#!/usr/bin/env node
/**
 * Agente de leads do FERABOT. Roda na sua máquina, no seu número de WhatsApp.
 *
 *   node ScriptsFera/agente/agente.js            DRY-RUN: conecta, escuta, imprime o que enviaria, não envia
 *   node ScriptsFera/agente/agente.js --enviar   envio real
 *   node ScriptsFera/agente/agente.js --avisos   lista os avisos ainda não lidos e sai
 *
 * Lembretes só saem com o computador ligado e este processo rodando.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { RAIZ, carregarEnv, carregarConfig, caminhoDados, resolverArquivoMaterial } = require('./config');
const { criarContexto } = require('./contexto');
const { processarMensagem, silenciarPeloDono } = require('./conversa');
const { tick } = require('./rotina');

const INTERVALO_TICK_MS = 60 * 1000;
const args = process.argv.slice(2);
const enviarDeVerdade = args.includes('--enviar');

carregarEnv();

function listarAvisos() {
  const arquivo = path.join(caminhoDados(), 'avisos.json');
  const avisos = fs.existsSync(arquivo) ? JSON.parse(fs.readFileSync(arquivo, 'utf8')).avisos : [];
  const abertos = avisos.filter((a) => !a.lido);
  if (!abertos.length) return console.log('  Nenhum aviso novo.');
  for (const a of abertos) console.log(`  [${a.tipo}] ${a.nome || '-'} | ${a.motivo} (${a.quando.slice(0, 16)})`);
  return undefined;
}

function carregarWhatsApp() {
  try {
    return { ...require('whatsapp-web.js'), qrcode: require('qrcode-terminal') };
  } catch (e) {
    console.error('[ERRO] Dependências não instaladas. Rode uma vez: cd ScriptsFera/agente && npm install');
    process.exit(1);
    return null;
  }
}

function criarEnvioWhatsApp(client, MessageMedia, contadorPropriasMsgs) {
  return async (numero, conteudo, { arquivo } = {}) => {
    const destino = `${numero}@c.us`;
    contadorPropriasMsgs.set(destino, (contadorPropriasMsgs.get(destino) || 0) + 1);
    if (arquivo) {
      const media = MessageMedia.fromFilePath(resolverArquivoMaterial(arquivo));
      await client.sendMessage(destino, media, { caption: conteudo });
    } else {
      await client.sendMessage(destino, conteudo);
    }
  };
}

function criarEnvioDryRun() {
  return async (numero, conteudo, { arquivo } = {}) => {
    console.log(`\n  [DRY-RUN] enviaria para ${numero.slice(0, 4)}...${arquivo ? ` (com arquivo ${arquivo})` : ''}:\n    ${conteudo.replace(/\n/g, '\n    ')}\n`);
  };
}

async function numeroDe(msg) {
  const contato = await msg.getContact();
  return String(contato.number || '').replace(/\D/g, '');
}

function ligarEventos(client, ctx, proprias) {
  client.on('message', (msg) => ctx.serial(async () => {
    try {
      if (msg.fromMe || msg.from === 'status@broadcast') return;
      const chat = await msg.getChat();
      const numero = await numeroDe(msg);
      const midia = msg.hasMedia ? msg.type : null;
      await processarMensagem(ctx, { numero, texto: msg.body || '', grupo: chat.isGroup, midia });
    } catch (e) {
      ctx.store.log('ERRO', `falha ao processar mensagem: ${e.message}`);
    }
  }));

  client.on('message_create', (msg) => {
    if (!msg.fromMe || msg.to.endsWith('@g.us')) return;
    const restantes = proprias.get(msg.to) || 0;
    if (restantes > 0) {
      proprias.set(msg.to, restantes - 1);
      return;
    }
    const numero = msg.to.replace(/@.*/, '');
    ctx.serial(async () => { silenciarPeloDono(ctx, numero); });
  });
}

function main() {
  if (args.includes('--avisos')) return listarAvisos();
  const cfg = carregarConfig();
  const ctxBase = {
    cfg, dirDados: caminhoDados(), leadsScript: path.join(RAIZ, 'ScriptsFera', 'leads-api.py'),
    exigirChave: enviarDeVerdade,
  };
  if (enviarDeVerdade && cfg._usaExemplo) {
    console.error('[ERRO] Crie o seu agente.json (copie de agente.exemplo.json e troque os textos) antes de enviar de verdade.');
    process.exit(1);
  }
  const wa = carregarWhatsApp();
  const proprias = new Map();
  const client = new wa.Client({
    authStrategy: new wa.LocalAuth({ dataPath: path.join(RAIZ, 'ScriptsFera', 'wpp', '.sessao') }),
    puppeteer: { headless: true, args: ['--no-sandbox'] },
  });
  const ctx = criarContexto({
    ...ctxBase,
    enviar: enviarDeVerdade ? criarEnvioWhatsApp(client, wa.MessageMedia, proprias) : criarEnvioDryRun(),
  });
  console.log(`\n  Agente de leads | modo: ${enviarDeVerdade ? 'ENVIO REAL' : 'DRY-RUN (nada é enviado)'} | IA: ${ctx.usaStub ? 'STUB (sem chave)' : ctx.cfg.modelo}`);
  console.log('  Lembretes dependem do computador ligado e deste processo aberto.\n');
  client.on('qr', (qr) => {
    console.log('  Escaneie o QR com o SEU WhatsApp (Aparelhos conectados, Conectar aparelho):');
    wa.qrcode.generate(qr, { small: true });
  });
  client.on('ready', () => {
    ctx.store.log('INFO', 'WhatsApp conectado, agente escutando');
    setInterval(() => ctx.serial(() => tick(ctx)).catch((e) => ctx.store.log('ERRO', e.message)), INTERVALO_TICK_MS);
  });
  client.on('auth_failure', (m) => {
    console.error(`[ERRO] Falha de autenticação: ${m}`);
    process.exit(1);
  });
  ligarEventos(client, ctx, proprias);
  client.initialize();
  return undefined;
}

if (require.main === module) main();
