import { NEGOCIO_EXEMPLO, _definirNegocioParaTeste } from "../../src/lib/negocio";
import { test } from "node:test";
import assert from "node:assert/strict";
import { reuniaoFutura } from "../../src/lib/seletor-agente";
import { validarMensagem } from "../../src/lib/guardas";

const agora = new Date("2026-10-29T13:00:00Z");
const livre = { links: [], precos: [] };

test("reunião futura bloqueia; passada, ausente ou lixo não", () => {
  assert.ok(reuniaoFutura({ evento_data: "2026-11-02T12:30:00-03:00" }, agora));
  assert.equal(reuniaoFutura({ evento_data: "2026-10-28T12:30:00-03:00" }, agora), null);
  assert.equal(reuniaoFutura({}, agora), null);
  assert.equal(reuniaoFutura({ evento_data: "amanha" }, agora), null);
  assert.equal(reuniaoFutura(null, agora), null);
});

test("guarda barra apresentação como assistente, mas não a palavra solta", () => {
  for (const t of ["Oi, Kelly, aqui é o assistente do Ana.", "Sou o assistente virtual do Ana.", "Eu sou a assistente da equipe."]) {
    assert.equal(validarMensagem(t, livre).ok, false, t);
  }
  assert.equal(validarMensagem("Você tem assistente jurídico no escritório?", livre).ok, true);
});

test("guarda barra aviso de passagem pro dono (nome do negocio.json) e pra equipe", () => {
  _definirNegocioParaTeste({ ...NEGOCIO_EXEMPLO, dono: { ...NEGOCIO_EXEMPLO.dono, nome: "Ana Lima", primeiroNome: "Ana" } });
  for (const t of ["Fechado, Renan. Vou passar essa conversa pra Ana agora.", "A Ana vai te chamar aqui mesmo.", "Vou te passar pro time."]) {
    assert.equal(validarMensagem(t, livre).ok, false, t);
  }
  _definirNegocioParaTeste(null);
  assert.equal(validarMensagem("Faz sentido pro teu momento?", livre).ok, true);
});
