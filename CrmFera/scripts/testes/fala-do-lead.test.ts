import { test } from "node:test";
import assert from "node:assert/strict";
import { adiamentoNaFala, disseSim, fechouComOutro, pediuDescadastro, perguntouPreco } from "../../src/lib/fala-do-lead";

// 13/11/2026, 10h de Brasília
const em = new Date("2026-11-13T13:00:00Z");
const dia = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

test("descadastro: frases reais e variações", () => {
  for (const t of [
    "me tire",
    "Me tira dessa lista por favor",
    "remover",
    "Não quero mais receber mensagem",
    "quero sair da lista",
    "para de me mandar mensagem",
    "pare de mandar isso",
    "não me mande mais nada",
    "me descadastra",
    "STOP",
  ]) {
    assert.equal(pediuDescadastro(t), true, t);
  }
});

test("descadastro: conversa normal não é descadastro", () => {
  for (const t of ["me tira uma dúvida", "quero remover a barreira do medo de vender", "vou parar pra pensar", "ok", "Obrigado!"]) {
    assert.equal(pediuDescadastro(t), false, t);
  }
});

test("disse sim: fechamento explícito", () => {
  for (const t of ["Vamos fechar!", "bora", "Bora começar", "quero começar", "Quero fechar sim", "pode mandar o link", "manda o pix", "tô dentro", "Fechado!"]) {
    assert.equal(disseSim(t), true, t);
  }
});

test("disse sim: negação e frases soltas não contam", () => {
  for (const t of [
    "não quero começar agora",
    "ainda não vamos fechar",
    "o escritório está fechado hoje, amanhã te respondo",
    "vou pensar",
    "quanto custa?",
  ]) {
    assert.equal(disseSim(t), false, t);
  }
});

test("pergunta de preço", () => {
  for (const t of ["Quanto custa?", "qual o valor?", "e o investimento?", "parcela no cartão?", "tem desconto?", "quanto fica?", "Qual o preço"]) {
    assert.equal(perguntouPreco(t), true, t);
  }
  for (const t of ["vendo mentoria", "meu cliente paga bem", "ok, obrigado"]) {
    assert.equal(perguntouPreco(t), false, t);
  }
});

test("adiamento: 'fim de novembro' (caso Débora) segura até o dia 25", () => {
  assert.equal(dia(adiamentoNaFala("me chama no fim de novembro", em)), "2026-11-25");
  assert.equal(dia(adiamentoNaFala("Final de novembro a gente vê", em)), "2026-11-25");
});

test("adiamento: mês sozinho com marcador vai pro dia 1 da próxima ocorrência", () => {
  assert.equal(dia(adiamentoNaFala("só em janeiro", em)), "2027-01-01");
  assert.equal(dia(adiamentoNaFala("pode ser pra fevereiro?", em)), "2027-02-01");
  assert.equal(dia(adiamentoNaFala("a partir de dezembro", em)), "2026-12-01");
  assert.equal(dia(adiamentoNaFala("depois de dezembro eu vejo", em)), "2027-01-01");
});

test("adiamento: fim do mês, mês que vem, semana que vem, ano que vem", () => {
  assert.equal(dia(adiamentoNaFala("fim do mês eu te falo", em)), "2026-11-25");
  assert.equal(dia(adiamentoNaFala("mês que vem a gente conversa", em)), "2026-12-01");
  assert.equal(dia(adiamentoNaFala("semana que vem", em)), "2026-11-20");
  assert.equal(dia(adiamentoNaFala("só no ano que vem", em)), "2027-01-01");
  assert.equal(dia(adiamentoNaFala("depois das festas", em)), "2027-01-05");
});

test("adiamento: 'depois do dia 20' e 'dia 5' (já passou: mês seguinte)", () => {
  assert.equal(dia(adiamentoNaFala("depois do dia 20 eu consigo", em)), "2026-11-21");
  assert.equal(dia(adiamentoNaFala("a partir do dia 5", em)), "2026-12-05");
  assert.equal(dia(adiamentoNaFala("daqui a 2 semanas", em)), "2026-11-27");
});

test("adiamento: frase sem data ou mês citado sem marcador não é adiamento", () => {
  assert.equal(adiamentoNaFala("comecei em janeiro e já vendi 10", em), null);
  assert.equal(dia(adiamentoNaFala("em janeiro eu consigo começar", em)), "2027-01-01");
  assert.equal(adiamentoNaFala("vou pensar", em), null);
  assert.equal(adiamentoNaFala("ok, obrigado", em), null);
  assert.equal(adiamentoNaFala("janeiro foi meu melhor mês", em), null);
});

test("fechou com outra empresa", () => {
  for (const t of ["já fechei com outra empresa", "Contratei outra agência", "fechamos com outro profissional", "optei por outro caminho", "decidi por outra mentoria"]) {
    assert.equal(fechouComOutro(t), true, t);
  }
  for (const t of ["fechei uma venda ontem", "contratei você?", "vou fechar"]) {
    assert.equal(fechouComOutro(t), false, t);
  }
});
