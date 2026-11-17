import { test } from "node:test";
import assert from "node:assert/strict";
import { followupAdiado, dataDeRetorno } from "../../src/lib/followup-adiado";

const out = new Date("2026-10-31T17:47:00Z");
const nov = new Date("2026-11-02T17:48:00Z");

test("retornar-novembro segura o toque até 1º de novembro e libera depois", () => {
  const c = { tags: ["sem-condicoes-agora", "retornar-novembro"], lifecycleStage: "futuro" };
  assert.equal(followupAdiado(c, out), true);
  assert.equal(followupAdiado(c, nov), false);
});

test("mês já passado há muito tempo vira o ano seguinte", () => {
  assert.equal(dataDeRetorno(["retornar-janeiro"], new Date("2026-10-31T12:00:00Z"))?.getUTCFullYear(), 2027);
});

test("não qualificado, deflexão e futuro sem data não recebem toque", () => {
  assert.equal(followupAdiado({ tags: ["nao-qualificado-orcamento"], lifecycleStage: "conversando" }, nov), true);
  assert.equal(followupAdiado({ tags: ["defletiu", "equipe"], lifecycleStage: "futuro" }, nov), true);
  assert.equal(followupAdiado({ tags: [], lifecycleStage: "futuro" }, nov), true);
});

test("retorno vencido não desfaz optout nem não qualificado", () => {
  assert.equal(followupAdiado({ tags: ["retornar-outubro", "optout"], lifecycleStage: "futuro" }, nov), true);
  assert.equal(followupAdiado({ tags: ["retornar-outubro", "nao-qualificado-orcamento"], lifecycleStage: "conversando" }, nov), true);
});

test("mês passado há tempo libera; mês próximo espera", () => {
  assert.equal(followupAdiado({ tags: ["retornar-agosto"], lifecycleStage: "futuro" }, nov), false);
  assert.equal(followupAdiado({ tags: ["retornar-janeiro"], lifecycleStage: "futuro" }, nov), true);
});

test("lead normal em conversa recebe o toque", () => {
  assert.equal(followupAdiado({ tags: ["follow-up-1"], lifecycleStage: "conversando" }, nov), false);
});
