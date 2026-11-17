import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularCustos, ehCustoDeReuniao, resumirReunioes, ehPropostaHumana, contarPropostasApresentadas } from "../../src/lib/painel-custos";
import type { Reuniao } from "../../src/lib/reunioes";

const inicio = new Date("2026-11-01T03:00:00Z");
const fim = new Date("2026-11-07T03:00:00Z");
const agora = new Date("2026-11-06T18:00:00Z");

function r(quando: string, semResultado = false): Reuniao {
  return {
    id: quando,
    nome: "x",
    phone: null,
    origem: "funil:a",
    funil: "a",
    pagina: "x",
    canal: null,
    quando: new Date(quando),
    link: "",
    semResultado,
    temperatura: null,
    propostaRecebida: false,
  };
}

test("custo de low ticket LATAM fica fora do custo por reunião", () => {
  assert.equal(ehCustoDeReuniao("funil:agendar-implementacao-ysp"), true);
  assert.equal(ehCustoDeReuniao("latam:arteterapia-es"), false);
  assert.equal(ehCustoDeReuniao("anuncio:atlas-coloracion-es-cold-2026-09"), false);
});

test("divide custo pelos totais e devolve null sem custo ou sem denominador", () => {
  const c = calcularCustos({ custoTotalCents: 10000, custoReuniaoCents: 6000, leads: 4, realizadas: 3, marcadas: 6, propostas: 0 });
  assert.equal(c.cplCents, 2500);
  assert.equal(c.porRealizadaCents, 2000);
  assert.equal(c.porMarcadaCents, 1000);
  assert.equal(c.porPropostaCents, null);
  const zero = calcularCustos({ custoTotalCents: 0, custoReuniaoCents: 0, leads: 4, realizadas: 1, marcadas: 1, propostas: 1 });
  assert.equal(zero.cplCents, null);
});

test("resumo: realizadas e no show contam no período; a realizar é o que vem pela frente", () => {
  const res = resumirReunioes(
    {
      realizadas: [r("2026-11-03T15:00:00Z"), r("2026-10-20T15:00:00Z")],
      noShow: [r("2026-11-04T15:00:00Z")],
      aRealizar: [r("2026-11-08T15:00:00Z"), r("2026-11-05T15:00:00Z", true)],
    },
    { inicio, fim },
    agora,
  );
  assert.equal(res.realizadas, 1);
  assert.equal(res.noShow, 1);
  assert.equal(res.aRealizar, 1);
  assert.equal(res.semResultado, 1);
  assert.equal(res.marcadasNoPeriodo, 3); // 1 realizada + 1 no show + 1 sem resultado
  assert.equal(res.comparecimento, 50);
  assert.equal(res.proxima?.toISOString(), "2026-11-08T15:00:00.000Z");
});

test("proposta conta só quando gente moveu o estágio, nunca agente", () => {
  assert.equal(ehPropostaHumana({ para: "proposta", ator: "dono@exemplo.com" }), true);
  assert.equal(ehPropostaHumana({ para: "proposta", ator: "agente:recepcao" }), false);
  assert.equal(ehPropostaHumana({ para: "conversando", ator: "dono@exemplo.com" }), false);
  assert.equal(ehPropostaHumana(null), false);
});

test("proposta conta pela data da reunião em que foi apresentada, não pelo clique", () => {
  const reunioes = new Map<string, Date>([
    ["antiga", new Date("2026-10-28T15:00:00Z")], // reunião de outubro, marcada só hoje
    ["nova", new Date("2026-11-04T15:00:00Z")],
  ]);
  const marcas = [
    { contactId: "antiga", em: new Date("2026-11-06T12:00:00Z") },
    { contactId: "nova", em: new Date("2026-11-06T12:00:00Z") },
    { contactId: "nova", em: new Date("2026-11-06T13:00:00Z") }, // duplicada
    { contactId: "sem-reuniao", em: new Date("2026-11-03T12:00:00Z") }, // sem reunião: vale o clique
    { contactId: "sem-reuniao-velha", em: new Date("2026-10-20T12:00:00Z") },
  ];
  assert.equal(contarPropostasApresentadas(marcas, reunioes, { inicio, fim }), 2);
});
