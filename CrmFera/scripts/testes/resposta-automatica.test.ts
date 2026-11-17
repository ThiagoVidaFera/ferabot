import { test } from "node:test";
import assert from "node:assert/strict";
import { ehRespostaAutomatica, pareceAssistente, ehEncerramento } from "../../src/lib/resposta-automatica";

test("reconhece as respostas automáticas reais que o agente respondeu", () => {
  assert.ok(ehRespostaAutomatica("No momento não posso interagir e peço sua compreensão. Logo que possível, lhe retornarei."));
  assert.ok(ehRespostaAutomatica("Olá! Por gentileza, deixe sua mensagem. Logo que possível, lhe retornarei."));
  assert.ok(
    ehRespostaAutomatica("Olá! Como você está? Sou Luiz Henrique, professor de Canto 🎙️ Agradeço a sua mensagem! Não estou disponível no momento."),
  );
  assert.ok(ehRespostaAutomatica("Estamos fora do horário de atendimento. Retornamos amanhã."));
});

test("fala de gente não casa", () => {
  assert.equal(ehRespostaAutomatica("Venho trabalhando para fechar mais pacotes."), false);
  assert.equal(ehRespostaAutomatica("Não assisti ainda. Vou assistir hoje que tenho folga"), false);
  assert.equal(ehRespostaAutomatica("Sim."), false);
  assert.equal(ehRespostaAutomatica("Hoje não posso falar, me chama amanhã"), false);
  assert.equal(ehRespostaAutomatica(""), false);
  assert.equal(ehRespostaAutomatica(null), false);
});

test("assistente ou equipe do lead é reconhecido; apresentação do próprio lead não", () => {
  assert.ok(pareceAssistente("Oi Paula! Aqui é o Argon, da equipe do Renato Rocha Miranda. Obrigado por enviar o link."));
  assert.ok(pareceAssistente("Sou a secretária do Dr. Paulo, posso ajudar?"));
  assert.equal(pareceAssistente("Aqui é o Galvão, da Galvão Hipnoterapia. Eu ajudo pessoas a destravarem bloqueios."), false);
  assert.equal(pareceAssistente("Sou da equipe, trabalho com vendas"), false);
  assert.equal(pareceAssistente("Sou assistente de marketing numa clínica"), false);
  assert.equal(pareceAssistente("Preciso de equipe de vendas pra escalar"), false);
  assert.equal(pareceAssistente("Meu problema é o atendimento do cliente"), false);
  assert.equal(pareceAssistente("Tenho uma secretária que cuida da agenda"), false);
});

test("agradecimento, ponto e emoji encerram; resposta a pergunta nossa não", () => {
  assert.ok(ehEncerramento("Tranquilo. Grato pelo apoio", true));
  assert.ok(ehEncerramento("Muito obrigado!", false));
  assert.ok(ehEncerramento(".", true));
  assert.ok(ehEncerramento("👍", false));
  assert.ok(ehEncerramento("Ok", false));
  assert.equal(ehEncerramento("Ok", true), false);
  assert.equal(ehEncerramento("Sim.", false), false);
  assert.equal(ehEncerramento("Obrigado, quero sim, me manda o link", false), false);
  assert.equal(ehEncerramento("Valeu, pode me ligar amanhã", false), false);
  assert.equal(ehEncerramento("Obrigado, quanto custa", false), false);
  assert.equal(ehEncerramento("Obrigado, mas quanto custa?", false), false);
  assert.equal(ehEncerramento("Venho trabalhando para fechar mais pacotes.", false), false);
});
