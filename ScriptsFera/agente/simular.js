#!/usr/bin/env node
/**
 * Simulação do agente SEM WhatsApp real.
 *
 *   node ScriptsFera/agente/simular.js [--manter]
 *
 * Usa uma pasta temporária (leads.json e dados próprios, não toca nos seus), relógio simulado e mensagens
 * fictícias. Com GEMINI_API_KEY no ambiente chama o Gemini de verdade. Sem a chave usa resposta STUB marcada.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { RAIZ, AQUI, carregarEnv, carregarConfig } = require('./config');
const { criarContexto } = require('./contexto');
const { processarMensagem, silenciarPeloDono } = require('./conversa');
const { tick } = require('./rotina');

carregarEnv();
const manter = process.argv.includes('--manter');
const falhas = [];
const verificar = (ok, descricao) => {
  console.log(`  ${ok ? 'OK   ' : 'FALHA'} ${descricao}`);
  if (!ok) falhas.push(descricao);
};

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'ferabot-agente-sim-'));
fs.mkdirSync(path.join(sandbox, 'ScriptsFera'), { recursive: true });
fs.copyFileSync(path.join(RAIZ, 'ScriptsFera', 'leads-api.py'), path.join(sandbox, 'ScriptsFera', 'leads-api.py'));
const dirDados = path.join(sandbox, 'dados');

let relogio = new Date(2026, 10, 4, 10, 0, 0); // quarta-feira, 10:00
const avancarPara = (d, h, mi) => { relogio = new Date(2026, 10, d, h, mi, 0); };

const transcricao = [];
const enviar = async (numero, conteudo, { arquivo } = {}) => {
  transcricao.push({ numero, conteudo, arquivo });
  console.log(`      AGENTE -> ${numero.slice(0, 4)}...: ${conteudo.replace(/\n/g, ' | ')}${arquivo ? ` [arquivo ${arquivo}]` : ''}`);
};

const cfg = carregarConfig();
cfg.preco_liberado = false;
const ctx = criarContexto({
  cfg, dirDados, leadsScript: path.join(sandbox, 'ScriptsFera', 'leads-api.py'),
  enviar, exigirChave: false, agora: () => relogio, pausa: async () => {}, silencioso: true,
});

const NUM = { ana: '5500000000001', bia: '5500000000002', caio: '5500000000003', intruso: '5500000000009' };
const enviadosPara = (n) => transcricao.filter((t) => t.numero === n);
const fala = async (numero, texto, grupo = false) => {
  console.log(`  [${relogio.toTimeString().slice(0, 5)}] LEAD ${numero.slice(0, 4)}...: ${texto}`);
  return processarMensagem(ctx, { numero, texto, grupo });
};
const rodarTick = (rotulo) => { console.log(`  --- tick ${rotulo} (${relogio.toLocaleString('pt-BR')})`); return tick(ctx); };

async function cenarioAna() {
  console.log('\n== Cenário 1: lead completo, confirma e recebe os 3 lembretes');
  const r = await fala(NUM.ana, '[AGENDAMENTO] 2026-11-05 14:00 | Ana Exemplo | @ana.exemplo | 5500000000001');
  verificar(r.acao === 'lead-criado', 'marcador cria lead e reunião');
  verificar(enviadosPara(NUM.ana).length === 2, 'abertura enviada (apresentação + pergunta)');
  verificar(/inteligência artificial/.test(enviadosPara(NUM.ana)[0].conteudo), 'agente se apresenta como IA');
  await fala(NUM.ana, 'Vendo consultoria de nutrição esportiva online');
  verificar(ctx.store.contato(NUM.ana).estagio === 'confirmada', 'respondeu com perfil conhecido: reunião confirmada');
  verificar(ctx.store.contato(NUM.ana).materiais_enviados.includes('guia'), 'material da primeira resposta enviado');
  await fala(NUM.ana, 'Vendo para mulheres de 30 a 45 anos que treinam em casa');
  await fala(NUM.ana, 'Já tentei postar todo dia e anúncio, mas ninguém compra o plano');
  await fala(NUM.ana, 'Quero fechar 10 clientes novos por mês pela internet');
  verificar(ctx.store.contato(NUM.ana).qualificado === true, 'qualificação completa');
  verificar(ctx.store.contato(NUM.ana).materiais_enviados.includes('video'), 'material pós-qualificação enviado');
  const lemb = ctx.store.agenda.reunioes[0].lembretes.map((l) => `${l.tipo}@${l.due.slice(5, 16)}:${l.status}`);
  console.log(`      agenda de lembretes: ${lemb.join('  ')}`);
  avancarPara(4, 14, 5);
  await rodarTick('lembrete -24h');
  avancarPara(5, 13, 2);
  await rodarTick('lembrete -1h');
  avancarPara(5, 13, 52);
  await rodarTick('lembrete -10min');
  const estados = ctx.store.agenda.reunioes[0].lembretes.map((l) => l.status);
  verificar(estados.every((s) => s === 'enviado'), `3 lembretes enviados (${estados.join(',')})`);
  verificar(ctx.store.contato(NUM.ana).materiais_enviados.includes('checklist'), 'material do lembrete de 24h enviado');
}

async function cenarioBia() {
  console.log('\n== Cenário 2: sem @ no marcador, pergunta preço, passa para humano');
  avancarPara(4, 10, 30);
  await fala(NUM.bia, '[AGENDAMENTO] 2026-11-06 10:00 | Bia Teste | | 5500000000002');
  verificar(/Instagram/.test(enviadosPara(NUM.bia)[1].conteudo), 'sem @, o agente pede o Instagram');
  await fala(NUM.bia, 'Quanto custa a mentoria?');
  const c = ctx.store.contato(NUM.bia);
  verificar(c.estagio === 'handoff' && c.silenciado, 'pergunta de preço aciona handoff e silêncio');
  const antes = enviadosPara(NUM.bia).length;
  await fala(NUM.bia, 'Alô?');
  verificar(enviadosPara(NUM.bia).length === antes, 'depois do handoff o agente não responde mais');
  verificar(ctx.store.avisos.avisos.some((a) => a.tipo === 'handoff'), 'aviso ao dono registrado');
}

async function cenarioCaio() {
  console.log('\n== Cenário 3: nunca responde, 2 toques e aviso de no-show');
  avancarPara(4, 10, 40);
  await fala(NUM.caio, '[AGENDAMENTO] 2026-11-06 16:00 | Caio Silêncio | @caio.silencio | 5500000000003');
  avancarPara(4, 13, 45);
  await rodarTick('toque 1');
  avancarPara(5, 10, 0);
  await rodarTick('toque 2');
  avancarPara(5, 12, 0);
  await rodarTick('mais tarde (não pode haver toque 3)');
  avancarPara(6, 14, 5);
  await rodarTick('2h antes da reunião');
  verificar(enviadosPara(NUM.caio).filter((t) => /Passando|última/.test(t.conteudo)).length === 2, 'exatamente 2 toques, nunca mais');
  verificar(ctx.store.avisos.avisos.some((a) => a.tipo === 'risco-no-show'), 'dono avisado do risco de no-show');
}

async function cenarioGuardas() {
  console.log('\n== Cenário 4: guardas');
  const antes = transcricao.length;
  const g = await fala(NUM.ana, 'oi pessoal', true);
  const i = await fala(NUM.intruso, 'oi, tudo bem?');
  verificar(g.acao === 'ignorado-grupo' && i.acao === 'ignorado-fora-da-lista', 'grupo e número fora da lista são ignorados');
  verificar(transcricao.length === antes, 'nenhuma mensagem enviada nesses casos');
  silenciarPeloDono(ctx, NUM.ana);
  const a = await fala(NUM.ana, 'obrigada!');
  verificar(a.acao === 'calado', 'dono digitou no chat: agente se cala naquele contato');
}

function posReuniao() {
  console.log('\n== Cenário 5: pós-reunião gera lead.json (sem chamar o gerador)');
  const saida = path.join(sandbox, 'proposta-ana');
  const r = spawnSync('node', [path.join(AQUI, 'pos-reuniao.js'), '--lead', 'Ana', '--dor', 'Ninguém compra o plano, segundo a própria Ana', '--out', saida], {
    encoding: 'utf8', env: { ...process.env, FERABOT_AGENTE_DADOS: dirDados },
  });
  console.log(r.stdout.trim());
  verificar(r.status === 0, 'pos-reuniao.js termina sem erro');
  const lead = JSON.parse(fs.readFileSync(path.join(saida, 'lead.json'), 'utf8'));
  console.log(`      lead.json: ${JSON.stringify(lead).slice(0, 420)}`);
  verificar(lead.falas.length > 0 && lead.instagram === '@ana.exemplo' && !!lead.objetivo, 'lead.json com falas literais, instagram e objetivo');
}

async function main() {
  console.log(`\n  Simulação do agente | IA: ${ctx.usaStub ? 'STUB (sem GEMINI_API_KEY, respostas marcadas)' : `Gemini ${cfg.modelo}`}`);
  console.log(`  Pasta temporária: ${sandbox}`);
  await cenarioAna();
  await cenarioBia();
  await cenarioCaio();
  await cenarioGuardas();
  posReuniao();
  const leads = spawnSync('python', ['-X', 'utf8', path.join(sandbox, 'ScriptsFera', 'leads-api.py'), 'list'], { encoding: 'utf8' });
  console.log(`\n  CRM da simulação:\n${leads.stdout}`);
  verificar(/Ana Exemplo/.test(leads.stdout) && /Bia Teste/.test(leads.stdout), 'leads criados no CRM via leads-api.py');
  console.log(falhas.length ? `\n  ${falhas.length} verificação(ões) falharam.` : '\n  Todas as verificações passaram.');
  if (!manter) fs.rmSync(sandbox, { recursive: true, force: true });
  process.exit(falhas.length ? 1 : 0);
}

main().catch((e) => {
  console.error(`[ERRO] ${e.stack}`);
  process.exit(1);
});
