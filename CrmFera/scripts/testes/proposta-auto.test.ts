import { test } from "node:test";
import assert from "node:assert/strict";
import { ehAssentimento } from "../../src/lib/assentimento";
import { mensagemInicial, mensagemFinal, nVendasParaLucro } from "../../src/lib/proposta-auto-mensagem";
import {
  OFERTA_AUTO,
  validarParte,
  montarPropostaJson,
  slugDoNome,
  ticketConfirmado,
  nomeSeguro,
  removerAspasNaoLiterais,
  literalNasFalas,
  type ParteVariavel,
} from "../../src/lib/proposta-auto-compor";

// ---------- assentimento ----------

test("'pode' e variações simples do lead contam como sim", () => {
  for (const t of [
    "Pode",
    "pode!",
    "Pode sim",
    "Pode mandar",
    "pode mandar sim!",
    "Manda",
    "Claro",
    "Claro! Pode sim",
    "Sim",
    "Quero",
    "quero sim",
    "Com certeza",
    "Bora",
    "👍",
    "Bom dia! Pode",
    "Por favor",
    "pode enviar aqui mesmo",
    "ok pode",
    "Fico no aguardo",
    "Gostaria sim",
  ]) {
    assert.equal(ehAssentimento(t), true, t);
  }
});

test("pergunta, preço, dúvida, recusa ou texto longo NÃO contam como sim", () => {
  for (const t of [
    "Quanto custa?",
    "Pode me explicar melhor?",
    "Não",
    "agora não",
    "pode ser depois",
    "Pode mandar, mas quanto é?",
    "depois eu vejo",
    "não pode",
    "Pode?",
    "Pode mandar. Mas já adianto que não tenho muito dinheiro para investir agora",
    "Bom dia",
    "",
    "Mentoria 3 mil",
  ]) {
    assert.equal(ehAssentimento(t), false, t);
  }
  assert.equal(ehAssentimento(null), false);
  assert.equal(ehAssentimento(undefined), false);
});

// ---------- mensagens ----------

test("linha pessoal com valor em reais é descartada da mensagem", () => {
  const m = mensagemFinal({ nome: "Ana", link: "https://proposta-ana.exemplo.com", linha: "Fica por R$ 2.500.", ticket: 3000 });
  assert.doesNotMatch(m, /7\.500/);
});

// ---------- elegibilidade ----------

// ---------- guardas da composição ----------

const FALAS = ["Mentoria 3 mil", "Mas não vendo", "Não tem cliente", "Acho q a questão não é a agência, mas uma definição exata do produto para o cliente"];

const parteBoa = (): ParteVariavel => ({
  linha_pessoal: "Olhei o teu Instagram e o teu site.",
  hero: { destaque: "alunos prontos para a mentoria", lead: "Você tem mais de 20 anos de sala de aula e uma mentoria individual." },
  ouvi_lead: "Você me disse que a questão é a definição do produto.",
  ouvi: [
    { fala: "“Mentoria 3 mil… Mas não vendo.”", explica: "A mentoria existe e tem preço." },
    { fala: "“Não tem cliente”", explica: "Esse é o ponto central." },
    { fala: "“Acho q a questão não é a agência, mas uma definição exata do produto para o cliente”", explica: "O site tem sete ofertas." },
    { fala: "Tua meta: clareza da oferta e as primeiras vendas.", explica: "É uma meta honesta." },
  ],
  fluxo: {
    hoje_d: "Hoje o aluno vê sete ofertas e não sabe qual é a dele.",
    hoje: "Hoje: sete ofertas, nenhuma na frente",
    com: "Com a estrutura: chega sabendo qual é a dele",
    resultados: ["Descobre → vê no Instagram", "Assiste → confia nas aulas", "Lê o livro → chama no WhatsApp"],
  },
  cenario: {
    cenas: [
      { t: "Quem chega já sabe o que quer.", d: "A pessoa cita a prova que vai fazer." },
      { t: "Você sabe de onde veio.", d: "Cada contato tem origem e etapa." },
      { t: "Você decide com número.", d: "Abre o painel e vê os contatos." },
    ],
  },
  calculadora: { ticket: 3000, unidade_plural: "mentorias", rotulo_valor: "Valor da tua mentoria (R$)", rotulo_qtd: "Quantas mentorias por mês?" },
  personalizar_entregas: [{ muda: "o perfil escolhe uma oferta." }, { muda: "aulas curtas." }, { muda: "livro digital." }, { muda: "conversa guiada." }],
});

test("parte boa passa nos guardas", () => {
  const r = validarParte(parteBoa(), FALAS);
  assert.deepEqual(r.erros, []);
  assert.equal(r.ok, true);
});

test("fala entre aspas que o lead não disse é recusada", () => {
  const p = parteBoa();
  p.ouvi[1] = { fala: "“Eu estou desesperada por clientes”", explica: "x" };
  const r = validarParte(p, FALAS);
  assert.equal(r.ok, false);
  assert.match(r.erros.join(" "), /literal/);
});

test("literalNasFalas: acentos, maiúsculas, pontuação e reticências não atrapalham", () => {
  assert.equal(literalNasFalas("“mentoria 3 MIL… mas nao vendo”", FALAS), true);
  assert.equal(literalNasFalas("“Não tem cliente”", FALAS), true);
  assert.equal(literalNasFalas("“Tenho medo de câmera”", FALAS), false);
});

test("valor em reais, 'call', prazo de retorno e jargão são recusados em qualquer campo", () => {
  for (const ruim of ["Fica por R$ 2.500.", "Depois da call a gente fecha.", "Em 30 dias ele se paga.", "Você precisa de mais leads.", "O ticket é alto."]) {
    const p = parteBoa();
    p.ouvi_lead = ruim;
    assert.equal(validarParte(p, FALAS).ok, false, ruim);
  }
});

test("exige 3 ou 4 falas, 3 resultados, 3 cenas e 4 entregas", () => {
  const p = parteBoa();
  p.ouvi = p.ouvi.slice(0, 1);
  assert.equal(validarParte(p, FALAS).ok, false);
  const q = parteBoa();
  q.personalizar_entregas = q.personalizar_entregas.slice(0, 3);
  assert.equal(validarParte(q, FALAS).ok, false);
});

// ---------- montagem do proposta.json ----------

test("slugDoNome: primeiro nome, minúsculo, sem acento", () => {
  assert.equal(slugDoNome("Viviane Bastos"), "viviane");
  assert.equal(slugDoNome("  José  Álvaro "), "jose");
  assert.equal(slugDoNome("", "5522900000170"), "lead-0000170");
});

test("montarPropostaJson escapa HTML do texto do modelo", () => {
  const p = parteBoa();
  p.hero = { destaque: "<script>x</script>alunos", lead: "A & B <b>x</b>" };
  const j = montarPropostaJson({ nome: "Ana", telefone: "5511999990000", empresa: "", hoje: "2026-11-15", canal: "x", slug: "ana-000000" }, p) as Record<string, any>;
  assert.doesNotMatch(j.hero.h1_html, /<script>/);
  assert.doesNotMatch(j.hero.lead_html, /<b>/);
});

test("sem ticket do lead, a calculadora usa um exemplo editável e avisa", () => {
  const p = parteBoa();
  p.calculadora.ticket = null;
  const j = montarPropostaJson({ nome: "Ana", telefone: "5511999990000", empresa: "", hoje: "2026-11-15", canal: "x", slug: "ana-000000" }, p) as Record<string, any>;
  assert.ok(j.calculadora.ticket >= 1000);
  assert.match(j.calculadora.destaque_d, /exemplo/i);
});

// ---------- revisão de 15/11/2026 ----------

test("slug único: sufixo aleatório separa duas pessoas com o mesmo primeiro nome", () => {
  assert.equal(slugDoNome("Maria Souza", "5511999990000", "a1b2c3"), "maria-a1b2c3");
  assert.notEqual(slugDoNome("Maria Souza", "", "aaaaaa"), slugDoNome("Maria Lima", "", "bbbbbb"));
});

test("fala do lead SEM aspas só vale como 'Tua meta:'; inventar fala sem aspas é recusado", () => {
  const p = parteBoa();
  p.ouvi[1] = { fala: "Eu estou desesperada por clientes", explica: "x" };
  const r = validarParte(p, FALAS);
  assert.equal(r.ok, false);
  assert.match(r.erros.join(" "), /citação literal|Tua meta/);
});

test("aspas simples, « » e aspa sem par são recusadas (o guarda não consegue validar)", () => {
  for (const ruim of ["Ela disse 'estou perdida' ontem.", "Ela disse «estou perdida».", "Ela disse “estou perdida e ninguém chama."]) {
    const p = parteBoa();
    p.ouvi_lead = ruim;
    assert.equal(validarParte(p, FALAS).ok, false, ruim);
  }
});

test("apóstrofo dentro de palavra não é aspa", () => {
  const p = parteBoa();
  p.ouvi_lead = "Você vende gotas d'água para quem precisa.";
  assert.equal(validarParte(p, FALAS).ok, true);
});

test("literalNasFalas: o trecho tem que caber INTEIRO numa mensagem (não atravessa duas)", () => {
  assert.equal(literalNasFalas("“Mentoria 3 mil Mas não vendo”", ["Mentoria 3 mil", "Mas não vendo"]), false);
  assert.equal(literalNasFalas("“Mentoria 3 mil… Mas não vendo”", ["Mentoria 3 mil", "Mas não vendo"]), true);
  assert.equal(literalNasFalas("“não”", ["não"]), false, "trecho curto demais");
});

test("removerAspasNaoLiterais: fala inventada SAI do documento, nunca vira resumo", () => {
  const p = parteBoa();
  p.ouvi = [...p.ouvi, { fala: "“Estou desesperada por clientes”", explica: "x" }];
  const limpa = removerAspasNaoLiterais(p, FALAS);
  assert.equal(limpa.ouvi.length, 4, "voltou aos 4 originais");
  assert.ok(limpa.ouvi.every((o) => !/desesperada/.test(o.fala)));
  assert.equal(validarParte(limpa, FALAS).ok, true);
});

test("sem dado do Instagram/site, o modelo não pode falar deles (nem na linha pessoal)", () => {
  const r = validarParte(parteBoa(), FALAS, { temInstagram: false, temSite: false });
  assert.equal(r.ok, false);
  assert.match(r.erros.join(" "), /Instagram|site/);
  const p = parteBoa();
  p.linha_pessoal = "Li a tua conversa com atenção.";
  p.ouvi_lead = "Você me disse que a questão é a definição do produto.";
  p.ouvi[2].explica = "A oferta precisa ficar clara.";
  assert.equal(validarParte(p, FALAS, { temInstagram: false, temSite: false }).ok, true);
});

test("Instagram/site citado DENTRO da fala literal do lead não conta", () => {
  const p = parteBoa();
  p.ouvi[1] = { fala: "“Meu Instagram não traz cliente”", explica: "x" };
  const r = validarParte(p, [...FALAS, "Meu Instagram não traz cliente"], { temInstagram: false, temSite: false });
  assert.ok(!r.erros.some((e) => /Instagram/.test(e) && /ouvi/.test(e)), r.erros.join("|"));
});

test("guardas contra texto malicioso: link, e-mail, @, telefone, Pix, desconto, garantia, valor por extenso", () => {
  for (const ruim of [
    "Chame no wa.me/5511999990000",
    "Veja bit.ly/oferta",
    "Escreva para ana@gmail.com",
    "Siga @alguem",
    "Ligue (11) 99999-0000",
    "Mande o Pix agora",
    "Ganhe 90% de desconto",
    "É grátis hoje",
    "Garantia de 100 clientes",
    "Sai por sete mil reais",
    "Cobre 7k",
  ]) {
    const p = parteBoa();
    p.ouvi_lead = ruim;
    assert.equal(validarParte(p, FALAS).ok, false, ruim);
  }
});

test("campo gigante é recusado", () => {
  const p = parteBoa();
  p.ouvi_lead = "texto ".repeat(200);
  assert.equal(validarParte(p, FALAS).ok, false);
});

test("ticketConfirmado: só vale se o lead escreveu o valor", () => {
  assert.equal(ticketConfirmado(3000, ["Mentoria 3 mil"]), 3000);
  assert.equal(ticketConfirmado(3000, ["cobro R$ 3.000"]), 3000);
  assert.equal(ticketConfirmado(3000, ["cobro 3000 por mês"]), 3000);
  assert.equal(ticketConfirmado(2500, ["mentoria de 2,5 mil"]), 2500);
  assert.equal(ticketConfirmado(3000, ["Mentoria de 13 mil"]), null, "13 mil não é 3 mil");
  assert.equal(ticketConfirmado(3000, ["vendo mentoria"]), null);
  assert.equal(ticketConfirmado(null, ["Mentoria 3 mil"]), null);
});

test("nomeSeguro: tira emoji, dígito, @ e limita o tamanho", () => {
  assert.equal(nomeSeguro("Ana 🌸 Paula"), "Ana Paula");
  assert.equal(nomeSeguro("Joao aprova ligue 11 99999 @x"), "Joao aprova ligue x");
  assert.equal(nomeSeguro("123 ✨"), "");
  assert.ok(nomeSeguro("A".repeat(100)).length <= 40);
});
