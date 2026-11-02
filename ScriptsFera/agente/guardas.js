'use strict';
/** Guardas determinísticas: handoff por palavra, trava de saída da IA e preenchimento de textos. */

const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const escapar = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function contem(texto, lista) {
  const alvo = semAcento(texto);
  return (lista || []).some((p) => new RegExp(`(^|[^a-z0-9])${escapar(semAcento(p))}([^a-z0-9]|$)`).test(alvo));
}

/** Devolve {tipo, motivo} ou null. Ordem: parar, humano, ligar, fechar, preço. */
function detectarIntencao(texto, cfg) {
  const h = cfg.handoff;
  const curto = semAcento(texto);
  if (curto.length <= 40 && contem(texto, h.palavras_parar)) return { tipo: 'parar', motivo: 'lead pediu pra parar' };
  if (curto.replace(/[^a-z]/g, '') === semAcento(h.palavra_unica) || contem(texto, h.palavras_humano)) {
    return { tipo: 'humano', motivo: 'lead pediu uma pessoa' };
  }
  if (contem(texto, h.palavras_ligar)) return { tipo: 'ligar', motivo: 'lead pediu ligação' };
  if (contem(texto, h.palavras_fechar)) return { tipo: 'fechar', motivo: 'lead quer fechar' };
  if (contem(texto, h.palavras_preco)) return { tipo: 'preco', motivo: 'lead perguntou preço' };
  return null;
}

function urlsPermitidas(cfg) {
  return (cfg.materiais || []).map((m) => m.url).filter(Boolean);
}

const PADROES_PROIBIDOS = [
  { re: /garant(o|imos|ido|ida|ia)\b/i, motivo: 'promessa de resultado' },
  { re: /vai (faturar|ganhar|vender|dobrar)/i, motivo: 'promessa de resultado' },
  { re: /\b(sou|era|fui) (uma )?(pessoa|humano|humana)\b/i, motivo: 'fingiu ser humano' },
];

/** Valida uma mensagem da IA antes do envio. Devolve null se ok, ou o motivo do bloqueio. */
function validarSaida(texto, cfg) {
  if (!texto || !texto.trim()) return 'mensagem vazia';
  if (texto.length > 600) return 'mensagem longa demais';
  if (!cfg.preco_liberado && /R\$\s?\d|\d\s?(reais|mil)\b/i.test(texto)) return 'citou valor sem liberação do dono';
  const permitidas = urlsPermitidas(cfg);
  for (const url of texto.match(/https?:\/\/\S+/gi) || []) {
    if (!permitidas.some((p) => url.startsWith(p))) return 'link fora da lista do dono';
  }
  for (const p of PADROES_PROIBIDOS) if (p.re.test(texto)) return p.motivo;
  return null;
}

function preencher(modelo, vars) {
  return String(modelo).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

module.exports = { detectarIntencao, validarSaida, preencher, semAcento };
