import { test } from "node:test";
import assert from "node:assert/strict";
import { destinoCloudApi } from "../../src/lib/telefone";

test("responde para o número exato que escreveu, mesmo sem o 9 do cadastro", () => {
  assert.equal(destinoCloudApi("551188887777", "5511988887777"), "551188887777");
});

test("mantém o número quando cadastro e entrada são iguais", () => {
  assert.equal(destinoCloudApi("5511988887777", "5511988887777"), "5511988887777");
});

test("cai no telefone do cadastro quando a entrada não é número brasileiro válido", () => {
  assert.equal(destinoCloudApi("crm", "5511988887777"), "5511988887777");
  assert.equal(destinoCloudApi(null, "5511988887777"), "5511988887777");
  assert.equal(destinoCloudApi("12345", "5511988887777"), "5511988887777");
});
