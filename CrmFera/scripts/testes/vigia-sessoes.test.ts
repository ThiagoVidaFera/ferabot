import { test } from "node:test";
import assert from "node:assert/strict";
import { sessoesCaidas, textoSessaoCaiu } from "../../src/lib/vigia-sessoes";

const s = (name: string, status: string, me: string | null) => ({ name, status, me: me ? { id: `${me}@c.us` } : null });

test("caida = ja foi pareada (tem me) e nao esta WORKING; nunca pareada nao conta", () => {
  const caidas = sessoesCaidas([
    s("principal", "WORKING", "551130000001"),
    s("comercial", "FAILED", "551190000002"),
    s("loja", "STOPPED", "551190000003"),
    s("abandonada", "FAILED", null),
  ]);
  assert.deepEqual(caidas.map((c) => c.name), ["comercial", "loja"]);
  assert.equal(caidas[0].numero, "551190000002");
});

test("STARTING e SCAN_QR_CODE tambem sao caida (ninguem esta recebendo mensagem)", () => {
  const caidas = sessoesCaidas([s("a", "STARTING", "551"), s("b", "SCAN_QR_CODE", "552")]);
  assert.equal(caidas.length, 2);
});

test("aviso usa o nome do CRM quando existe e formata o numero", () => {
  const t = textoSessaoCaiu({ name: "comercial", status: "FAILED", numero: "551188887777" }, "Paula");
  assert.match(t, /Paula/);
  assert.match(t, /\(11\) 8888-7777/);
  assert.match(t, /FAILED/);
});
