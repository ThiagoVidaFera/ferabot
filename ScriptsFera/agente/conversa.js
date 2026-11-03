'use strict';
/** Fluxo de conversa: entrada pelo funil, qualificação, confirmação e passagem para humano. */
const { parseMarcador, normalizarInstagram } = require('./marcador');
const { calcularLembretes, calcularToques } = require('./janela');
const { detectarIntencao, validarSaida } = require('./guardas');
const { enviar, texto, registrarFala } = require('./envio');
const { montarSistema, montarContexto, perguntasPendentes } = require('./prompt');

const MAX_CHARS_MSG = 600;
const MIN_PEDIDO = 'Responda só com o JSON do formato combinado, sem comentários.';

function proximaPergunta(ctx, c) {
  return perguntasPendentes(ctx.cfg, c)[0] || null;
}

async function enviarMateriais(ctx, c, quando) {
  for (const m of ctx.cfg.materiais.filter((x) => x.quando === quando)) {
    if (c.materiais_enviados.includes(m.id)) continue;
    const corpo = [texto(ctx, c, m.texto), m.url].filter(Boolean).join('\n\n');
    const ok = await enviar(ctx, c, corpo, { tipo: 'proativo', arquivo: m.arquivo || null });
    if (ok) c.materiais_enviados.push(m.id);
  }
}

async function passarParaHumano(ctx, c, motivo, { silenciarLead = false } = {}) {
  if (c.estagio === 'handoff') return;
  c.estagio = 'handoff';
  c.motivo_handoff = motivo;
  ctx.store.aviso(ctx.agora(), 'handoff', c, `${motivo}. Assume a conversa com ${c.nome}.`);
  if (!silenciarLead) await enviar(ctx, c, texto(ctx, c, ctx.cfg.textos.handoff), { tipo: 'saida' });
  c.silenciado = true;
  ctx.store.salvar();
}

async function encerrarPedido(ctx, c) {
  c.estagio = 'encerrado';
  ctx.store.aviso(ctx.agora(), 'parar', c, `${c.nome} pediu pra não receber mais mensagens.`);
  await enviar(ctx, c, texto(ctx, c, ctx.cfg.textos.parar), { tipo: 'saida' });
  c.silenciado = true;
  cancelarAgenda(ctx, c, 'cancelada');
  ctx.store.salvar();
}

function cancelarAgenda(ctx, c, status) {
  const r = ctx.store.agenda.reunioes.find((x) => x.id === c.reuniao_id);
  if (r) r.status = status;
}

async function entradaFunil(ctx, m, marc) {
  const { store, cfg } = ctx;
  const agora = ctx.agora();
  if (!marc.quando || marc.quando <= agora) {
    store.log('MARCADOR', 'data inválida ou no passado, ignorado', { numero: m.numero });
    store.aviso(agora, 'marcador-invalido', null, `Marcador com data inválida vindo de ${m.numero}.`);
    return { acao: 'marcador-invalido' };
  }
  const existente = store.contato(m.numero);
  if (existente && existente.reuniao_quando === marc.quando.toISOString()) return { acao: 'marcador-duplicado' };
  if (!existente && store.leadsNovosHoje(agora) >= cfg.limites.max_leads_novos_dia) {
    store.log('BLOQ', 'teto de leads novos por dia atingido');
    return { acao: 'teto-leads-dia' };
  }
  const nome = marc.nome || 'Sem nome';
  const c = existente || {
    numero: m.numero, nome, lead_id: null, estagio: 'novo', silenciado: false, historico: [],
    dados: {}, materiais_enviados: [], criado: agora.toISOString(),
  };
  if (!c.lead_id) {
    const nota = `Instagram: ${marc.instagram || 'não informado'}. Reunião ${marc.data} ${marc.hora}.`;
    c.lead_id = ctx.leads.add(nome, m.numero, cfg.origem_lead, nota);
    store.registrarLeadNovo(agora);
  }
  if (marc.instagram) c.dados.instagram = marc.instagram;
  c.reuniao_quando = marc.quando.toISOString();
  c.reuniao_id = `r${store.agenda.reunioes.length + 1}`;
  c.respondeu = false;
  c.estagio = 'qualificando';
  c.silenciado = false;
  store.estado.contatos[m.numero] = c;
  store.agenda.reunioes.push({
    id: c.reuniao_id, numero: m.numero, lead_id: c.lead_id, nome, quando: c.reuniao_quando, status: 'agendada',
    lembretes: calcularLembretes(marc.quando, cfg.janela, agora),
    toques: calcularToques(marc.quando, cfg.janela, agora, cfg.limites),
  });
  registrarFala(c, 'lead', m.texto, agora);
  store.log('FUNIL', `lead ${c.lead_id} e reunião ${c.reuniao_id} criados`, { quando: c.reuniao_quando });
  await abrirConversa(ctx, c);
  store.salvar();
  return { acao: 'lead-criado', lead_id: c.lead_id };
}

async function abrirConversa(ctx, c) {
  const { cfg } = ctx;
  await enviar(ctx, c, texto(ctx, c, cfg.apresentacao));
  const p = proximaPergunta(ctx, c);
  const partes = [texto(ctx, c, cfg.confirmacao_horario)];
  if (p) partes.push(p.pergunta);
  await enviar(ctx, c, partes.join(' '));
}

function mesclarDados(c, novos) {
  for (const [id, valor] of Object.entries(novos || {})) {
    if (typeof valor !== 'string' || !valor.trim()) continue;
    if (id === 'instagram') {
      const ig = normalizarInstagram(valor.trim().split(/\s+/)[0]);
      if (ig) c.dados.instagram = ig;
    } else if (!c.dados[id]) {
      c.dados[id] = valor.trim().slice(0, 300);
    }
  }
}

/** Pega @ digitado direto pelo lead, sem depender da IA. */
function capturarInstagram(c, conteudo) {
  if (c.dados.instagram) return;
  const m = /@[A-Za-z0-9._]{2,30}/.exec(conteudo);
  if (m) c.dados.instagram = normalizarInstagram(m[0]);
}

async function confirmarSeProvou(ctx, c) {
  if (c.estagio === 'confirmada' || !c.respondeu || !c.dados.instagram) return;
  c.estagio = 'confirmada';
  const r = ctx.store.agenda.reunioes.find((x) => x.id === c.reuniao_id);
  if (r) r.status = 'confirmada';
  ctx.store.log('CONFIRMA', `${c.nome} respondeu e deu o perfil ${c.dados.instagram}`);
  await enviar(ctx, c, texto(ctx, c, ctx.cfg.textos.confirmacao));
}

async function turnoIA(ctx, c) {
  const { store, cfg } = ctx;
  const contexto = montarContexto(cfg, c);
  let saida;
  try {
    saida = await ctx.gemini({
      sistema: montarSistema(cfg),
      contexto,
      conteudo: `${JSON.stringify(contexto)}\n\n${MIN_PEDIDO}`,
    });
  } catch (e) {
    store.log('ERRO', `IA falhou: ${e.message}`);
    store.aviso(ctx.agora(), 'erro-ia', c, `A IA não respondeu (${e.message.slice(0, 120)}). ${c.nome} ficou sem resposta.`);
    return;
  }
  const mensagens = (Array.isArray(saida.mensagens) ? saida.mensagens : [])
    .map((x) => String(x).slice(0, MAX_CHARS_MSG))
    .slice(0, cfg.limites.max_mensagens_por_turno);
  const bloqueio = mensagens.map((x) => validarSaida(x.replace(/^\[STUB SEM GEMINI\] /, ''), cfg)).find(Boolean);
  if (bloqueio) {
    store.log('BLOQ', `saída da IA barrada: ${bloqueio}`);
    await passarParaHumano(ctx, c, `Resposta da IA barrada (${bloqueio})`);
    return;
  }
  mesclarDados(c, saida.dados);
  if (saida.handoff) {
    await passarParaHumano(ctx, c, saida.motivo || 'IA pediu passagem para humano');
    return;
  }
  for (const msg of mensagens) await enviar(ctx, c, msg);
}

async function aposResposta(ctx, c) {
  const primeira = !c.respondeu;
  c.respondeu = true;
  if (primeira && c.lead_id) ctx.leads.status(c.lead_id, 'conversando');
  await confirmarSeProvou(ctx, c);
  if (primeira) await enviarMateriais(ctx, c, 'apos_primeira_resposta');
  if (!proximaPergunta(ctx, c) && c.estagio !== 'qualificado' && !c.qualificado) {
    c.qualificado = true;
    await enviar(ctx, c, texto(ctx, c, ctx.cfg.textos.qualificado));
    await enviarMateriais(ctx, c, 'apos_qualificacao');
  }
}

async function tratarIntencao(ctx, c, intencao) {
  if (intencao.tipo === 'parar') return encerrarPedido(ctx, c);
  if (intencao.tipo === 'preco' && ctx.cfg.preco_liberado && ctx.cfg.preco_texto) {
    await enviar(ctx, c, texto(ctx, c, ctx.cfg.textos.preco_liberado));
    return null;
  }
  return passarParaHumano(ctx, c, intencao.motivo);
}

const NOME_DA_MIDIA = { ptt: 'áudio', audio: 'áudio', image: 'foto', video: 'vídeo', document: 'documento', sticker: 'figurinha' };

async function processarMensagem(ctx, m) {
  const { store } = ctx;
  if (m.grupo) {
    store.log('IGNORA', 'mensagem de grupo');
    return { acao: 'ignorado-grupo' };
  }
  const marc = parseMarcador(m.texto);
  if (marc) return entradaFunil(ctx, m, marc);
  const c = store.contato(m.numero);
  if (!c) {
    store.log('IGNORA', `número fora da lista branca: ${m.numero.slice(0, 4)}...`);
    return { acao: 'ignorado-fora-da-lista' };
  }
  const midia = m.midia ? NOME_DA_MIDIA[m.midia] || 'arquivo' : null;
  registrarFala(c, 'lead', midia ? `[${midia}]` : m.texto, ctx.agora());
  if (c.silenciado || c.estagio === 'handoff' || c.estagio === 'encerrado') {
    store.salvar();
    return { acao: 'calado' };
  }
  // Áudio, foto, vídeo, documento e figurinha nunca recebem resposta do agente: só avisa o dono e fica calado.
  if (midia) {
    await passarParaHumano(ctx, c, `Mandou ${midia}`, { silenciarLead: true });
    return { acao: 'handoff-midia' };
  }
  capturarInstagram(c, m.texto);
  const intencao = detectarIntencao(m.texto, ctx.cfg);
  if (intencao) {
    const seguiu = await tratarIntencao(ctx, c, intencao);
    store.salvar();
    if (seguiu !== null) return { acao: `saida-${intencao.tipo}` };
  } else {
    await turnoIA(ctx, c);
  }
  if (c.estagio !== 'handoff') await aposResposta(ctx, c);
  store.salvar();
  return { acao: c.estagio === 'handoff' ? 'handoff' : 'respondido' };
}

/** O dono digitou no chat: o agente se cala naquele contato. */
function silenciarPeloDono(ctx, numero) {
  const c = ctx.store.contato(numero);
  if (!c || c.silenciado) return false;
  c.silenciado = true;
  c.estagio = 'handoff';
  c.motivo_handoff = 'dono assumiu digitando';
  ctx.store.log('DONO', `dono digitou, agente calado com ${c.nome}`);
  ctx.store.salvar();
  return true;
}

module.exports = { processarMensagem, silenciarPeloDono, enviarMateriais, passarParaHumano };
