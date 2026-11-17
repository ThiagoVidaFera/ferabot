import { test } from "node:test";
import assert from "node:assert/strict";
import { separarListas, montarMensagens, type Conversa } from "../../src/lib/resumo-silencio";

const AGORA = new Date("2026-11-04T11:00:00.000Z");
const haHoras = (h: number): Date => new Date(AGORA.getTime() - h * 3_600_000);
const conversa = (
  id: string,
  ultima: "nossa" | "dele",
  h: number,
  extra: Partial<Conversa> = {},
): Conversa => ({
  contactId: id,
  nome: `Lead ${id}`,
  ultima,
  em: haHoras(h),
  destino: "5511900000001",
  telefone: "5511999990000",
  estagio: "conversando",
  ...extra,
});

test("nossa última só entra com 72h ou mais; a dele, com 24h ou mais", () => {
  const listas = separarListas(
    [
      conversa("a", "nossa", 71),
      conversa("b", "nossa", 72),
      conversa("c", "nossa", 200),
      conversa("d", "dele", 23),
      conversa("e", "dele", 24),
    ],
    AGORA,
  );
  assert.deepEqual(listas.nossaUltima.map((c) => c.contactId), ["b", "c"]);
  assert.deepEqual(listas.deleUltima.map((c) => c.contactId), ["e"]);
});

test("a conversa mais recente vem primeiro", () => {
  const listas = separarListas([conversa("velha", "dele", 100), conversa("nova", "dele", 30)], AGORA);
  assert.deepEqual(listas.deleUltima.map((c) => c.contactId), ["nova", "velha"]);
});

test("sem conversa parada não monta mensagem nenhuma", () => {
  assert.deepEqual(montarMensagens({ nossaUltima: [], deleUltima: [] }, AGORA, "https://crm.exemplo"), []);
});

test("estágio mais quente vem primeiro, depois a mais recente", () => {
  const listas = separarListas(
    [
      conversa("novo-recente", "dele", 30, { estagio: "novo" }),
      conversa("conv", "dele", 40, { estagio: "conversando" }),
      conversa("proposta-velha", "dele", 200, { estagio: "proposta" }),
      conversa("call", "dele", 100, { estagio: "call_marcada" }),
      conversa("conv-recente", "dele", 26, { estagio: "conversando" }),
    ],
    AGORA,
  );
  assert.deepEqual(listas.deleUltima.map((c) => c.contactId), [
    "proposta-velha",
    "call",
    "conv-recente",
    "conv",
    "novo-recente",
  ]);
});

test("cada conversa sai com o link do WhatsApp, o estágio e o tempo parado", () => {
  const listas = separarListas(
    [
      conversa("x1", "nossa", 100, { telefone: "5511900000003" }),
      conversa("y2", "dele", 50, { telefone: "(11) 90000-0002", estagio: "proposta" }),
    ],
    AGORA,
  );
  const [texto] = montarMensagens(listas, AGORA, "https://crm.exemplo");
  assert.match(texto, /https:\/\/wa\.me\/5511900000003/);
  assert.match(texto, /https:\/\/wa\.me\/5511900000002/);
  assert.doesNotMatch(texto, /inbox\?c=/);
  assert.match(texto, /proposta/);
  assert.match(texto, /há 4 dias/);
  assert.match(texto, /há 2 dias/);
});

test("sem telefone válido, cai no link do Inbox", () => {
  const listas = separarListas([conversa("sem-fone", "dele", 50, { telefone: null })], AGORA);
  const [texto] = montarMensagens(listas, AGORA, "https://crm.exemplo");
  assert.match(texto, /https:\/\/crm\.exemplo\/inbox\?c=sem-fone/);
});

test("telefone sem DDI (10 ou 11 dígitos) ganha 55", () => {
  const listas = separarListas([conversa("a", "dele", 50, { telefone: "11900000002" })], AGORA);
  const [texto] = montarMensagens(listas, AGORA, "https://crm.exemplo");
  assert.match(texto, /https:\/\/wa\.me\/5511900000002/);
});

test("quem falou por último e ninguém respondeu vem antes no resumo", () => {
  const listas = separarListas([conversa("n", "nossa", 100), conversa("d", "dele", 50)], AGORA);
  const [texto] = montarMensagens(listas, AGORA, "https://crm.exemplo");
  assert.ok(texto.indexOf("ninguém respondeu") < texto.indexOf("a pessoa não respondeu"));
});

test("lista longa é dividida em várias mensagens abaixo do teto, sem perder conversa", () => {
  const muitas = Array.from({ length: 120 }, (_, i) => conversa(`id${i}`, "dele", 30 + i));
  const mensagens = montarMensagens(separarListas(muitas, AGORA), AGORA, "https://crm.exemplo");
  assert.ok(mensagens.length > 1);
  assert.ok(mensagens.every((m) => m.length <= 3300));
  const nomes = mensagens.join("\n").match(/Lead id\d+/g) ?? [];
  assert.equal(new Set(nomes).size, 120);
});

test("o rótulo do celular abre cada mensagem", () => {
  const muitas = Array.from({ length: 120 }, (_, i) => conversa(`id${i}`, "dele", 30 + i));
  const mensagens = montarMensagens(separarListas(muitas, AGORA), AGORA, "https://crm.exemplo", "WhatsApp final 2494");
  assert.ok(mensagens.length > 1);
  assert.ok(mensagens.every((m) => m.startsWith("*WhatsApp final 2494*")));
});

test("quem disse sim e não comprou abre o resumo, em bloco próprio, sem esperar 24h/72h", () => {
  const listas = separarListas(
    [conversa("sim", "nossa", 3, { disseSim: true }), conversa("n", "nossa", 100)],
    AGORA,
  );
  assert.deepEqual(listas.disseSim?.map((c) => c.contactId), ["sim"]);
  assert.deepEqual(listas.nossaUltima.map((c) => c.contactId), ["n"]);
  const [texto] = montarMensagens(listas, AGORA, "https://crm.exemplo");
  assert.ok(texto.indexOf("Disse sim") < texto.indexOf("Lead n"), texto);
  assert.match(texto, /🟢 \*Disse sim e ainda não comprou/);
});

test("sem ninguém que disse sim, o bloco verde não aparece", () => {
  const [texto] = montarMensagens(separarListas([conversa("d", "dele", 50)], AGORA), AGORA, "https://crm.exemplo");
  assert.doesNotMatch(texto, /Disse sim/);
});
