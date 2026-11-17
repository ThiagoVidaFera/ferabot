import { test } from "node:test";
import assert from "node:assert/strict";
import { resolverTelefoneDoLid, telefoneDaRespostaLid, type FontesLid } from "../../src/lib/lid";

const LID = "34926724390936@lid";

function fontes(over: Partial<FontesLid> = {}): FontesLid {
  return {
    telefoneDoContatoPorChat: async () => null,
    telefoneDoContatoPorMensagem: async () => null,
    perguntarAoWaha: async () => null,
    ...over,
  };
}

test("resposta do WAHA /lids vira só dígitos", () => {
  assert.equal(telefoneDaRespostaLid({ lid: LID, pn: "555400001643@c.us" }), "555400001643");
  assert.equal(telefoneDaRespostaLid({ lid: LID, pn: null }), "");
  assert.equal(telefoneDaRespostaLid("lixo"), "");
});

test("jid que não é @lid não consulta nada", async () => {
  let chamou = false;
  const r = await resolverTelefoneDoLid("5511999@c.us", fontes({ perguntarAoWaha: async () => { chamou = true; return "1"; } }));
  assert.equal(r, "");
  assert.equal(chamou, false);
});

test("contato que já conversou nesse chat resolve sem rede", async () => {
  let chamouWaha = false;
  const r = await resolverTelefoneDoLid(
    LID,
    fontes({
      telefoneDoContatoPorChat: async (j) => (j === LID ? "555400001643" : null),
      perguntarAoWaha: async () => { chamouWaha = true; return "999"; },
    }),
  );
  assert.equal(r, "555400001643");
  assert.equal(chamouWaha, false);
});

test("sem chat gravado, usa mensagem antiga com o mesmo LID no id", async () => {
  const r = await resolverTelefoneDoLid(LID, fontes({ telefoneDoContatoPorMensagem: async () => "5511900000000" }));
  assert.equal(r, "5511900000000");
});

test("último recurso: pergunta ao WAHA", async () => {
  const r = await resolverTelefoneDoLid(LID, fontes({ perguntarAoWaha: async () => "554100002128" }));
  assert.equal(r, "554100002128");
});

test("fonte que falha não derruba a entrada, segue para a próxima", async () => {
  const r = await resolverTelefoneDoLid(
    LID,
    fontes({
      telefoneDoContatoPorChat: async () => { throw new Error("db"); },
      perguntarAoWaha: async () => "554100002128",
    }),
  );
  assert.equal(r, "554100002128");
});

test("nada resolve: devolve vazio (quem chama registra o descarte)", async () => {
  assert.equal(await resolverTelefoneDoLid(LID, fontes()), "");
});
