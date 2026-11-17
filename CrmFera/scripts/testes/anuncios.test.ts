import { test } from "node:test";
import assert from "node:assert/strict";
import {
  consolidarAnuncios,
  gerarSugestoes,
  type ContatoDeAnuncio,
  type InsightAnuncio,
} from "../../src/lib/anuncios";

const insights: InsightAnuncio[] = [
  { adId: "111", nome: "ad-video-01", campanha: "Black Friday", gastoCents: 20000, impressoes: 9000, cliques: 300 },
  { adId: "222", nome: "ad-video-02", campanha: "Black Friday", gastoCents: 15000, impressoes: 7000, cliques: 120 },
  { adId: "333", nome: "ad-imagem-03", campanha: "Black Friday", gastoCents: 500, impressoes: 100, cliques: 2 },
];

const contatos: ContatoDeAnuncio[] = [
  { adId: "111", anuncio: "ad-video-01", leads: 1, compras: [{ valueCents: 9700 }, { valueCents: 9700 }] },
  { adId: "111", anuncio: "ad-video-01", leads: 1, compras: [] },
  // sem id: casa pelo nome (utm_content), ignorando caixa e sufixo depois de "|"
  { adId: "", anuncio: "AD-VIDEO-01 | variação", leads: 1, compras: [{ valueCents: 9700 }] },
  { adId: "222", anuncio: "ad-video-02", leads: 1, compras: [] },
];

test("junta gasto da Graph com leads e vendas do CRM, casando por id e por nome", () => {
  const r = consolidarAnuncios(insights, contatos);
  const a = r.find((x) => x.adId === "111")!;
  assert.equal(a.leads, 3);
  assert.equal(a.vendas, 3);
  assert.equal(a.receitaCents, 29100);
  assert.equal(a.gastoCents, 20000);
  assert.equal(a.roas, 29100 / 20000);
});

test("anuncio que gasta e nao vende fica 'gastando'; o que vende fica 'vende'; sem dado fica 'cedo'", () => {
  const r = consolidarAnuncios(insights, contatos);
  assert.equal(r.find((x) => x.adId === "111")!.situacao, "vende");
  assert.equal(r.find((x) => x.adId === "222")!.situacao, "gastando");
  assert.equal(r.find((x) => x.adId === "333")!.situacao, "cedo");
});

test("ordena quem vende primeiro, depois quem mais gasta", () => {
  const r = consolidarAnuncios(insights, contatos);
  assert.deepEqual(r.map((x) => x.adId), ["111", "222", "333"]);
});

test("anuncio so no CRM (sem gasto na Graph) aparece, sem inventar custo", () => {
  const r = consolidarAnuncios([], [{ adId: "999", anuncio: "ad-velho", leads: 1, compras: [{ valueCents: 5000 }] }]);
  assert.equal(r.length, 1);
  assert.equal(r[0].gastoCents, 0);
  assert.equal(r[0].roas, null);
  assert.equal(r[0].situacao, "vende");
});

test("sugestoes: pausa o que gasta sem vender, escala o que vende, e nunca sugere sobre amostra pequena", () => {
  const r = consolidarAnuncios(insights, contatos);
  const s = gerarSugestoes(r);
  assert.ok(s.some((x) => x.tipo === "pausar" && x.adId === "222"));
  assert.ok(s.some((x) => x.tipo === "escalar" && x.adId === "111"));
  assert.ok(!s.some((x) => x.adId === "333"), "333 tem 2 cliques: cedo demais");
});

test("nome do CRM sem prefixo casa com o nome da Meta quando so um anuncio serve", () => {
  const ins: InsightAnuncio[] = [
    { adId: "1", nome: "ad_a2_prova_47h_video", campanha: "C", gastoCents: 4300, impressoes: 900, cliques: 40 },
    { adId: "2", nome: "ad_a1_prova_47h", campanha: "C", gastoCents: 12200, impressoes: 900, cliques: 90 },
  ];
  const r = consolidarAnuncios(ins, [
    { adId: "", anuncio: "a2-prova-47h-video", leads: 1, compras: [{ valueCents: 750000 }] },
  ]);
  const a = r.find((x) => x.adId === "1")!;
  assert.equal(a.vendas, 1);
  assert.equal(a.situacao, "vende");
  assert.equal(r.find((x) => x.adId === "2")!.situacao, "gastando");
  assert.equal(r.length, 2, "nao cria linha orfa quando casou");
});

test("nome ambiguo (dois anuncios servem) nao e atribuido e trava a sugestao de pausar nos dois", () => {
  const ins: InsightAnuncio[] = [
    { adId: "1", nome: "fa-03-agente-consorcios", campanha: "C", gastoCents: 3800, impressoes: 900, cliques: 50 },
    { adId: "2", nome: "ad-teste-res-03-agente-consorcios", campanha: "C", gastoCents: 14200, impressoes: 900, cliques: 90 },
  ];
  const r = consolidarAnuncios(ins, [
    { adId: "", anuncio: "03-agente-consorcios", leads: 1, compras: [{ valueCents: 750000 }] },
  ]);
  assert.equal(r.find((x) => x.adId === "1")!.vendas, 0);
  assert.ok(r.find((x) => x.adId === "1")!.incerto);
  assert.ok(r.find((x) => x.adId === "2")!.incerto);
  assert.ok(r.some((x) => x.vendas === 1), "a venda continua visivel numa linha propria");
  assert.deepEqual(gerarSugestoes(r).filter((s) => s.tipo === "pausar"), []);
});

test("so sugere pausar anuncio que esta ativo, e limita a 3 pausas e 3 escalas", () => {
  const ins: InsightAnuncio[] = Array.from({ length: 6 }, (_, i) => ({
    adId: String(100 + i),
    nome: `ad-x-${i}`,
    campanha: "C",
    gastoCents: 10000 + i,
    impressoes: 1000,
    cliques: 100,
  }));
  const linhas = consolidarAnuncios(ins, []);
  const ativos = new Set(["100", "101", "102", "103", "104"]); // 105 (o que mais gasta) esta pausado
  const s = gerarSugestoes(linhas, ativos);
  assert.equal(s.length, 3);
  assert.ok(!s.some((x) => x.adId === "105"));
  assert.deepEqual(s.map((x) => x.adId), ["104", "103", "102"], "os que mais gastam primeiro");
});

test("sem nenhum dado, nao inventa sugestao", () => {
  assert.deepEqual(gerarSugestoes([]), []);
});
