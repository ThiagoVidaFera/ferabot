import { test } from "node:test";
import assert from "node:assert/strict";
import {
  construirNoShow,
  decidirNoShow,
  dentroDaJanelaNoShow,
  type ContextoNoShow,
  type EstadoNoShow,
} from "../../src/lib/sequencia-noshow";
import { textoNoShow, DIAS_NOSHOW } from "../../src/lib/sequencia-noshow-copy";

// quarta-feira, 11/11/2026, 11h de Brasília (UTC-3)
const agora = new Date("2026-11-11T14:00:00Z");
const noShowRecente = new Date("2026-11-10T18:00:00Z"); // ontem

const ctx = (extra: Partial<ContextoNoShow> = {}): ContextoNoShow => ({
  estagio: "novo",
  tags: ["no-show"],
  ultimaDoLead: null,
  ultimaFalaHumana: null,
  oficial: false,
  propostaAtiva: false,
  agora,
  ...extra,
});

test("no-show de ontem: 5 passos pendentes, o D+1 vence hoje às 9h", () => {
  const e = construirNoShow(noShowRecente, agora);
  assert.deepEqual(e.passos.map((p) => p.d), [...DIAS_NOSHOW]);
  assert.ok(e.passos.every((p) => p.status === "pendente"));
  assert.equal(e.passos[0].devidoEm, "2026-11-11T12:00:00.000Z");
});

test("no-show antigo (26 dias): D+1 sai agora, D+7 e D+15 viram pulado, D+30 e D+60 ficam", () => {
  const e = construirNoShow(new Date("2026-10-16T12:00:00Z"), agora);
  const por = Object.fromEntries(e.passos.map((p) => [p.d, p.status]));
  assert.deepEqual(por, { 1: "pendente", 7: "pulado", 15: "pulado", 30: "pendente", 60: "pendente" });
  assert.equal(e.passos[0].devidoEm, agora.toISOString());
});

test("decisão: dentro da janela envia o passo 1", () => {
  const e = construirNoShow(noShowRecente, agora);
  assert.deepEqual(decidirNoShow(e, ctx()), { acao: "enviar", passo: 1 });
});

test("janela: 10h–18h, segunda a sábado; domingo e madrugada não", () => {
  assert.equal(dentroDaJanelaNoShow(new Date("2026-11-11T14:00:00Z")), true);
  assert.equal(dentroDaJanelaNoShow(new Date("2026-11-11T12:00:00Z")), false); // 9h
  assert.equal(dentroDaJanelaNoShow(new Date("2026-11-11T21:00:00Z")), false); // 18h
  assert.equal(dentroDaJanelaNoShow(new Date("2026-11-15T14:00:00Z")), false); // domingo
  assert.equal(dentroDaJanelaNoShow(new Date("2026-11-14T14:00:00Z")), true); // sábado
});

test("lead que respondeu depois da reunião perdida pausa 72h", () => {
  const e = construirNoShow(noShowRecente, agora);
  const d = decidirNoShow(e, ctx({ ultimaDoLead: new Date("2026-11-11T10:00:00Z") }));
  assert.equal(d.acao, "esperar");
});

test("gente falou nas últimas 24h: espera", () => {
  const e = construirNoShow(noShowRecente, agora);
  assert.equal(decidirNoShow(e, ctx({ ultimaFalaHumana: new Date("2026-11-11T09:00:00Z") })).acao, "esperar");
});

test("sequência de proposta ativa é dona da conversa", () => {
  const e = construirNoShow(noShowRecente, agora);
  assert.equal(decidirNoShow(e, ctx({ propostaAtiva: true })).acao, "esperar");
});

test("optout, controle-* e estágio cliente encerram", () => {
  const e = construirNoShow(noShowRecente, agora);
  assert.equal(decidirNoShow(e, ctx({ tags: ["optout"] })).acao, "encerrar");
  assert.equal(decidirNoShow(e, ctx({ tags: ["controle-suporte"] })).acao, "encerrar");
  assert.equal(decidirNoShow(e, ctx({ estagio: "cliente" })).acao, "encerrar");
});

test("número oficial pula (texto livre fora da janela de 24h não sai)", () => {
  const e = construirNoShow(noShowRecente, agora);
  assert.equal(decidirNoShow(e, ctx({ oficial: true })).acao, "pular");
});

test("44h entre toques: depois de enviar o D+1, o D+7 não sai no dia seguinte", () => {
  const base = construirNoShow(new Date("2026-11-04T18:00:00Z"), agora);
  const e: EstadoNoShow = {
    ...base,
    passos: base.passos.map((p) => (p.d === 1 ? { ...p, status: "enviado", enviadoEm: "2026-11-11T13:00:00.000Z" } : p)),
  };
  // D+7 (11/11 às 9h) está vencido e dentro da tolerância, mas o último toque foi há 1h
  const d = decidirNoShow(e, ctx());
  assert.equal(d.acao, "esperar");
});

test("passos todos resolvidos: sequência conclui", () => {
  const base = construirNoShow(noShowRecente, agora);
  const e: EstadoNoShow = { ...base, passos: base.passos.map((p) => ({ ...p, status: "enviado", enviadoEm: "2026-10-01T12:00:00.000Z" })) };
  assert.deepEqual(decidirNoShow(e, ctx()), { acao: "encerrar", motivo: "concluída" });
});

test("no-show antigo: passo 1 ainda sai 4 dias depois da adoção (escoa pelo teto diário)", () => {
  const e = construirNoShow(new Date("2026-10-16T12:00:00Z"), new Date("2026-11-07T14:00:00Z"));
  assert.deepEqual(decidirNoShow(e, ctx({ agora })), { acao: "enviar", passo: 1 });
});

test("texto 1 só diz 'recentemente' quando a reunião perdida é recente", () => {
  assert.ok(textoNoShow(1, "Ana", true)?.includes("recentemente você tinha agendado"));
  assert.ok(!textoNoShow(1, "Ana", false)?.includes("recentemente"));
  assert.ok(textoNoShow(1, "Ana", false)?.startsWith("Ana, você tinha agendado"));
});

test("textos aposentados (13/11/2026): sem 'correria', sem 'Leia e me agradeça depois'; o 1º termina em pergunta", () => {
  for (const d of DIAS_NOSHOW) {
    const t = textoNoShow(d, "Carlos Silva") ?? "";
    assert.doesNotMatch(t, /correria|agradeça depois|relacionamento tóxico|guardanapo/i, `texto ${d}`);
  }
  assert.match(textoNoShow(1, "Carlos Silva") ?? "", /\?$/);
});
