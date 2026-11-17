import { test } from "node:test";
import assert from "node:assert/strict";
import { deveEnviarVideo, escolherToqueFinal, legendaVideoProposta } from "../../src/lib/video-ultimo-toque";
import { legendaVideoJornada } from "../../src/lib/sequencia-iscas-copy";

const base = { toquesMax: 2, jaRecebeu: false, ligado: true };

test("o 1º toque continua texto e o último vira vídeo", () => {
  assert.equal(deveEnviarVideo({ ...base, toque: 0 }), false);
  assert.equal(deveEnviarVideo({ ...base, toque: 1 }), true);
});

test("quem já recebeu o vídeo ou com a chave desligada fica no texto", () => {
  assert.equal(deveEnviarVideo({ ...base, toque: 1, jaRecebeu: true }), false);
  assert.equal(deveEnviarVideo({ ...base, toque: 1, ligado: false }), false);
});

test("legenda usa o primeiro nome e termina com pergunta", () => {
  const l = legendaVideoJornada("Edson Mattos");
  assert.match(l, /^Edson, .+ gravou um vídeo curto/);
  assert.ok(l.trim().endsWith("?"));
});

// ---- opcao B (05/11): lead em proposta recebe o video-resumo, nao o da jornada ----
const final = { toque: 1, toquesMax: 2, jaRecebeu: false, ligado: true };
const padrao = { entregas: ["x"], garantia: "reuniões ilimitadas até a meta", videoResumo: true };
const semGarantia = { entregas: ["x"], garantia: null, videoResumo: false };

test("lead em proposta com a oferta padrao recebe o video-resumo", () => {
  assert.equal(escolherToqueFinal({ ...final, etapa: "proposta", oferta: padrao }), "video-proposta");
});

test("lead em proposta com oferta sem garantia ou sem registro fica no texto (nunca o video da jornada)", () => {
  assert.equal(escolherToqueFinal({ ...final, etapa: "proposta", oferta: semGarantia }), "texto");
  assert.equal(escolherToqueFinal({ ...final, etapa: "proposta", oferta: null }), "texto");
});

test("fora de proposta nada muda: video da jornada no ultimo toque", () => {
  assert.equal(escolherToqueFinal({ ...final, etapa: "conversando", oferta: null }), "video-jornada");
});

test("primeiro toque, video ja recebido e chave desligada continuam texto, em qualquer etapa", () => {
  assert.equal(escolherToqueFinal({ ...final, toque: 0, etapa: "proposta", oferta: padrao }), "texto");
  assert.equal(escolherToqueFinal({ ...final, jaRecebeu: true, etapa: "proposta", oferta: padrao }), "texto");
  assert.equal(escolherToqueFinal({ ...final, ligado: false, etapa: "conversando", oferta: null }), "texto");
});

test("legenda do video-resumo: sem validade, sem preco, sem pergunta de duvida, com o clique", () => {
  const l = legendaVideoProposta("Pedro Alves");
  assert.match(l, /^Pedro, enquanto você avalia a proposta/);
  assert.match(l, /Vamos começar/);
  assert.doesNotMatch(l, /validade|prazo|R\$|dúvida|10 minutos/i);
  assert.ok(!l.trim().endsWith("?"));
});

test("vídeo do último toque nasce DESLIGADO (13/11/2026): só a Setting '1' liga", async () => {
  const { videoLigadoPelaSetting } = await import("../../src/lib/followup-agente");
  assert.equal(videoLigadoPelaSetting(undefined), false);
  assert.equal(videoLigadoPelaSetting(""), false);
  assert.equal(videoLigadoPelaSetting("0"), false);
  assert.equal(videoLigadoPelaSetting("1"), true);
});
