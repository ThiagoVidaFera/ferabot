import { test } from "node:test";
import assert from "node:assert/strict";
import { montarJornada, ehMarco, type EstadoJornada } from "../../src/lib/jornada";

const ok = { em: "2026-11-22T10:00:00Z" };
const semWhats = { servidor: false, conectado: false };
const whatsOk = { servidor: true, conectado: true };
const chavesGratis = ["GEMINI_API_KEY", "NETLIFY_AUTH_TOKEN"];
const vazio: EstadoJornada = {
  ferabotConectado: false,
  chavesFuncionando: [],
  marcos: {},
  totalLeads: 0,
  whatsapp: semWhats,
  planoAprovado: false,
  leadsReais: 0,
};

test("painel recém-criado: 7 passos, nada feito, um passo da vez em cada trilha", () => {
  const jornada = montarJornada(vazio);

  assert.equal(jornada.total, 7);
  assert.equal(jornada.feitos, 0);
  assert.equal(jornada.atuais.tecnica?.id, "chaves");
  assert.equal(jornada.atuais.conteudo?.id, "narrativa");
  assert.equal(jornada.passos.filter((p) => p.atual).length, 2);
  assert.equal(jornada.atual?.id, "chaves");
});

test("as trilhas: técnica = chaves, página, WhatsApp, anúncio; conteúdo = narrativa, YouTube, posts", () => {
  const jornada = montarJornada(vazio);
  const por = (t: string) => jornada.passos.filter((p) => p.trilha === t).map((p) => p.id);

  assert.deepEqual(por("tecnica"), ["chaves", "pagina", "whatsapp", "anuncios"]);
  assert.deepEqual(por("conteudo"), ["narrativa", "youtube", "conteudo"]);
});

test("WhatsApp travado não segura o YouTube: a trilha de conteúdo anda sozinha", () => {
  const jornada = montarJornada({
    ...vazio,
    ferabotConectado: true,
    chavesFuncionando: chavesGratis,
    marcos: { narrativa: ok, pagina: ok },
    totalLeads: 1,
    briefingRespondido: true,
  });

  assert.equal(jornada.atuais.tecnica?.id, "whatsapp");
  assert.equal(jornada.atuais.conteudo?.id, "youtube");
});

test("plano aprovado no painel fecha a narrativa sem esperar o FERABOT, depois do briefing", () => {
  const soPlano = montarJornada({ ...vazio, planoAprovado: true });
  assert.equal(soPlano.atuais.conteudo?.id, "narrativa");
  const jornada = montarJornada({ ...vazio, planoAprovado: true, briefingRespondido: true });

  assert.equal(jornada.passos[1].feito, true);
  assert.equal(jornada.atuais.conteudo?.id, "youtube");
});

test("passo 1 só fecha com FERABOT conectado e as duas chaves grátis funcionando", () => {
  const soChaves = montarJornada({ ...vazio, chavesFuncionando: chavesGratis });
  const completo = montarJornada({ ...vazio, ferabotConectado: true, chavesFuncionando: chavesGratis });

  assert.equal(soChaves.atuais.tecnica?.id, "chaves");
  assert.equal(completo.passos[0].feito, true);
  assert.equal(completo.atuais.tecnica?.id, "pagina");
});

test("página no ar só fecha com o lead de teste chegando no painel", () => {
  const base: EstadoJornada = {
    ...vazio,
    ferabotConectado: true,
    chavesFuncionando: chavesGratis,
    marcos: { pagina: { em: ok.em, link: "https://exemplo.com" } },
  };

  const semLead = montarJornada(base);
  const comLead = montarJornada({ ...base, totalLeads: 1 });

  assert.equal(semLead.atuais.tecnica?.id, "pagina");
  assert.equal(semLead.atuais.tecnica?.itens[0].link, "https://exemplo.com");
  assert.equal(comLead.atuais.tecnica?.id, "whatsapp");
});

test("WhatsApp só fecha com o servidor ligado e o QR lido", () => {
  const base: EstadoJornada = {
    ...vazio,
    ferabotConectado: true,
    chavesFuncionando: chavesGratis,
    marcos: { pagina: ok },
    totalLeads: 1,
  };

  const soServidor = montarJornada({ ...base, whatsapp: { servidor: true, conectado: false } });
  const conectado = montarJornada({ ...base, whatsapp: whatsOk });

  assert.equal(soServidor.atuais.tecnica?.id, "whatsapp");
  assert.equal(soServidor.atuais.tecnica?.itens[0].feito, true);
  assert.equal(soServidor.atuais.tecnica?.itens[1].feito, false);
  assert.equal(conectado.atuais.tecnica?.id, "anuncios");
});

test("anúncios exigem Meta funcionando, campanha criada e o primeiro lead REAL (o de teste não conta)", () => {
  const quase: EstadoJornada = {
    ferabotConectado: true,
    chavesFuncionando: [...chavesGratis, "META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
    marcos: { narrativa: ok, pagina: ok, canal_youtube: ok, video_youtube: ok, criativos: ok, posts: ok, campanha: ok },
    totalLeads: 3,
    whatsapp: whatsOk,
    planoAprovado: false,
    leadsReais: 0,
    briefingRespondido: true,
  };

  const soTeste = montarJornada(quase);
  const tudo = montarJornada({ ...quase, leadsReais: 1 });

  assert.equal(soTeste.atuais.tecnica?.id, "anuncios");
  assert.equal(soTeste.concluida, false);
  assert.equal(tudo.concluida, true);
  assert.equal(tudo.atual, null);
  assert.equal(tudo.atuais.tecnica, null);
  assert.equal(tudo.atuais.conteudo, null);
});

test("marco fora da lista é recusado", () => {
  assert.equal(ehMarco("pagina"), true);
  assert.equal(ehMarco("video_youtube"), true);
  assert.equal(ehMarco("faturamento"), false);
  assert.equal(ehMarco(42), false);
});
