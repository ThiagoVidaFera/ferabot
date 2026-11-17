import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { criarBancoTemporario } from "./banco-temporario";

// Sem negocio.json, vale o NEGOCIO_EXEMPLO: uma oferta `principal` ("Seu serviço principal",
// R$ 2.000 à vista, 10x de R$ 230, página https://exemplo.com/oferta). `padrao` = essa oferta.
const banco = criarBancoTemporario();

type Mod = typeof import("../../src/lib/proposta-contato");
type Dbm = typeof import("../../src/lib/db");
let gravarProposta: Mod["gravarProposta"];
let lerProposta: Mod["lerProposta"];
let ofertaDaProposta: Mod["ofertaDaProposta"];
let precoDaProposta: Mod["precoDaProposta"];
let db: Dbm["db"];

before(async () => {
  ({ gravarProposta, lerProposta, ofertaDaProposta, precoDaProposta } = await import("../../src/lib/proposta-contato"));
  ({ db } = await import("../../src/lib/db"));
});
after(async () => {
  await db.$disconnect();
  banco.apagar();
});

const campos = async (id: string) =>
  (await db.contact.findUniqueOrThrow({ where: { id } })).customFields as Record<string, unknown>;

const dados = {
  ofertaBase: "padrao",
  link: "https://proposta-pedro.exemplo.com",
};

test("grava a oferta no contato achado pela variante sem o 9º dígito, sem apagar o resto", async () => {
  const c = await db.contact.create({
    data: { name: "Pedro", phone: "5551980007823", customFields: { nicho: "terapia" } },
  });
  const r = await gravarProposta("555180007823", dados, "skill-proposta");
  assert.equal(r.ok, true);
  const f = await campos(c.id);
  assert.equal(f.nicho, "terapia");
  const p = lerProposta(f);
  assert.equal(p?.ofertaBase, "padrao");
  assert.equal(p?.link, "https://proposta-pedro.exemplo.com");
  assert.ok(p?.enviadaEm);
  const eventos = await db.timelineEvent.findMany({ where: { contactId: c.id } });
  assert.equal(eventos.length, 1);
  assert.equal(eventos[0].eventType, "note");
});

test("proposta nova no mesmo contato substitui a anterior", async () => {
  const c = await db.contact.create({ data: { name: "Ana", phone: "5511900006675" } });
  await gravarProposta("5511900006675", dados, "skill-proposta");
  await gravarProposta("5511900006675", { ofertaBase: "principal", link: "https://proposta-ana.exemplo.com" }, "skill-proposta");
  assert.equal(lerProposta(await campos(c.id))?.ofertaBase, "principal");
});

test("oferta desconhecida, link fora do padrão de proposta e telefone ruim são recusados", async () => {
  await db.contact.create({ data: { name: "Rui", phone: "5511999990001" } });
  const a = await gravarProposta("5511999990001", { ...dados, ofertaBase: "inventada" }, "x");
  assert.deepEqual(a, { ok: false, status: 422, erro: "oferta desconhecida: inventada" });
  const b = await gravarProposta("5511999990001", { ...dados, link: "https://checkout.exemplo.com/pay/x" }, "x");
  assert.deepEqual(b, { ok: false, status: 422, erro: "link de proposta invalido" });
  const c = await gravarProposta("123", dados, "x");
  assert.deepEqual(c, { ok: false, status: 422, erro: "telefone invalido" });
});

test("contato que não existe não é criado", async () => {
  const r = await gravarProposta("5599900000000", dados, "x");
  assert.deepEqual(r, { ok: false, status: 404, erro: "contato nao encontrado" });
});

test("entregas próprias da proposta valem mais que o catálogo", async () => {
  const c = await db.contact.create({ data: { name: "Lia", phone: "5511999990002" } });
  await gravarProposta("5511999990002", { ...dados, entregas: ["entrega sob medida A", "entrega sob medida B"] }, "x");
  const o = ofertaDaProposta(lerProposta(await campos(c.id)));
  assert.deepEqual(o?.entregas, ["entrega sob medida A", "entrega sob medida B"]);
});

test("proposta mandada pela página da oferta (sem página própria) também é registrada", async () => {
  const c = await db.contact.create({ data: { name: "Rafa", phone: "5511900007041" } });
  const a = await gravarProposta("5511900007041", { ofertaBase: "padrao", link: "https://exemplo.com/oferta" }, "x");
  assert.equal(a.ok, true);
  assert.equal(lerProposta(await campos(c.id))?.link, "https://exemplo.com/oferta");
});

test("catálogo vem do negocio.json: entregas, garantia vazia = null e preço lido da frase", () => {
  const o = ofertaDaProposta({ ofertaBase: "padrao", link: "https://proposta-a.exemplo.com", enviadaEm: "2026-11-05T00:00:00Z" });
  assert.deepEqual(o?.entregas, ["entrega 1", "entrega 2"]);
  assert.equal(o?.garantia, null);
  assert.equal(o?.videoResumo, false);
  assert.deepEqual(precoDaProposta("padrao"), { totalCentavos: 200_000, parcelaCentavos: 23_000 });
  assert.deepEqual(precoDaProposta("principal"), { totalCentavos: 200_000, parcelaCentavos: 23_000 });
  assert.equal(precoDaProposta("inexistente"), null);
});

test("sem proposta guardada, não inventa oferta", () => {
  assert.equal(lerProposta({}), null);
  assert.equal(lerProposta(null), null);
  assert.equal(ofertaDaProposta(null), null);
});
