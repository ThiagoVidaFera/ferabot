import { test, after } from "node:test";
import assert from "node:assert/strict";
import { criarBancoTemporario } from "./banco-temporario";
import { cifrar, decifrar, mascarar, tokensIguais } from "../../src/lib/cofre";
import { testarChave } from "../../src/lib/chaves-teste";

const banco = criarBancoTemporario();
process.env.SESSION_SECRET = "segredo-de-teste-com-mais-de-16";
after(async () => {
  const { db } = await import("../../src/lib/db");
  await db.$disconnect();
  banco.apagar();
});

const respondeCom = (status: number) => async () => new Response("{}", { status });

test("o que entra no cofre sai igual e não fica legível no banco", () => {
  const guardado = cifrar("AIzaSy-chave-de-teste", "segredo-de-teste-com-mais-de-16");

  assert.equal(guardado.includes("AIzaSy"), false);
  assert.equal(decifrar(guardado, "segredo-de-teste-com-mais-de-16"), "AIzaSy-chave-de-teste");
});

test("segredo errado ou valor adulterado não abre o cofre", () => {
  const guardado = cifrar("token", "segredo-de-teste-com-mais-de-16");

  assert.throws(() => decifrar(guardado, "outro-segredo-com-mais-de-16-x"));
  assert.throws(() => decifrar(guardado.slice(0, -4) + "AAAA", "segredo-de-teste-com-mais-de-16"));
  assert.throws(() => decifrar("texto-puro", "segredo-de-teste-com-mais-de-16"));
});

test("máscara mostra só o fim da chave", () => {
  assert.equal(mascarar("AIzaSyABCDEFGH1234"), "••••1234");
  assert.equal(mascarar("curta"), "••••");
});

test("token vazio nunca confere", () => {
  assert.equal(tokensIguais("abc", "abc"), true);
  assert.equal(tokensIguais("abc", "abd"), false);
  assert.equal(tokensIguais("", ""), false);
});

test("serviço que aceita a chave marca funcionando, o que recusa marca recusada", async () => {
  const aceita = await testarChave("GEMINI_API_KEY", "AIzaSy-x", {}, respondeCom(200));
  const recusa = await testarChave("NETLIFY_AUTH_TOKEN", "errado", {}, respondeCom(401));
  const instavel = await testarChave("META_ACCESS_TOKEN", "x", {}, respondeCom(503));

  assert.equal(aceita.ok, true);
  assert.equal(recusa.ok, false);
  assert.equal(instavel.ok, null);
});

test("serviço fora do ar não vira chave recusada", async () => {
  const semRede = await testarChave("GEMINI_API_KEY", "AIzaSy-x", {}, async () => {
    throw new Error("sem rede");
  });

  assert.equal(semRede.ok, null);
  assert.equal(semRede.msg.includes("sem rede"), false, "o texto do erro de rede não vai para a tela");
});

test("conta de anúncios confere formato e só testa de verdade com o token salvo", async () => {
  const formatoErrado = await testarChave("META_AD_ACCOUNT_ID", "123456", {}, respondeCom(200));
  const semToken = await testarChave("META_AD_ACCOUNT_ID", "act_123456", {}, respondeCom(200));
  const comToken = await testarChave("META_AD_ACCOUNT_ID", "act_123456", { META_ACCESS_TOKEN: "t" }, respondeCom(200));

  assert.equal(formatoErrado.ok, false);
  assert.equal(semToken.ok, null);
  assert.equal(comToken.ok, true);
});

test("chave salva volta decifrada, aparece mascarada e some ao apagar", async () => {
  const { gravarConfig } = await import("../../src/lib/config");
  const chaves = await import("../../src/lib/chaves");
  await gravarConfig("chave:FAL_KEY", cifrar("meuid:meusegredo9876"));
  await gravarConfig("chave_status:FAL_KEY", JSON.stringify({ ok: null, msg: "Formato certo.", em: "2026-11-22T10:00:00Z" }));

  const salvas = await chaves.chavesSalvas();
  const naTela = (await chaves.chavesNaTela()).find((c) => c.env === "FAL_KEY");
  await chaves.apagarChave("FAL_KEY");

  assert.equal(salvas.FAL_KEY, "meuid:meusegredo9876");
  assert.equal(naTela?.fim, "••••9876");
  assert.equal(naTela?.status?.ok, null);
  assert.equal((await chaves.chavesSalvas()).FAL_KEY, undefined);
  await assert.rejects(() => chaves.salvarChave("CHAVE_INVENTADA", "x"));
  await assert.rejects(() => chaves.salvarChave("FAL_KEY", "a\rNODE_OPTIONS=x"), /caractere inválido/);
  await assert.rejects(() => chaves.salvarChave("FAL_KEY", "tem espaco"), /caractere inválido/);
});

test("linha do cofre que não decifra vira chave em falta, sem derrubar a tela", async () => {
  const { gravarConfig } = await import("../../src/lib/config");
  const chaves = await import("../../src/lib/chaves");
  await gravarConfig("chave:ELEVENLABS_API_KEY", cifrar("sk_x", "outro-segredo-com-mais-de-16-x"));

  const naTela = (await chaves.chavesNaTela()).find((c) => c.env === "ELEVENLABS_API_KEY");

  assert.equal(naTela?.salva, false);
  assert.equal((await chaves.chavesSalvas()).ELEVENLABS_API_KEY, undefined);
});

test("chave recusada pelo serviço não desce para o FERABOT", async () => {
  const { gravarConfig } = await import("../../src/lib/config");
  const chaves = await import("../../src/lib/chaves");
  await gravarConfig("chave:RESEND_API_KEY", cifrar("re_boa"));
  await gravarConfig("chave_status:RESEND_API_KEY", JSON.stringify({ ok: null, msg: "Formato certo.", em: "x" }));
  await gravarConfig("chave:META_AD_ACCOUNT_ID", cifrar("123"));
  await gravarConfig("chave_status:META_AD_ACCOUNT_ID", JSON.stringify({ ok: false, msg: "Formato estranho.", em: "x" }));

  const descem = await chaves.chavesParaOFerabot();

  assert.equal(descem.RESEND_API_KEY, "re_boa");
  assert.equal(descem.META_AD_ACCOUNT_ID, undefined);
});

test("marco, entrega e código de ligação do FERABOT ficam guardados", async () => {
  const estado = await import("../../src/lib/jornada-estado");

  const token = await estado.tokenDoFerabot();
  await estado.registrarMarco("pagina", { link: "https://exemplo.com/captura", resumo: "Página de captura" });
  await estado.registrarMarco("narrativa", { link: "javascript:alert(1)" });
  await estado.registrarEntrega({ bot: "paginas-e-quiz", oque: "Página de captura no ar", link: "https://exemplo.com/captura" });
  const marcos = await estado.lerMarcos();

  assert.equal(await estado.tokenDoFerabot(), token);
  assert.equal(await estado.tokenDoFerabotConfere(token), true);
  assert.equal(await estado.tokenDoFerabotConfere("errado"), false);
  assert.equal(await estado.tokenDoFerabotConfere(null), false);
  assert.equal(marcos.pagina?.link, "https://exemplo.com/captura");
  assert.equal(marcos.narrativa?.link, undefined);
  assert.equal((await estado.lerEntregas())[0].bot, "paginas-e-quiz");
  await assert.rejects(() => estado.registrarMarco("faturamento", {}));
  await assert.rejects(() => estado.registrarEntrega({ oque: "" }));
});
