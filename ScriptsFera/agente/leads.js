'use strict';
/** Ponte para o CRM local (ScriptsFera/leads-api.py). */
const { spawnSync } = require('child_process');

let pythonCache = null;

function achar() {
  if (pythonCache) return pythonCache;
  for (const cmd of ['python', 'py', 'python3']) {
    const r = spawnSync(cmd, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) {
      pythonCache = cmd;
      return cmd;
    }
  }
  throw new Error('Python não encontrado. Instale o Python e rode de novo.');
}

function rodar(script, args) {
  const r = spawnSync(achar(), ['-X', 'utf8', script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1' },
  });
  if (r.status !== 0) throw new Error(`leads-api falhou: ${(r.stderr || r.stdout || '').trim()}`);
  return r.stdout;
}

function criarLeadsApi(script) {
  return {
    add(nome, telefone, origem, nota) {
      const saida = rodar(script, ['add', nome, '--tel', telefone, '--origem', origem, '--nota', nota]);
      const m = /(l\d{4,})/.exec(saida);
      if (!m) throw new Error(`Não consegui ler o id do lead: ${saida}`);
      return m[1];
    },
    status(id, novo) {
      rodar(script, ['status', id, novo]);
    },
  };
}

module.exports = { criarLeadsApi };
