import { test } from "node:test";
import assert from "node:assert/strict";
import { motivoAtencao, telefoneValido, type ContatoAtencao } from "../../src/lib/atencao-manual";

const agora = new Date("2026-10-29T14:00:00Z");
const base: ContatoAtencao = {
  origem: "funil:consultoria-jornada-de-compra",
  lifecycleStage: "novo",
  phone: "5511980002023",
  customFields: { objetivo: "Chamou no WhatsApp pela página da consultoria" },
  createdAt: new Date("2026-10-29T11:04:00Z"),
  mensagens: 0,
};

test("telefone: celular com 9, fixo, e o formato quebrado da máscara antiga", () => {
  assert.equal(telefoneValido("5531980003466"), true);
  assert.equal(telefoneValido("553180003466"), true);
  assert.equal(telefoneValido("5555300007499"), false); // 55 duplicado + truncado
  assert.equal(telefoneValido("5555500009966"), false);
  assert.equal(telefoneValido("5511980002023"), true);
  assert.equal(telefoneValido(null), false);
});

test("chamou no WhatsApp e não há mensagem: sinaliza; com mensagem ou muito novo, não", () => {
  assert.equal(motivoAtencao(base, agora), "sem_mensagem");
  assert.equal(motivoAtencao({ ...base, mensagens: 2 }, agora), null);
  assert.equal(motivoAtencao({ ...base, createdAt: new Date("2026-10-29T13:50:00Z") }, agora), null);
  assert.equal(motivoAtencao({ ...base, createdAt: new Date("2026-10-20T13:50:00Z") }, agora), null);
});

test("reunião futura com telefone inválido sinaliza; telefone bom ou reunião passada, não", () => {
  const agenda = {
    ...base,
    origem: "funil:agendar-implementacao-ysp",
    customFields: { evento_data: "2026-11-02T08:00:00-03:00", objetivo: "Reunião de 20 min agendada" },
    phone: "5555300007499",
  };
  assert.equal(motivoAtencao(agenda, agora), "telefone_invalido");
  assert.equal(motivoAtencao({ ...agenda, phone: "5531980003466" }, agora), null);
  assert.equal(motivoAtencao({ ...agenda, customFields: { evento_data: "2026-10-01T08:00:00-03:00" } }, agora), null);
});

test("lead que não é de funil ou já perdido não entra", () => {
  assert.equal(motivoAtencao({ ...base, origem: "whatsapp" }, agora), null);
  assert.equal(motivoAtencao({ ...base, lifecycleStage: "perdido" }, agora), null);
});
