import { test } from "node:test";
import assert from "node:assert/strict";
import {
  construirSequencia,
  decidirSequencia,
  FERIADOS_ATE,
  dentroDaJanela,
  devidoEm,
  lerSequencia,
  proximoPasso,
  toquesSemResposta,
  type ContextoSequencia,
  type EstadoSequencia,
} from "../../src/lib/sequencia-proposta";

const z = (iso: string) => new Date(iso);
// Proposta enviada na terça 03/11/2026, 18h em Brasília.
const INICIO = z("2026-11-03T21:00:00Z");

const estadoBase = (): EstadoSequencia => ({
  status: "ativa",
  inicio: INICIO.toISOString(),
  criadaEm: INICIO.toISOString(),
  passos: [
    { d: 1, devidoEm: devidoEm(INICIO, 1).toISOString(), status: "pulado", motivo: "x" },
    { d: 3, devidoEm: devidoEm(INICIO, 3).toISOString(), status: "pulado", motivo: "x" },
    { d: 7, devidoEm: devidoEm(INICIO, 7).toISOString(), status: "pendente" },
    { d: 15, devidoEm: devidoEm(INICIO, 15).toISOString(), status: "pendente" },
    { d: 30, devidoEm: devidoEm(INICIO, 30).toISOString(), status: "pendente" },
    { d: 60, devidoEm: devidoEm(INICIO, 60).toISOString(), status: "pendente" },
    { d: 90, devidoEm: devidoEm(INICIO, 90).toISOString(), status: "pendente" },
  ],
});

const ctx = (agora: string, mudanca: Partial<ContextoSequencia> = {}): ContextoSequencia => ({
  estagio: "proposta",
  tags: [],
  ultimaDoLead: null,
  ultimaFalaHumana: null,
  oficial: false,
  agora: z(agora),
  ...mudanca,
});

// D+7 vence terça 10/11 às 9h (12:00Z). 12:05Z = 9h05 em Brasília, dentro da janela.
const NA_JANELA = "2026-11-10T12:05:00Z";

test("passo vence às 9h de Brasília, N dias depois do envio", () => {
  assert.equal(devidoEm(INICIO, 1).toISOString(), "2026-11-04T12:00:00.000Z");
  assert.equal(devidoEm(INICIO, 7).toISOString(), "2026-11-10T12:00:00.000Z");
});

test("domingo vai para segunda; sábado envia; feriado vai para o próximo dia útil", () => {
  // sábado 07/11 + 1 dia = domingo 08/11 -> segunda 09/11
  assert.equal(devidoEm(z("2026-11-07T15:00:00Z"), 1).toISOString(), "2026-11-09T12:00:00.000Z");
  // sexta 06/11 + 1 dia = sábado 07/11 (envia)
  assert.equal(devidoEm(z("2026-11-06T15:00:00Z"), 1).toISOString(), "2026-11-07T12:00:00.000Z");
  // quinta 19/11 + 1 dia = sexta 20/11 (feriado) -> sábado 21/11
  assert.equal(devidoEm(z("2026-11-19T15:00:00Z"), 1).toISOString(), "2026-11-21T12:00:00.000Z");
});

test("janela de envio: 9h às 10h30, segunda a sábado", () => {
  assert.equal(dentroDaJanela(z("2026-11-10T12:00:00Z")), true); // 9h00
  assert.equal(dentroDaJanela(z("2026-11-10T13:29:00Z")), true); // 10h29
  assert.equal(dentroDaJanela(z("2026-11-10T13:30:00Z")), false); // 10h30
  assert.equal(dentroDaJanela(z("2026-11-10T11:59:00Z")), false); // 8h59
  assert.equal(dentroDaJanela(z("2026-11-08T12:30:00Z")), false); // domingo
});

test("sequência nova pula o que já venceu há mais de 30h e mantém o resto pendente", () => {
  const e = construirSequencia(INICIO, z("2026-11-09T18:00:00Z"));
  assert.deepEqual(
    e.passos.map((p) => `${p.d}:${p.status}`),
    ["1:pulado", "3:pulado", "7:pendente", "15:pendente", "30:pendente", "60:pendente", "90:pendente"],
  );
  assert.equal(proximoPasso(e)?.d, 7);
});

test("passo que acabou de vencer, dentro da janela e sem resposta: envia", () => {
  assert.deepEqual(decidirSequencia(estadoBase(), ctx(NA_JANELA)), { acao: "enviar", passo: 7, esqueleto: false });
});

test("antes de vencer espera; fora da janela espera", () => {
  assert.equal(decidirSequencia(estadoBase(), ctx("2026-11-10T11:00:00Z")).acao, "esperar");
  const fora = decidirSequencia(estadoBase(), ctx("2026-11-10T14:00:00Z"));
  assert.equal(fora.acao, "esperar");
});

test("vencido há mais de 30h é pulado, não enviado tarde", () => {
  const d = decidirSequencia(estadoBase(), ctx("2026-11-12T12:05:00Z"));
  assert.deepEqual(d, { acao: "pular", passo: 7, motivo: "atrasado mais de 30h" });
});

test("o lead respondeu depois da proposta: pausa por 72h", () => {
  const d = decidirSequencia(estadoBase(), ctx(NA_JANELA, { ultimaDoLead: z("2026-11-09T15:00:00Z") }));
  assert.equal(d.acao, "esperar");
  assert.match((d as { motivo: string }).motivo, /pausada/);
});

test("resposta ANTES da proposta não pausa", () => {
  const d = decidirSequencia(estadoBase(), ctx(NA_JANELA, { ultimaDoLead: z("2026-11-03T15:00:00Z") }));
  assert.equal(d.acao, "enviar");
});

test("gente falou nas últimas 24h, sem resposta do lead: adia", () => {
  const d = decidirSequencia(estadoBase(), ctx(NA_JANELA, { ultimaFalaHumana: z("2026-11-10T01:00:00Z") }));
  assert.equal(d.acao, "esperar");
  const livre = decidirSequencia(estadoBase(), ctx(NA_JANELA, { ultimaFalaHumana: z("2026-11-08T01:00:00Z") }));
  assert.equal(livre.acao, "enviar");
});

test("saiu de proposta, optout ou número oficial", () => {
  assert.equal(decidirSequencia(estadoBase(), ctx(NA_JANELA, { estagio: "futuro" })).acao, "encerrar");
  assert.equal(decidirSequencia(estadoBase(), ctx(NA_JANELA, { estagio: "cliente" })).acao, "encerrar");
  assert.equal(decidirSequencia(estadoBase(), ctx(NA_JANELA, { tags: ["optout"] })).acao, "encerrar");
  assert.equal(decidirSequencia(estadoBase(), ctx(NA_JANELA, { oficial: true })).acao, "pular");
});

test("a tag humano não bloqueia a sequência", () => {
  assert.equal(decidirSequencia(estadoBase(), ctx(NA_JANELA, { tags: ["humano"] })).acao, "enviar");
});

test("toques sem resposta contam depois da última fala do lead", () => {
  const e: EstadoSequencia = {
    ...estadoBase(),
    legado: ["2026-11-04T11:00:00Z", "2026-11-06T20:00:00Z", "2026-11-08T11:00:00Z"],
  };
  assert.equal(toquesSemResposta(e, null, null), 3);
  assert.equal(toquesSemResposta(e, z("2026-11-06T00:00:00Z"), null), 2);
  assert.equal(toquesSemResposta(e, null, z("2026-11-09T12:00:00Z")), 0);
});

test("dois toques seguidos sem resposta disparam o esqueleto no próximo toque", () => {
  const e: EstadoSequencia = { ...estadoBase(), legado: ["2026-11-04T11:00:00Z", "2026-11-08T11:00:00Z"] };
  assert.deepEqual(decidirSequencia(e, ctx(NA_JANELA)), { acao: "enviar", passo: 7, esqueleto: true });
});

test("esqueleto não dispara com 1 toque, com tom-serio, uma 2ª vez ou na despedida", () => {
  const um: EstadoSequencia = { ...estadoBase(), legado: ["2026-11-08T11:00:00Z"] };
  assert.equal((decidirSequencia(um, ctx(NA_JANELA)) as { esqueleto: boolean }).esqueleto, false);

  const dois: EstadoSequencia = { ...estadoBase(), legado: ["2026-11-04T11:00:00Z", "2026-11-08T11:00:00Z"] };
  assert.equal((decidirSequencia(dois, ctx(NA_JANELA, { tags: ["tom-serio"] })) as { esqueleto: boolean }).esqueleto, false);

  const jaFoi: EstadoSequencia = { ...dois, esqueleto: { enviadoEm: "2026-11-08T11:00:00Z", variante: "a", d: 3 } };
  assert.equal((decidirSequencia(jaFoi, ctx(NA_JANELA)) as { esqueleto: boolean }).esqueleto, false);

  const naDespedida: EstadoSequencia = {
    ...dois,
    passos: dois.passos.map((p) => (p.d < 90 ? { ...p, status: "pulado" as const } : p)),
  };
  const d90 = decidirSequencia(naDespedida, ctx("2027-02-01T12:05:00Z"));
  assert.equal(d90.acao, "enviar");
  assert.equal((d90 as { esqueleto: boolean }).esqueleto, false);
});

test("sequência completa: espera 72h depois do último toque e então encerra como concluída", () => {
  const e: EstadoSequencia = {
    ...estadoBase(),
    passos: estadoBase().passos.map((p) =>
      p.d === 90 ? { ...p, status: "enviado" as const, enviadoEm: "2027-02-01T12:00:00Z" } : { ...p, status: "pulado" as const },
    ),
  };
  assert.equal(decidirSequencia(e, ctx("2027-02-02T12:00:00Z")).acao, "esperar");
  assert.deepEqual(decidirSequencia(e, ctx("2027-02-05T12:00:00Z")), { acao: "encerrar", motivo: "concluída" });
});

test("sequência encerrada não age", () => {
  assert.equal(decidirSequencia({ ...estadoBase(), status: "encerrada" }, ctx(NA_JANELA)).acao, "esperar");
});

// ---------- correções da revisão independente (09/11/2026) ----------

test("toque anterior há menos de 44h segura o próximo, mesmo vencido e dentro da janela", () => {
  const e: EstadoSequencia = { ...estadoBase(), legado: ["2026-11-09T11:00:00Z"] }; // 25h antes
  const d = decidirSequencia(e, ctx(NA_JANELA));
  assert.equal(d.acao, "esperar");
  assert.match((d as { motivo: string }).motivo, /44h/);
  const livre: EstadoSequencia = { ...estadoBase(), legado: ["2026-11-08T11:00:00Z"] }; // 49h antes
  assert.equal(decidirSequencia(livre, ctx(NA_JANELA)).acao, "enviar");
});

test("qualquer tag controle-* encerra; adiamento e reunião marcada seguram", () => {
  assert.equal(decidirSequencia(estadoBase(), ctx(NA_JANELA, { tags: ["controle-suporte-humano"] })).acao, "encerrar");
  assert.equal(decidirSequencia(estadoBase(), ctx(NA_JANELA, { tags: ["controle-nao-perturbe"] })).acao, "encerrar");
  assert.equal(decidirSequencia(estadoBase(), ctx(NA_JANELA, { adiado: true })).acao, "esperar");
  assert.equal(decidirSequencia(estadoBase(), ctx(NA_JANELA, { reuniaoMarcada: true })).acao, "esperar");
});

test("lerSequencia rejeita estado com data inválida em vez de tratar o passo como vencido", () => {
  const ruim = { sequencia_proposta: { ...estadoBase(), passos: [{ d: 7, devidoEm: "lixo", status: "pendente" }] } };
  assert.equal(lerSequencia(ruim), null);
  assert.equal(lerSequencia({ sequencia_proposta: { ...estadoBase(), inicio: "nunca" } }), null);
  assert.ok(lerSequencia({ sequencia_proposta: estadoBase() }));
});

test("construirSequencia guarda o link e o registro da proposta que a originou", () => {
  const e = construirSequencia(INICIO, z("2026-11-04T00:00:00Z"), [], {
    ofertaBase: "padrao",
    link: "https://proposta-x.exemplo.com",
    enviadaEm: "2026-11-05T22:09:00Z",
  });
  assert.equal(e.link, "https://proposta-x.exemplo.com");
  assert.equal(e.propostaEnviadaEm, "2026-11-05T22:09:00Z");
});

test("Sexta-feira Santa de 2027 (26/03) não envia e a lista de feriados não está vencendo", () => {
  // quinta 25/03/2027 + 1 dia = sexta 26/03 (feriado) -> sábado 27/03
  assert.equal(devidoEm(z("2027-03-25T15:00:00Z"), 1).toISOString(), "2027-03-27T12:00:00.000Z");
  // sexta 02/04/2027 é dia comum
  assert.equal(devidoEm(z("2027-04-01T15:00:00Z"), 1).toISOString(), "2027-04-02T12:00:00.000Z");
  const margem = new Date(`${FERIADOS_ATE}T00:00:00Z`).getTime() - Date.now();
  assert.ok(margem > 180 * 86_400_000, `a lista de feriados vence em ${FERIADOS_ATE}: estenda antes de 6 meses`);
});
