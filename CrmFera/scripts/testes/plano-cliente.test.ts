import { test } from "node:test";
import assert from "node:assert/strict";
import { mesclarPlano, lerPlanoBruto, aprovarPlano, PLANO_VAZIO, LIMITES } from "../../src/lib/plano-cliente";
import { montarJornada, type EstadoJornada } from "../../src/lib/jornada";

const agora = new Date("2026-11-22T12:00:00Z");

test("plano completo do onboarding é aceito e limpo", () => {
  const r = mesclarPlano(PLANO_VAZIO, {
    bigIdea: "  A call deveria começar na decisão  ",
    mecanismo: { nome: "Jornada de Compra", explicacao: "o lead chega decidido" },
    headlines: ["Uma", "", 3, "Duas"],
    roteirosYoutube: [{ titulo: "Vídeo 1", roteiro: "texto" }, { titulo: "sem roteiro" }],
    postsInstagram: [{ titulo: "Post", texto: "corpo", formato: "carrossel" }],
  }, agora);

  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.plano.bigIdea, "A call deveria começar na decisão");
  assert.deepEqual(r.plano.headlines, ["Uma", "Duas"]);
  assert.equal(r.plano.roteirosYoutube.length, 1);
  assert.equal(r.plano.postsInstagram[0].formato, "carrossel");
  assert.equal(r.plano.atualizadoEm, agora.toISOString());
});

test("FERABOT manda só roteiros novos e a big idea continua", () => {
  const primeiro = mesclarPlano(PLANO_VAZIO, { bigIdea: "Big", headlines: ["H"] }, agora);
  assert.ok(primeiro.ok);
  if (!primeiro.ok) return;

  const depois = mesclarPlano(primeiro.plano, { roteirosYoutube: [{ titulo: "Novo", roteiro: "r" }] }, agora);

  assert.ok(depois.ok);
  if (!depois.ok) return;
  assert.equal(depois.plano.bigIdea, "Big");
  assert.deepEqual(depois.plano.headlines, ["H"]);
  assert.equal(depois.plano.roteirosYoutube[0].titulo, "Novo");
});

test("plano vazio ou sem nenhum campo útil é recusado", () => {
  assert.equal(mesclarPlano(PLANO_VAZIO, {}).ok, false);
  assert.equal(mesclarPlano(PLANO_VAZIO, "texto").ok, false);
  assert.equal(mesclarPlano(PLANO_VAZIO, { headlines: ["", 1] }).ok, false);
});

test("listas e textos têm teto", () => {
  const muitas = Array.from({ length: 50 }, (_, i) => `h${i}`);
  const r = mesclarPlano(PLANO_VAZIO, { headlines: muitas, bigIdea: "x".repeat(5000) });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.plano.headlines.length, LIMITES.headlines);
  assert.equal(r.plano.bigIdea.length, LIMITES.medio);
});

test("banco com lixo vira plano vazio, sem quebrar a tela", () => {
  assert.deepEqual(lerPlanoBruto("{quebrado"), PLANO_VAZIO);
  assert.deepEqual(lerPlanoBruto(""), PLANO_VAZIO);
  assert.equal(lerPlanoBruto(JSON.stringify({ bigIdea: "B", atualizadoEm: "2026-11-01T00:00:00Z" })).atualizadoEm, "2026-11-01T00:00:00Z");
});

test("Jornada tem o passo do YouTube depois do WhatsApp e ele fecha com canal e vídeo", () => {
  const ok = { em: "2026-11-22T10:00:00Z" };
  const estado: EstadoJornada = {
    ferabotConectado: true,
    chavesFuncionando: ["GEMINI_API_KEY", "NETLIFY_AUTH_TOKEN"],
    marcos: { narrativa: ok, pagina: ok, canal_youtube: ok },
    totalLeads: 1,
    whatsapp: { servidor: true, conectado: true },
    planoAprovado: false,
    leadsReais: 0,
    briefingRespondido: true,
  };
  const soCanal = montarJornada(estado);
  assert.equal(soCanal.passos[4].id, "youtube");
  assert.equal(soCanal.atuais.conteudo?.id, "youtube");

  const comVideo = montarJornada({ ...estado, marcos: { ...estado.marcos, video_youtube: ok } });
  assert.equal(comVideo.atuais.conteudo?.id, "conteudo");
});

test("lote do mês soma roteiros e posts sem repetir título, mais novos primeiro", () => {
  const base = mesclarPlano(PLANO_VAZIO, { roteirosYoutube: [{ titulo: "A", roteiro: "a" }] }, agora);
  assert.ok(base.ok);
  if (!base.ok) return;

  const r = mesclarPlano(base.plano, {
    modo: "acrescentar",
    roteirosYoutube: [{ titulo: "B", roteiro: "b", lote: "2026-12" }, { titulo: "A", roteiro: "repetido" }],
  }, agora);

  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.plano.roteirosYoutube.map((x) => x.titulo), ["B", "A"]);
  assert.equal(r.plano.roteirosYoutube[0].lote, "2026-12");
  assert.equal(r.plano.roteirosYoutube[1].roteiro, "a");
});

test("aprovação some quando a big idea muda e fica quando só chegam roteiros", () => {
  const base = mesclarPlano(PLANO_VAZIO, { bigIdea: "Big" }, agora);
  assert.ok(base.ok);
  if (!base.ok) return;
  const aprovado = aprovarPlano(base.plano, agora);
  assert.ok(aprovado?.aprovadoEm);
  if (!aprovado) return;

  const comRoteiro = mesclarPlano(aprovado, { roteirosYoutube: [{ titulo: "R", roteiro: "r" }] }, agora);
  const outraIdeia = mesclarPlano(aprovado, { bigIdea: "Outra" }, agora);

  assert.ok(comRoteiro.ok && comRoteiro.plano.aprovadoEm);
  assert.ok(outraIdeia.ok && !outraIdeia.plano.aprovadoEm);
  assert.equal(aprovarPlano(PLANO_VAZIO), null);
});

test("redes entram, se somam às que já estavam e campo desconhecido fica de fora", () => {
  const a = mesclarPlano(PLANO_VAZIO, { redes: { site: "https://exemplo.com", orkut: "x" } }, agora);
  assert.ok(a.ok);
  if (!a.ok) return;
  assert.deepEqual(a.plano.redes, { site: "https://exemplo.com" });

  const b = mesclarPlano(a.plano, { redes: { instagram: "@exemplo" } }, agora);
  assert.ok(b.ok);
  if (!b.ok) return;
  assert.deepEqual(b.plano.redes, { site: "https://exemplo.com", instagram: "@exemplo" });
});
