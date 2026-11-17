import { test } from "node:test";
import assert from "node:assert/strict";
import { montarLinha, type EntradaProposta } from "../../src/lib/painel-propostas";

/**
 * Motivo de um lead em "proposta" estar sem próximo follow-up (11/11/2026): o Painel mostrava só "—"
 * e o Ana não sabia se o robô tinha esquecido o lead ou se era regra.
 */

const AGORA = new Date("2026-11-11T15:00:00Z");

const base = (m: Partial<EntradaProposta> = {}): EntradaProposta => ({
  id: "c1",
  nome: "Lead",
  tags: [],
  customFields: {},
  viradaParaPropostaEm: new Date("2026-11-05T12:00:00Z"),
  criadoEm: new Date("2026-11-01T00:00:00Z"),
  mensagens: [],
  ...m,
});

const sequencia = (m: Record<string, unknown> = {}) => ({
  proposta: { ofertaBase: "padrao", link: "https://proposta-x.exemplo.com", enviadaEm: "2026-11-05T12:00:00Z" },
  sequencia_proposta: {
    status: "ativa",
    inicio: "2026-11-05T12:00:00.000Z",
    criadaEm: "2026-11-05T12:00:00.000Z",
    passos: [{ d: 15, devidoEm: "2026-11-20T12:00:00.000Z", status: "pendente" }],
    ...m,
  },
});

test("sem proposta registrada: diz que falta registrar", () => {
  assert.equal(montarLinha(base(), AGORA).motivo, "proposta não registrada");
});

test("proposta registrada com oferta fora do catálogo: follow-up é manual", () => {
  const l = montarLinha(
    base({ customFields: { proposta: { ofertaBase: "casa-nova", link: "https://proposta-casanova.exemplo.com", enviadaEm: "2026-10-27T18:00:00Z" } } }),
    AGORA,
  );
  assert.equal(l.motivo, "oferta fora do catálogo: follow-up manual");
});

test("proposta registrada no catálogo e ainda sem sequência: o robô adota no próximo ciclo", () => {
  const l = montarLinha(
    base({ customFields: { proposta: { ofertaBase: "padrao", link: "https://proposta-x.exemplo.com", enviadaEm: "2026-11-05T12:00:00Z" } } }),
    AGORA,
  );
  assert.equal(l.motivo, "o robô adota no próximo ciclo (9h)");
});

test("valor definido à mão sem proposta registrada: proposta personalizada, follow-up manual", () => {
  const l = montarLinha(base({ customFields: { valor_proposta: 15000 } }), AGORA);
  assert.equal(l.motivo, "proposta personalizada: follow-up manual");
});

test("Sprint: follow-up manual", () => {
  assert.equal(montarLinha(base({ tags: ["oferta-sprint"] }), AGORA).motivo, "Sprint: follow-up manual");
});

test("sem SEQUENCIA_PROPOSTA_FORA nenhum funil fica fora da sequência", () => {
  const l = montarLinha(base({ origem: "funil:qualquer-funil" }), AGORA);
  assert.notEqual(l.motivo, "funil com número único: fora da sequência");
});

test("sequência encerrada mostra o motivo do encerramento", () => {
  const l = montarLinha(
    base({ customFields: sequencia({ status: "encerrada", encerradaMotivo: "tag de controle (não perturbe, suporte humano ou optout)" }) }),
    AGORA,
  );
  assert.equal(l.motivo, "encerrada: tag de controle (não perturbe, suporte humano ou optout)");
});

test("sequência ativa com o lead respondendo há menos de 72h: pausada, com a data da volta", () => {
  const l = montarLinha(
    base({
      customFields: sequencia(),
      mensagens: [{ direction: "inbound", timestamp: new Date("2026-11-10T00:27:00Z"), body: "[áudio]", metadata: {} }],
    }),
    AGORA,
  );
  assert.equal(l.proximo?.d, 15);
  assert.equal(l.motivo, "pausada até 12/11: o lead respondeu");
});

test("pausa conta da última fala de gente quando ela veio depois da resposta do lead", () => {
  const l = montarLinha(
    base({
      customFields: sequencia(),
      mensagens: [
        { direction: "inbound", timestamp: new Date("2026-11-09T10:00:00Z"), body: "vou ver", metadata: {} },
        { direction: "outbound", timestamp: new Date("2026-11-10T12:00:00Z"), body: "combinado", metadata: { origem: "inbox", ator: "ana" } },
      ],
    }),
    AGORA,
  );
  assert.equal(l.motivo, "pausada até 13/11: o lead respondeu");
});

test("tag de controle: avisa que a sequência encerra no próximo ciclo", () => {
  const l = montarLinha(base({ tags: ["controle-nao-perturbe"], customFields: sequencia() }), AGORA);
  assert.equal(l.motivo, "encerra no próximo ciclo: tag de controle");
});

test("sequência ativa sem nada travando: sem motivo (o próximo toque já explica)", () => {
  const l = montarLinha(base({ customFields: sequencia() }), AGORA);
  assert.equal(l.motivo, null);
});

// "!" no Painel (11/11/2026): onde o Ana tem de agir à mão.
test("!: a última mensagem é do lead, então o Ana precisa responder", () => {
  const l = montarLinha(
    base({
      customFields: sequencia(),
      mensagens: [
        { direction: "outbound", timestamp: new Date("2026-11-09T12:00:00Z"), body: "proposta", metadata: {} },
        { direction: "inbound", timestamp: new Date("2026-11-10T00:27:00Z"), body: "[áudio]", metadata: {} },
      ],
    }),
    AGORA,
  );
  assert.equal(l.acaoManual, "responder: o lead mandou a última mensagem (09/11)");
});

test("!: follow-up manual quando o robô não cuida do lead", () => {
  assert.equal(montarLinha(base(), AGORA).acaoManual, "follow-up manual: proposta não registrada");
  assert.equal(
    montarLinha(base({ customFields: { valor_proposta: 15000 } }), AGORA).acaoManual,
    "follow-up manual: proposta personalizada: follow-up manual",
  );
});

test("sem !: o robô cuida e a última mensagem é nossa", () => {
  const l = montarLinha(
    base({
      customFields: sequencia(),
      mensagens: [{ direction: "outbound", timestamp: new Date("2026-11-10T12:00:00Z"), body: "toque", metadata: {} }],
    }),
    AGORA,
  );
  assert.equal(l.acaoManual, null);
});

test("sem !: proposta registrada que o robô adota no próximo ciclo", () => {
  const l = montarLinha(
    base({ customFields: { proposta: { ofertaBase: "padrao", link: "https://proposta-x.exemplo.com", enviadaEm: "2026-11-05T12:00:00Z" } } }),
    AGORA,
  );
  assert.equal(l.acaoManual, null);
});
