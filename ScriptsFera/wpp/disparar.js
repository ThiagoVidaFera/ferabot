#!/usr/bin/env node
/**
 * Disparador local de WhatsApp do FERABOT.
 *
 * Roda na máquina do usuário, com o número DELE (QR code no WhatsApp dele).
 * Nada passa por servidor de terceiro.
 *
 * Uso:
 *   node disparar.js lote.json            → DRY-RUN: mostra o plano, não envia nada
 *   node disparar.js lote.json --enviar   → envia de verdade
 *
 * lote.json (gerado por leads-api.py lote):
 *   { "itens": [ { "id": "l0001", "nome": "...", "telefone": "5561...", "mensagem": "..." } ] }
 *
 * Anti-ban (fixo no código, não configurável de propósito):
 *   - intervalo aleatório de 60 a 300s entre envios
 *   - máximo 50 envios por dia
 *   - re-rodar o mesmo lote não duplica (resultados em <lote>.results.jsonl)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const INTERVALO_MIN_S = 60;
const INTERVALO_MAX_S = 300;
const MAX_POR_DIA = 50;

// ── Argumentos ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const lotePath = args.find((a) => !a.startsWith('--'));
const enviar = args.includes('--enviar');

if (!lotePath) {
  console.error('Uso: node disparar.js <lote.json> [--enviar]');
  process.exit(1);
}
if (!fs.existsSync(lotePath)) {
  console.error(`[ERRO] Arquivo não existe: ${lotePath}`);
  process.exit(1);
}

let lote;
try {
  lote = JSON.parse(fs.readFileSync(lotePath, 'utf8'));
} catch (e) {
  console.error(`[ERRO] lote.json inválido: ${e.message}`);
  process.exit(1);
}
const itens = (lote.itens || []).filter((i) => i.telefone && i.mensagem);
if (!itens.length) {
  console.error('[ERRO] Lote vazio (nenhum item com telefone e mensagem).');
  process.exit(1);
}

// ── Idempotência: quem já recebeu neste lote não recebe de novo ─────────────
const resultsPath = lotePath.replace(/\.json$/, '') + '.results.jsonl';
const jaEnviados = new Set();
if (fs.existsSync(resultsPath)) {
  for (const linha of fs.readFileSync(resultsPath, 'utf8').split('\n')) {
    if (!linha.trim()) continue;
    try {
      const r = JSON.parse(linha);
      if (r.ok) jaEnviados.add(r.telefone);
    } catch (e) { /* linha corrompida, ignora */ }
  }
}

// ── Cap diário (conta envios de hoje em qualquer lote desta pasta) ──────────
const hoje = new Date().toISOString().slice(0, 10);
let enviadosHoje = 0;
const pastaLote = path.dirname(path.resolve(lotePath));
for (const arquivo of fs.readdirSync(pastaLote)) {
  if (!arquivo.endsWith('.results.jsonl')) continue;
  for (const linha of fs.readFileSync(path.join(pastaLote, arquivo), 'utf8').split('\n')) {
    if (!linha.trim()) continue;
    try {
      const r = JSON.parse(linha);
      if (r.ok && r.quando && r.quando.slice(0, 10) === hoje) enviadosHoje += 1;
    } catch (e) { /* ignora */ }
  }
}

const fila = itens.filter((i) => !jaEnviados.has(i.telefone));
const disponivel = Math.max(0, MAX_POR_DIA - enviadosHoje);
const plano = fila.slice(0, disponivel);
const cortados = fila.length - plano.length;

// ── Plano ───────────────────────────────────────────────────────────────────
console.log('');
console.log(`  Lote: ${itens.length} contato(s) | já enviados antes: ${jaEnviados.size} | hoje já foram: ${enviadosHoje}/${MAX_POR_DIA}`);
console.log(`  Vão receber agora: ${plano.length}` + (cortados > 0 ? `  (${cortados} ficam pra amanhã — cap diário)` : ''));
console.log(`  Intervalo entre envios: ${INTERVALO_MIN_S}-${INTERVALO_MAX_S}s (aleatório)`);
if (plano.length) {
  const totalMinMin = Math.round((plano.length - 1) * INTERVALO_MIN_S / 60);
  const totalMaxMin = Math.round((plano.length - 1) * INTERVALO_MAX_S / 60);
  console.log(`  Duração estimada: ${totalMinMin} a ${totalMaxMin} minutos. Não é instantâneo de propósito.`);
}
console.log('');
for (const item of plano.slice(0, 5)) {
  console.log(`  → ${item.nome} (${item.telefone}): "${item.mensagem.slice(0, 60)}${item.mensagem.length > 60 ? '…' : ''}"`);
}
if (plano.length > 5) console.log(`  … e mais ${plano.length - 5}.`);
console.log('');

if (!plano.length) {
  console.log('  Nada a enviar. Fim.');
  process.exit(0);
}
if (!enviar) {
  console.log('  DRY-RUN — nada foi enviado. Pra enviar de verdade:');
  console.log(`  node ${path.relative(process.cwd(), __filename)} ${lotePath} --enviar`);
  process.exit(0);
}

// ── Envio real ──────────────────────────────────────────────────────────────
let Client, LocalAuth, qrcode;
try {
  ({ Client, LocalAuth } = require('whatsapp-web.js'));
  qrcode = require('qrcode-terminal');
} catch (e) {
  console.error('[ERRO] Dependências não instaladas. Roda uma vez:');
  console.error('       cd ScriptsFera/wpp && npm install');
  process.exit(1);
}

const esperar = (ms) => new Promise((res) => setTimeout(res, ms));
const intervaloAleatorio = () =>
  (INTERVALO_MIN_S + Math.random() * (INTERVALO_MAX_S - INTERVALO_MIN_S)) * 1000;

const registrar = (registro) =>
  fs.appendFileSync(resultsPath, JSON.stringify(registro) + '\n', 'utf8');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.sessao') }),
  puppeteer: { headless: true, args: ['--no-sandbox'] },
});

client.on('qr', (qr) => {
  console.log('  Escaneia o QR abaixo com o SEU WhatsApp (Aparelhos conectados → Conectar aparelho):');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('  Conectado. Começando os envios...\n');
  let ok = 0;
  let falha = 0;
  for (let i = 0; i < plano.length; i += 1) {
    const item = plano[i];
    const destino = `${item.telefone}@c.us`;
    try {
      await client.sendMessage(destino, item.mensagem);
      ok += 1;
      registrar({ ok: true, id: item.id, telefone: item.telefone, quando: new Date().toISOString() });
      console.log(`  [${i + 1}/${plano.length}] ✓ ${item.nome}`);
    } catch (e) {
      falha += 1;
      registrar({ ok: false, id: item.id, telefone: item.telefone, erro: String(e.message || e), quando: new Date().toISOString() });
      console.log(`  [${i + 1}/${plano.length}] ✗ ${item.nome} — ${e.message || e}`);
    }
    if (i < plano.length - 1) {
      const pausa = intervaloAleatorio();
      console.log(`      aguardando ${Math.round(pausa / 1000)}s…`);
      await esperar(pausa);
    }
  }
  console.log(`\n  Fim: ${ok} enviado(s), ${falha} falha(s). Registro: ${resultsPath}`);
  await client.destroy();
  process.exit(falha > 0 ? 2 : 0);
});

client.on('auth_failure', (msg) => {
  console.error(`[ERRO] Falha de autenticação: ${msg}`);
  process.exit(1);
});

client.initialize();
