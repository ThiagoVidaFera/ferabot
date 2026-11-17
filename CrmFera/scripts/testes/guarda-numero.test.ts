import { test } from "node:test";
import assert from "node:assert/strict";
import {
  capFrioDoDia,
  decidirEnvio,
  ehSoEmoji,
  type EntradaGuarda,
} from "../../src/lib/guarda-numero";

// Terça 10/11/2026 11h de Brasília = 14h UTC
const TERCA_11H = new Date("2026-11-10T14:00:00Z");
const DOMINGO_11H = new Date("2026-11-15T14:00:00Z");
const TERCA_20H = new Date("2026-11-10T23:00:00Z");
const HORA = 3_600_000;
const MIN = 60_000;

function base(sobre: Partial<EntradaGuarda> = {}): EntradaGuarda {
  return {
    agora: TERCA_11H,
    sessaoOk: true,
    retornoEm: null,
    perfil: "prioritario",
    destinoJaEscreveu: false,
    texto: "Oi, Ana! Paula aqui, sócio do @negocio.",
    frioHoje: 0,
    totalHoje: 0,
    ultimoFrioEm: null,
    proximoFrioApos: null,
    capFrioConfigurado: null,
    ...sobre,
  };
}

test("sessão fora do ar bloqueia tudo, inclusive resposta a quem escreveu", () => {
  assert.equal(decidirEnvio(base({ sessaoOk: false })).liberado, false);
  const r = decidirEnvio(base({ sessaoOk: false, destinoJaEscreveu: true, perfil: "resposta" }));
  assert.equal(r.liberado, false);
  assert.equal(r.motivo, "sessao_fora");
});

test("primeiras 24h depois que o número volta: só conversa com quem escreveu", () => {
  const retorno = new Date(TERCA_11H.getTime() - 5 * HORA);
  const frio = decidirEnvio(base({ retornoEm: retorno }));
  assert.equal(frio.liberado, false);
  assert.equal(frio.motivo, "quarentena_pos_retorno");
  const quente = decidirEnvio(base({ retornoEm: retorno, destinoJaEscreveu: true, perfil: "resposta" }));
  assert.equal(quente.liberado, true);
});

test("rampa: dia 1 depois do retorno 10, e sobe até o teto normal de 60", () => {
  const dias = [1, 2, 3, 4, 5, 6, 9].map((d) =>
    capFrioDoDia(TERCA_11H, new Date(TERCA_11H.getTime() - (d * 24 + 1) * HORA), null),
  );
  assert.deepEqual(dias, [10, 20, 30, 40, 50, 60, 60]);
  assert.equal(capFrioDoDia(TERCA_11H, null, null), 60);
});

test("cap configurado à mão vence a rampa, mas nunca passa de 60", () => {
  assert.equal(capFrioDoDia(TERCA_11H, null, 12), 12);
  assert.equal(capFrioDoDia(TERCA_11H, null, 500), 60);
});

test("cap a frio é compartilhado: atingido, ninguém mais sai a frio", () => {
  const r = decidirEnvio(base({ frioHoje: 60 }));
  assert.equal(r.liberado, false);
  assert.equal(r.motivo, "cap_frio_dia");
});

test("rotina só usa 60% do cap; o prioritário usa o cap inteiro", () => {
  assert.equal(decidirEnvio(base({ perfil: "rotina", frioHoje: 36 })).liberado, false);
  assert.equal(decidirEnvio(base({ perfil: "rotina", frioHoje: 35 })).liberado, true);
  assert.equal(decidirEnvio(base({ perfil: "prioritario", frioHoje: 59 })).liberado, true);
});

test("espaçamento: 5 minutos desde o último envio a frio e respeita o sorteio já feito", () => {
  const agora = TERCA_11H;
  assert.equal(decidirEnvio(base({ ultimoFrioEm: new Date(agora.getTime() - 4 * MIN) })).motivo, "espacamento");
  assert.equal(decidirEnvio(base({ ultimoFrioEm: new Date(agora.getTime() - 6 * MIN) })).liberado, true);
  const sorteado = decidirEnvio(
    base({ ultimoFrioEm: new Date(agora.getTime() - 6 * MIN), proximoFrioApos: new Date(agora.getTime() + 2 * MIN) }),
  );
  assert.equal(sorteado.liberado, false);
  assert.equal(sorteado.motivo, "espacamento");
});

test("janela de envio a frio: 9h às 18h de Brasília, nunca domingo", () => {
  assert.equal(decidirEnvio(base({ agora: TERCA_20H })).motivo, "fora_da_janela");
  assert.equal(decidirEnvio(base({ agora: DOMINGO_11H })).motivo, "fora_da_janela");
  assert.equal(decidirEnvio(base({ agora: new Date("2026-11-10T11:59:00Z") })).motivo, "fora_da_janela"); // 8h59
});

test("mensagem de só emoji nunca sai a frio, mas pode sair em conversa", () => {
  assert.equal(decidirEnvio(base({ texto: "👀" })).motivo, "so_emoji_a_frio");
  assert.equal(decidirEnvio(base({ texto: "❓" })).liberado, false);
  assert.equal(decidirEnvio(base({ texto: "👀", destinoJaEscreveu: true, perfil: "resposta" })).liberado, true);
  assert.equal(ehSoEmoji("🆙"), true);
  assert.equal(ehSoEmoji("ok"), true);
  assert.equal(ehSoEmoji("Oi, Ana!"), false);
});

test("quem escreveu pro número é conversa: sem cap a frio, sem espaçamento, sem janela", () => {
  const r = decidirEnvio(
    base({
      agora: TERCA_20H,
      destinoJaEscreveu: true,
      perfil: "resposta",
      frioHoje: 99,
      ultimoFrioEm: new Date(TERCA_20H.getTime() - MIN),
    }),
  );
  assert.equal(r.liberado, true);
});

test("teto duro de 150 saídas por dia vale até para conversa", () => {
  const r = decidirEnvio(base({ destinoJaEscreveu: true, perfil: "resposta", totalHoje: 150 }));
  assert.equal(r.liberado, false);
  assert.equal(r.motivo, "teto_total_dia");
});

test("agente (perfil resposta) para quem não escreveu há dias é a frio: respeita quarentena e janela", () => {
  const retorno = new Date(TERCA_11H.getTime() - 5 * HORA);
  const r = decidirEnvio(base({ perfil: "resposta", destinoJaEscreveu: false, retornoEm: retorno }));
  assert.equal(r.liberado, false);
  assert.equal(r.motivo, "quarentena_pos_retorno");
  assert.equal(decidirEnvio(base({ perfil: "resposta", destinoJaEscreveu: false, agora: DOMINGO_11H })).motivo, "fora_da_janela");
});
