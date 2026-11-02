'use strict';
/** Envio com trava de cap diário, silêncio, pausa humana e registro no histórico. */
const { preencher } = require('./guardas');

const aleatorio = ([min, max]) => (min + Math.random() * (max - min)) * 1000;

function variaveis(ctx, c) {
  const quando = c.reuniao_quando ? new Date(c.reuniao_quando) : null;
  return {
    nome: (c.nome || '').split(' ')[0] || 'tudo bem',
    dono: ctx.cfg.dono.nome,
    dia: quando ? quando.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : '',
    hora: quando ? quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
    preco_texto: ctx.cfg.preco_texto || '',
  };
}

const texto = (ctx, c, modelo) => preencher(modelo, variaveis(ctx, c));

function registrarFala(c, de, conteudo, agora) {
  c.historico.push({ de, texto: conteudo, quando: agora.toISOString() });
}

/**
 * tipo: 'resposta' (pausa curta), 'proativo' (lembrete, toque, material: pausa maior),
 * 'saida' (handoff ou parar: ignora o silêncio).
 */
async function enviar(ctx, c, conteudo, { tipo = 'resposta', arquivo = null } = {}) {
  const { store, cfg } = ctx;
  const agora = ctx.agora();
  if (c.silenciado && tipo !== 'saida') {
    store.log('BLOQ', `contato silenciado, nada enviado a ${c.nome}`);
    return false;
  }
  if (store.enviosHoje(agora) >= cfg.limites.max_envios_dia) {
    store.log('BLOQ', `cap diário (${cfg.limites.max_envios_dia}) atingido, ficou pra depois`);
    return false;
  }
  const faixa = tipo === 'proativo' ? cfg.limites.pausa_proativa_seg : cfg.limites.pausa_resposta_seg;
  await ctx.pausa(aleatorio(faixa));
  await ctx.enviar(c.numero, conteudo, { arquivo });
  registrarFala(c, 'agente', conteudo, ctx.agora());
  store.registrarEnvio(ctx.agora());
  store.log('ENVIO', `${tipo} para ${c.nome}`, { chars: conteudo.length });
  return true;
}

module.exports = { enviar, texto, variaveis, registrarFala };
