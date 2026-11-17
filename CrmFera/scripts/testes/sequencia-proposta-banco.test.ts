import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { criarBancoTemporario } from "./banco-temporario";

const banco = criarBancoTemporario();

type Mod = typeof import("../../src/lib/sequencia-proposta");
type Dbm = typeof import("../../src/lib/db");
let seq: Mod;
let db: Dbm["db"];
let instanceId: string;

before(async () => {
  seq = await import("../../src/lib/sequencia-proposta");
  ({ db } = await import("../../src/lib/db"));
  const inst = await db.whatsappInstance.create({ data: { name: "teste-1740", provider: "waha", instanceName: "casamento-1740" } });
  instanceId = inst.id;
});
beforeEach(async () => {
  // cada teste começa sem leads: o envio é 1 por vez e leads antigos tomariam a vez
  await db.whatsappMessage.deleteMany();
  await db.contact.deleteMany();
});
after(async () => {
  await db.$disconnect();
  banco.apagar();
});

const D0 = new Date("2026-11-03T21:00:00Z"); // terça 18h em Brasília
const NA_JANELA = new Date("2026-11-10T12:05:00Z"); // terça 9h05

async function criarLead(nome: string, opcoes: { tags?: string[]; legado?: string[]; stage?: string } = {}) {
  const c = await db.contact.create({
    data: {
      name: nome,
      phone: `55519${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
      lifecycleStage: opcoes.stage ?? "proposta",
      tags: (opcoes.tags ?? []) as never,
      customFields: {
        proposta: { ofertaBase: "padrao", link: `https://proposta-${nome.toLowerCase()}.exemplo.com`, enviadaEm: "2026-11-05T22:09:00Z" },
        maior_trava: "Aumentar número de reuniões de venda",
      } as never,
    },
  });
  const saida = (iso: string, body: string, metadata: object = { origem: "celular", fonte: "api" }) =>
    db.whatsappMessage.create({
      data: {
        contactId: c.id,
        instanceId,
        fromNumber: "x",
        toNumber: c.phone ?? "",
        body,
        direction: "outbound",
        timestamp: new Date(iso),
        metadata: metadata as never,
      },
    });
  await saida(D0.toISOString(), `Segue a proposta: https://proposta-${nome.toLowerCase()}.exemplo.com`);
  for (const iso of opcoes.legado ?? []) await saida(iso, "Voltei na proposta que te mandei. Ficou alguma dúvida?");
  return c;
}

const estadoDe = async (id: string) => {
  const c = await db.contact.findUniqueOrThrow({ where: { id } });
  return seq.lerSequencia(c.customFields);
};

test("adoção: D0 vem da mensagem com o link e os toques do robô antigo são contados", async () => {
  const c = await criarLead("Adocao", { legado: ["2026-11-05T14:00:00Z"] });
  assert.equal(await seq.adotarSequenciasProposta(NA_JANELA), 1);
  const e = await estadoDe(c.id);
  assert.ok(e);
  assert.equal(e.inicio, D0.toISOString());
  assert.deepEqual(e.legado, ["2026-11-05T14:00:00.000Z"]);
  assert.equal(seq.contarToques(e), 1);
  assert.equal(seq.proximoPasso(e)?.d, 7);
  // idempotente
  assert.equal(await seq.adotarSequenciasProposta(NA_JANELA), 0);
});

test("lead sem proposta registrada ou fora do estágio proposta não ganha sequência", async () => {
  const semRegistro = await db.contact.create({ data: { name: "SemRegistro", phone: "5511900000001", lifecycleStage: "proposta" } });
  const foraDoEstagio = await criarLead("Cliente", { stage: "cliente" });
  await seq.adotarSequenciasProposta(NA_JANELA);
  assert.equal(await estadoDe(semRegistro.id), null);
  assert.equal(await estadoDe(foraDoEstagio.id), null);
});

test("modo teste: decide, devolve o texto e não envia nem grava passo", async () => {
  const c = await criarLead("Teste");
  let chamadas = 0;
  const r = await seq.processarSequenciasProposta({
    agora: NA_JANELA,
    modo: "teste",
    enviar: async () => {
      chamadas++;
      return { ok: true };
    },
    midiaExiste: () => false,
  });
  const dele = r.decisoes.find((d) => d.contactId === c.id);
  assert.equal(chamadas, 0);
  assert.equal(r.enviados, 0);
  assert.equal(dele?.acao, "enviar");
  assert.equal(dele?.passo, 7);
  assert.match(dele?.texto ?? "", /^\*Teste, uma pergunta que costuma destravar a decisão/);
  assert.doesNotMatch(dele?.texto ?? "", /guardanapo|R\$ 500/); // não perguntou preço: sem valor
  assert.equal((await estadoDe(c.id))?.passos.find((p) => p.d === 7)?.status, "pendente");
});

test("modo desligado só adota; não decide nem envia", async () => {
  const r = await seq.processarSequenciasProposta({ agora: NA_JANELA, modo: "desligado" });
  assert.equal(r.decisoes.length, 0);
  assert.equal(r.enviados, 0);
});

test("modo envio: manda o passo, grava a mensagem com rótulo do cron e marca o passo como enviado", async () => {
  const c = await criarLead("Envio");
  const enviados: string[] = [];
  const r = await seq.processarSequenciasProposta({
    agora: NA_JANELA,
    modo: "envio",
    enviar: async (p) => {
      enviados.push(p.rotulo);
      // simula o que o envio real faz: nada além de responder ok
      await db.whatsappMessage.create({
        data: { contactId: p.contatoId, instanceId: p.instanceId, fromNumber: "crm", toNumber: p.telefone, body: p.texto, direction: "outbound", timestamp: NA_JANELA, metadata: { origem: "followup", followup: p.rotulo, ator: "cron" } as never },
      });
      return { ok: true, externalId: "ext-1" };
    },
    midiaExiste: () => false,
  });
  assert.equal(r.enviados, 1);
  assert.equal(enviados.length, 1);
  assert.equal(enviados[0], "proposta-d7-a");
  const e = await estadoDe(c.id);
  assert.equal(e?.passos.find((p) => p.d === 7)?.status, "enviado");
  assert.equal(e?.passos.find((p) => p.d === 7)?.enviadoEm, NA_JANELA.toISOString());
});

test("envio falho deixa o passo pendente para o próximo minuto", async () => {
  const c = await criarLead("Falha");
  const r = await seq.processarSequenciasProposta({
    agora: new Date(NA_JANELA.getTime() + 10 * 60_000),
    modo: "envio",
    enviar: async () => ({ ok: false, erro: "HTTP 500" }),
    midiaExiste: () => false,
  });
  assert.equal(r.enviados, 0);
  assert.equal((await estadoDe(c.id))?.passos.find((p) => p.d === 7)?.status, "pendente");
});

test("dois toques seguidos sem resposta: o próximo toque sai como esqueleto (imagem + legenda)", async () => {
  const c = await criarLead("Esqueleto", { legado: ["2026-11-04T14:00:00Z", "2026-11-08T14:00:00Z"] });
  let envio: { tipo: string; arquivo?: string; texto: string; rotulo: string } | null = null;
  const r = await seq.processarSequenciasProposta({
    agora: new Date(NA_JANELA.getTime() + 30 * 60_000),
    modo: "envio",
    enviar: async (p) => {
      if (p.contatoId === c.id) envio = { tipo: p.tipo, arquivo: p.arquivo, texto: p.texto, rotulo: p.rotulo };
      return { ok: true };
    },
    midiaExiste: () => true,
  });
  assert.ok(r.enviados >= 1);
  assert.ok(envio);
  const e = envio as { tipo: string; arquivo?: string; texto: string; rotulo: string };
  assert.equal(e.tipo, "imagem-esqueleto");
  assert.match(e.arquivo ?? "", /^esqueleto-[ab]\.png$/);
  assert.match(e.texto, /banco da praça/);
  assert.doesNotMatch(e.texto, /relacionamento tóxico/);
  assert.match(e.rotulo, /^proposta-esqueleto-[ab]$/);
  const estado = await estadoDe(c.id);
  assert.ok(estado?.esqueleto);
  assert.match(estado?.passos.find((p) => p.d === 7)?.variante ?? "", /^esqueleto-/);
});

test("imagem do esqueleto ausente: manda o texto normal do passo, sem marcar esqueleto", async () => {
  const c = await criarLead("SemImagem", { legado: ["2026-11-04T14:00:00Z", "2026-11-08T14:00:00Z"] });
  let tipo = "";
  await seq.processarSequenciasProposta({
    agora: new Date(NA_JANELA.getTime() + 60 * 60_000),
    modo: "envio",
    enviar: async (p) => {
      if (p.contatoId === c.id) tipo = p.tipo;
      return { ok: true };
    },
    midiaExiste: () => false,
  });
  assert.equal(tipo, "texto");
  assert.equal((await estadoDe(c.id))?.esqueleto, undefined);
});

test("quando o estágio sai de proposta a sequência encerra e não envia", async () => {
  const c = await criarLead("Saiu");
  await seq.adotarSequenciasProposta(NA_JANELA);
  await db.contact.update({ where: { id: c.id }, data: { lifecycleStage: "cliente" } });
  const r = await seq.processarSequenciasProposta({ agora: NA_JANELA, modo: "envio", enviar: async () => ({ ok: true }), midiaExiste: () => false });
  assert.ok(r.decisoes.some((d) => d.contactId === c.id && d.acao === "encerrar"));
  assert.equal((await estadoDe(c.id))?.status, "encerrada");
});

test("depois da despedida sem resposta, a sequência conclui e o lead vai para Futuro", async () => {
  const c = await criarLead("Despedida");
  const base = seq.construirSequencia(D0, new Date("2027-02-10T12:00:00Z"));
  const e = {
    ...base,
    passos: base.passos.map((p) => (p.d === 90 ? { ...p, status: "enviado" as const, enviadoEm: "2027-02-01T12:00:00Z" } : { ...p, status: "pulado" as const })),
  };
  const atual = await db.contact.findUniqueOrThrow({ where: { id: c.id } });
  await db.contact.update({ where: { id: c.id }, data: { customFields: { ...(atual.customFields as object), sequencia_proposta: e } as never } });
  await seq.processarSequenciasProposta({ agora: new Date("2027-02-10T12:00:00Z"), modo: "envio", enviar: async () => ({ ok: true }), midiaExiste: () => false });
  const depois = await db.contact.findUniqueOrThrow({ where: { id: c.id } });
  assert.equal(depois.lifecycleStage, "futuro");
  assert.equal(seq.lerSequencia(depois.customFields)?.encerradaMotivo, "concluída");
});

test("cancelarSequenciaProposta encerra a sequência ativa", async () => {
  const c = await criarLead("Cancelar");
  await seq.adotarSequenciasProposta(NA_JANELA);
  await seq.cancelarSequenciaProposta(c.id, "botão desligado", NA_JANELA);
  const e = await estadoDe(c.id);
  assert.equal(e?.status, "encerrada");
  assert.equal(e?.encerradaMotivo, "botão desligado");
});

test("só 1 envio por rodada, mesmo com vários leads vencidos (anti-ban)", async () => {
  await criarLead("Um");
  await criarLead("Dois");
  await criarLead("Tres");
  const r = await seq.processarSequenciasProposta({
    agora: NA_JANELA,
    modo: "envio",
    enviar: async () => ({ ok: true }),
    midiaExiste: () => false,
  });
  assert.equal(r.enviados, 1);
});

// ---------- correções da revisão independente (09/11/2026) ----------

const semEnvio = async () => ({ ok: true });

test("dois ticks ao mesmo tempo: só um envia (trava em memória)", async () => {
  await criarLead("Corrida");
  let chamadas = 0;
  const enviar = async () => {
    chamadas++;
    await new Promise((r) => setTimeout(r, 80));
    return { ok: true };
  };
  const [a, b] = await Promise.all([
    seq.processarSequenciasProposta({ agora: NA_JANELA, modo: "envio", enviar, midiaExiste: () => false }),
    seq.processarSequenciasProposta({ agora: NA_JANELA, modo: "envio", enviar, midiaExiste: () => false }),
  ]);
  assert.equal(chamadas, 1);
  assert.equal([a, b].filter((r) => r.ocupado).length, 1);
});

test("mesmo passo em dois ticks seguidos: a reserva impede o 2º envio mesmo se o estado voltar a pendente", async () => {
  const c = await criarLead("Reserva");
  let chamadas = 0;
  const enviar = async () => {
    chamadas++;
    return { ok: true };
  };
  await seq.processarSequenciasProposta({ agora: NA_JANELA, modo: "envio", enviar, midiaExiste: () => false });
  // simula o pior caso: outro escritor do JSON devolveu o passo a pendente
  const atual = await db.contact.findUniqueOrThrow({ where: { id: c.id } });
  const e = seq.lerSequencia(atual.customFields);
  assert.ok(e);
  const revertido = { ...e, passos: e.passos.map((p) => (p.d === 7 ? { d: 7, devidoEm: p.devidoEm, status: "pendente" as const } : p)) };
  await db.contact.update({ where: { id: c.id }, data: { customFields: { ...(atual.customFields as object), sequencia_proposta: revertido } as never } });
  await db.whatsappMessage.deleteMany({ where: { contactId: c.id, fromNumber: "crm" } }); // nem o log salva: só a reserva
  await seq.processarSequenciasProposta({ agora: new Date(NA_JANELA.getTime() + 5 * 60_000), modo: "envio", enviar, midiaExiste: () => false });
  assert.equal(chamadas, 1);
});

test("o histórico de mensagens é a segunda fonte de verdade: rótulo já enviado cura o estado e não reenvia", async () => {
  const c = await criarLead("Historico");
  await seq.adotarSequenciasProposta(NA_JANELA); // a sequência já existe quando a mensagem aparece fora do JSON
  await db.whatsappMessage.create({
    data: {
      contactId: c.id,
      instanceId,
      fromNumber: "crm",
      toNumber: "x",
      body: "Conta de guardanapo",
      direction: "outbound",
      timestamp: new Date("2026-11-10T11:50:00Z"),
      metadata: { origem: "followup", followup: "proposta-d7-a", ator: "cron" } as never,
    },
  });
  let chamadas = 0;
  await seq.processarSequenciasProposta({
    agora: NA_JANELA,
    modo: "envio",
    enviar: async () => {
      chamadas++;
      return { ok: true };
    },
    midiaExiste: () => false,
  });
  assert.equal(chamadas, 0);
  assert.equal((await estadoDe(c.id))?.passos.find((p) => p.d === 7)?.status, "enviado");
});

test("reserva recente de outro processo: não envia; reserva antiga sem mensagem: marca envio incerto", async () => {
  const c = await criarLead("Preso");
  await seq.adotarSequenciasProposta(NA_JANELA);
  await db.setting.create({ data: { key: `seqprop:${c.id}:7`, value: new Date(NA_JANELA.getTime() - 60_000).toISOString() } });
  let chamadas = 0;
  const enviar = async () => {
    chamadas++;
    return { ok: true };
  };
  await seq.processarSequenciasProposta({ agora: NA_JANELA, modo: "envio", enviar, midiaExiste: () => false });
  assert.equal(chamadas, 0);
  assert.equal((await estadoDe(c.id))?.passos.find((p) => p.d === 7)?.status, "pendente");

  await db.setting.update({ where: { key: `seqprop:${c.id}:7` }, data: { value: new Date(NA_JANELA.getTime() - 60 * 60_000).toISOString() } });
  await seq.processarSequenciasProposta({ agora: NA_JANELA, modo: "envio", enviar, midiaExiste: () => false });
  assert.equal(chamadas, 0);
  const p7 = (await estadoDe(c.id))?.passos.find((p) => p.d === 7);
  assert.equal(p7?.status, "pulado");
  assert.match(p7?.motivo ?? "", /envio incerto/);
});

test("falha definitiva (HTTP 500): libera a reserva, tenta de novo só depois de 5 min e desiste na 2ª", async () => {
  const c = await criarLead("Definitiva");
  const falha = async () => ({ ok: false, erro: "HTTP 500: erro do WAHA" });
  await seq.processarSequenciasProposta({ agora: NA_JANELA, modo: "envio", enviar: falha, midiaExiste: () => false });
  let p7 = (await estadoDe(c.id))?.passos.find((p) => p.d === 7);
  assert.equal(p7?.status, "pendente");
  assert.equal(p7?.tentativas, 1);
  assert.equal(await db.setting.count({ where: { key: `seqprop:${c.id}:7` } }), 0);

  // 1 minuto depois: ainda em espera entre tentativas
  let chamadas = 0;
  const conta = async () => {
    chamadas++;
    return { ok: false, erro: "HTTP 500: erro do WAHA" };
  };
  await seq.processarSequenciasProposta({ agora: new Date(NA_JANELA.getTime() + 60_000), modo: "envio", enviar: conta, midiaExiste: () => false });
  assert.equal(chamadas, 0);

  // 6 minutos depois: 2ª tentativa, que também falha: o passo é pulado
  await seq.processarSequenciasProposta({ agora: new Date(NA_JANELA.getTime() + 6 * 60_000), modo: "envio", enviar: conta, midiaExiste: () => false });
  assert.equal(chamadas, 1);
  p7 = (await estadoDe(c.id))?.passos.find((p) => p.d === 7);
  assert.equal(p7?.status, "pulado");
  assert.match(p7?.motivo ?? "", /falhou 2 vezes/);
});

test("falha ambígua (timeout ou queda): nunca reenvia sozinho; fica pulado como envio incerto", async () => {
  const c = await criarLead("Ambigua");
  let chamadas = 0;
  const timeout = async () => {
    chamadas++;
    return { ok: false, erro: "The operation was aborted due to timeout" };
  };
  await seq.processarSequenciasProposta({ agora: NA_JANELA, modo: "envio", enviar: timeout, midiaExiste: () => false });
  await seq.processarSequenciasProposta({ agora: new Date(NA_JANELA.getTime() + 10 * 60_000), modo: "envio", enviar: timeout, midiaExiste: () => false });
  assert.equal(chamadas, 1);
  const p7 = (await estadoDe(c.id))?.passos.find((p) => p.d === 7);
  assert.equal(p7?.status, "pulado");
  assert.match(p7?.motivo ?? "", /envio incerto/);
  assert.ok(await db.auditEvent.findFirst({ where: { action: "toque_incerto" } }));
});

test("envio que lança exceção é tratado como ambíguo, não derruba os outros leads", async () => {
  await criarLead("Explode");
  const r = await seq.processarSequenciasProposta({
    agora: NA_JANELA,
    modo: "envio",
    enviar: async () => {
      throw new Error("socket hang up");
    },
    midiaExiste: () => false,
  });
  assert.equal(r.enviados, 0);
});

test("proposta nova (link diferente) recria a sequência com o D0 novo", async () => {
  const c = await criarLead("Revisada");
  await seq.adotarSequenciasProposta(NA_JANELA);
  const antes = await estadoDe(c.id);
  assert.equal(antes?.inicio, D0.toISOString());

  const atual = await db.contact.findUniqueOrThrow({ where: { id: c.id } });
  const campos = atual.customFields as Record<string, unknown>;
  await db.contact.update({
    where: { id: c.id },
    data: { customFields: { ...campos, proposta: { ofertaBase: "padrao", link: "https://proposta-revisada-2.exemplo.com", enviadaEm: "2026-11-20T15:00:00Z" } } as never },
  });
  await db.whatsappMessage.create({
    data: { contactId: c.id, instanceId, fromNumber: "x", toNumber: "x", body: "A nova: https://proposta-revisada-2.exemplo.com", direction: "outbound", timestamp: new Date("2026-11-20T14:50:00Z"), metadata: { origem: "celular", fonte: "app" } as never },
  });
  assert.equal(await seq.adotarSequenciasProposta(new Date("2026-11-20T16:00:00Z")), 1);
  const depois = await estadoDe(c.id);
  assert.equal(depois?.inicio, "2026-11-20T14:50:00.000Z");
  assert.equal(depois?.link, "https://proposta-revisada-2.exemplo.com");
});

test("D0 não é puxado para uma reenvio antigo do mesmo link: vale a mensagem mais próxima do registro", async () => {
  const c = await criarLead("Reenvio");
  await db.whatsappMessage.create({
    data: { contactId: c.id, instanceId, fromNumber: "x", toNumber: "x", body: "link de novo https://proposta-reenvio.exemplo.com", direction: "outbound", timestamp: new Date("2026-11-08T12:00:00Z"), metadata: { origem: "celular", fonte: "app" } as never },
  });
  await seq.adotarSequenciasProposta(NA_JANELA);
  assert.equal((await estadoDe(c.id))?.inicio, D0.toISOString());
});

test("tag de controle encerra; tag de adiamento (retornar-<mês>) espera; sem número único configurado nenhuma origem fica fora", async () => {
  const controle = await criarLead("Controle", { tags: ["controle-suporte-humano"] });
  const adiado = await criarLead("Adiado", { tags: ["retornar-janeiro"] });
  let chamadas = 0;
  const r = await seq.processarSequenciasProposta({
    agora: NA_JANELA,
    modo: "envio",
    enviar: async () => {
      chamadas++;
      return { ok: true };
    },
    midiaExiste: () => false,
  });
  assert.equal(chamadas, 0);
  assert.equal((await estadoDe(controle.id))?.status, "encerrada");
  assert.equal((await estadoDe(adiado.id))?.status, "ativa");
  assert.ok(r.decisoes.some((d) => d.contactId === controle.id && d.acao === "encerrar"));
});

test("reunião marcada no futuro segura o toque", async () => {
  const c = await criarLead("ComReuniao");
  const atual = await db.contact.findUniqueOrThrow({ where: { id: c.id } });
  await db.contact.update({
    where: { id: c.id },
    data: { customFields: { ...(atual.customFields as object), evento_data: "2026-11-12T15:00:00-03:00" } as never },
  });
  let chamadas = 0;
  await seq.processarSequenciasProposta({
    agora: NA_JANELA,
    modo: "envio",
    enviar: async () => {
      chamadas++;
      return { ok: true };
    },
    midiaExiste: () => false,
  });
  assert.equal(chamadas, 0);
});

test("estado corrompido num lead não derruba a rodada dos outros", async () => {
  const ruim = await criarLead("Corrompido");
  await seq.adotarSequenciasProposta(NA_JANELA);
  const atual = await db.contact.findUniqueOrThrow({ where: { id: ruim.id } });
  const e = seq.lerSequencia(atual.customFields);
  assert.ok(e);
  await db.contact.update({
    where: { id: ruim.id },
    data: { customFields: { ...(atual.customFields as object), sequencia_proposta: { ...e, passos: [{ d: 7, devidoEm: "lixo", status: "pendente" }] } } as never },
  });
  assert.equal(await estadoDe(ruim.id), null); // lerSequencia rejeita data inválida
  await criarLead("Saudavel");
  const r = await seq.processarSequenciasProposta({ agora: NA_JANELA, modo: "envio", enviar: semEnvio, midiaExiste: () => false });
  assert.equal(r.enviados, 1);
});

test("D+15 pelo motor: oferece o conteúdo que o lead ainda não recebeu (não repete o vídeo do plano)", async () => {
  const c = await criarLead("Quinze", { tags: ["interesse-yt"] });
  await db.whatsappMessage.create({
    data: { contactId: c.id, instanceId, fromNumber: "x", toNumber: "x", body: "Assiste antes: https://clientesnoyoutube.exemplo.com/", direction: "outbound", timestamp: new Date("2026-11-03T18:00:00Z"), metadata: { origem: "celular", fonte: "app" } as never },
  });
  const r = await seq.processarSequenciasProposta({
    agora: new Date("2026-11-18T12:05:00Z"), // D+15 (quarta 9h05), com D+1 a D+7 já vencidos
    modo: "teste",
    midiaExiste: () => false,
  });
  const dele = r.decisoes.find((d) => d.contactId === c.id && d.acao === "enviar");
  assert.equal(dele?.passo, 15);
  // sem biblioteca de conteúdos configurada, o D+15 pergunta o que mudou e nunca repete o link já enviado
  assert.match(dele?.texto ?? "", /o que mudou/);
  assert.doesNotMatch(dele?.texto ?? "", /clientesnoyoutube/);
});

test("D+30 pelo motor nunca é pulado por falta de novidade", async () => {
  const c = await criarLead("Trinta");
  const r = await seq.processarSequenciasProposta({
    agora: new Date("2026-12-03T12:05:00Z"), // D+30 (quinta 9h05)
    modo: "teste",
    midiaExiste: () => false,
  });
  const dele = r.decisoes.find((d) => d.contactId === c.id && d.acao === "enviar");
  assert.equal(dele?.passo, 30);
  assert.match(dele?.texto ?? "", /proposta segue de pé/);
  assert.ok(!r.decisoes.some((d) => d.contactId === c.id && d.acao === "pular" && d.passo === 30));
});

test("guarda central: quem disse 'vamos fechar' ou já comprou não recebe toque (vira toque humano)", async () => {
  const sim = await criarLead("Henrick");
  await db.whatsappMessage.create({
    data: {
      contactId: sim.id,
      instanceId,
      fromNumber: sim.phone ?? "",
      toNumber: "x",
      body: "Vamos fechar!",
      direction: "inbound",
      timestamp: new Date(D0.getTime() - 3_600_000),
    },
  });
  const comprou = await criarLead("Camila");
  await db.purchase.create({ data: { contactId: comprou.id, product: "Consultoria", valueCents: 750_000 } });
  let chamadas = 0;
  const r = await seq.processarSequenciasProposta({
    agora: NA_JANELA,
    modo: "envio",
    enviar: async () => {
      chamadas++;
      return { ok: true };
    },
    midiaExiste: () => false,
  });
  assert.equal(chamadas, 0);
  assert.match(r.decisoes.find((d) => d.contactId === sim.id)?.motivo ?? "", /guarda: disse_sim/);
  assert.match(r.decisoes.find((d) => d.contactId === comprou.id)?.motivo ?? "", /guarda: comprou/);
  const tags = (await db.contact.findUniqueOrThrow({ where: { id: sim.id } })).tags as string[];
  assert.ok(tags.includes("disse-sim"), "carimba a tag que põe o lead no resumo das 8h");
});
