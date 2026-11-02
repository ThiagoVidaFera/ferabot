'use strict';
/** Caminhos, .env e configuração do agente (agente.json sobre agente.exemplo.json). */
const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const RAIZ = path.resolve(AQUI, '..', '..');
const MODELO_PADRAO = 'gemini-2.5-pro';
const SECOES_MESCLADAS = ['dono', 'textos', 'limites', 'janela', 'handoff'];

function carregarEnv(raiz = RAIZ) {
  const arquivo = path.join(raiz, '.env');
  if (!fs.existsSync(arquivo)) return;
  for (const bruta of fs.readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const linha = bruta.trim();
    if (!linha || linha.startsWith('#') || !linha.includes('=')) continue;
    const i = linha.indexOf('=');
    const chave = linha.slice(0, i).trim();
    const valor = linha.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (chave && valor && !(chave in process.env)) process.env[chave] = valor;
  }
}

function lerJson(arquivo) {
  return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
}

function carregarConfig(dir = AQUI) {
  const exemplo = lerJson(path.join(AQUI, 'agente.exemplo.json'));
  const propriaPath = path.join(dir, 'agente.json');
  const usaExemplo = !fs.existsSync(propriaPath);
  const propria = usaExemplo ? {} : lerJson(propriaPath);
  const cfg = { ...exemplo, ...propria };
  for (const secao of SECOES_MESCLADAS) {
    cfg[secao] = { ...exemplo[secao], ...(propria[secao] || {}) };
  }
  cfg.modelo = process.env.GEMINI_MODEL || cfg.modelo || MODELO_PADRAO;
  cfg._usaExemplo = usaExemplo;
  return cfg;
}

function caminhoDados() {
  return process.env.FERABOT_AGENTE_DADOS || path.join(AQUI, 'dados');
}

function resolverArquivoMaterial(caminho) {
  return path.isAbsolute(caminho) ? caminho : path.join(RAIZ, caminho);
}

module.exports = { AQUI, RAIZ, MODELO_PADRAO, carregarEnv, carregarConfig, caminhoDados, resolverArquivoMaterial };
