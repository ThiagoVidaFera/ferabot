import { test } from "node:test";
import assert from "node:assert/strict";
import { lerCache, cacheValido, comEntrada, podar } from "../../src/lib/fila-sugestao-cache";

const agora = new Date("2026-10-28T15:00:00Z");
const ult = new Date("2026-10-28T10:00:00Z");
const entrada = { texto: "Oi Ana?", ultimaEntradaEm: ult.toISOString(), geradoEm: agora.toISOString() };

test("lerCache: vazio, lixo e formato errado viram cache vazio", () => {
  assert.deepEqual(lerCache(null), {});
  assert.deepEqual(lerCache(""), {});
  assert.deepEqual(lerCache("{nao e json"), {});
  assert.deepEqual(lerCache("[1,2]"), {});
  assert.deepEqual(lerCache('"texto"'), {});
});

test("lerCache: descarta entradas malformadas e mantem as boas", () => {
  const r = lerCache(JSON.stringify({ a: entrada, b: { texto: 1 }, c: null }));
  assert.deepEqual(Object.keys(r), ["a"]);
});

test("cacheValido: so vale se o lead nao escreveu de novo", () => {
  const c = comEntrada({}, "a", entrada);
  assert.equal(cacheValido(c, "a", ult), "Oi Ana?");
  assert.equal(cacheValido(c, "a", new Date(ult.getTime() + 1000)), null);
  assert.equal(cacheValido(c, "outro", ult), null);
});

test("comEntrada nao muta o cache original", () => {
  const original = Object.freeze({});
  const novo = comEntrada(original, "a", entrada);
  assert.deepEqual(original, {});
  assert.ok("a" in novo);
});

test("podar remove entradas com mais de 7 dias e data invalida", () => {
  const velha = { ...entrada, geradoEm: "2026-10-10T00:00:00Z" };
  const torta = { ...entrada, geradoEm: "ontem" };
  const r = podar({ nova: entrada, velha, torta }, agora);
  assert.deepEqual(Object.keys(r), ["nova"]);
});
