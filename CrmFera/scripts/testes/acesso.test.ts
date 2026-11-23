import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bloqueadoPorFalhas,
  inicioDaJanela,
  liberadoDuranteTroca,
  motivoSenhaRecusada,
  normalizarEmail,
  LIMITE_FALHAS,
} from "../../src/lib/acesso";

test("login trava no 5º erro seguido do mesmo e-mail, dentro de 15 minutos", () => {
  assert.equal(bloqueadoPorFalhas(LIMITE_FALHAS - 1), false);
  assert.equal(bloqueadoPorFalhas(LIMITE_FALHAS), true);
  assert.equal(inicioDaJanela(new Date("2026-11-22T12:00:00Z")).toISOString(), "2026-11-22T11:45:00.000Z");
  assert.equal(normalizarEmail("  Ana@X.com "), "ana@x.com");
});

test("senha nova não pode ser a senha de entrada, curta ou diferente da confirmação", () => {
  assert.match(motivoSenhaRecusada("abc", "abc", "senha de entrada") ?? "", /8 caracteres/);
  assert.match(motivoSenhaRecusada("12345678", "12345679", "senha de entrada") ?? "", /iguais/);
  assert.match(motivoSenhaRecusada("Senha De Entrada", "Senha De Entrada", "senha de entrada") ?? "", /diferente/);
  assert.equal(motivoSenhaRecusada("minha-senha-boa", "minha-senha-boa", "senha de entrada"), null);
});

test("durante a troca obrigatória só abrem a própria tela, a API e o login", () => {
  assert.equal(liberadoDuranteTroca("/primeiro-acesso"), true);
  assert.equal(liberadoDuranteTroca("/api/ferabot/estado"), true);
  assert.equal(liberadoDuranteTroca("/login"), true);
  assert.equal(liberadoDuranteTroca("/"), false);
  assert.equal(liberadoDuranteTroca("/configuracoes"), false);
  assert.equal(liberadoDuranteTroca("/chaves"), false);
});
