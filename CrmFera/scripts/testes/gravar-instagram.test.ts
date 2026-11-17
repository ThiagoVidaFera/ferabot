import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { criarBancoTemporario } from "./banco-temporario";

const banco = criarBancoTemporario();

type Mod = typeof import("../../src/lib/gravar-instagram");
type Dbm = typeof import("../../src/lib/db");
let gravarInstagram: Mod["gravarInstagram"];
let db: Dbm["db"];

before(async () => {
  ({ gravarInstagram } = await import("../../src/lib/gravar-instagram"));
  ({ db } = await import("../../src/lib/db"));
});
after(async () => {
  await db.$disconnect();
  banco.apagar();
});

const campos = async (id: string) =>
  (await db.contact.findUniqueOrThrow({ where: { id } })).customFields as Record<string, unknown>;

test("grava o @ no contato achado pela variante sem o 9º dígito e registra na linha do tempo", async () => {
  const c = await db.contact.create({
    data: { name: "Bianca", phone: "5511988887777", customFields: { nicho: "advocacia" } },
  });
  const r = await gravarInstagram("551188887777", "@Bianca.Silva", "robo-agenda");
  assert.deepEqual(r, { ok: true, id: c.id, instagram: "bianca.silva", mudou: true });
  assert.deepEqual(await campos(c.id), { nicho: "advocacia", instagram: "bianca.silva" });
  const eventos = await db.timelineEvent.findMany({ where: { contactId: c.id } });
  assert.equal(eventos.length, 1);
  assert.equal(eventos[0].eventType, "note");
});

test("mesmo @ de novo não mexe em nada (sem evento duplicado)", async () => {
  const c = await db.contact.create({
    data: { name: "Raul", phone: "5511900006675", customFields: { instagram: "raul.x" } },
  });
  const r = await gravarInstagram("5511900006675", "raul.x", "robo-agenda");
  assert.equal(r.ok && r.mudou, false);
  assert.equal(await db.timelineEvent.count({ where: { contactId: c.id } }), 0);
});

test("@ diferente substitui e guarda o anterior no evento", async () => {
  const c = await db.contact.create({
    data: { name: "Kelly", phone: "5511900009746", customFields: { instagram: "kelly.velho" } },
  });
  await gravarInstagram("5511900009746", "kelly.novo", "robo-agenda");
  assert.equal((await campos(c.id)).instagram, "kelly.novo");
  const ev = await db.timelineEvent.findFirstOrThrow({ where: { contactId: c.id } });
  assert.equal((ev.metadata as Record<string, unknown>).anterior, "kelly.velho");
});

test("recusa @ inválido, telefone inválido e contato inexistente (nunca cria lead)", async () => {
  assert.deepEqual(await gravarInstagram("5511900000000", "instagram", "x"), { ok: false, status: 422, erro: "instagram invalido" });
  assert.deepEqual(await gravarInstagram("123", "fulano", "x"), { ok: false, status: 422, erro: "telefone invalido" });
  const antes = await db.contact.count();
  assert.deepEqual(await gravarInstagram("5521900003825", "fulano", "x"), { ok: false, status: 404, erro: "contato nao encontrado" });
  assert.equal(await db.contact.count(), antes);
});
