import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decidirConviteAula,
  TEXTO_CONVITE_AULA,
  LINK_GRUPO_BASTIDORES,
  ESPERA_APOS_PROPOSTA_MS,
  DIAS_MINIMOS_NA_BASE,
  type ContatoConvite,
} from "../../src/lib/convite-aula";

const agora = new Date("2026-11-05T14:00:00Z");
const DIA = 24 * 60 * 60 * 1000;
const base: ContatoConvite = {
  origem: "funil:agendar-implementacao-ysp",
  lifecycleStage: "conversando",
  tags: [],
  criadoEm: new Date(agora.getTime() - 30 * DIA),
  propostaEm: null,
  mensagensAnteriores: 1,
};

test("lead de funil em conversa: recebe", () => {
  assert.deepEqual(decidirConviteAula(base, agora), { enviar: true });
});

test("lead na base há menos de 10 dias não recebe; com 10 dias ou mais recebe", () => {
  const dias = (n: number) => new Date(agora.getTime() - n * DIA);
  assert.equal(DIAS_MINIMOS_NA_BASE, 10);
  assert.equal(decidirConviteAula({ ...base, criadoEm: dias(0) }, agora).enviar, false);
  assert.equal(decidirConviteAula({ ...base, criadoEm: dias(9) }, agora).enviar, false);
  assert.equal(decidirConviteAula({ ...base, criadoEm: dias(10) }, agora).enviar, true);
});

test("já recebeu uma vez: nunca de novo", () => {
  assert.equal(decidirConviteAula({ ...base, tags: ["convite-aula-enviado"] }, agora).enviar, false);
});

test("quem já fechou não recebe: estágio cliente ou tag comprou-*", () => {
  assert.equal(decidirConviteAula({ ...base, lifecycleStage: "cliente" }, agora).enviar, false);
  assert.equal(decidirConviteAula({ ...base, tags: ["comprou-yt"] }, agora).enviar, false);
});

test("em negociação: só 15 dias depois da proposta", () => {
  const prop = { ...base, lifecycleStage: "proposta" };
  assert.equal(decidirConviteAula({ ...prop, propostaEm: new Date(agora.getTime() - 14 * DIA) }, agora).enviar, false);
  assert.equal(decidirConviteAula({ ...prop, propostaEm: new Date(agora.getTime() - 15 * DIA) }, agora).enviar, true);
  assert.equal(ESPERA_APOS_PROPOSTA_MS, 15 * DIA);
});

test("proposta sem data conhecida: espera (na dúvida, não manda)", () => {
  assert.equal(decidirConviteAula({ ...base, lifecycleStage: "proposta", propostaEm: null }, agora).enviar, false);
});

test("quem já foi pra proposta e voltou de estágio: respeita os 15 dias mesmo assim", () => {
  const recente = new Date(agora.getTime() - 3 * DIA);
  assert.equal(decidirConviteAula({ ...base, lifecycleStage: "conversando", propostaEm: recente }, agora).enviar, false);
});

test("já está no grupo (veio do funil do grupo): não recebe", () => {
  assert.equal(decidirConviteAula({ ...base, origem: "funil:grupo-bastidores-ysp" }, agora).enviar, false);
  assert.equal(decidirConviteAula({ ...base, origem: "funil:grupo_bastidores_ysp" }, agora).enviar, false);
});

test("opt-out, controle humano, perdido e sem automação: não recebe", () => {
  assert.equal(decidirConviteAula({ ...base, tags: ["controle-optout"] }, agora).enviar, false);
  assert.equal(decidirConviteAula({ ...base, tags: ["humano"] }, agora).enviar, false);
  assert.equal(decidirConviteAula({ ...base, lifecycleStage: "perdido" }, agora).enviar, false);
  assert.equal(decidirConviteAula({ ...base, lifecycleStage: "pessoal" }, agora).enviar, false);
});

test("a primeira interação nossa nunca leva convite (sem mensagem de turno anterior)", () => {
  assert.equal(decidirConviteAula({ ...base, mensagensAnteriores: 0 }, agora).enviar, false);
});

test("quem recebeu proposta (toque agendado) e mudou de estágio também espera os 15 dias", () => {
  const recente = new Date(agora.getTime() - 5 * DIA);
  assert.equal(decidirConviteAula({ ...base, lifecycleStage: "call_marcada", propostaEm: recente }, agora).enviar, false);
});
