'use strict';
/** Monta o prompt do Gemini a partir de SkillsDoFera/agente-de-leads/references/prompt-agente.md. */
const fs = require('fs');
const path = require('path');
const { RAIZ } = require('./config');
const { preencher } = require('./guardas');

const ARQUIVO = path.join(RAIZ, 'SkillsDoFera', 'agente-de-leads', 'references', 'prompt-agente.md');
const INICIO = '<!-- PROMPT:INICIO -->';
const FIM = '<!-- PROMPT:FIM -->';
const HISTORICO_MAX = 14;

function carregarModelo() {
  if (!fs.existsSync(ARQUIVO)) throw new Error(`Prompt do agente não encontrado: ${ARQUIVO}`);
  const bruto = fs.readFileSync(ARQUIVO, 'utf8');
  const i = bruto.indexOf(INICIO);
  const f = bruto.indexOf(FIM);
  if (i < 0 || f < 0) throw new Error('prompt-agente.md sem os marcadores PROMPT:INICIO e PROMPT:FIM.');
  return bruto.slice(i + INICIO.length, f).trim();
}

function perguntasPendentes(cfg, c) {
  return cfg.perguntas.filter((p) => p.obrigatoria !== false && !c.dados[p.id]);
}

function montarSistema(cfg) {
  return preencher(carregarModelo(), {
    dono: cfg.dono.nome,
    assistente: cfg.dono.assistente,
    preco_liberado: cfg.preco_liberado ? 'sim' : 'nao',
  });
}

function montarContexto(cfg, c) {
  const ultima = [...c.historico].reverse().find((h) => h.de === 'lead');
  return {
    lead: { nome: c.nome, instagram: c.dados.instagram || null, reuniao: c.reuniao_quando },
    dados_ja_coletados: c.dados,
    perguntas_pendentes: perguntasPendentes(cfg, c).map((p) => ({ id: p.id, pergunta: p.pergunta })),
    materiais_ja_enviados: c.materiais_enviados,
    ultima_fala_lead: ultima ? ultima.texto : '',
    historico: c.historico.slice(-HISTORICO_MAX).map((h) => ({ de: h.de, texto: h.texto })),
  };
}

module.exports = { montarSistema, montarContexto, perguntasPendentes };
