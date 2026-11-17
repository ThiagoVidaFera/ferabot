import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { criarBancoTemporario } from "./banco-temporario";

const banco = criarBancoTemporario();

type Fila = typeof import("../../src/lib/fila-sem-resposta");
type Dbm = typeof import("../../src/lib/db");
let fila: Fila;
let db: Dbm["db"];

const H = 3_600_000;
const agora = new Date("2026-10-28T15:00:00Z");
const ha = (h: number) => new Date(agora.getTime() - h * H);

let seq = 0;
async function contato(nome: string, extra: Record<string, unknown> = {}) {
  seq += 1;
  return db.contact.create({
    data: { name: nome, phone: `5511900000${String(seq).padStart(3, "0")}`, ...extra },
  });
}
async function msg(contactId: string, direction: "inbound" | "outbound", h: number, body = "texto", instanceId?: string) {
  return db.whatsappMessage.create({
    data: {
      contactId,
      instanceId: instanceId ?? null,
      fromNumber: direction === "inbound" ? "lead" : "crm",
      toNumber: direction === "inbound" ? "crm" : "lead",
      body,
      direction,
      timestamp: ha(h),
    },
  });
}

before(async () => {
  ({ db } = await import("../../src/lib/db"));
  fila = await import("../../src/lib/fila-sem-resposta");
});
after(async () => {
  await db.$disconnect();
  banco.apagar();
});

test("lista quem tem a ultima mensagem do lead e ignora quem ja foi respondido", async () => {
  const a = await contato("Sem Resposta");
  await msg(a.id, "inbound", 3, "oi, quanto custa?");
  const b = await contato("Respondido");
  await msg(b.id, "inbound", 5);
  await msg(b.id, "outbound", 4);

  const r = await fila.filaSemResposta({ agora });
  const ids = r.map((i) => i.contactId);
  assert.ok(ids.includes(a.id));
  assert.ok(!ids.includes(b.id));
  const item = r.find((i) => i.contactId === a.id)!;
  assert.equal(item.ultimaMensagem.texto, "oi, quanto custa?");
  assert.equal(item.mensagensSemResposta, 1);
  assert.equal(Math.round(item.horasParado), 3);
});

test("conta so as mensagens do lead DEPOIS da nossa ultima fala e mede o tempo desde a primeira", async () => {
  const c = await contato("Insistente");
  await msg(c.id, "inbound", 30, "antiga");
  await msg(c.id, "outbound", 20, "nossa");
  await msg(c.id, "inbound", 10, "primeira sem resposta");
  await msg(c.id, "inbound", 2, "segunda");
  const item = (await fila.filaSemResposta({ agora })).find((i) => i.contactId === c.id)!;
  assert.equal(item.mensagensSemResposta, 2);
  assert.equal(Math.round(item.horasParado), 10);
  assert.equal(item.ultimaMensagem.texto, "segunda");
  assert.equal(item.janela.estado, "aberta"); // janela conta da ULTIMA fala (2h)
});

test("exclui perdido, arquivada, opt-out, numero interno, antigo demais e grupo", async () => {
  const perdido = await contato("Perdido", { lifecycleStage: "perdido" });
  await msg(perdido.id, "inbound", 2);

  const arq = await contato("Arquivada");
  await msg(arq.id, "inbound", 2);
  await db.conversationState.create({ data: { contactId: arq.id, estado: "arquivada" } });

  const opt = await contato("OptOut", { tags: ["controle-optout"] });
  await msg(opt.id, "inbound", 2);

  const interno = await contato("Interno");
  await msg(interno.id, "inbound", 2);
  await db.setting.upsert({
    where: { key: "notificar_whatsapp" },
    update: { value: interno.phone! },
    create: { key: "notificar_whatsapp", value: interno.phone! },
  });

  const velho = await contato("Velho");
  await msg(velho.id, "inbound", 24 * 40);

  await db.whatsappMessage.create({
    data: { contactId: null, fromNumber: "g", toNumber: "crm", body: "msg de grupo", direction: "inbound", timestamp: ha(1) },
  });

  const ids = (await fila.filaSemResposta({ agora })).map((i) => i.contactId);
  for (const x of [perdido, arq, opt, interno, velho]) assert.ok(!ids.includes(x.id), x.name);
});

test("ordena por prioridade: funil quente com janela fechando vence base fria parada", async () => {
  const quente = await contato("Quente Funil", { origem: "funil:mentoria", lifecycleStage: "conversando", purchaseCount: 0 });
  await msg(quente.id, "inbound", 20, "x".repeat(150));
  const frio = await contato("Frio Base", { origem: "base" });
  await msg(frio.id, "inbound", 24 * 10, "oi");

  const r = await fila.filaSemResposta({ agora });
  const iq = r.findIndex((i) => i.contactId === quente.id);
  const ifr = r.findIndex((i) => i.contactId === frio.id);
  assert.ok(iq >= 0 && ifr >= 0 && iq < ifr);
  const q = r[iq];
  assert.equal(q.janela.estado, "fechando");
  assert.ok(q.prioridade.pontos > r[ifr].prioridade.pontos);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].prioridade.pontos >= r[i].prioridade.pontos);
});

test("Cloud API com janela fechada exige template; WAHA nao", async () => {
  const cloud = await db.whatsappInstance.create({
    data: { name: "oficial", provider: "cloud_api", evolutionApiUrl: "https://graph.example", instanceName: "123" },
  });
  const waha = await db.whatsappInstance.create({
    data: { name: "celular", provider: "waha", evolutionApiUrl: "http://waha.example", instanceName: "s" },
  });
  const c1 = await contato("Oficial Fechada");
  await msg(c1.id, "inbound", 30, "oi", cloud.id);
  const c2 = await contato("Celular Fechada");
  await msg(c2.id, "inbound", 30, "oi", waha.id);

  const r = await fila.filaSemResposta({ agora });
  const i1 = r.find((i) => i.contactId === c1.id)!;
  const i2 = r.find((i) => i.contactId === c2.id)!;
  assert.equal(i1.janela.estado, "fechada");
  assert.equal(i1.exigeTemplate, true);
  assert.equal(i1.tipoConexao, "cloud_api");
  assert.equal(i2.exigeTemplate, false);
});

test("'obrigado' como ultima fala e marcado como encerramento e perde prioridade", async () => {
  const c = await contato("Agradecido", { origem: "funil:x" });
  await msg(c.id, "inbound", 2, "obrigado!");
  const d = await contato("Pergunta", { origem: "funil:x" });
  await msg(d.id, "inbound", 2, "e o preco?");
  const r = await fila.filaSemResposta({ agora });
  const ic = r.find((i) => i.contactId === c.id)!;
  const id = r.find((i) => i.contactId === d.id)!;
  assert.equal(ic.encerramento, true);
  assert.ok(ic.prioridade.pontos < id.prioridade.pontos);
});

test("respeita o limite e contarSemResposta bate com a lista", async () => {
  const toda = await fila.filaSemResposta({ agora });
  const limitada = await fila.filaSemResposta({ agora, limite: 2 });
  assert.equal(limitada.length, 2);
  assert.deepEqual(limitada.map((i) => i.contactId), toda.slice(0, 2).map((i) => i.contactId));
  assert.equal(await fila.contarSemResposta({ agora }), toda.length);
});

test("midia sem texto aparece como rotulo legivel", async () => {
  const c = await contato("Mandou audio");
  await db.whatsappMessage.create({
    data: { contactId: c.id, fromNumber: "l", toNumber: "crm", body: "", type: "audio", direction: "inbound", timestamp: ha(1) },
  });
  const item = (await fila.filaSemResposta({ agora })).find((i) => i.contactId === c.id)!;
  assert.equal(item.ultimaMensagem.texto, "[áudio]");
});
