import { test } from "node:test";
import assert from "node:assert/strict";
import { semWebhookDoCrm, textoSemWebhook } from "../../src/lib/vigia-sessoes";

const URL_CRM = "https://crm.exemplo.com/api/webhooks/evolution";

test("sessão sem webhook, ou só com webhook de outro sistema, é sinalizada", () => {
  assert.equal(semWebhookDoCrm([], URL_CRM), true);
  assert.equal(semWebhookDoCrm(["http://10.0.3.11:8083/webhook"], URL_CRM), true);
});

test("webhook do CRM presente (com ou sem barra final, com query) não sinaliza", () => {
  assert.equal(semWebhookDoCrm([URL_CRM], URL_CRM), false);
  assert.equal(semWebhookDoCrm([URL_CRM + "/"], URL_CRM), false);
  assert.equal(semWebhookDoCrm(["http://10.0.3.11:8083/webhook", URL_CRM + "?sessao=x"], URL_CRM), false);
});

test("o aviso diz o que acontece e como corrigir", () => {
  const t = textoSemWebhook("casamento-1740", "Ana (61) 99115-1740");
  assert.match(t, /Ana \(61\) 99115-1740/);
  assert.match(t, /Conectar/);
  assert.match(t, /casamento-1740/);
});
