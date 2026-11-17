import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ehObjecaoDeValor,
  ehRespostaDois,
  furaHumano,
  instrucaoDaObjecao,
  entradaJaOferecida,
} from "../../src/lib/objecao-valor";

const REGUA = [
  "Pra eu parar de fazer papel de esqueleto: ainda faz sentido pra você gerar clientes pelo YouTube?",
  "1️⃣ Quero começar",
  "2️⃣ Travei em algo (me diz em uma linha)",
  "3️⃣ Agora não (me diz em que mês te chamo)",
].join("\n");

test("a fala real do Lucas é objeção de valor", () => {
  assert.ok(ehObjecaoDeValor("2 - travei no valor de investimentos. Pra mim no momento é muita grana."));
});

test("variações comuns de 'não cabe' são objeção", () => {
  for (const t of [
    "tá caro pra mim",
    "não tenho esse dinheiro agora",
    "não consigo investir esse valor",
    "é só o financeiro",
    "só em janeiro",
    "ficou pesado",
  ]) {
    assert.ok(ehObjecaoDeValor(t), t);
  }
});

test("conversa comum não é objeção", () => {
  for (const t of ["bom dia", "quero começar", "qual o valor?", "vamos fechar", "", null, undefined]) {
    assert.ok(!ehObjecaoDeValor(t), String(t));
  }
});

test("'2' só vale como resposta às opções 1/2/3 da régua", () => {
  assert.ok(ehRespostaDois("2", REGUA));
  assert.ok(ehRespostaDois("2️⃣", REGUA));
  assert.ok(ehRespostaDois("2 - travei", REGUA));
  assert.ok(!ehRespostaDois("2", "Bom dia Lucas, ficou alguma dúvida?"));
  assert.ok(!ehRespostaDois("20 mil", REGUA));
  assert.ok(!ehRespostaDois("1", REGUA));
});

