import { test } from "node:test";
import assert from "node:assert/strict";
import { calorDe } from "../../src/lib/calor";

const recebida = (texto = "oi") => ({ eventType: "whatsapp_message", metadata: { direcao: "recebida", texto } });
const enviada = { eventType: "whatsapp_message", metadata: { direcao: "enviada", texto: "oi" } };
const base = { purchaseCount: 0, lifecycleStage: "novo", origem: "outro" };

test("sem resposta do lead nao tem calor", () => {
  assert.deepEqual(calorDe(base, [enviada]), { pontos: 0, motivos: [] });
});

test("responder no WhatsApp vale 40; tres respostas somam conversa em andamento", () => {
  assert.equal(calorDe(base, [recebida()]).pontos, 40);
  const tres = calorDe(base, [recebida(), recebida(), recebida()]);
  assert.equal(tres.pontos, 55);
  assert.ok(tres.motivos.includes("conversa em andamento"));
});

test("compra, call/proposta, origem e texto longo somam e o teto e 100", () => {
  const c = calorDe(
    { purchaseCount: 1, lifecycleStage: "proposta", origem: "funil:x" },
    [recebida("x".repeat(130)), recebida(), recebida()],
  );
  assert.equal(c.pontos, 100);
  assert.ok(c.motivos.includes("escreveu mensagem longa"));
  assert.ok(c.motivos.includes("está em proposta"));
});

test("origem base/outro nao pontua; metadata torta nao quebra", () => {
  const c = calorDe({ ...base, origem: "base" }, [
    { eventType: "whatsapp_message", metadata: null },
    { eventType: "whatsapp_message", metadata: "texto" },
    recebida(),
  ]);
  assert.equal(c.pontos, 40);
});
