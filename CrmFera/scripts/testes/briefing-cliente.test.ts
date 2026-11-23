import { test } from "node:test";
import assert from "node:assert/strict";
import { briefingCompleto, limparBriefing, MINIMO_RESPOSTA, PERGUNTAS_BRIEFING, respondidas } from "../../src/lib/briefing-cliente";

test("briefing tem as 7 perguntas pedidas e só guarda as respostas conhecidas", () => {
  assert.deepEqual(PERGUNTAS_BRIEFING.map((p) => p.id), [
    "identidade_visual", "estilo_comunicacao", "quem_atrair", "quem_nao_atrair", "problemas", "resultados", "por_que_confiar",
  ]);
  const b = limparBriefing({ identidade_visual: "  azul e branco  ", outra: "x" });
  assert.equal(b.identidade_visual, "azul e branco");
  assert.equal((b as Record<string, unknown>).outra, undefined);
});

test("resposta curta não conta e o briefing só fecha com as 7", () => {
  const longa = "x".repeat(MINIMO_RESPOSTA);
  const quase = Object.fromEntries(PERGUNTAS_BRIEFING.slice(0, 6).map((p) => [p.id, longa]));
  assert.equal(respondidas(limparBriefing({ ...quase, por_que_confiar: "curta" })), 6);
  assert.equal(briefingCompleto(limparBriefing({ ...quase, por_que_confiar: longa })), true);
});
