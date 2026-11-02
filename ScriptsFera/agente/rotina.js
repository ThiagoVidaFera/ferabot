'use strict';
/** Rotina periódica: lembretes, toques de quem não respondeu, avisos de no-show e de pós-reunião. */
const { HORA, MIN, TOLERANCIA, dentroDaJanela } = require('./janela');
const { enviar, texto } = require('./envio');
const { enviarMateriais } = require('./conversa');

const TEXTO_LEMBRETE = { '24h': 'lembrete_24h', '1h': 'lembrete_1h', '10min': 'lembrete_10min' };
const FOLGA_POS_REUNIAO = 30 * MIN;
const ANTECEDENCIA_AVISO_NOSHOW = 2 * HORA;
const ESPERA_APOS_TOQUE_FINAL = 6 * HORA;
const MAX_ENVIOS_POR_TICK = 3;

const ativa = (r) => r.status === 'agendada' || r.status === 'confirmada';

async function processarLembretes(ctx, r, c, agora, orcamento) {
  for (const l of r.lembretes.filter((x) => x.status === 'pendente')) {
    const due = new Date(l.due);
    if (due > agora || orcamento.n <= 0) continue;
    if (agora - due > TOLERANCIA[l.tipo] || agora >= new Date(r.quando)) {
      l.status = 'perdido';
      ctx.store.log('LEMBRETE', `${l.tipo} de ${c.nome} perdido (atraso grande, computador desligado?)`);
      continue;
    }
    const ok = await enviar(ctx, c, texto(ctx, c, ctx.cfg.textos[TEXTO_LEMBRETE[l.tipo]]), { tipo: 'proativo' });
    if (!ok) continue;
    l.status = 'enviado';
    orcamento.n -= 1;
    if (l.tipo === '24h') await enviarMateriais(ctx, c, 'no_lembrete_24h');
  }
}

async function processarToques(ctx, r, c, agora, orcamento) {
  for (const t of r.toques.filter((x) => x.status === 'pendente')) {
    if (new Date(t.due) > agora || orcamento.n <= 0) continue;
    if (!dentroDaJanela(agora, ctx.cfg.janela)) continue;
    const ok = await enviar(ctx, c, texto(ctx, c, ctx.cfg.textos[`toque${t.n}`]), { tipo: 'proativo' });
    if (!ok) continue;
    t.status = 'enviado';
    t.enviado_em = agora.toISOString();
    orcamento.n -= 1;
  }
}

function momentoAvisoNoShow(r) {
  const quando = new Date(r.quando).getTime();
  const ultimo = r.toques.filter((t) => t.enviado_em).map((t) => new Date(t.enviado_em).getTime());
  const todosFeitos = r.toques.every((t) => t.status !== 'pendente');
  const porToque = todosFeitos && ultimo.length ? Math.max(...ultimo) + ESPERA_APOS_TOQUE_FINAL : Infinity;
  return Math.min(quando - ANTECEDENCIA_AVISO_NOSHOW, porToque);
}

function avisarSeNecessario(ctx, r, c, agora) {
  const { store } = ctx;
  const passou = agora.getTime() >= new Date(r.quando).getTime() + FOLGA_POS_REUNIAO;
  if (c.estagio !== 'confirmada' && !r.avisou_noshow && agora.getTime() >= momentoAvisoNoShow(r)) {
    r.avisou_noshow = true;
    store.aviso(agora, 'risco-no-show', c, `${c.nome} não respondeu nem deu o perfil. Reunião ${new Date(r.quando).toLocaleString('pt-BR')}. Decida se mantém.`);
  }
  if (!passou || r.avisou_pos) return;
  r.avisou_pos = true;
  if (c.estagio === 'confirmada') {
    store.aviso(agora, 'pos-reuniao', c, `A reunião com ${c.nome} já passou. Quando acontecer, diga "reunião do ${c.nome} foi" pra montar a proposta.`);
    r.status = 'aguardando-pos';
  } else {
    r.status = 'no-show';
    store.aviso(agora, 'no-show', c, `${c.nome} não confirmou e a hora da reunião passou. Tratar como no-show.`);
  }
}

async function tick(ctx) {
  const { store } = ctx;
  const agora = ctx.agora();
  const orcamento = { n: MAX_ENVIOS_POR_TICK };
  for (const r of store.agenda.reunioes.filter(ativa)) {
    const c = store.contato(r.numero);
    if (!c) continue;
    if (c.silenciado || c.estagio === 'handoff' || c.estagio === 'encerrado') continue;
    if (c.estagio === 'confirmada') await processarLembretes(ctx, r, c, agora, orcamento);
    else await processarToques(ctx, r, c, agora, orcamento);
    avisarSeNecessario(ctx, r, c, agora);
  }
  store.salvar();
}

module.exports = { tick };
