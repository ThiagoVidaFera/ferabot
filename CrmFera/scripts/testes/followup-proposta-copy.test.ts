import { test } from "node:test";
import assert from "node:assert/strict";
import { situacaoProposta } from "../../src/lib/followup-proposta-copy";

const primeiro = situacaoProposta({ horas: 48, toque: 0, ultimaFoiHumana: false });
const segundo = situacaoProposta({ horas: 96, toque: 1, ultimaFoiHumana: false });

test("em partes, sem markdown nem lista (o guarda do agente barra)", () => {
  assert.match(primeiro, /\[QUEBRA\]/);
  assert.match(primeiro, /sem asteriscos|ZERO asteriscos|sem markdown/i);
});

test("proibe pergunta de duvida, conversa curta, validade, preco e retorno", () => {
  for (const proibido of ["tem alguma dúvida", "10 minutos", "qualquer dúvida", "validade", "preço", "retorno do investimento"]) {
    assert.ok(primeiro.toLowerCase().includes(proibido.toLowerCase()), `a proibicao deveria citar: ${proibido}`);
  }
  assert.match(primeiro, /NUNCA|PROIBIDO/);
});

test("avisa que a regra geral do link (qualquer duvida) nao vale neste toque", () => {
  assert.match(primeiro, /NÃO vale neste toque/);
});

test("garantia so quando a proposta ou a conversa ja citou", () => {
  assert.match(primeiro, /só (cite|mencione|fale).*garantia/i);
});

test("nao inventa o link: copia o da conversa", () => {
  assert.match(primeiro, /link.*(conversa|exatamente)/i);
  assert.match(primeiro, /não invente/i);
});

test("nao herda as regras do follow-up generico", () => {
  assert.doesNotMatch(primeiro, /Termine com UMA pergunta/);
  assert.doesNotMatch(primeiro, /2 exemplos/);
});

test("o segundo toque e outra mensagem: uma entrega, mais curta", () => {
  assert.notEqual(primeiro, segundo);
  assert.match(segundo, /ÚLTIMO/);
  assert.match(segundo, /não repita/i);
});

test("o horario do silencio entra no texto", () => {
  assert.match(primeiro, /48 horas/);
  assert.match(segundo, /96 horas/);
});

// ---- oferta guardada no contato (customFields.proposta) ----
const padrao = {
  entregas: ["um Instagram com 12 posts prontos", "um canal no YouTube com 7 roteiros prontos"],
  garantia: "reuniões individuais ilimitadas comigo, até a meta combinada em contrato",
  videoResumo: true,
};
const youtube = {
  entregas: ["o Mapa de Intenção e 7 vídeos no YouTube", "anúncios, WhatsApp e CRM"],
  garantia: null,
  videoResumo: false,
};
const ctx = { horas: 48, toque: 0, ultimaFoiHumana: false };

test("com a oferta guardada, as entregas vêm dela e a lista padrao some", () => {
  const t = situacaoProposta({ ...ctx, oferta: youtube });
  assert.ok(t.includes("o Mapa de Intenção e 7 vídeos no YouTube"));
  assert.ok(!t.includes("12 posts"));
  assert.ok(!t.includes("livro digital"));
});

test("oferta com garantia: manda dizer a garantia guardada", () => {
  const t = situacaoProposta({ ...ctx, oferta: padrao });
  assert.ok(t.includes("reuniões individuais ilimitadas comigo, até a meta combinada em contrato"));
});

test("oferta SEM garantia: proibe falar de garantia e de risco zero", () => {
  const t = situacaoProposta({ ...ctx, oferta: youtube });
  assert.match(t, /NÃO tem garantia/);
  assert.match(t, /nunca (cite|fale).*garantia/i);
});

test("sem oferta guardada, mantem a regra condicional (so cita se a conversa citou)", () => {
  const t = situacaoProposta(ctx);
  assert.match(t, /só (cite|mencione|fale).*garantia/i);
});

test("segundo toque tambem respeita a oferta", () => {
  const t = situacaoProposta({ horas: 96, toque: 1, ultimaFoiHumana: false, oferta: youtube });
  assert.match(t, /NÃO tem garantia/);
  assert.ok(t.includes("o Mapa de Intenção e 7 vídeos no YouTube"));
});
