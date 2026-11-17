import { test } from "node:test";
import assert from "node:assert/strict";
import { sortearAtrasoMs, lerPendente, ATRASO_MIN_S, ATRASO_MAX_S } from "../../src/lib/resposta-agendada";

test("atraso sorteado fica entre 60 e 100 segundos (e portanto dentro de 1–3 min com o cron)", () => {
  assert.equal(sortearAtrasoMs(ATRASO_MIN_S, ATRASO_MAX_S, () => 0), 60_000);
  assert.equal(sortearAtrasoMs(ATRASO_MIN_S, ATRASO_MAX_S, () => 1), 100_000);
  for (let i = 0; i < 200; i++) {
    const ms = sortearAtrasoMs();
    assert.ok(ms >= 60_000 && ms <= 100_000, String(ms));
  }
});

test("lerPendente ignora lixo e lê um registro válido", () => {
  assert.equal(lerPendente(null), null);
  assert.equal(lerPendente({ resposta_pendente: "x" }), null);
  const ok = {
    resposta_pendente: { status: "pendente", tipo: "agente", sessao: "casamento-1740", agendadoEm: "2026-10-30T12:00:00Z", devidaEm: "2026-10-30T12:01:20Z" },
  };
  assert.equal(lerPendente(ok)?.tipo, "agente");
  assert.equal(lerPendente(ok)?.sessao, "casamento-1740");
});
