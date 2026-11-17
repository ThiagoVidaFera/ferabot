import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { criarBancoTemporario } from "./banco-temporario";

const banco = criarBancoTemporario();

type Servico = typeof import("../../src/lib/fila-sugestao-servico");
type Dbm = typeof import("../../src/lib/db");
let svc: Servico;
let db: Dbm["db"];

const H = 3_600_000;
const agora = new Date("2026-10-28T15:00:00Z");
const ha = (h: number) => new Date(agora.getTime() - h * H);

const RESPOSTA = "Ana, voltando de onde paramos: em quanto tempo suas alunas chegam no resultado?";
let chamadas = 0;
const gerarFn = async () => {
  chamadas += 1;
  return { ok: true, texto: RESPOSTA };
};

let seq = 0;
async function lead(nome: string, msgs: Array<["inbound" | "outbound", number, string]>) {
  seq += 1;
  const c = await db.contact.create({ data: { name: nome, phone: `5511911100${String(seq).padStart(3, "0")}` } });
  for (const [direction, h, body] of msgs) {
    await db.whatsappMessage.create({
      data: { contactId: c.id, fromNumber: "x", toNumber: "y", body, direction, timestamp: ha(h) },
    });
  }
  return c;
}

before(async () => {
  ({ db } = await import("../../src/lib/db"));
  svc = await import("../../src/lib/fila-sugestao-servico");
});
after(async () => {
  await db.$disconnect();
  banco.apagar();
});

test("sugere, guarda no cache e na segunda chamada nao gasta IA", async () => {
  const c = await lead("Ana Paula", [["inbound", 5, "Ajudo mulheres a emagrecer"]]);
  chamadas = 0;
  const a = await svc.sugerirParaContato(c.id, { gerarFn, agora });
  assert.deepEqual(a, { ok: true, texto: RESPOSTA, doCache: false });
  const b = await svc.sugerirParaContato(c.id, { gerarFn, agora });
  assert.deepEqual(b, { ok: true, texto: RESPOSTA, doCache: true });
  assert.equal(chamadas, 1);
});

test("forcar regenera mesmo com cache", async () => {
  const c = await lead("Ana Dois", [["inbound", 5, "oi, tenho uma mentoria"]]);
  chamadas = 0;
  await svc.sugerirParaContato(c.id, { gerarFn, agora });
  await svc.sugerirParaContato(c.id, { gerarFn, agora, forcar: true });
  assert.equal(chamadas, 2);
});

test("mensagem nova do lead invalida a sugestao guardada", async () => {
  const c = await lead("Ana Tres", [["inbound", 5, "primeira"]]);
  chamadas = 0;
  await svc.sugerirParaContato(c.id, { gerarFn, agora });
  await db.whatsappMessage.create({
    data: { contactId: c.id, fromNumber: "x", toNumber: "y", body: "segunda", direction: "inbound", timestamp: ha(1) },
  });
  const r = await svc.sugerirParaContato(c.id, { gerarFn, agora });
  assert.equal(r.ok && r.doCache, false);
  assert.equal(chamadas, 2);
});

test("contato ja respondido ou inexistente devolve erro claro, sem chamar a IA", async () => {
  const c = await lead("Respondida", [["inbound", 5, "oi"], ["outbound", 4, "oi!"]]);
  chamadas = 0;
  const r = await svc.sugerirParaContato(c.id, { gerarFn, agora });
  assert.equal(r.ok, false);
  const x = await svc.sugerirParaContato("nao-existe", { gerarFn, agora });
  assert.equal(x.ok, false);
  assert.equal(chamadas, 0);
});

test("falha da IA volta como erro e nao grava nada no cache", async () => {
  const c = await lead("Sem IA", [["inbound", 5, "oi"]]);
  const r = await svc.sugerirParaContato(c.id, {
    gerarFn: async () => ({ ok: false, erro: "chave do Gemini nao configurada" }),
    agora,
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.erro, /chave do Gemini/);
  const cache = await svc.sugestoesGuardadas();
  assert.ok(!(c.id in cache));
});

test("rotina do dia gera para a fila, pula quem so agradeceu e audita", async () => {
  const agradecido = await lead("Agradecido", [["inbound", 2, "obrigado!"]]);
  chamadas = 0;
  const resumo = await svc.gerarSugestoesDoDia({ gerarFn, agora, topo: 50 });
  assert.ok(resumo.analisados >= 1);
  assert.ok(resumo.ignoradas >= 1);
  assert.equal(resumo.falhas, 0);
  const cache = await svc.sugestoesGuardadas();
  assert.ok(!(agradecido.id in cache));
  const audit = await db.auditEvent.findFirst({ where: { action: "sugestoes_do_dia" } });
  assert.ok(audit);
});
