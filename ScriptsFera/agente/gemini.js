'use strict';
/** Cliente Gemini (REST, chave do próprio usuário) e resposta stub para testes sem chave. */
const ESPERA_RETRY_MS = 5000;

async function chamar({ modelo, chave, sistema, conteudo }, tentativa = 1) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`;
  const corpo = {
    systemInstruction: { parts: [{ text: sistema }] },
    contents: [{ role: 'user', parts: [{ text: conteudo }] }],
    generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(60000),
  });
  if ((resp.status === 429 || resp.status >= 500) && tentativa < 2) {
    await new Promise((r) => setTimeout(r, ESPERA_RETRY_MS));
    return chamar({ modelo, chave, sistema, conteudo }, tentativa + 1);
  }
  if (!resp.ok) {
    const detalhe = (await resp.text()).slice(0, 300);
    throw new Error(`Gemini HTTP ${resp.status}: ${detalhe}`);
  }
  const json = await resp.json();
  const partes = json.candidates?.[0]?.content?.parts || [];
  const texto = partes.map((p) => p.text || '').join('').trim();
  if (!texto) throw new Error('Gemini devolveu resposta vazia.');
  return texto;
}

function lerJsonSolto(texto) {
  const limpo = texto.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(limpo);
}

/** Devolve função `gerar({sistema, conteudo}) -> objeto JSON`. */
function criarGemini({ modelo, chave }) {
  return async ({ sistema, conteudo }) => lerJsonSolto(await chamar({ modelo, chave, sistema, conteudo }));
}

const MARCA_STUB = '[STUB SEM GEMINI] ';

/** Resposta de mentira, deterministica, claramente marcada. Nunca vai pro WhatsApp real. */
function criarStub() {
  return async ({ contexto }) => {
    const pendentes = contexto.perguntas_pendentes;
    const ultima = contexto.ultima_fala_lead;
    const dados = {};
    if (pendentes.length) dados[pendentes[0].id] = ultima.slice(0, 160);
    const seguinte = pendentes[1];
    const msg = seguinte
      ? `${MARCA_STUB}Anotado. ${seguinte.pergunta}`
      : `${MARCA_STUB}Anotado, era a última pergunta.`;
    return { mensagens: [msg], dados, handoff: false, motivo: '', perfil_provado: false };
  };
}

module.exports = { criarGemini, criarStub, MARCA_STUB };
