import { test } from "node:test";
import assert from "node:assert/strict";
import { decidirToque, lerToque, type ContextoToque, type ToqueProposta } from "../../src/lib/toque-proposta";

const agendado = new Date("2026-10-27T15:00:00Z"); // 12h em Brasília
const toque: ToqueProposta = {
  agendadoEm: agendado.toISOString(),
  devidoEm: new Date(agendado.getTime() + 48 * 3600_000).toISOString(),
  status: "pendente",
};
const ctx: ContextoToque = { lifecycleStage: "proposta", tags: [], ultimaDoLead: null, oficial: false };
const venceu = new Date("2026-10-29T15:01:00Z"); // 12h01 em Brasília

test("antes de 48h espera", () => {
  assert.equal(decidirToque(toque, ctx, new Date("2026-10-29T14:59:00Z")).acao, "esperar");
});

test("vencido, em horário comercial e sem resposta: envia", () => {
  assert.equal(decidirToque(toque, ctx, venceu).acao, "enviar");
});

test("vencido de madrugada espera a janela de 8h–21h", () => {
  assert.equal(decidirToque(toque, ctx, new Date("2026-10-29T05:00:00Z")).acao, "esperar"); // 2h BRT
});

test("cancela se saiu da proposta, se o lead respondeu ou se pediu opt-out", () => {
  assert.equal(decidirToque(toque, { ...ctx, lifecycleStage: "cliente" }, venceu).acao, "cancelar");
  assert.equal(decidirToque(toque, { ...ctx, ultimaDoLead: new Date("2026-10-28T10:00:00Z") }, venceu).acao, "cancelar");
  assert.equal(decidirToque(toque, { ...ctx, tags: ["optout"] }, venceu).acao, "cancelar");
});

test("resposta ANTES da proposta não cancela; tag humano não bloqueia", () => {
  const r = decidirToque(toque, { ...ctx, tags: ["humano"], ultimaDoLead: new Date("2026-10-27T10:00:00Z") }, venceu);
  assert.equal(r.acao, "enviar");
});

test("número oficial cancela (janela de 24h já fechou)", () => {
  assert.equal(decidirToque(toque, { ...ctx, oficial: true }, venceu).acao, "cancelar");
});

test("lerToque ignora lixo e toque já resolvido não age", () => {
  assert.equal(lerToque({ toque_proposta: "x" }), null);
  assert.equal(decidirToque({ ...toque, status: "enviado" }, ctx, venceu).acao, "esperar");
});
