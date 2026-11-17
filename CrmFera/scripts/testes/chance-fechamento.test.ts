import { test } from "node:test";
import assert from "node:assert/strict";
import { CHANCE_BASE, CHANCE_MAXIMA, CHANCE_MINIMA, chanceFechamento, type SinaisChance } from "../../src/lib/chance-fechamento";
import { valorDoLead } from "../../src/lib/painel-propostas";

const sinais = (m: Partial<SinaisChance> = {}): SinaisChance => ({
  tags: [],
  respondeuAposProposta: false,
  diasSemRespostaDoLead: null,
  mensagensDoLead: 0,
  toquesSemResposta: 0,
  diasDesdeVencimento: null,
  ...m,
});

test("sem nenhum sinal, parte do ponto de partida", () => {
  const r = chanceFechamento(sinais());
  assert.equal(r.pct, CHANCE_BASE);
  assert.equal(r.manual, false);
});

test("lead quente: respondeu hoje, conversa longa e pediu o valor", () => {
  const r = chanceFechamento(
    sinais({ respondeuAposProposta: true, diasSemRespostaDoLead: 0, mensagensDoLead: 10, tags: ["perguntou-preco"] }),
  );
  assert.equal(r.pct, 21);
  assert.ok(r.motivos.some((m) => /pediu o valor/.test(m)));
});

test("lead frio: fora de escopo, silêncio de 10+ dias", () => {
  const r = chanceFechamento(sinais({ tags: ["fora_escopo", "passagem_humano"], diasSemRespostaDoLead: 12, mensagensDoLead: 17 }));
  assert.ok(r.pct < CHANCE_BASE);
});

test("3 toques sem nenhuma resposta, reunião feita, proposta vencida há dias", () => {
  const r = chanceFechamento(sinais({ tags: ["reuniao-realizada", "no-show"], toquesSemResposta: 3, diasDesdeVencimento: 5 }));
  // 8 +3 (reunião) -2 (faltou) -3 (toques) -2 (vencida)
  assert.equal(r.pct, 4);
});

test("sempre entre o mínimo e o máximo", () => {
  const ruim = chanceFechamento(
    sinais({ tags: ["fora_escopo", "defletiu"], diasSemRespostaDoLead: 90, toquesSemResposta: 5, diasDesdeVencimento: 30 }),
  );
  assert.equal(ruim.pct, CHANCE_MINIMA);
  const otima = chanceFechamento(
    sinais({
      tags: ["perguntou-preco", "objeção: investimento", "call-realizada"],
      respondeuAposProposta: true,
      diasSemRespostaDoLead: 0,
      mensagensDoLead: 40,
    }),
  );
  assert.ok(otima.pct <= CHANCE_MAXIMA);
});

test("chance manual vence a régua", () => {
  const r = chanceFechamento(sinais(), 55);
  assert.deepEqual({ pct: r.pct, manual: r.manual }, { pct: 55, manual: true });
});

const D0 = new Date("2026-11-03T21:00:00Z");

test("valor do lead: manual > proposta registrada (oferta do negocio.json) > desconhecido", () => {
  // sem negocio.json vale o exemplo: oferta principal "R$ 2.000 à vista"
  const registrada = { proposta: { ofertaBase: "padrao", link: "https://exemplo.com/oferta", enviadaEm: "2026-11-05T22:09:00Z" } };
  const base = { customFields: {}, tags: [] as string[], saidas: [], inicio: D0 };

  const catalogo = valorDoLead({ ...base, customFields: registrada });
  assert.deepEqual([catalogo.centavos, catalogo.origem], [200_000, "registrada"]);

  const manualReais = valorDoLead({ ...base, customFields: { ...registrada, valor_proposta: 4500 } });
  assert.deepEqual([manualReais.centavos, manualReais.origem], [450_000, "manual"]);

  // a tag de "porta" não diz o que foi oferecido
  const nada = valorDoLead({ ...base, tags: ["interesse-principal", "humano"] });
  assert.deepEqual([nada.centavos, nada.origem], [null, "desconhecido"]);
});
