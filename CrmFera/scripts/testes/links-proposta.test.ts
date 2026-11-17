import { test } from "node:test";
import assert from "node:assert/strict";
import { linksDePropostaEm } from "../../src/lib/links-proposta";

test("acha o link da pagina de proposta numa mensagem enviada", () => {
  const msg = "Tudo está aqui 👇\n\n🔗 https://proposta-pedro-camila.exemplo.com\n\nFaz sentido?";
  assert.deepEqual(linksDePropostaEm([msg]), ["https://proposta-pedro-camila.exemplo.com"]);
});

test("aceita caminho depois do dominio e tira pontuacao colada", () => {
  assert.deepEqual(linksDePropostaEm(["veja https://proposta-carlos.exemplo.com/v3."]), [
    "https://proposta-carlos.exemplo.com/v3",
  ]);
});

test("checkout e outros links nao viram autorizados", () => {
  const msg = "https://pay.exemplo.com/pay/consultoria-fera-reunioes-individuais-ilimitadas e https://google.com";
  assert.deepEqual(linksDePropostaEm([msg]), []);
});

test("sem duplicar e sem inventar", () => {
  const a = "https://proposta-a.exemplo.com";
  assert.deepEqual(linksDePropostaEm([a, `de novo ${a}`, "sem link"]), [a]);
  assert.deepEqual(linksDePropostaEm([]), []);
});

