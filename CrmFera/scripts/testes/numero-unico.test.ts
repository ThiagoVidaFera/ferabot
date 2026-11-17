import { test } from "node:test";
import assert from "node:assert/strict";
import {
  exigeNumeroUnico,
  sessaoPermitida,
  sessaoNumeroUnico,
  avisoNumeroUnico,
  _definirNumeroUnico,
} from "../../src/lib/numero-unico";

test("sem configuração não existe número único: qualquer sessão fala com qualquer lead", () => {
  _definirNumeroUnico(null);
  assert.equal(sessaoNumeroUnico(), "");
  assert.equal(exigeNumeroUnico("funil:qualquer"), false);
  assert.equal(sessaoPermitida("funil:qualquer", "default"), true);
  assert.equal(avisoNumeroUnico("funil:qualquer", "default"), null);
});

test("origem configurada exige a sessão do número único (normaliza hífen, acento e caixa)", () => {
  _definirNumeroUnico({ sessao: "comercial", marcas: ["Funil Mentoria"], aviso: "Responda pelo comercial" });
  for (const o of ["funil:funil-mentoria", "funil:funil_mentoria", "Funil:Funil Mentória", "funil:funil-mentoria-v2"]) {
    assert.equal(exigeNumeroUnico(o), true, o);
  }
  for (const o of ["funil:outro", "whatsapp", "anuncio", "", null, undefined]) {
    assert.equal(exigeNumeroUnico(o), false, String(o));
  }
  assert.equal(sessaoPermitida("funil:funil-mentoria", "comercial"), true);
  assert.equal(sessaoPermitida("funil:funil-mentoria", "default"), false);
  assert.equal(sessaoPermitida("funil:funil-mentoria", null), false);
  assert.equal(sessaoPermitida("funil:outro", "default"), true);
});

test("aviso do Inbox só quando o lead exige o número único e quem responde é outro", () => {
  _definirNumeroUnico({ sessao: "comercial", marcas: ["funil mentoria"], aviso: "Responda pelo comercial" });
  assert.equal(avisoNumeroUnico("funil:funil-mentoria", "default"), "Responda pelo comercial");
  assert.equal(avisoNumeroUnico("funil:funil-mentoria", undefined), "Responda pelo comercial");
  assert.equal(avisoNumeroUnico("funil:funil-mentoria", "comercial"), null);
  assert.equal(avisoNumeroUnico("funil:outro", "default"), null);
  _definirNumeroUnico(null);
});
