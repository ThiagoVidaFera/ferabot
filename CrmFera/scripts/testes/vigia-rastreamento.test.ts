import { test } from "node:test";
import assert from "node:assert/strict";
import { problemasDeRastreio, textoAlertaRastreio } from "../../src/lib/vigia-rastreamento";

const base = { recusas: [], cobertura: [], metaXcrm: [] };

test("sem recusa, cobertura boa e numeros batendo nao gera problema", () => {
  const p = problemasDeRastreio({
    ...base,
    cobertura: [{ origem: "funil:a", pagos: 20, comClique: 18 }],
    metaXcrm: [{ campanha: "c1", meta: 10, crm: 11 }],
  });
  assert.deepEqual(p, []);
});

test("recusa da CAPI nas ultimas 24h vira problema com a ultima mensagem", () => {
  const p = problemasDeRastreio({ ...base, recusas: [{ detalhe: "Lead: token expirado", em: new Date() }] });
  assert.equal(p.length, 1);
  assert.match(p[0], /CAPI recusou 1/);
  assert.match(p[0], /token expirado/);
});

test("funil pago com menos da metade dos leads com clique vira problema; volume baixo nao", () => {
  const p = problemasDeRastreio({
    ...base,
    cobertura: [
      { origem: "funil:isca", pagos: 40, comClique: 0 },
      { origem: "funil:pequeno", pagos: 3, comClique: 0 },
    ],
  });
  assert.equal(p.length, 1);
  assert.match(p[0], /funil:isca/);
  assert.match(p[0], /0 de 40/);
});

test("Meta e CRM divergindo mais que 2x numa campanha com volume vira problema", () => {
  const p = problemasDeRastreio({
    ...base,
    metaXcrm: [
      { campanha: "agendar", meta: 3, crm: 21 },
      { campanha: "ok", meta: 9, crm: 10 },
      { campanha: "miuda", meta: 0, crm: 2 },
    ],
  });
  assert.equal(p.length, 1);
  assert.match(p[0], /agendar/);
  assert.match(p[0], /Meta 3 × CRM 21/);
});

test("texto do alerta lista os problemas e diz onde olhar", () => {
  const t = textoAlertaRastreio(["a", "b"]);
  assert.match(t, /• a/);
  assert.match(t, /• b/);
  assert.match(t, /Auditoria/);
});
