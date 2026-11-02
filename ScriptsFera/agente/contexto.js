'use strict';
/** Monta o contexto injetável do motor (relógio, envio, IA, CRM), igual para o modo real e a simulação. */
const { criarStore } = require('./store');
const { criarLeadsApi } = require('./leads');
const { criarGemini, criarStub } = require('./gemini');

function criarFilaSerial() {
  let fila = Promise.resolve();
  return (fn) => {
    const proxima = fila.then(fn, fn);
    fila = proxima.catch(() => {});
    return proxima;
  };
}

function escolherIA(cfg, { exigirChave }) {
  const chave = process.env.GEMINI_API_KEY;
  if (chave) return { gemini: criarGemini({ modelo: cfg.modelo, chave }), stub: false };
  if (exigirChave) {
    throw new Error('GEMINI_API_KEY não encontrada no .env. Sem a chave o agente não envia nada. Rode: python SetupFera/setup_chaves.py');
  }
  return { gemini: criarStub(), stub: true };
}

function criarContexto({ cfg, dirDados, leadsScript, enviar, exigirChave, agora, pausa, silencioso }) {
  const ia = escolherIA(cfg, { exigirChave });
  return {
    cfg,
    store: criarStore(dirDados, { silencioso }),
    leads: criarLeadsApi(leadsScript),
    enviar,
    gemini: ia.gemini,
    usaStub: ia.stub,
    agora: agora || (() => new Date()),
    pausa: pausa || ((ms) => new Promise((r) => setTimeout(r, ms))),
    serial: criarFilaSerial(),
  };
}

module.exports = { criarContexto };
