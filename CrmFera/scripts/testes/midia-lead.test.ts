import { test } from "node:test";
import assert from "node:assert/strict";
import { midiaSemResposta } from "../../src/lib/midia-lead";
import { validarMensagem } from "../../src/lib/guardas";
import { definicaoPorSlug } from "../../src/lib/prompts";
import { promptPadrao } from "../../src/lib/prompt-recepcao";

const entrou = (type: string) => ({ direction: "inbound", type });
const saiu = { direction: "outbound", type: "text" };

// mais nova primeiro, como vem do banco
test("mídia depois da nossa última mensagem cala o agente, mesmo com texto vindo depois", () => {
  assert.equal(midiaSemResposta([entrou("audio"), saiu]), "áudio");
  assert.equal(midiaSemResposta([entrou("image"), saiu]), "foto");
  assert.equal(midiaSemResposta([entrou("video")]), "vídeo");
  assert.equal(midiaSemResposta([entrou("document"), saiu]), "documento");
  assert.equal(midiaSemResposta([entrou("sticker"), saiu]), "figurinha");
  assert.equal(midiaSemResposta([entrou("text"), entrou("audio"), saiu]), "áudio");
});

test("texto e mídia já respondida não calam", () => {
  assert.equal(midiaSemResposta([entrou("text"), saiu, entrou("audio")]), null);
  assert.equal(midiaSemResposta([entrou("text"), saiu]), null);
  assert.equal(midiaSemResposta([]), null);
});

test("o guarda barra frase de que não consegue ouvir, ver ou abrir mídia", () => {
  const a = { links: [], precos: [] };
  for (const t of [
    "Não consigo ouvir áudios. O que você vende?",
    "Não consegui abrir o áudio, me conta o que você vende?",
    "Por favor, escreva em vez de mandar áudio. O que você vende?",
    "Por aqui eu só consigo ler mensagens de texto. O que você vende?",
    "Por aqui só leio texto. O que você vende?",
    "Não consigo abrir essa foto. O que você vende?",
    "Não consigo ver o vídeo. O que você vende?",
  ]) {
    assert.ok(validarMensagem(t, a).erros.some((e) => /mídia/.test(e)), t);
  }
  assert.ok(!validarMensagem("Pode mandar áudio. O que você vende hoje?", a).erros.some((e) => /mídia/.test(e)));
});

test("nenhum prompt manda responder a mídia", () => {
  const proibido = /Mensagem sem texto \(\[|VIER COMO \[|só lê texto|só consegue ler/;
  assert.doesNotMatch(promptPadrao(), proibido);
  for (const slug of ["implementacao-youtube", "consultoria-sem-limite"]) {
    assert.doesNotMatch(String(definicaoPorSlug(slug)?.prompt), proibido, slug);
  }
});
