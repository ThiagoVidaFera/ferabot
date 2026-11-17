import { test } from "node:test";
import assert from "node:assert/strict";
import {
  personaDaSessao,
  ehLeadComercial,
  origemDaMensagemPronta,
  ORIGEM_MENSAGEM_PRONTA,
  _definirPersonas,
} from "../../src/lib/numero-comercial";
import { validarMensagem } from "../../src/lib/guardas";
import { NEGOCIO_EXEMPLO, _definirNegocioParaTeste } from "../../src/lib/negocio";

const PERSONAS = JSON.stringify({
  comercial: {
    nome: "Paula",
    agentePadrao: "recepcao",
    passagemSilenciosa: true,
    avisarEm: "55 11 98888-7777",
    apresentacao: "paula\\s*aqui",
    bloco: "# IDENTIDADE\nVocê escreve como a Paula, da equipe. Nunca diga que é robô.",
    mensagemPronta: "^\\s*oi,?\\s*paula[!,.]?\\s.*\\b(li o pdf|vim pela palavra)\\b",
  },
});

test("sem configuração nenhum número tem persona", () => {
  _definirPersonas(null);
  assert.equal(personaDaSessao("comercial"), null);
  assert.equal(personaDaSessao(null), null);
  assert.equal(origemDaMensagemPronta("Oi, Paula! Li o PDF X"), null);
});

test("persona configurada: nome, agente padrão, passagem e telefone só com dígitos", () => {
  _definirPersonas(PERSONAS);
  const p = personaDaSessao("comercial")!;
  assert.equal(p.nome, "Paula");
  assert.equal(p.agentePadrao, "recepcao");
  assert.equal(p.passagemSilenciosa, true);
  assert.equal(p.avisarEm, "5511988887777");
  assert.ok(p.apresentacao.test("Oi, Ana! Paula aqui, da equipe."));
  assert.ok(!p.apresentacao.test("Oi, Ana! Tudo bem?"));
  assert.equal(personaDaSessao("principal"), null);
});

test("JSON inválido desliga as personas em vez de derrubar o CRM", () => {
  _definirPersonas("{nao e json");
  assert.equal(personaDaSessao("comercial"), null);
});

test("lead comercial = funil, clique no anúncio ou anúncio; base importada e pessoal ficam de fora", () => {
  assert.equal(ehLeadComercial("funil:acesso-ao-material"), true);
  assert.equal(ehLeadComercial("FUNIL:Diagnostico"), true);
  assert.equal(ehLeadComercial("ctwa"), true);
  assert.equal(ehLeadComercial("anuncio"), true);
  assert.equal(ehLeadComercial("whatsapp"), false);
  assert.equal(ehLeadComercial(null), false);
});

test("mensagem pronta do botão vira lead de funil; conversa solta não", () => {
  _definirPersonas(PERSONAS);
  assert.equal(origemDaMensagemPronta('Oi, Paula! Li o PDF "Guia" e quero saber mais.'), ORIGEM_MENSAGEM_PRONTA);
  assert.equal(origemDaMensagemPronta("Oi, Paula! Vim pela palavra RADAR."), ORIGEM_MENSAGEM_PRONTA);
  assert.equal(ehLeadComercial(ORIGEM_MENSAGEM_PRONTA), true);
  assert.equal(origemDaMensagemPronta("Oi, tudo bem? Quanto custa?"), null);
  assert.equal(origemDaMensagemPronta(""), null);
  _definirPersonas(null);
});

test("guarda: o robô nunca se apresenta como o dono do negócio (nome vem do negocio.json)", () => {
  _definirNegocioParaTeste({ ...NEGOCIO_EXEMPLO, dono: { ...NEGOCIO_EXEMPLO.dono, nome: "Ana Lima", primeiroNome: "Ana" } });
  const aut = { links: [], precos: [] } as never;
  assert.equal(validarMensagem("Oi, Bruno! Aqui é a Ana. Me conta o que você faz hoje?", aut, {}).ok, false);
  assert.equal(validarMensagem("Oi, Bruno! Paula aqui, da equipe. Me conta o que você faz hoje?", aut, { personaSeApresenta: true }).ok, true);
  assert.equal(validarMensagem("Vou passar pra Ana, ela já te responde. Tudo bem?", aut, {}).ok, false);
  _definirNegocioParaTeste(null);
});
