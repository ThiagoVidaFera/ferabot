import { test } from "node:test";
import assert from "node:assert/strict";
import {
  janelaWhatsapp,
  calcularPrioridade,
  ordenarFila,
  ehEncerramento,
  PESOS,
  type EntradaPrioridade,
} from "../../src/lib/fila-prioridade";

const H = 3_600_000;
const agora = new Date("2026-10-28T15:00:00Z");
const haHoras = (h: number) => new Date(agora.getTime() - h * H);

const base: EntradaPrioridade = {
  horasParado: 0,
  calor: 0,
  janela: { estado: "aberta", horasRestantes: 20 },
  origem: "outro",
  estagio: "novo",
  receitaCents: 0,
  valorNegocioCents: 0,
  encerramento: false,
};
const com = (p: Partial<EntradaPrioridade>): EntradaPrioridade => ({ ...base, ...p });

test("janela: ate 18h esta aberta e informa quanto resta", () => {
  const j = janelaWhatsapp(haHoras(2), agora);
  assert.equal(j.estado, "aberta");
  assert.equal(Math.round(j.horasRestantes ?? -1), 22);
});

test("janela: entre 18h e 24h esta fechando", () => {
  assert.equal(janelaWhatsapp(haHoras(18), agora).estado, "fechando");
  assert.equal(janelaWhatsapp(haHoras(23.5), agora).estado, "fechando");
});

test("janela: passou de 24h esta fechada, sem horas restantes", () => {
  const j = janelaWhatsapp(haHoras(24), agora);
  assert.equal(j.estado, "fechada");
  assert.equal(j.horasRestantes, null);
});

test("janela: mensagem do futuro (relogio torto) nao quebra, conta como recem chegada", () => {
  const j = janelaWhatsapp(new Date(agora.getTime() + H), agora);
  assert.equal(j.estado, "aberta");
  assert.equal(j.horasRestantes, 24);
});

test("tempo parado: cresce 1,25 ponto por hora e trava no teto", () => {
  assert.equal(calcularPrioridade(com({ horasParado: 0 })).partes.tempo, 0);
  assert.equal(calcularPrioridade(com({ horasParado: 8 })).partes.tempo, 10);
  assert.equal(calcularPrioridade(com({ horasParado: 500 })).partes.tempo, PESOS.tempoMax);
});

test("calor 0-100 vira ate 30 pontos", () => {
  assert.equal(calcularPrioridade(com({ calor: 100 })).partes.calor, 30);
  assert.equal(calcularPrioridade(com({ calor: 50 })).partes.calor, 15);
  assert.equal(calcularPrioridade(com({ calor: 999 })).partes.calor, 30);
  assert.equal(calcularPrioridade(com({ calor: -5 })).partes.calor, 0);
});

test("ticket: quem ja comprou vale 10, negocio de R$1000+ vale 8, menor vale 4", () => {
  assert.equal(calcularPrioridade(com({ receitaCents: 9700 })).partes.ticket, 10);
  assert.equal(calcularPrioridade(com({ valorNegocioCents: 750000 })).partes.ticket, 8);
  assert.equal(calcularPrioridade(com({ valorNegocioCents: 9700 })).partes.ticket, 4);
  assert.equal(calcularPrioridade(com({})).partes.ticket, 0);
});

test("origem: funil pago 10, anuncio 8, indicacao 8, organico 4, resto 0", () => {
  const o = (origem: string) => calcularPrioridade(com({ origem })).partes.origem;
  assert.equal(o("funil:gerador-de-mentoria"), 10);
  assert.equal(o("anuncio"), 8);
  assert.equal(o("indicacao"), 8);
  assert.equal(o("organico"), 4);
  assert.equal(o("base"), 0);
  assert.equal(o("outro"), 0);
});

test("janela: fechando 25, aberta 10, fechada 0", () => {
  const j = (estado: "aberta" | "fechando" | "fechada") =>
    calcularPrioridade(com({ janela: { estado, horasRestantes: estado === "fechada" ? null : 3 } })).partes.janela;
  assert.equal(j("fechando"), 25);
  assert.equal(j("aberta"), 10);
  assert.equal(j("fechada"), 0);
});

test("encerramento (so um 'obrigado') perde 25 pontos mas nunca fica negativo", () => {
  const p = calcularPrioridade(com({ encerramento: true }));
  assert.equal(p.partes.encerramento, -25);
  assert.equal(p.pontos, 0); // janela aberta (10) - 25 = -15, preso em 0
});

test("pontos ficam presos entre 0 e 100", () => {
  const max = calcularPrioridade(
    com({
      horasParado: 100, calor: 100, receitaCents: 1, origem: "funil:x",
      janela: { estado: "fechando", horasRestantes: 1 },
    }),
  );
  assert.equal(max.pontos, 100);
  const min = calcularPrioridade(com({ encerramento: true, janela: { estado: "fechada", horasRestantes: null } }));
  assert.equal(min.pontos, 0);
});

test("niveis: >=70 urgente, >=45 alta, resto normal", () => {
  assert.equal(calcularPrioridade(com({ horasParado: 100, calor: 100, janela: { estado: "fechando", horasRestantes: 1 } })).nivel, "urgente");
  assert.equal(calcularPrioridade(com({ horasParado: 20, calor: 60, janela: { estado: "fechando", horasRestantes: 1 } })).nivel, "alta");
  assert.equal(calcularPrioridade(com({ horasParado: 1 })).nivel, "normal");
});

test("motivos explicam em portugues o que pesou", () => {
  const p = calcularPrioridade(
    com({ horasParado: 20, calor: 80, receitaCents: 100, origem: "funil:abc", janela: { estado: "fechando", horasRestantes: 2 } }),
  );
  const t = p.motivos.join(" | ");
  assert.match(t, /janela de 24h fecha em 2h/);
  assert.match(t, /parado ha 20h/);
  assert.match(t, /ja comprou/);
  assert.match(t, /funil:abc/);
});

test("ordenarFila: maior pontuacao primeiro, nao muta a lista original", () => {
  const mk = (id: string, pontos: number, estado: "aberta" | "fechando" | "fechada", horasParado: number) => ({
    id, horasParado, janela: { estado, horasRestantes: null }, prioridade: { pontos },
  });
  const lista = [mk("a", 40, "aberta", 5), mk("b", 80, "aberta", 1), mk("c", 40, "fechando", 2), mk("d", 40, "aberta", 9)];
  const copia = [...lista];
  const r = ordenarFila(lista).map((x) => x.id);
  assert.deepEqual(r, ["b", "c", "d", "a"]); // empate em 40: janela fechando, depois mais tempo parado
  assert.deepEqual(lista, copia);
});

test("ehEncerramento: reconhece agradecimento/ok/joinha e nao pergunta", () => {
  for (const t of ["obrigado", "Obrigada!", "ok", "Blz 👍", "👍", "valeu", "perfeito, obrigado!", "show"]) {
    assert.equal(ehEncerramento(t), true, t);
  }
  for (const t of ["obrigado, mas quanto custa?", "ok e o preço?", "quero comprar", "", "não entendi", "me liga"]) {
    assert.equal(ehEncerramento(t), false, t);
  }
});
