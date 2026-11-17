import { test } from "node:test";
import assert from "node:assert/strict";
import {
  montarEntrada,
  gerarSugestao,
  PROMPT_SUGESTAO,
  type ContextoSugestao,
  type Gerador,
} from "../../src/lib/fila-sugestao";

const autorizado = { links: ["https://youtubelucrativo.exemplo.com"], precos: ["1997"] };

const ctx: ContextoSugestao = {
  nome: "Ana Paula Souza",
  estagio: "conversando",
  origem: "funil:mentoria",
  horasParado: 20,
  janela: { estado: "fechando", horasRestantes: 4 },
  exigeTemplate: false,
  historico: [
    { de: "nos", texto: "Qual a meta que voce entrega pro seu cliente?" },
    { de: "lead", texto: "Ajudo mulheres a emagrecer sem dieta" },
  ],
};

const fixo = (texto: string): Gerador => async () => ({ ok: true, texto });

test("prompt carrega as regras de WhatsApp do workspace", () => {
  assert.match(PROMPT_SUGESTAO, /desculpa/i);
  assert.match(PROMPT_SUGESTAO, /pode ignorar/i);
  assert.match(PROMPT_SUGESTAO, /continuidade/i);
  assert.match(PROMPT_SUGESTAO, /\[QUEBRA\]/);
});

test("entrada usa so o primeiro nome, mostra historico rotulado e o estado da janela", () => {
  const e = montarEntrada(ctx);
  assert.match(e, /NOME: Ana/);
  assert.doesNotMatch(e, /Souza/);
  assert.match(e, /LEAD: Ajudo mulheres/);
  assert.match(e, /NOS: Qual a meta/);
  assert.match(e, /parado ha 20h/);
  assert.match(e, /fecha em 4h/);
});

test("entrada nao chama de 'nome' um telefone", () => {
  const e = montarEntrada({ ...ctx, nome: "5511999990000" });
  assert.match(e, /NOME: \(desconhecido\)/);
});

test("entrada avisa quando a janela fechou", () => {
  const e = montarEntrada({ ...ctx, janela: { estado: "fechada", horasRestantes: null }, exigeTemplate: true });
  assert.match(e, /janela de 24h FECHADA/);
});

test("aceita resposta valida, divide por [QUEBRA] e entrega partes", async () => {
  const r = await gerarSugestao(ctx, {
    gerarFn: fixo(
      "Ana, dando continuidade ao que a gente começou.[QUEBRA]Sua meta de emagrecer sem dieta já dá uma boa oferta. Em quanto tempo suas alunas chegam no resultado?",
    ),
    autorizado,
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.partes.length, 2);
    assert.match(r.texto, /\n\n/);
  }
});

test("remove seletor de variacao de emoji (U+FE0F)", async () => {
  const r = await gerarSugestao(ctx, {
    gerarFn: fixo("Ana, voltando de onde paramos ⚡️ em quanto tempo suas alunas chegam no resultado?"),
    autorizado,
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.ok(!r.texto.includes("️"));
});

test("segunda tentativa recebe o motivo da recusa e pode salvar a resposta", async () => {
  const entradas: string[] = [];
  let n = 0;
  const gerarFn: Gerador = async (_p, entrada) => {
    entradas.push(entrada);
    n += 1;
    return {
      ok: true,
      texto:
        n === 1
          ? "Desculpa a demora! Quer seguir?"
          : "Ana, retomando de onde paramos: em quanto tempo suas alunas chegam no resultado?",
    };
  };
  const r = await gerarSugestao(ctx, { gerarFn, autorizado });
  assert.equal(r.ok, true);
  assert.equal(entradas.length, 2);
  assert.match(entradas[1], /RECUSADA/);
  assert.match(entradas[1], /desculpa/i);
});

test("recusa preco inventado, link fora da lista, fuga e fim sem proximo passo", async () => {
  const ruins = [
    "Ana, sai por R$ 4.997 hoje. Fechamos?",
    "Ana, veja https://site-inventado.com/promo e me diga o que achou?",
    "Ana, se não for seu momento pode ignorar. Quer seguir?",
    "Ana, a sua meta é boa e a oferta fica forte.",
  ];
  for (const t of ruins) {
    const r = await gerarSugestao(ctx, { gerarFn: fixo(t), autorizado });
    assert.equal(r.ok, false, t);
  }
});

test("falha da IA vira erro explicito, nunca texto inventado", async () => {
  const r = await gerarSugestao(ctx, {
    gerarFn: async () => ({ ok: false, erro: "chave do Gemini nao configurada" }),
    autorizado,
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.erros.join(" "), /chave do Gemini/);
});

test("excecao do gerador nao derruba: vira erro", async () => {
  const r = await gerarSugestao(ctx, {
    gerarFn: async () => {
      throw new Error("rede caiu");
    },
    autorizado,
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.erros.join(" "), /rede caiu/);
});

test("aceita resposta embrulhada em bloco de codigo", async () => {
  const r = await gerarSugestao(ctx, {
    gerarFn: fixo("```\nAna, retomando de onde paramos: em quanto tempo suas alunas chegam no resultado?\n```"),
    autorizado,
  });
  assert.equal(r.ok, true);
});

test("mais de 4 partes e recusado", async () => {
  const r = await gerarSugestao(ctx, {
    gerarFn: fixo("a?[QUEBRA]b[QUEBRA]c[QUEBRA]d[QUEBRA]e?"),
    autorizado,
  });
  assert.equal(r.ok, false);
});
