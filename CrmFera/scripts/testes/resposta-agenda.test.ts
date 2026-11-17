import { test } from "node:test";
import assert from "node:assert/strict";
import { respostasDaAgenda, quandoPorExtenso } from "../../src/lib/resposta-agenda";
import { perguntaSeERobo } from "../../src/lib/pergunta-robo";

const agora = new Date("2026-10-29T13:00:00Z");
const campos = { evento_data: "2026-11-02T12:30:00-03:00", link_reuniao: "https://meet.google.com/guu-djkm-eav" };

test("data por extenso no fuso de Brasília", () => {
  assert.equal(quandoPorExtenso(new Date("2026-11-02T12:30:00-03:00")), "segunda, 02/11, às 12h30");
  assert.equal(quandoPorExtenso(new Date("2026-11-03T09:00:00-03:00")), "terça, 03/11, às 9h");
});

test("link, data e propósito são respondidos; agradecimento não", () => {
  assert.deepEqual(respostasDaAgenda("qual o link da sala?", campos, agora), ["O link da sala é esse: https://meet.google.com/guu-djkm-eav"]);
  assert.match(respostasDaAgenda("que horas mesmo?", campos, agora)[0], /segunda, 02\/11, às 12h30/);
  assert.match(respostasDaAgenda("vai ser sobre o que?", campos, agora).join(" "), /20 minutos/);
  assert.deepEqual(respostasDaAgenda("Obrigada!", campos, agora), []);
  assert.deepEqual(respostasDaAgenda("Quanto custa?", campos, agora), []);
});

test("sem reunião futura ou sem link não responde", () => {
  assert.deepEqual(respostasDaAgenda("link?", { evento_data: "2026-10-01T10:00:00-03:00", link_reuniao: "x" }, agora), []);
  assert.deepEqual(respostasDaAgenda("qual o link?", { evento_data: campos.evento_data }, agora), []);
});

test("detecta pergunta de robô/IA e ignora conversa normal", () => {
  for (const t of ["Você é um robô?", "vc é IA?", "É robô?", "isso é uma inteligência artificial?", "tô falando com uma pessoa de verdade?", "Estou falando com um bot?", "é uma pessoa?"]) {
    assert.equal(perguntaSeERobo(t), true, t);
  }
  for (const t of ["Obrigada!", "Vou usar IA no meu negócio", "Vocês fazem robô de WhatsApp?", "Quanto custa?", "Sou psicóloga e atendo online"]) {
    assert.equal(perguntaSeERobo(t), false, t);
  }
});

test("pergunta de preço/condição dispara; resposta com valor ou assunto comum, não", async () => {
  const { perguntaPreco } = await import("../../src/lib/pergunta-robo");
  for (const t of ["preço e condições de pagamento", "Quanto custa?", "qual o valor?", "Qual é o investimento", "Valor?", "dá pra parcelar?", "tem desconto à vista?", "quais as formas de pagamento", "quanto é"]) {
    assert.equal(perguntaPreco(t), true, t);
  }
  for (const t of ["consultoria de 5.000", "mentoria, valor de 3 mil", "sim", "nunca investi", "4 novos clientes por mês", "pelo instagram e por indicação"]) {
    assert.equal(perguntaPreco(t), false, t);
  }
});
