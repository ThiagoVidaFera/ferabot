import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contar,
  funil,
  grupoDe,
  historicoDiario,
  resolverPeriodo,
  reunioesPorDia,
} from "../../src/lib/dashboard";

const agora = new Date(2026, 9, 29, 8, 13); // qui 29/10/2026

test("período: hoje, ontem, semana (segunda) e mês", () => {
  assert.equal(resolverPeriodo("hoje", undefined, undefined, agora).de, "2026-10-29");
  const ontem = resolverPeriodo("ontem", undefined, undefined, agora);
  assert.equal(ontem.de, "2026-10-28");
  assert.equal(ontem.ate, "2026-10-28");
  assert.equal(resolverPeriodo("semana", undefined, undefined, agora).de, "2026-10-26");
  assert.equal(resolverPeriodo(undefined, undefined, undefined, agora).de, "2026-10-01");
});

test("período custom aceita datas invertidas e cai no mês se for inválido", () => {
  const p = resolverPeriodo("custom", "2026-10-10", "2026-10-05", agora);
  assert.equal(p.de, "2026-10-05");
  assert.equal(p.ate, "2026-10-10");
  assert.equal(resolverPeriodo("custom", "lixo", "x", agora).key, "mes");
});

test("etapa vira grupo; quem respondeu e esfriou conta como interagiu", () => {
  assert.equal(grupoDe("novo", false), "novo");
  assert.equal(grupoDe("frio", true), "interagiu");
  assert.equal(grupoDe("conversando", false), "interagindo");
  assert.equal(grupoDe("proposta", true), "agendado");
  assert.equal(grupoDe("perdido", true), "perdido");
});

test("funil é cumulativo e histórico traz dia sem lead", () => {
  const cs = [
    { createdAt: new Date(2026, 9, 29, 9), lifecycleStage: "novo", respondeu: false },
    { createdAt: new Date(2026, 9, 29, 10), lifecycleStage: "conversando", respondeu: true },
    { createdAt: new Date(2026, 9, 29, 11), lifecycleStage: "call_marcada", respondeu: true },
    { createdAt: new Date(2026, 9, 27, 11), lifecycleStage: "cliente", respondeu: true },
  ];
  assert.deepEqual(funil(contar(cs)), { leads: 4, interagiu: 3, agendado: 2 });
  const p = resolverPeriodo("custom", "2026-10-27", "2026-10-29", agora);
  const h = historicoDiario(cs, p);
  assert.deepEqual(h.map((l) => [l.dia, l.leads]), [["2026-10-29", 3], ["2026-10-28", 0], ["2026-10-27", 1]]);
  assert.equal(h[1].taxa, null);
  assert.equal(h[0].taxa, 33);
  assert.equal(reunioesPorDia([new Date(2026, 9, 28, 15)], p)[1].total, 1);
});
