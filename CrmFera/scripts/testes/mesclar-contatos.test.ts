import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizarInstagram,
  extrairInstagramDaMensagem,
  decidirManter,
  dadosMesclados,
} from "../../src/lib/mesclar-contatos";

test("@ do Instagram: normaliza e recusa lixo", () => {
  assert.equal(normalizarInstagram("@Romeu.BozzoJr"), "romeu.bozzojr");
  assert.equal(normalizarInstagram("romeu.bozzojr"), "romeu.bozzojr");
  assert.equal(normalizarInstagram("ab"), null);
  assert.equal(normalizarInstagram("nao"), null);
  assert.equal(normalizarInstagram("com espaço"), null);
  assert.equal(normalizarInstagram(null), null);
});

test("extrai o @ da mensagem pronta do botão da página", () => {
  const msg = "Olá Ana, meu nome é Romeu Bozzo Junior (@romeu.bozzojr). Vim da página da Consultoria de Jornada de Compra com IA.";
  assert.equal(extrairInstagramDaMensagem(msg), "romeu.bozzojr");
  assert.equal(extrairInstagramDaMensagem("oi, tudo bem?"), null);
});

test("fica quem tem a conversa; empate, o mais antigo", () => {
  const a = { id: "form", mensagens: 0, createdAt: new Date("2026-10-30T11:48:11Z") };
  const b = { id: "zap", mensagens: 20, createdAt: new Date("2026-10-30T11:48:31Z") };
  assert.equal(decidirManter(a, b).manter.id, "zap");
  assert.equal(decidirManter({ ...a, mensagens: 1 }, { ...b, mensagens: 1 }).manter.id, "form");
});

test("dados do contato mesclado: nome/origem/e-mail do formulário, telefone da conversa preservado", () => {
  const zap = { name: "Bozzo Jr, ROMEU", email: null, phone: "393770804581", origem: "whatsapp", tags: ["interesse-cjc"], customFields: { whatsapp_chat_id: "x@lid", instagram: "@romeu.bozzojr" }, createdAt: new Date("2026-10-30T11:48:31Z"), totalRevenue: 0, purchaseCount: 0 };
  const form = { name: "Romeu Bozzo Junior", email: "romeu@z4.com.br", phone: "5511900001358", origem: "funil:consultoria-jornada-de-compra", tags: [], customFields: { instagram: "romeu.bozzojr", utm_source: "meta" }, createdAt: new Date("2026-10-30T11:48:11Z"), totalRevenue: 0, purchaseCount: 0 };
  const r = dadosMesclados(zap, form, "id-form");
  assert.equal(r.name, "Romeu Bozzo Junior");
  assert.equal(r.email, "romeu@z4.com.br");
  assert.equal(r.origem, "funil:consultoria-jornada-de-compra");
  assert.deepEqual(r.tags, ["interesse-cjc"]);
  assert.equal((r.customFields as Record<string, unknown>).telefone_formulario, "5511900001358");
  assert.equal((r.customFields as Record<string, unknown>).whatsapp_chat_id, "x@lid");
  assert.equal((r.customFields as Record<string, unknown>).utm_source, "meta");
  assert.equal(r.createdAt.toISOString(), "2026-10-30T11:48:11.000Z");
});
