import { test } from "node:test";
import assert from "node:assert/strict";
import {
  elegivelPrimeiroContato,
  mensagemPrimeiroContato,
  type ContatoPrimeiroContato,
} from "../../src/lib/primeiro-contato";

const agora = new Date("2026-11-08T14:00:00Z");
const desde = new Date("2026-11-08T00:00:00Z");
const base: ContatoPrimeiroContato = {
  origem: "funil:plano-faturamento-exemplo",
  lifecycleStage: "novo",
  phone: "5548900003596",
  tags: [],
  customFields: {},
  createdAt: new Date("2026-11-08T12:29:00Z"),
  mensagens: 0,
};

test("lead do funil, 1h+ sem nenhuma mensagem: elegível", () => {
  assert.deepEqual(elegivelPrimeiroContato(base, agora, desde), { ok: true });
});

test("recusa: estágio fora, telefone inválido, humano/opt-out, já recebeu", () => {
  assert.equal(elegivelPrimeiroContato({ ...base, lifecycleStage: "cliente" }, agora, desde).ok, false);
  assert.equal(elegivelPrimeiroContato({ ...base, phone: "5555300007499" }, agora, desde).ok, false);
  assert.equal(elegivelPrimeiroContato({ ...base, tags: ["humano"] }, agora, desde).ok, false);
  assert.equal(elegivelPrimeiroContato({ ...base, tags: ["optout"] }, agora, desde).ok, false);
  assert.equal(
    elegivelPrimeiroContato({ ...base, customFields: { primeiro_contato: { status: "enviado" } } }, agora, desde).ok,
    false,
  );
});

const COMBINADOS_OBRIGATORIOS = [
  "não tenho fórmula mágica",
  "R$ 3.000 e R$ 18.000",
  "pelo menos R$ 30 por dia em anúncios",
  "agentes de inteligência artificial",
  "cerca de 2 horas por dia",
];

test("mensagem sem nome ou sem plano continua natural", () => {
  const m = mensagemPrimeiroContato("", {});
  assert.ok(m?.startsWith("Oi!"));
  assert.ok(!m?.includes("undefined"));
  assert.ok(!m?.includes("escolheu o plano"));
});
