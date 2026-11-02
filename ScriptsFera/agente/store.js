'use strict';
/** Persistência local em JSON (estado, agenda, avisos) e log. Nada disso vai pro git. */
const fs = require('fs');
const path = require('path');

function gravarAtomico(arquivo, dados) {
  const tmp = `${arquivo}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, arquivo);
}

function lerOu(arquivo, padrao) {
  if (!fs.existsSync(arquivo)) return padrao;
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch (e) {
    throw new Error(`Arquivo ilegível: ${arquivo} (${e.message}). Corrija ou apague pra recomeçar.`);
  }
}

const mesmoDia = (iso, data) => iso.slice(0, 10) === data.toISOString().slice(0, 10);

function criarStore(dir, { silencioso = false } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const arq = {
    estado: path.join(dir, 'agente-estado.json'),
    agenda: path.join(dir, 'agenda.json'),
    avisos: path.join(dir, 'avisos.json'),
    log: path.join(dir, 'agente.log'),
  };
  const estado = lerOu(arq.estado, { contatos: {}, envios: [], leads_novos: [] });
  const agenda = lerOu(arq.agenda, { reunioes: [] });
  const avisos = lerOu(arq.avisos, { avisos: [] });

  const store = {
    dir, arq, estado, agenda, avisos,
    salvar() {
      gravarAtomico(arq.estado, estado);
      gravarAtomico(arq.agenda, agenda);
      gravarAtomico(arq.avisos, avisos);
    },
    contato: (numero) => estado.contatos[numero] || null,
    log(nivel, msg, extra) {
      const linha = `${new Date().toISOString()} [${nivel}] ${msg}` + (extra ? ` ${JSON.stringify(extra)}` : '');
      fs.appendFileSync(arq.log, linha + '\n', 'utf8');
      if (!silencioso) console.log(`  ${linha.slice(11)}`);
    },
    aviso(agora, tipo, contato, motivo) {
      const item = {
        id: `a${avisos.avisos.length + 1}`, quando: agora.toISOString(), tipo,
        numero: contato ? contato.numero : '', nome: contato ? contato.nome : '', motivo, lido: false,
      };
      avisos.avisos.push(item);
      store.log('AVISO', `${tipo}: ${item.nome || '-'} | ${motivo}`);
      console.log(`\n  >>> AVISO PRO DONO (${tipo}) ${item.nome ? 'sobre ' + item.nome : ''}: ${motivo}\n`);
      return item;
    },
    enviosHoje: (agora) => estado.envios.filter((q) => mesmoDia(q, agora)).length,
    registrarEnvio: (agora) => estado.envios.push(agora.toISOString()),
    leadsNovosHoje: (agora) => estado.leads_novos.filter((q) => mesmoDia(q, agora)).length,
    registrarLeadNovo: (agora) => estado.leads_novos.push(agora.toISOString()),
  };
  return store;
}

module.exports = { criarStore };
