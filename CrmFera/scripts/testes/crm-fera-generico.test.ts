/**
 * Suíte do CRM FERA genérico: os textos e prompts saem do negocio.json, nunca de um negócio fixo.
 * O negocio.json de teste é gravado num arquivo temporário ANTES de importar os módulos (as
 * constantes de ofertas.ts são lidas na carga).
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const NEGOCIO_TESTE = {
  nome: "Clínica Bem Estar",
  dono: { nome: "Ana Souza", primeiroNome: "Ana", instagram: "@anasouza", whatsapp: "5511988887777", email: "ana@exemplo.com" },
  assistente: { apresentacao: "da Ana" },
  nicho: "nutrição esportiva",
  publico: "mulheres que treinam e querem mais resultado",
  promessa: "Monto o plano alimentar que acompanha o seu treino.",
  qualificacao: ["qual o seu treino hoje", "qual o seu objetivo"],
  links: {
    agendamento: "https://agenda.exemplo.com",
    suporte: "https://wa.me/5511988887777",
    proposta: "https://exemplo.com/propostas",
    isca: "https://exemplo.com/guia",
    grupo: "",
  },
  reuniao: { duracaoMin: 20, formato: "Google Meet" },
  ofertas: [
    {
      slug: "acompanhamento",
      nome: "Acompanhamento 90 dias",
      paraQuem: "quem treina",
      comoFalar: "R$ 1.800 à vista ou 6x de R$ 320 no cartão",
      precoAVista: "R$ 1.800 à vista",
      parcelamento: "6x de R$ 320 no cartão",
      link: "https://exemplo.com/acompanhamento",
      fecha: "call",
      garantia: "",
      garantiaCurta: "",
      acesso: "",
      posicionamento: "",
      transformacao: "",
      entregas: ["plano alimentar", "ajuste quinzenal"],
      bonus: [],
      urgenciaReal: "",
      naoDizer: [],
    },
  ],
  entrada: { slug: "", nome: "", preco: "", link: "", garantia: "" },
  valoresDeQualificacao: [],
};

const NOMES_PROIBIDOS = /thiago|ricardo|vidafera|thiagolsc|7\.500|cakto|youtube sem produ|sprint/i;

type Mods = {
  prompts: typeof import("../../src/lib/prompts");
  recepcao: typeof import("../../src/lib/prompt-recepcao");
  vars: typeof import("../../src/lib/prompt-vars");
  primeira: typeof import("../../src/lib/primeira-mensagem");
  iscas: typeof import("../../src/lib/sequencia-iscas-copy");
  noshow: typeof import("../../src/lib/sequencia-noshow-copy");
  seqprop: typeof import("../../src/lib/sequencia-proposta-copy");
  pagina: typeof import("../../src/lib/pagina-reuniao");
  links: typeof import("../../src/lib/links-proposta");
  zero: typeof import("../../src/lib/comecando-do-zero");
  objecao: typeof import("../../src/lib/objecao-valor");
  resumo: typeof import("../../src/lib/convite-resumo");
  conteudos: typeof import("../../src/lib/conteudos-followup");
  sazonal: typeof import("../../src/lib/oferta-sazonal");
  onc: typeof import("../../src/lib/oferta-na-conversa");
  grupo: typeof import("../../src/lib/convite-grupo");
  pauto: typeof import("../../src/lib/proposta-auto-mensagem");
};
let m: Mods;

before(async () => {
  const arquivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "negocio-")), "negocio.json");
  fs.writeFileSync(arquivo, JSON.stringify(NEGOCIO_TESTE));
  process.env.NEGOCIO_JSON = arquivo;
  const { _definirNegocioParaTeste } = await import("../../src/lib/negocio");
  _definirNegocioParaTeste(null);
  m = {
    prompts: await import("../../src/lib/prompts"),
    recepcao: await import("../../src/lib/prompt-recepcao"),
    vars: await import("../../src/lib/prompt-vars"),
    primeira: await import("../../src/lib/primeira-mensagem"),
    iscas: await import("../../src/lib/sequencia-iscas-copy"),
    noshow: await import("../../src/lib/sequencia-noshow-copy"),
    seqprop: await import("../../src/lib/sequencia-proposta-copy"),
    pagina: await import("../../src/lib/pagina-reuniao"),
    links: await import("../../src/lib/links-proposta"),
    zero: await import("../../src/lib/comecando-do-zero"),
    objecao: await import("../../src/lib/objecao-valor"),
    resumo: await import("../../src/lib/convite-resumo"),
    conteudos: await import("../../src/lib/conteudos-followup"),
    sazonal: await import("../../src/lib/oferta-sazonal"),
    onc: await import("../../src/lib/oferta-na-conversa"),
    grupo: await import("../../src/lib/convite-grupo"),
    pauto: await import("../../src/lib/proposta-auto-mensagem"),
  };
});

/** Resolve as variáveis como o motor faz, sem banco (dicionário montado à mão do negocio de teste). */
function resolver(prompt: string): string {
  const n = NEGOCIO_TESTE;
  const o = n.ofertas[0];
  const vars: Record<string, string> = {
    "negocio.nome": n.nome,
    "negocio.dono": n.dono.nome,
    "negocio.donoPrimeiroNome": n.dono.primeiroNome,
    "negocio.instagram": n.dono.instagram,
    "negocio.assistente": n.assistente.apresentacao,
    "negocio.nicho": n.nicho,
    "negocio.publico": n.publico,
    "negocio.promessa": n.promessa,
    "negocio.qualificacao": n.qualificacao.join("\n"),
    "negocio.reuniao": "20 minutos, por Google Meet",
    "links.agendamento": n.links.agendamento,
    "links.isca": n.links.isca,
    "suporte.link": n.links.suporte,
    "evento.proximo": "",
  };
  for (const [k, v] of Object.entries(o)) vars[`oferta.principal.${k}`] = Array.isArray(v) ? v.join("; ") : String(v);
  vars["oferta.principal.preco"] = o.comoFalar;
  vars["oferta.principal.avista"] = o.precoAVista;
  vars["oferta.principal.urgencia"] = o.urgenciaReal;
  return m.vars.aplicarVars(prompt, vars);
}

test("roster padrão: os 7 agentes prometidos, slugs únicos, recuperação de carrinho nasce desligada", () => {
  const slugs = m.prompts.AGENTES_PADRAO.map((a) => a.slug);
  assert.deepEqual(slugs, [
    "qualificacao-agendamento",
    "confirmacao-reuniao",
    "no-show",
    "proposta",
    "followup",
    "nutricao",
    "recuperacao-carrinho",
  ]);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(m.prompts.definicaoPorSlug("recuperacao-carrinho")?.ativoPadrao, false);
  for (const a of m.prompts.AGENTES_PADRAO) {
    assert.ok(a.gatilhoTag || a.gatilhoEstagio || a.gatilhoOrigem, `${a.slug} sem gatilho`);
    assert.ok(a.testesDeMesa.length > 0, `${a.slug} sem teste de mesa`);
  }
});

test("prompts (roster e recepção) não citam negócio fixo e toda variável usada existe", () => {
  const textos = [...m.prompts.AGENTES_PADRAO.map((a) => a.prompt), m.recepcao.promptPadrao()];
  for (const t of textos) {
    assert.doesNotMatch(t, NOMES_PROIBIDOS);
    const final = resolver(t);
    assert.doesNotMatch(final, /VARIÁVEL DESCONHECIDA/, final.match(/\[VARIÁVEL DESCONHECIDA: [^\]]+\]/)?.[0]);
    assert.match(final, /Ana/);
  }
});

test("recepção e qualificação levam para a reunião pelo link de agendamento", () => {
  assert.match(resolver(m.recepcao.promptPadrao()), /https:\/\/agenda\.exemplo\.com/);
  assert.match(resolver(m.prompts.definicaoPorSlug("qualificacao-agendamento")!.prompt), /https:\/\/agenda\.exemplo\.com/);
});

test("primeira mensagem: página humanizada, apresentação do negócio, sem combinados fixos", () => {
  assert.equal(m.primeira.paginaDeCadastro("funil:agendamento-rapido"), "página Agendamento Rapido");
  assert.equal(m.primeira.paginaDeCadastro("anuncio"), null);
  assert.deepEqual(m.primeira.combinadosDaAbertura(), []);
  const regra = m.primeira.regraPrimeiraMensagem("funil:agendamento");
  assert.match(regra, /Monto o plano alimentar/);
  assert.doesNotMatch(regra, NOMES_PROIBIDOS);
});

test("sequência de iscas: material pela origem, link do formulário ou do negocio.json", () => {
  const comLink = m.iscas.materialDoContato({ origem: "funil:isca-guia-do-treino", customFields: { material_link: "https://x.com/g" } });
  assert.deepEqual(comLink, { nome: "Guia do treino", link: "https://x.com/g", destaque: "" });
  const padrao = m.iscas.materialDoContato({ origem: "funil:material-receitas", customFields: {} });
  assert.equal(padrao?.link, "https://exemplo.com/guia");
  assert.equal(m.iscas.materialDoContato({ origem: "anuncio", customFields: {} }), null);
  for (const passo of [1, 2, 3, 4] as const) {
    const t = m.iscas.montarMensagem(passo, "Bia Lima", padrao!, "funil:material-receitas");
    assert.doesNotMatch(t, NOMES_PROIBIDOS);
    assert.ok(t.split("\n\n").length >= 2);
  }
  assert.match(m.iscas.conviteReuniaoPasso4("Bia"), /agenda\.exemplo\.com/);
});

test("no-show: 5 toques, todos com o link de agendamento, sem número inventado", () => {
  for (const d of [1, 7, 30, 60]) {
    const t = m.noshow.textoNoShow(d, "Carlos Silva") ?? "";
    assert.match(t, /agenda\.exemplo\.com/, `dia ${d}`);
    assert.doesNotMatch(t, NOMES_PROIBIDOS);
    assert.doesNotMatch(t, /R\$/);
  }
  assert.match(m.noshow.textoNoShow(15, "Carlos") ?? "", /exemplo\.com\/guia/);
  assert.ok(m.noshow.textoNoShow(1, "")?.startsWith("Recentemente"));
});

test("sequência de proposta: sem dado inventado, sem condição da estação e voz da equipe", () => {
  const c = {
    nome: "Pedro Ferreira",
    oferta: { entregas: ["plano alimentar", "ajuste quinzenal"], garantia: null, videoResumo: false },
    ofertaBase: "padrao",
    precoTotalCentavos: 180_000,
    parcelaCentavos: 32_000,
    linkProposta: "https://exemplo.com/propostas/pedro",
    inicio: new Date("2026-11-03T21:00:00Z"),
    agora: new Date("2026-11-10T12:05:00Z"),
    tomSerio: false,
    canal: "pelo digital",
    nToques: 6,
  };
  assert.equal(m.seqprop.FATO_FUNIL, "");
  assert.equal(m.seqprop.textoD3(c), null);
  for (const d of [1, 7, 15, 30, 60, 90]) {
    const t = m.seqprop.textoDoPasso(d, c) ?? "";
    assert.ok(t.length > 20, `D+${d}`);
    assert.doesNotMatch(t, NOMES_PROIBIDOS);
    assert.doesNotMatch(t, /\n\n\n/, `D+${d} bloco vazio`);
  }
  assert.match(m.seqprop.textoD1(c), /proposta\/?.*pedro|propostas\/pedro/);
  assert.match(m.seqprop.textoD90(c), /6 mensagens nossas/);
});

test("página da reunião: chave gravada ou caminho da URL", () => {
  assert.equal(m.pagina.origemDaReuniao({ pagina: "agendar" }).pagina, "Página de agendamento");
  assert.equal(m.pagina.origemDaReuniao({ origem_url: "https://x.com/consulta-gratis/?a=1" }).chave, "consulta-gratis");
  assert.equal(m.pagina.origemDaReuniao(null).pagina, m.pagina.SEM_PAGINA);
});

test("links de proposta: host proposta*, caminho /proposta ou base do negocio.json; checkout fica de fora", () => {
  const achados = m.links.linksDePropostaEm([
    "veja https://proposta-pedro.site.com/ e https://exemplo.com/propostas/ana.",
    "pague em https://pay.checkout.com/abc",
  ]);
  assert.deepEqual(achados, ["https://proposta-pedro.site.com/", "https://exemplo.com/propostas/ana"]);
});

test("travas opcionais nascem desligadas: começando do zero, páginas sem robô, estação, produto de entrada", () => {
  assert.deepEqual([...m.zero.AGENTES_COMECANDO_DO_ZERO], []);
  assert.doesNotMatch(m.zero.textoComecandoDoZero().join(" "), /R\$/);
  assert.deepEqual([...m.resumo.PAGINAS_DE_CONSULTORIA], []);
  assert.equal(m.resumo.ehPaginaDeConsultoria("https://exemplo.com/acompanhamento"), false);
  assert.equal(m.sazonal.ofertaVigente(new Date("2026-11-20T12:00:00Z")), null);
  assert.equal(m.objecao.furaHumano({ ultimaDoLead: "tá caro", nossaUltima: "", enviadas: [], ultimaEhDoLead: true }), false);
  assert.equal(m.onc.PRECO_SPRINT_CENTAVOS, 0);
});

test("oferta na conversa: a página da oferta enviada vale o preço do negocio.json", () => {
  const o = m.onc.ofertaMaisRecente([{ body: "Aqui: https://exemplo.com/acompanhamento", timestamp: new Date("2026-11-10T12:00:00Z") }]);
  assert.equal(o?.centavos, 180_000);
  assert.equal(o?.rotulo, "Acompanhamento 90 dias");
});

test("conteúdo do D+15: material gratuito do negocio.json, sem repetir o que já foi enviado", () => {
  assert.equal(m.conteudos.escolherConteudo([], [])?.url, "https://exemplo.com/guia");
  assert.equal(m.conteudos.escolherConteudo([], ["já mandei https://exemplo.com/guia"]), null);
});

test("convite do grupo e proposta automática: textos do negócio, sem valor", () => {
  const t = m.grupo.mensagem("Bia");
  assert.match(t, /agenda\.exemplo\.com/);
  assert.doesNotMatch(t, NOMES_PROIBIDOS);
  const final = m.pauto.mensagemFinal({ nome: "Bia", link: "https://exemplo.com/propostas/bia", linha: "", ticket: null });
  assert.doesNotMatch(final, /R\$|NOMES/);
  assert.doesNotMatch(final, NOMES_PROIBIDOS);
  assert.equal(m.pauto.nVendasParaLucro(900), 4);
});
