import { test } from "node:test";
import assert from "node:assert/strict";
import { indicadorValido, mesclarIndicadores, MAX_INDICADORES } from "../../src/lib/indicadores";

const agora = new Date("2026-11-23T10:00:00Z");

test("cartão precisa de id, título e valor; número vira texto", () => {
  assert.equal(indicadorValido({ titulo: "Posts", valor: 3 }), null);
  assert.equal(indicadorValido({ id: "Posts do mês!", titulo: "Posts", valor: 3 }), null);
  assert.deepEqual(indicadorValido({ id: "posts-mes", titulo: "Posts no mês", valor: 12, tipo: "estimado" }, agora), {
    id: "posts-mes",
    titulo: "Posts no mês",
    valor: "12",
    tipo: "estimado",
    atualizadoEm: agora.toISOString(),
  });
});

test("mesmo id atualiza, remover apaga e o teto é respeitado", () => {
  const um = mesclarIndicadores([], { id: "custo-ia", titulo: "Custo de IA", valor: "R$ 10" }, agora);
  const dois = mesclarIndicadores(um, [{ id: "custo-ia", titulo: "Custo de IA", valor: "R$ 12" }, { id: "posts", titulo: "Posts", valor: "4" }], agora);
  assert.deepEqual(dois.map((i) => [i.id, i.valor]), [["posts", "4"], ["custo-ia", "R$ 12"]]);
  assert.deepEqual(mesclarIndicadores(dois, { id: "posts", remover: true }, agora).map((i) => i.id), ["custo-ia"]);
  const muitos = Array.from({ length: 20 }, (_, n) => ({ id: `n${n}`, titulo: "x", valor: "1" }));
  assert.equal(mesclarIndicadores([], muitos, agora).length, MAX_INDICADORES);
});
