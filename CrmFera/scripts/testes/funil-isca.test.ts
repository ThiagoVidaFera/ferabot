import { test } from "node:test";
import assert from "node:assert/strict";
import { ehFunilIsca } from "../../src/lib/funil-isca";

test("funis de isca digital não avisam", () => {
  for (const f of [
    "isca_guia_20min",
    "isca_livro_venda_sem_reuniao",
    "isca_digital_exemplo",
    "funil:isca_digital_exemplo",
    "isca-guia-20min",
    "pdf_cliente",
    "material_radar",
    "material_guia",
    "material_prompt",
  ]) {
    assert.equal(ehFunilIsca(f), true, f);
  }
});

test("funis de venda e vazio continuam avisando", () => {
  for (const f of ["consultoria-sem-limite", "planos_30_50_100", "agendar", "diagnostico-lsc", "", null, undefined]) {
    assert.equal(ehFunilIsca(f), false, String(f));
  }
});
