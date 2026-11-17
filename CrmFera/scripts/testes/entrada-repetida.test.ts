import { test } from "node:test";
import assert from "node:assert/strict";
import { ehEntradaRepetida } from "../../src/lib/entrada-repetida";

const agora = new Date("2026-11-10T20:00:00-03:00");
const min = (n: number) => new Date(agora.getTime() - n * 60_000);

test("mesma entrada minutos antes é repetida", () => {
  const recentes = [{ timestamp: min(5), metadata: { texto: "Entrou por estruturacao_digital" } }];
  assert.equal(ehEntradaRepetida(recentes, "Entrou por estruturacao_digital", agora), true);
});

test("funil diferente não é repetida", () => {
  const recentes = [{ timestamp: min(5), metadata: { texto: "Entrou por agendar_implementacao_ysp" } }];
  assert.equal(ehEntradaRepetida(recentes, "Entrou por estruturacao_digital", agora), false);
});

test("mesma entrada fora da janela de 2h conta como nova", () => {
  const recentes = [{ timestamp: min(180), metadata: { texto: "Entrou por estruturacao_digital" } }];
  assert.equal(ehEntradaRepetida(recentes, "Entrou por estruturacao_digital", agora), false);
});

test("sem eventos, sem texto ou metadata estranha: não é repetida", () => {
  assert.equal(ehEntradaRepetida([], "Entrou por x", agora), false);
  assert.equal(ehEntradaRepetida([{ timestamp: min(1), metadata: null }], "Entrou por x", agora), false);
  assert.equal(ehEntradaRepetida([{ timestamp: min(1), metadata: { texto: "" } }], "", agora), false);
});
