#!/usr/bin/env node
/**
 * Pós-reunião: monta o lead.json da proposta a partir da conversa e (opcional) chama o gerador.
 *
 *   node ScriptsFera/agente/pos-reuniao.js --lead "Nome ou l0001 ou telefone" [--dor "..."] [--empresa "..."]
 *        [--out pasta] [--gerar] [--forcar]
 *
 * Nunca envia nada ao lead. O dono aprova a página antes de qualquer mensagem.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { RAIZ, caminhoDados } = require('./config');
const { semAcento } = require('./guardas');

const MIN_CHARS_FALA = 20;
const MAX_FALAS = 10;
const GERADOR = path.join(RAIZ, 'SkillsDoFera', 'proposta-pagina', 'gerar_proposta.py');

function argumento(args, nome) {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : undefined;
}

function achar(estado, busca) {
  const b = semAcento(busca);
  const todos = Object.values(estado.contatos);
  return todos.find((c) => c.lead_id === busca || c.numero === busca.replace(/\D/g, ''))
    || todos.find((c) => semAcento(c.nome).includes(b));
}

/** Falas literais: só o que o lead escreveu, sem o marcador do funil e sem respostas curtas demais. */
function falasLiterais(c) {
  return c.historico
    .filter((h) => h.de === 'lead' && !h.texto.startsWith('[AGENDAMENTO]') && h.texto.trim().length >= MIN_CHARS_FALA)
    .map((h) => h.texto.trim())
    .slice(0, MAX_FALAS);
}

function montarLead(c, extras = {}) {
  return {
    nome: c.nome,
    empresa: extras.empresa || c.dados.empresa || '',
    instagram: c.dados.instagram || '',
    whatsapp: c.numero,
    falas: falasLiterais(c),
    objetivo: c.dados.objetivo || '',
    dor: extras.dor || c.dados.dor || '',
  };
}

function faltas(lead) {
  return ['falas', 'objetivo', 'dor'].filter((k) => !(Array.isArray(lead[k]) ? lead[k].length : lead[k]));
}

function chamarGerador(arquivoLead, pastaSaida) {
  if (!fs.existsSync(GERADOR)) {
    console.error(`[AVISO] Gerador de proposta não encontrado em ${GERADOR}. O lead.json está pronto, rode o gerador quando a skill proposta-pagina estiver instalada.`);
    return 3;
  }
  const r = spawnSync('python', ['-X', 'utf8', GERADOR, '--lead', arquivoLead, '--out', pastaSaida], {
    stdio: 'inherit', env: { ...process.env, PYTHONUTF8: '1' },
  });
  return r.status === 0 ? 0 : 4;
}

function marcarRealizada(dir, c) {
  const arquivo = path.join(dir, 'agenda.json');
  if (!fs.existsSync(arquivo)) return;
  const agenda = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const r = agenda.reunioes.find((x) => x.id === c.reuniao_id);
  if (r) r.status = 'realizada';
  fs.writeFileSync(arquivo, JSON.stringify(agenda, null, 2) + '\n', 'utf8');
}

function principal(args) {
  const busca = argumento(args, 'lead');
  if (!busca) {
    console.error('Uso: node pos-reuniao.js --lead "<nome|id|telefone>" [--dor "..."] [--empresa "..."] [--out pasta] [--gerar] [--forcar]');
    return 1;
  }
  const dir = caminhoDados();
  const arquivoEstado = path.join(dir, 'agente-estado.json');
  if (!fs.existsSync(arquivoEstado)) {
    console.error('[ERRO] Ainda não existe conversa registrada (agente-estado.json).');
    return 1;
  }
  const c = achar(JSON.parse(fs.readFileSync(arquivoEstado, 'utf8')), busca);
  if (!c) {
    console.error(`[ERRO] Nenhum contato encontrado para "${busca}".`);
    return 1;
  }
  const lead = montarLead(c, { dor: argumento(args, 'dor'), empresa: argumento(args, 'empresa') });
  const faltando = faltas(lead);
  if (faltando.length && !args.includes('--forcar')) {
    console.error(`[PARE] Faltam dados reais do lead: ${faltando.join(', ')}. Pergunte ao dono ou passe --dor/--empresa. Nada foi inventado.`);
    return 2;
  }
  const saida = path.resolve(argumento(args, 'out') || path.join(RAIZ, 'output', 'propostas', semAcento(c.nome).replace(/[^a-z0-9]+/g, '-')));
  fs.mkdirSync(saida, { recursive: true });
  const arquivoLead = path.join(saida, 'lead.json');
  fs.writeFileSync(arquivoLead, JSON.stringify(lead, null, 2) + '\n', 'utf8');
  marcarRealizada(dir, c);
  console.log(`  lead.json pronto: ${arquivoLead}`);
  if (!args.includes('--gerar')) {
    console.log(`  Próximo passo: python SkillsDoFera/proposta-pagina/gerar_proposta.py --lead "${arquivoLead}" --out "${saida}"`);
    return 0;
  }
  return chamarGerador(arquivoLead, saida);
}

if (require.main === module) process.exit(principal(process.argv.slice(2)));

module.exports = { montarLead, falasLiterais, faltas };
