'use strict';
/** Janela de envio (dias e horas) e cálculo da agenda de lembretes. Funções puras. */
const MIN = 60 * 1000;
const HORA = 60 * MIN;

// Quanto atraso ainda é aceitável antes de o lembrete perder o sentido.
const TOLERANCIA = { '24h': 3 * HORA, '1h': 20 * MIN, '10min': 5 * MIN };
const ANTECEDENCIA = { '24h': 24 * HORA, '1h': HORA, '10min': 10 * MIN };

function minutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function dentroDaJanela(data, janela) {
  if (!janela.dias.includes(data.getDay())) return false;
  const atual = data.getHours() * 60 + data.getMinutes();
  return atual >= minutos(janela.inicio) && atual < minutos(janela.fim);
}

/** Primeiro instante dentro da janela, igual ou depois de `data`. */
function proximaJanela(data, janela) {
  let cand = new Date(data);
  for (let i = 0; i < 9; i += 1) {
    if (janela.dias.includes(cand.getDay())) {
      const inicio = new Date(cand);
      inicio.setHours(0, minutos(janela.inicio), 0, 0);
      const fim = new Date(cand);
      fim.setHours(0, minutos(janela.fim), 0, 0);
      if (cand < inicio) return inicio;
      if (cand < fim) return cand;
    }
    cand = new Date(cand);
    cand.setDate(cand.getDate() + 1);
    cand.setHours(0, 0, 0, 0);
  }
  return null;
}

/** Lembretes -24h, -1h, -10min. Só o de 24h respeita a janela (os outros ficam colados no horário marcado). */
function calcularLembretes(reuniao, janela, agora) {
  return Object.keys(ANTECEDENCIA).map((tipo) => {
    let due = new Date(reuniao.getTime() - ANTECEDENCIA[tipo]);
    if (tipo === '24h' && !dentroDaJanela(due, janela)) due = proximaJanela(due, janela) || due;
    const limite = new Date(reuniao.getTime() - 2 * HORA);
    const inutil = due.getTime() + TOLERANCIA[tipo] < agora.getTime() || (tipo === '24h' && due > limite);
    return { tipo, due: due.toISOString(), status: inutil ? 'pulado' : 'pendente' };
  });
}

/** Toques para quem não respondeu: máximo configurado, sempre dentro da janela e antes da reunião. */
function calcularToques(reuniao, janela, agora, limites) {
  const toques = [];
  let base = new Date(agora.getTime() + limites.horas_ate_toque1 * HORA);
  for (let n = 1; n <= limites.max_toques_noshow; n += 1) {
    const due = proximaJanela(base, janela);
    const cabe = due && due.getTime() < reuniao.getTime() - HORA;
    toques.push({ n, due: due ? due.toISOString() : null, status: cabe ? 'pendente' : 'pulado' });
    base = new Date((due || base).getTime() + limites.horas_entre_toques * HORA);
  }
  return toques;
}

module.exports = { HORA, MIN, TOLERANCIA, dentroDaJanela, proximaJanela, calcularLembretes, calcularToques };
