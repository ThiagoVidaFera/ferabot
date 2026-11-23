import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AVISO_TELAS_MUDAM,
  COMO_ABRIR,
  EXEMPLO_BOM,
  EXEMPLO_RUIM,
  MODELO_DE_PROMPT,
  PROMPT_ESPIAR_CONCORRENTE,
  REGRAS,
  SECOES,
  SOCORRO,
  TUTORIAIS,
} from "../../src/lib/promptbook";
import { chaveDoCatalogo } from "../../src/lib/chaves-catalogo";

const PROIBIDOS: { nome: string; padrao: RegExp }[] = [
  { nome: "travessão", padrao: /—/ },
  { nome: "automático", padrao: /autom[aá]tic[oa]s?/i },
  { nome: "sem esforço", padrao: /sem esfor[cç]o/i },
  { nome: "a IA cuida de tudo", padrao: /cuida de tudo/i },
  { nome: "e-mail", padrao: /[\w.+-]+@[\w-]+\.[a-z]{2,}/i },
  { nome: "telefone", padrao: /(\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b/ },
];

function todosOsTextos(): string[] {
  return [
    COMO_ABRIR,
    EXEMPLO_BOM,
    EXEMPLO_RUIM,
    AVISO_TELAS_MUDAM,
    PROMPT_ESPIAR_CONCORRENTE,
    ...REGRAS.flatMap((r) => [r.titulo, r.texto]),
    ...MODELO_DE_PROMPT.flatMap((m) => [m.parte, m.pergunta]),
    ...SECOES.flatMap((s) => [s.titulo, s.resumo, ...s.itens.flatMap((i) => [i.titulo, i.para, i.prompt])]),
    ...SOCORRO.flatMap((i) => [i.titulo, i.para, i.prompt]),
    ...TUTORIAIS.flatMap((t) => [t.titulo, t.tempo, t.para, ...t.passos]),
  ];
}

test("toda seção do guia tem itens e id único", () => {
  assert.ok(SECOES.length > 0);
  const ids = new Set(SECOES.map((s) => s.id));
  assert.equal(ids.size, SECOES.length);
  for (const s of SECOES) assert.ok(s.itens.length > 0, `seção ${s.id} sem itens`);
});

test("todo item tem título, para e prompt não vazios", () => {
  for (const item of [...SECOES.flatMap((s) => s.itens), ...SOCORRO]) {
    assert.ok(item.titulo.trim(), "título vazio");
    assert.ok(item.para.trim(), `para vazio em ${item.titulo}`);
    assert.ok(item.prompt.trim(), `prompt vazio em ${item.titulo}`);
  }
});

test("nenhum texto do guia tem travessão, promessa vazia, e-mail ou telefone", () => {
  for (const texto of todosOsTextos()) {
    for (const { nome, padrao } of PROIBIDOS) {
      assert.ok(!padrao.test(texto), `${nome} encontrado em: ${texto.slice(0, 80)}`);
    }
  }
});

test("o guia tem a seção de artes com carrossel, anúncio e story", () => {
  const artes = SECOES.find((s) => s.id === "artes");
  assert.ok(artes);
  const prompts = artes.itens.map((i) => i.prompt).join(" ");
  for (const comando of ["/carrossel-ilustrado", "/anuncios-de-ouro", "/squad-stories-fera", "/galeria-de-artes"]) {
    assert.ok(prompts.includes(comando), `falta ${comando}`);
  }
});

test("todo tutorial de chave usa nomes do catálogo e termina na tela Chaves", () => {
  for (const t of TUTORIAIS) {
    assert.ok(t.passos.length > 0, `${t.id} sem passos`);
    for (const env of t.envs) assert.ok(chaveDoCatalogo(env), `${env} não está no catálogo`);
    if (t.envs.length) {
      assert.ok(t.passos.some((p) => p.includes("Salvar e testar")), `${t.id} não manda testar`);
    }
  }
});

test("nenhum prompt pede para colar chave no chat", () => {
  for (const item of SECOES.flatMap((s) => s.itens)) {
    assert.ok(!/cole o token aqui|cole a chave aqui|cofre de credenciais/i.test(item.prompt), item.titulo);
  }
});
