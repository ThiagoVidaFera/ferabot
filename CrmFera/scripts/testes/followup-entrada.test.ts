import { test } from "node:test";
import assert from "node:assert/strict";
import { elegivelEntrada, textoDoToqueEntrada, numeroDominante, type ContatoEntrada } from "../../src/lib/followup-entrada";
import { ehSoEmoji } from "../../src/lib/guarda-numero";

const agora = new Date("2026-10-29T14:00:00Z");
const base: ContatoEntrada = {
  origem: "funil:grupo-bastidores-ysp",
  lifecycleStage: "novo",
  phone: "5511987654321",
  tags: [],
  customFields: {},
  createdAt: new Date("2026-10-25T10:00:00Z"),
  mensagens: 0,
};

test("lead de funil, 72h+, sem nenhuma mensagem: elegível", () => {
  assert.deepEqual(elegivelEntrada(base, agora), { ok: true });
});

test("recusa: menos de 72h, antigo demais, com mensagem, estágio fora, sem funil", () => {
  assert.equal(elegivelEntrada({ ...base, createdAt: new Date("2026-10-27T15:00:00Z") }, agora).ok, false);
  assert.equal(elegivelEntrada({ ...base, createdAt: new Date("2026-09-01T10:00:00Z") }, agora).ok, false);
  assert.equal(elegivelEntrada({ ...base, mensagens: 1 }, agora).ok, false);
  assert.equal(elegivelEntrada({ ...base, lifecycleStage: "cliente" }, agora).ok, false);
  assert.equal(elegivelEntrada({ ...base, origem: "whatsapp" }, agora).ok, false);
});

test("recusa: telefone inválido, reunião futura, humano/opt-out e quem já recebeu", () => {
  assert.equal(elegivelEntrada({ ...base, phone: "5555300007499" }, agora).ok, false);
  assert.equal(elegivelEntrada({ ...base, customFields: { evento_data: "2026-11-02T08:00:00-03:00" } }, agora).ok, false);
  assert.equal(elegivelEntrada({ ...base, tags: ["humano"] }, agora).ok, false);
  assert.equal(elegivelEntrada({ ...base, tags: ["optout"] }, agora).ok, false);
  assert.equal(elegivelEntrada({ ...base, customFields: { followup_entrada: { status: "enviado" } } }, agora).ok, false);
});

test("toque de entrada é texto de verdade, com a primeira pergunta da qualificação", () => {
  const t = textoDoToqueEntrada("Ana Paula", null);
  assert.equal(ehSoEmoji(t), false);
  assert.ok(t.startsWith("Oi, Ana!"), t);
  assert.match(t, /\?/);
  assert.match(t, /\n\n/);
  assert.doesNotMatch(t, /👀|🆙|❓/);
  assert.ok(textoDoToqueEntrada(null, null).startsWith("Oi!"));
});

test("num número com persona o toque se apresenta com o nome dela", () => {
  const t = textoDoToqueEntrada("Ana", { nome: "Paula" });
  assert.match(t, /Paula aqui, da equipe de /);
});

test("número do funil: o de mais conversa entre os permitidos (oficial fica de fora)", () => {
  const contagens = [
    { instanceId: "oficial", n: 500 },
    { instanceId: "pessoal", n: 150 },
    { instanceId: "comercial", n: 20 },
  ];
  assert.equal(numeroDominante(contagens, new Set(["pessoal", "comercial"])), "pessoal");
  assert.equal(numeroDominante([], new Set(["pessoal"])), null);
  assert.equal(numeroDominante(contagens, new Set(["x"])), null);
});
