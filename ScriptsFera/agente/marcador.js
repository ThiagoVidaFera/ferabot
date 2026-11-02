'use strict';
/** Marcador gerado pela página do funil: [AGENDAMENTO] AAAA-MM-DD HH:MM | nome | @instagram | fone */
const RE = /^\s*\[AGENDAMENTO\]\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s*\|([^|]*)\|([^|]*)\|?(.*)$/s;

function normalizarInstagram(bruto) {
  const limpo = String(bruto || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '');
  const handle = limpo.replace(/^@/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `@${handle}` : '';
}

function parseMarcador(texto) {
  const m = RE.exec(String(texto || ''));
  if (!m) return null;
  const [, data, hora, nome, ig, fone] = m;
  const horaFmt = hora.padStart(5, '0');
  const quando = new Date(`${data}T${horaFmt}:00`);
  return {
    data,
    hora: horaFmt,
    quando: Number.isNaN(quando.getTime()) ? null : quando,
    nome: nome.trim().replace(/\s+/g, ' ').slice(0, 80),
    instagram: normalizarInstagram(ig),
    fone: fone.split(/\r?\n/)[0].replace(/\D/g, ''),
  };
}

module.exports = { parseMarcador, normalizarInstagram };
