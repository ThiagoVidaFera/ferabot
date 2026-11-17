import { test } from "node:test";
import assert from "node:assert/strict";
import { textoResumo, horaDeBrasilia } from "../../src/lib/resumo-diario";
import { ehAvisoInterno } from "../../src/lib/notificacao";

test("resumo lista quem respondeu, quem espera gente e o que precisa de revisão", () => {
  const t = textoResumo({ enviadas: 54, responderam: ["Osmar", "Edson"], esperandoGente: ["Paulo"], revisar: [] });
  assert.match(t, /54\* mensagens enviadas/);
  assert.match(t, /Responderam:\* Osmar, Edson/);
  assert.match(t, /Esperando você.*:\* Paulo/);
  assert.match(t, /revisar\):\* ninguém/);
});

test("lista longa vira 'e mais N'", () => {
  const nomes = Array.from({ length: 9 }, (_, i) => `L${i}`);
  assert.match(textoResumo({ enviadas: 1, responderam: nomes, esperandoGente: [], revisar: [] }), /e mais 3/);
});

test("hora de Brasília", () => {
  assert.equal(horaDeBrasilia(new Date("2026-11-02T21:30:00Z")), 18);
});

test("avisos do próprio CRM são reconhecidos; conversa de lead não", () => {
  assert.ok(ehAvisoInterno("🔥 Lead quente\n\nJoana, o robô parou de responder"));
  assert.ok(ehAvisoInterno("⚠️ Erro\n\nO agente consultoria-sem-limite"));
  assert.ok(ehAvisoInterno("📅 REUNIAO AGENDADA (funil /agendar/) Bianca"));
  assert.equal(ehAvisoInterno("Oi Joana, tudo bem?"), false);
});
