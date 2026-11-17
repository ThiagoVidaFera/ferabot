import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { criarBancoTemporario } from "./banco-temporario";

/**
 * Proposta automática depois do "pode" (15/11/2026), do começo ao fim contra um banco descartável.
 * Fora do ar de verdade: WhatsApp (WAHA), Gemini e o proposta-svc são simulados por um `fetch` falso.
 */
const banco = criarBancoTemporario();
process.env.PROPOSTA_SVC_URL = "http://svc.test";
process.env.PROPOSTA_SVC_KEY = "chave-teste";
process.env.GEMINI_API_KEY = "gemini-teste";

type Dbm = typeof import("../../src/lib/db");
let db: Dbm["db"];
let auto: typeof import("../../src/lib/proposta-auto");
let conversa: typeof import("../../src/lib/agente-conversa");
let agenteId: string;
let agente: NonNullable<Awaited<ReturnType<Dbm["db"]["agent"]["findFirst"]>>>;

const FALAS = ["Mentoria 3 mil", "Mas não vendo", "Não tem cliente", "Acho q a questão não é a agência, mas uma definição exata do produto para o cliente", "Pode"];
const URL_PROPOSTA = "https://proposta-viviane.exemplo.com";

const parte = (ouviFala = "“Mentoria 3 mil… Mas não vendo.”") => ({
  linha_pessoal: "Olhei o teu Instagram e o teu site, e a primeira coisa que a gente resolve é qual oferta vai na frente.",
  hero: { destaque: "alunos prontos para a mentoria", lead: "Você tem 20 anos de sala de aula e uma mentoria individual." },
  ouvi_lead: "Você me disse que a questão é a definição do produto.",
  ouvi: [
    { fala: ouviFala, explica: "A mentoria existe e tem preço." },
    { fala: "“Não tem cliente”", explica: "Esse é o ponto central." },
    { fala: "Tua meta: clareza da oferta e as primeiras vendas.", explica: "É uma meta honesta." },
  ],
  fluxo: { hoje_d: "Hoje o aluno vê sete ofertas.", hoje: "Hoje: sete ofertas", com: "Com a estrutura: chega sabendo", resultados: ["Descobre → vê", "Assiste → confia", "Lê o livro → chama"] },
  cenario: { cenas: [{ t: "Quem chega já sabe.", d: "Cita a prova." }, { t: "Você sabe de onde veio.", d: "Cada contato tem origem." }, { t: "Você decide com número.", d: "Abre o painel." }] },
  calculadora: { ticket: 3000, unidade_plural: "mentorias", rotulo_valor: "Valor da tua mentoria (R$)", rotulo_qtd: "Quantas mentorias por mês?" },
  personalizar_entregas: [{ muda: "o perfil escolhe uma oferta." }, { muda: "aulas curtas." }, { muda: "livro digital." }, { muda: "conversa guiada." }],
});

type Mundo = {
  enviados: string[];
  jobs: Record<string, unknown>[];
  statusDoJob: "running" | "done" | "failed";
  svcFora: boolean;
  jobsFora: boolean;
  respostasGemini: string[];
};
let mundo: Mundo;
const fetchOriginal = globalThis.fetch;

function instalarFetchFalso(): void {
  globalThis.fetch = (async (entrada: string | URL | Request, init?: RequestInit) => {
    const url = String(entrada);
    const json = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
    if (url.includes("waha.test/api/sendText")) {
      mundo.enviados.push((JSON.parse(String(init?.body)) as { text: string }).text);
      return json({ id: `msg-${mundo.enviados.length}` });
    }
    if (url.includes("generativelanguage")) {
      const texto = mundo.respostasGemini.shift() ?? mundo.respostasGemini[0] ?? "";
      return json({ candidates: [{ content: { parts: [{ text: texto }] } }] });
    }
    if (url.startsWith("http://svc.test")) {
      if (mundo.svcFora) throw new Error("conexão recusada");
      if (url.endsWith("/health")) return json({ ok: true });
      if (url.endsWith("/instagram")) return json({ ok: true, seguidores: 1972, posts: 66, bio: "Professora de Direito Constitucional", link_bio_resumo: "VB Academy: 7 ofertas" });
      if (url.endsWith("/jobs") && init?.method === "POST") {
        if (mundo.jobsFora) throw new Error("conexão recusada");
        mundo.jobs.push(JSON.parse(String(init.body)));
        return json({ id: "job-1" }, 202);
      }
      if (url.includes("/jobs/job-1")) return json({ status: mundo.statusDoJob, url: mundo.statusDoJob === "done" ? URL_PROPOSTA : null, validade: "2026-11-18T23:59:00-03:00", erro: mundo.statusDoJob === "failed" ? "gerador recusou" : null });
    }
    return json({}, 404);
  }) as typeof fetch;
}

before(async () => {
  ({ db } = await import("../../src/lib/db"));
  auto = await import("../../src/lib/proposta-auto");
  conversa = await import("../../src/lib/agente-conversa");
  await db.whatsappInstance.create({ data: { name: "teste-1740", provider: "waha", instanceName: "casamento-1740", evolutionApiUrl: "http://waha.test", evolutionApiKey: "k", isDefault: true } });
  agente = await db.agent.create({ data: { name: "CJC", slug: "consultoria-jornada-de-compra", prompt: "x", modo: "autonomo", ativo: true } });
  agenteId = agente.id;
});
beforeEach(async () => {
  mundo = { enviados: [], jobs: [], statusDoJob: "running", svcFora: false, jobsFora: false, respostasGemini: [JSON.stringify(parte())] };
  instalarFetchFalso();
  await db.agentAction.deleteMany();
  await db.whatsappMessage.deleteMany();
  await db.timelineEvent.deleteMany();
  await db.contact.deleteMany();
});
after(async () => {
  globalThis.fetch = fetchOriginal;
  await db.$disconnect();
  banco.apagar();
});

async function criarLead(ultimaFala = "Pode", tags: string[] = ["aguardando-pode"], opcoes: { convite?: boolean } = {}) {
  const inst = await db.whatsappInstance.findFirstOrThrow();
  const c = await db.contact.create({
    data: {
      name: "Viviane Bastos",
      phone: "5511900000170",
      origem: "funil:plano-faturamento",
      lifecycleStage: "proposta",
      tags: tags as never,
      customFields: { instagram: "prof.vivianebastos", faturamento: "Mentoria 3 mil", utm_content: "plano-100k-video" } as never,
    },
  });
  const antes = FALAS.slice(0, -1);
  let t = Date.now() - 3 * 3_600_000;
  for (const body of antes) {
    await db.whatsappMessage.create({ data: { contactId: c.id, instanceId: inst.id, fromNumber: "5511900000170", toNumber: "crm", body, direction: "inbound", timestamp: new Date((t += 60_000)) } });
  }
  if (opcoes.convite !== false) {
    await db.whatsappMessage.create({ data: { contactId: c.id, instanceId: inst.id, fromNumber: "crm", toNumber: "5511900000170", body: "Posso te mandar aqui o resumo de como funciona nossa consultoria?", direction: "outbound", timestamp: new Date(Date.now() - 30 * 60_000), metadata: { origem: "agente", agente: "consultoria-jornada-de-compra" } as never } });
  }
  await db.whatsappMessage.create({ data: { contactId: c.id, instanceId: inst.id, fromNumber: "5511900000170", toNumber: "crm", body: ultimaFala, direction: "inbound", timestamp: new Date(Date.now() - 20 * 60_000) } });
  return c;
}

const estadoDe = async (id: string) => auto.lerEstado((await db.contact.findUniqueOrThrow({ where: { id } })).customFields);
const tagsDo = async (id: string) => ((await db.contact.findUniqueOrThrow({ where: { id } })).tags as string[]) ?? [];

test("caminho feliz: 'pode' → aviso curto → composição → job → página pronta → mensagem final, oferta registrada e robô para", async () => {
  const c = await criarLead();
  const r = await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  assert.equal(r.iniciada, true);
  assert.equal(mundo.enviados.length, 1);
  assert.match(mundo.enviados[0], /Legal, Viviane\./);
  assert.equal((await estadoDe(c.id))?.estado, "compondo");

  await auto.processarPropostasAuto();
  assert.equal(mundo.jobs.length, 1, "criou o job no serviço");
  const job = mundo.jobs[0] as { slug: string; proposta: Record<string, any> };
  assert.match(job.slug, /^viviane-[0-9a-f]{6}$/);
  assert.equal(job.proposta.cliente.slug, job.slug);
  assert.deepEqual(job.proposta.oferta, {
    // vem do negocio.json de exemplo: "R$ 2.000 à vista ou 10x de R$ 230"
    a_vista: 2000,
    parcelas: 10,
    parcela: 230,
  });
  assert.equal(job.proposta.marca, "padrao");
  assert.equal(job.proposta.cliente.whatsapp, "5511900000170");
  assert.equal((await estadoDe(c.id))?.estado, "gerando");
  assert.equal(mundo.enviados.length, 1, "ainda não mandou a proposta");

  mundo.statusDoJob = "done";
  await auto.processarPropostasAuto();
  assert.equal(mundo.enviados.length, 2);
  assert.match(mundo.enviados[1], new RegExp(URL_PROPOSTA.replace(/\./g, "\\.")));
  assert.match(mundo.enviados[1], /2 vendas/);
  assert.doesNotMatch(mundo.enviados[1], /7\.500|3\.000|15×|6\.500|\b500\b/, "preço só na página");
  assert.equal((await estadoDe(c.id))?.estado, "enviada");
  const tags = await tagsDo(c.id);
  assert.ok(tags.includes("proposta-auto-enviada") && tags.includes("humano"), tags.join(","));
  const campos = (await db.contact.findUniqueOrThrow({ where: { id: c.id } })).customFields as Record<string, any>;
  assert.equal(campos.proposta.ofertaBase, "principal");
  assert.equal(campos.proposta.link, URL_PROPOSTA);

  await auto.processarPropostasAuto();
  assert.equal(mundo.enviados.length, 2, "nunca manda duas vezes");
});

test("idempotente: segundo 'pode' não reinicia", async () => {
  const c = await criarLead();
  assert.equal((await auto.iniciarPropostaAuto({ agenteId, contactId: c.id })).iniciada, true);
  const de_novo = await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  assert.equal(de_novo.iniciada, false);
  assert.equal(mundo.enviados.length, 1);
});

test("fala inventada em item que sobra: o item SAI da página (nunca vira resumo sem aspas)", async () => {
  const c = await criarLead();
  const quatro = parte();
  quatro.ouvi.push({ fala: "“Acho q a questão não é a agência, mas uma definição exata do produto para o cliente”", explica: "ok" });
  quatro.ouvi[1] = { fala: "“Estou desesperada por clientes”", explica: "x" };
  const inventada = JSON.stringify(quatro);
  mundo.respostasGemini = [inventada, inventada];
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  await auto.processarPropostasAuto();
  assert.equal(mundo.jobs.length, 1, JSON.stringify(await estadoDe(c.id)));
  const ouvi = (mundo.jobs[0] as { proposta: { ouvi: { fala: string }[] } }).proposta.ouvi;
  assert.equal(ouvi.length, 3);
  assert.ok(ouvi.every((o) => !/desesperada/.test(o.fala)), JSON.stringify(ouvi));
});

test("fala inventada e só 3 itens: falha em vez de publicar", async () => {
  const c = await criarLead();
  const inventada = JSON.stringify(parte("“Estou desesperada por clientes”"));
  mundo.respostasGemini = [inventada, inventada];
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  await auto.processarPropostasAuto();
  assert.equal(mundo.jobs.length, 0);
  assert.equal((await estadoDe(c.id))?.estado, "falhou");
});

test("modelo devolve lixo duas vezes: falha sem job, avisa, tag revisar, lead não recebe texto de travada", async () => {
  const c = await criarLead();
  mundo.respostasGemini = ["isso não é json", "nem isso"];
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  await auto.processarPropostasAuto();
  assert.equal(mundo.jobs.length, 0);
  assert.equal((await estadoDe(c.id))?.estado, "falhou");
  assert.ok((await tagsDo(c.id)).includes("revisar"));
  assert.equal(mundo.enviados.length, 1, "só o aviso inicial saiu");
});

test("serviço fora do ar na criação do job: falha explícita, tag humano e revisar", async () => {
  const c = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  mundo.jobsFora = true;
  await auto.processarPropostasAuto();
  const e = await estadoDe(c.id);
  assert.equal(e?.estado, "falhou");
  assert.match(e?.erro ?? "", /fora do ar|nao configurados|proposta-svc/i);
  const tags = await tagsDo(c.id);
  assert.ok(tags.includes("revisar") && tags.includes("humano"), tags.join(","));
});

test("serviço fora do ar ANTES de dizer 'estou montando': não manda aviso nenhum e passa pra gente", async () => {
  const c = await criarLead();
  mundo.svcFora = true;
  const r = await conversa.atenderCom(agente, c.id);
  assert.equal(r.atendeu, false);
  assert.equal(mundo.enviados.length, 0, "o lead não recebe promessa que não vai cumprir");
  assert.equal(await estadoDe(c.id), null);
  assert.ok((await tagsDo(c.id)).includes("humano"));
});

test("job que falha no gerador: falha e não envia nada", async () => {
  const c = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  await auto.processarPropostasAuto();
  mundo.statusDoJob = "failed";
  await auto.processarPropostasAuto();
  assert.equal((await estadoDe(c.id))?.estado, "falhou");
  assert.equal(mundo.enviados.length, 1);
});

test("se o dono falou na conversa enquanto a página era gerada, o robô NÃO manda por cima", async () => {
  const c = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  await auto.processarPropostasAuto();
  const inst = await db.whatsappInstance.findFirstOrThrow();
  await db.whatsappMessage.create({ data: { contactId: c.id, instanceId: inst.id, fromNumber: "crm", toNumber: "5511900000170", body: "Oi Viviane, já te mando a proposta", direction: "outbound", timestamp: new Date(Date.now() + 1000), metadata: { origem: "celular", fonte: "app" } as never } });
  mundo.statusDoJob = "done";
  await auto.processarPropostasAuto();
  assert.equal(mundo.enviados.length, 1, "nada além do aviso inicial");
  assert.equal((await estadoDe(c.id))?.estado, "falhou");
});

test("lead que optou por sair no meio: a guarda de toque barra o envio", async () => {
  const c = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  await auto.processarPropostasAuto();
  await db.contact.update({ where: { id: c.id }, data: { tags: ["aguardando-pode", "optout"] as never } });
  mundo.statusDoJob = "done";
  await auto.processarPropostasAuto();
  assert.equal(mundo.enviados.length, 1);
  assert.equal((await estadoDe(c.id))?.estado, "falhou");
});

test("gancho no agente: 'Pode' depois do convite inicia a proposta; qualquer outra coisa vira conversa com gente", async () => {
  const a = await criarLead("Pode");
  const r1 = await conversa.atenderCom(agente, a.id);
  assert.equal(r1.atendeu, true, r1.motivo);
  assert.equal((await estadoDe(a.id))?.estado, "compondo");

  await db.contact.deleteMany();
  const b = await criarLead("Quanto custa?");
  const r2 = await conversa.atenderCom(agente, b.id);
  assert.equal(r2.atendeu, false);
  assert.equal(await estadoDe(b.id), null);
  assert.ok((await tagsDo(b.id)).includes("humano"));
});

test("durante a geração o robô fica em silêncio se o lead escreve de novo", async () => {
  const c = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  const r = await conversa.atenderCom(agente, c.id);
  assert.equal(r.atendeu, false);
  assert.match(r.motivo ?? "", /silêncio/);
  assert.equal(mundo.enviados.length, 1);
});

test("dois leads com o mesmo primeiro nome no mesmo dia recebem páginas diferentes", async () => {
  const a = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: a.id });
  await auto.processarPropostasAuto();
  const b = await db.contact.create({ data: { name: "Viviane Lima", phone: "5511988887777", origem: "funil:plano-faturamento", lifecycleStage: "proposta", tags: ["aguardando-pode"] as never, customFields: {} as never } });
  const inst = await db.whatsappInstance.findFirstOrThrow();
  for (const body of FALAS) await db.whatsappMessage.create({ data: { contactId: b.id, instanceId: inst.id, fromNumber: "5511988887777", toNumber: "crm", body, direction: "inbound", timestamp: new Date() } });
  await auto.iniciarPropostaAuto({ agenteId, contactId: b.id });
  await auto.processarPropostasAuto();
  const slugs = mundo.jobs.map((j) => (j as { slug: string }).slug);
  assert.equal(new Set(slugs).size, slugs.length, slugs.join(","));
});

test("o lead escreveu 'pera, não quero mais' enquanto a página era gerada: NÃO envia, passa pra gente", async () => {
  const c = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  await auto.processarPropostasAuto();
  const inst = await db.whatsappInstance.findFirstOrThrow();
  await db.whatsappMessage.create({ data: { contactId: c.id, instanceId: inst.id, fromNumber: "5511900000170", toNumber: "crm", body: "pera, não quero mais", direction: "inbound", timestamp: new Date(Date.now() + 1000) } });
  mundo.statusDoJob = "done";
  await auto.processarPropostasAuto();
  assert.equal(mundo.enviados.length, 1);
  assert.equal((await estadoDe(c.id))?.estado, "falhou");
  assert.ok((await tagsDo(c.id)).includes("humano"));
});

test("o lead só agradeceu enquanto a página era gerada: envia normalmente", async () => {
  const c = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  await auto.processarPropostasAuto();
  const inst = await db.whatsappInstance.findFirstOrThrow();
  await db.whatsappMessage.create({ data: { contactId: c.id, instanceId: inst.id, fromNumber: "5511900000170", toNumber: "crm", body: "Obrigada!", direction: "inbound", timestamp: new Date(Date.now() + 1000) } });
  mundo.statusDoJob = "done";
  await auto.processarPropostasAuto();
  assert.equal(mundo.enviados.length, 2);
  assert.equal((await estadoDe(c.id))?.estado, "enviada");
});

test("outro processo já reivindicou o envio: este não manda (sem duplicar)", async () => {
  const c = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  await auto.processarPropostasAuto();
  await db.notificacao.create({ data: { tipo: "proposta-auto-passo", chave: `${c.id}:enviar` } });
  mundo.statusDoJob = "done";
  await auto.processarPropostasAuto();
  assert.equal(mundo.enviados.length, 1, "só o aviso inicial");
});

test("dois ticks concorrentes no mesmo job pronto: uma mensagem só", async () => {
  const c = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  await auto.processarPropostasAuto();
  mundo.statusDoJob = "done";
  await Promise.all([auto.processarPropostasAuto(), auto.processarPropostasAuto()]);
  assert.equal(mundo.enviados.length, 2, "aviso + UMA proposta");
});

test("estado 'enviando' que não confirma em 10 min vira falha com aviso 'confira na conversa'", async () => {
  const c = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  const antigo = new Date(Date.now() - 11 * 60_000).toISOString();
  const campos = (await db.contact.findUniqueOrThrow({ where: { id: c.id } })).customFields as Record<string, any>;
  await db.contact.update({ where: { id: c.id }, data: { customFields: { ...campos, propostaAuto: { ...campos.propostaAuto, estado: "enviando", atualizadoEm: antigo } } as never } });
  await auto.processarPropostasAuto();
  assert.equal((await estadoDe(c.id))?.estado, "falhou");
  assert.ok((await tagsDo(c.id)).includes("humano"));
});

test("composição parada há mais de 25 minutos falha sozinha (sem ficar tentando para sempre)", async () => {
  const c = await criarLead();
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  const campos = (await db.contact.findUniqueOrThrow({ where: { id: c.id } })).customFields as Record<string, any>;
  const velha = new Date(Date.now() - 30 * 60_000).toISOString();
  await db.contact.update({ where: { id: c.id }, data: { customFields: { ...campos, propostaAuto: { ...campos.propostaAuto, iniciadaEm: velha } } as never } });
  await auto.processarPropostasAuto();
  assert.equal(mundo.jobs.length, 0);
  assert.equal((await estadoDe(c.id))?.estado, "falhou");
});

test("'quanto custa?' seguido de 'pode': a pergunta de preço manda, vai pra gente", async () => {
  const c = await criarLead("Pode", ["aguardando-pode"], { convite: false });
  const inst = await db.whatsappInstance.findFirstOrThrow();
  await db.whatsappMessage.create({ data: { contactId: c.id, instanceId: inst.id, fromNumber: "5511900000170", toNumber: "crm", body: "quanto custa?", direction: "inbound", timestamp: new Date(Date.now() - 1_800_000) } });
  await db.whatsappMessage.create({ data: { contactId: c.id, instanceId: inst.id, fromNumber: "crm", toNumber: "5511900000170", body: "Posso te mandar aqui o resumo de como funciona nossa consultoria?", direction: "outbound", timestamp: new Date(Date.now() - 4_000_000), metadata: { origem: "agente" } as never } });
  const r = await conversa.atenderCom(agente, c.id);
  assert.equal(r.atendeu, false);
  assert.equal(await estadoDe(c.id), null);
  assert.ok((await tagsDo(c.id)).includes("humano"));
});

test("convite de mais de 72h: a tag antiga não dispara proposta com um 'ok' qualquer", async () => {
  const c = await criarLead("ok", ["aguardando-pode"], { convite: false });
  const inst = await db.whatsappInstance.findFirstOrThrow();
  await db.whatsappMessage.create({ data: { contactId: c.id, instanceId: inst.id, fromNumber: "crm", toNumber: "5511900000170", body: "Posso te mandar aqui o resumo de como funciona nossa consultoria?", direction: "outbound", timestamp: new Date(Date.now() - 4 * 86_400_000), metadata: { origem: "agente" } as never } });
  await conversa.atenderCom(agente, c.id).catch(() => null);
  assert.equal(await estadoDe(c.id), null);
});

test("sem Instagram nem site, a composição que 'olhou o perfil' é recusada", async () => {
  const c = await criarLead();
  await db.contact.update({ where: { id: c.id }, data: { customFields: { faturamento: "Mentoria 3 mil" } as never } });
  await auto.iniciarPropostaAuto({ agenteId, contactId: c.id });
  await auto.processarPropostasAuto();
  assert.equal(mundo.jobs.length, 0);
  assert.equal((await estadoDe(c.id))?.estado, "falhou");
});
