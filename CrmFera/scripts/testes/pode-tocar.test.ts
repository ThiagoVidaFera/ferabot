import { test } from "node:test";
import assert from "node:assert/strict";
import { podeTocar, type ContatoToque, type MensagemToque } from "../../src/lib/pode-tocar";

const agora = new Date("2026-11-13T13:00:00Z");
const h = (horas: number) => new Date(agora.getTime() - horas * 3_600_000);
const nossa = (horas: number, body = "Oi, tudo bem?"): MensagemToque => ({ direction: "outbound", body, type: "text", timestamp: h(horas) });
const dele = (horas: number, body: string, type = "text"): MensagemToque => ({ direction: "inbound", body, type, timestamp: h(horas) });

const base: ContatoToque = { lifecycleStage: "conversando", tags: [], compras: 0 };
const conversaNormal = [dele(80, "vendo mentoria de R$ 3 mil"), nossa(72, "Legal! Me conta mais?")];

test("conversa parada com a última mensagem nossa: libera", () => {
  assert.deepEqual(podeTocar(base, conversaNormal, agora), { liberado: true });
  assert.deepEqual(podeTocar(base, [], agora), { liberado: true });
});

test("estágio cliente, perdido, sem_automacao e pessoal bloqueiam", () => {
  for (const e of ["cliente", "perdido", "sem_automacao", "pessoal"]) {
    const d = podeTocar({ ...base, lifecycleStage: e }, conversaNormal, agora);
    assert.equal(d.liberado, false, e);
    assert.equal(!d.liberado && d.motivo, "estagio");
  }
});

test("quem já comprou (compra registrada ou tag comprou-*) não recebe — caso Camila", () => {
  const d1 = podeTocar({ ...base, compras: 1 }, conversaNormal, agora);
  assert.equal(!d1.liberado && d1.motivo, "comprou");
  const d2 = podeTocar({ ...base, tags: ["comprou-yt"] }, conversaNormal, agora);
  assert.equal(!d2.liberado && d2.motivo, "comprou");
});

test("tag de opt-out bloqueia", () => {
  for (const t of ["optout", "controle-optout", "controle-nao-perturbe", "descadastro"]) {
    const d = podeTocar({ ...base, tags: [t] }, conversaNormal, agora);
    assert.equal(!d.liberado && d.motivo, "optout", t);
  }
});

test("lead que escreveu 'me tire' é bloqueado e a tag optout é pedida — caso marcelo", () => {
  const d = podeTocar(base, [dele(200, "me tire"), nossa(100, "Oi, marcelo!")], agora);
  assert.equal(d.liberado, false);
  assert.equal(!d.liberado && d.motivo, "optout");
  assert.equal(!d.liberado && d.carimbarTag, "optout");
});

test("última mensagem é do lead (texto ou áudio): é humano que responde", () => {
  const d1 = podeTocar(base, [nossa(30), dele(20, "[áudio]", "audio")], agora);
  assert.equal(!d1.liberado && d1.motivo, "ultima_do_lead");
  const d2 = podeTocar(base, [nossa(30), dele(2, "ok, vou ver")], agora);
  assert.equal(!d2.liberado && d2.motivo, "ultima_do_lead");
});

test("a ordem das mensagens na entrada não importa", () => {
  const d = podeTocar(base, [dele(2, "ok, vou ver"), nossa(30)], agora);
  assert.equal(!d.liberado && d.motivo, "ultima_do_lead");
});

test("adiamento com data na fala segura até a data — caso Débora ('fim de novembro')", () => {
  const msgs = [dele(48, "me chama no fim de novembro"), nossa(47, "Combinado!")];
  const d = podeTocar(base, msgs, agora);
  assert.equal(!d.liberado && d.motivo, "adiou");
  // depois da data, volta a liberar
  const depois = new Date("2026-11-26T13:00:00Z");
  assert.deepEqual(podeTocar(base, msgs, depois), { liberado: true });
});

test("adiamento por tag retornar-<mês> também segura", () => {
  const d = podeTocar({ ...base, tags: ["retornar-janeiro"] }, conversaNormal, agora);
  assert.equal(!d.liberado && d.motivo, "adiou");
});

test("disse sim sem venda registrada: não manda mensagem, vai pro resumo das 8h — caso Henrick", () => {
  const d = podeTocar({ ...base, lifecycleStage: "proposta" }, [dele(50, "Vamos fechar!"), nossa(49, "Show, te mando o link")], agora);
  assert.equal(!d.liberado && d.motivo, "disse_sim");
  assert.equal(!d.liberado && d.carimbarTag, "disse-sim");
});

test("sim muito antigo (mais de 30 dias) não trava a régua pra sempre", () => {
  const d = podeTocar(base, [dele(24 * 40, "bora"), nossa(24 * 39)], agora);
  assert.deepEqual(d, { liberado: true });
});

test("lead que fechou com outra empresa — caso Andrezza", () => {
  const d = podeTocar(base, [dele(50, "Obrigada, mas já fechei com outra empresa"), nossa(49)], agora);
  assert.equal(!d.liberado && d.motivo, "fechou_com_outro");
});
