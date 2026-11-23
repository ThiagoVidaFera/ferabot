"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  sessaoAtual,
  hashSenha,
  conferirSenha,
  encerrarTodasAsSessoes,
} from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { gravarConfig } from "@/lib/config";
import { negocio } from "@/lib/negocio";
import { CHAVES_ROBOS } from "@/lib/chaves-robos";
import {
  apagarSessao,
  conexaoDe,
  conexaoPadrao,
  conexaoPorId,
  estadoComQr,
  estadoSessao,
  iniciarSessao,
  qrCode,
} from "@/lib/whatsapp";
import { testarSmtp } from "@/lib/email";
import { motivoServidorRecusado, painelHospedado } from "@/lib/hospedado";

async function exigirSessao() {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");
  return s;
}

export async function salvarWhatsapp(form: FormData) {
  const s = await exigirSessao();

  const provider = String(form.get("provider") ?? "waha");
  const url = String(form.get("url") ?? "").trim().replace(/\/+$/, "");
  const apiKey = String(form.get("apiKey") ?? "").trim();
  const sessao = String(form.get("sessao") ?? "default").trim() || "default";
  const numero = String(form.get("numero") ?? "").trim() || null;

  const instanceId = String(form.get("instanceId") ?? "");
  const nome = String(form.get("nome") ?? "").trim();

  // Painel hospedado: o servidor do WhatsApp é do cliente e precisa ser público e HTTPS.
  if (painelHospedado()) {
    const motivo = motivoServidorRecusado(url);
    if (motivo) throw new Error(motivo);
  }

  if (instanceId) {
    await db.whatsappInstance.update({
      where: { id: instanceId },
      data: {
        provider,
        evolutionApiUrl: url,
        evolutionApiKey: apiKey,
        instanceName: sessao,
        phoneNumber: numero,
        ...(nome ? { name: nome } : {}),
      },
    });
  } else {
    const primeira = (await db.whatsappInstance.count()) === 0;
    await db.whatsappInstance.create({
      data: {
        name: nome || `numero-${Date.now()}`,
        provider,
        evolutionApiUrl: url,
        evolutionApiKey: apiKey,
        instanceName: sessao,
        phoneNumber: numero,
        isDefault: primeira,
      },
    });
  }

  await gravarConfig(
    "webhook_url_publica",
    String(form.get("webhook_url_publica") ?? "").trim(),
  );

  await auditar(s.email, "whatsapp_configurado", `${provider} ${url} sessao=${sessao}`);
  revalidatePath("/configuracoes");
}

export type EstadoConexao = {
  status: "desconectado" | "conectando" | "conectado";
  qr?: string | null;
  detalhe?: string;
  erro?: string;
};

export async function conectarWhatsapp(
  urlWebhook: string,
  instanceId?: string,
): Promise<EstadoConexao> {
  const s = await exigirSessao();
  const c = instanceId ? await conexaoPorId(instanceId) : await conexaoPadrao();
  if (!c) return { status: "desconectado", erro: "configure a URL do provider primeiro" };

  const subiu = await iniciarSessao(c, urlWebhook);
  await auditar(s.email, "whatsapp_conectar", `${c.provider} ${c.sessao}`);

  // Espera o SCAN_QR_CODE aparecer — sessao recem-criada ou reiniciada passa
  // por STARTING, e nesse estado o WAHA nao entrega QR nenhum.
  const st = await estadoComQr(c);
  await sincronizarStatus(st.status, c.instanceId, st.telefone);
  return {
    status: st.status,
    qr: st.qr ?? null,
    detalhe: st.cru,
    erro:
      !subiu && st.status === "desconectado"
        ? "o provider nao conseguiu iniciar a sessao"
        : undefined,
  };
}

export async function statusWhatsapp(instanceId?: string): Promise<EstadoConexao> {
  await exigirSessao();
  const c = instanceId ? await conexaoPorId(instanceId) : await conexaoPadrao();
  if (!c) return { status: "desconectado", erro: "nao configurado" };
  const st = await estadoSessao(c);
  // QR sempre que NAO estiver conectado. Antes so pedia em "conectando", entao
  // sessao caida (FAILED) nunca mostrava nada na tela.
  const qr = st.status === "conectado" ? null : await qrCode(c);
  await sincronizarStatus(st.status, c.instanceId, st.telefone);
  return { status: st.status, qr, detalhe: st.cru };
}

/**
 * Adiciona um telefone novo: a pessoa so da um APELIDO. O CRM deriva o nome da
 * sessao, herda URL/chave do provider do numero que ja opera (ou do .env),
 * cria a sessao no WAHA com o webhook certo e devolve o QR pronto pra leitura.
 */
export async function adicionarNumero(
  nome: string,
  urlWebhook: string,
): Promise<{ ok: boolean; erro?: string; id?: string; estado?: EstadoConexao }> {
  const s = await exigirSessao();
  const apelido = nome.trim();
  if (apelido.length < 2) return { ok: false, erro: "de um apelido pro telefone" };

  if (await db.whatsappInstance.findFirst({ where: { name: apelido } })) {
    return { ok: false, erro: "ja existe um telefone com esse apelido" };
  }

  // Herda o provider de quem ja opera: o WAHA da VPS so responde na rede
  // interna, entao nao ha URL pra pessoa digitar — e nem deveria haver.
  const modelo =
    (await db.whatsappInstance.findFirst({
      where: { provider: "waha", evolutionApiUrl: { not: null } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    })) ?? null;

  const baseUrl = (modelo?.evolutionApiUrl ?? process.env.WAHA_URL ?? "").replace(/\/+$/, "");
  const apiKey = modelo?.evolutionApiKey ?? process.env.WAHA_APIKEY ?? "";
  if (!baseUrl) {
    return { ok: false, erro: "nenhum provider WAHA configurado ainda — salve um numero primeiro" };
  }

  const sessao = await sessaoLivre(apelido);
  const inst = await db.whatsappInstance.create({
    data: {
      name: apelido,
      provider: "waha",
      evolutionApiUrl: baseUrl,
      evolutionApiKey: apiKey,
      instanceName: sessao,
      isDefault: (await db.whatsappInstance.count()) === 0,
      status: "desconectado",
    },
  });

  await auditar(s.email, "whatsapp_numero_adicionado", `${apelido} sessao=${sessao}`);

  const c = conexaoDe(inst);
  if (!c) return { ok: false, erro: "nao consegui montar a conexao" };

  const subiu = await iniciarSessao(c, urlWebhook);
  const st = await estadoComQr(c);
  await sincronizarStatus(st.status, inst.id, st.telefone);
  revalidatePath("/configuracoes");

  return {
    ok: true,
    id: inst.id,
    estado: {
      status: st.status,
      qr: st.qr ?? null,
      detalhe: st.cru,
      erro: !subiu ? "o provider nao conseguiu iniciar a sessao" : undefined,
    },
  };
}

/** Slug de sessao unico — o WAHA nao aceita espaco nem acento no nome. */
async function sessaoLivre(apelido: string): Promise<string> {
  const base =
    apelido
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "numero";
  let nome = base;
  for (let i = 2; await db.whatsappInstance.findFirst({ where: { instanceName: nome } }); i++) {
    nome = `${base}-${i}`;
  }
  return nome;
}

async function sincronizarStatus(
  status: string,
  instanceId?: string,
  telefone?: string | null,
) {
  const inst = instanceId
    ? await db.whatsappInstance.findUnique({ where: { id: instanceId } })
    : await db.whatsappInstance.findFirst({ where: { isDefault: true } });
  if (!inst) return;
  // O numero real so aparece depois do pareamento — dai em diante o CRM sabe
  // com que telefone esta falando sem ninguem digitar nada.
  const mudouTelefone = !!telefone && inst.phoneNumber !== telefone;
  if (inst.status !== status || mudouTelefone) {
    await db.whatsappInstance.update({
      where: { id: inst.id },
      data: { status, ...(mudouTelefone ? { phoneNumber: telefone } : {}) },
    });
  }
}

export async function definirPadrao(instanceId: string) {
  const s = await exigirSessao();
  await db.whatsappInstance.updateMany({ data: { isDefault: false } });
  await db.whatsappInstance.update({ where: { id: instanceId }, data: { isDefault: true } });
  await auditar(s.email, "whatsapp_padrao_alterado", instanceId);
  revalidatePath("/configuracoes");
  revalidatePath("/inbox");
}

export async function removerInstancia(instanceId: string, encerrarSessao = false) {
  const s = await exigirSessao();
  const i = await db.whatsappInstance.findUnique({ where: { id: instanceId } });
  if (encerrarSessao && i) {
    const c = conexaoDe(i);
    if (c) await apagarSessao(c);
  }
  await db.whatsappInstance.delete({ where: { id: instanceId } });
  await auditar(s.email, "whatsapp_instancia_removida", i?.name ?? instanceId);
  revalidatePath("/configuracoes");
  revalidatePath("/inbox");
}

export async function salvarSmtp(form: FormData) {
  const s = await exigirSessao();
  const campos: Array<[string, string]> = [
    ["smtp_host", String(form.get("host") ?? "").trim()],
    ["smtp_porta", String(form.get("porta") ?? "587").trim()],
    ["smtp_usuario", String(form.get("usuario") ?? "").trim()],
    ["smtp_remetente", String(form.get("remetente") ?? "").trim()],
    ["smtp_seguro", String(form.get("seguro") ?? "") === "1" ? "1" : "0"],
  ];
  const senha = String(form.get("senha") ?? "");
  if (senha) campos.push(["smtp_senha", senha]);

  for (const [k, v] of campos) await gravarConfig(k, v);
  await auditar(s.email, "smtp_configurado", campos[0][1]);
  revalidatePath("/configuracoes");
}

export async function testarConexaoSmtp() {
  await exigirSessao();
  return testarSmtp();
}

export async function salvarIA(form: FormData) {
  const s = await exigirSessao();
  const provider = String(form.get("ia_provider") ?? "gemini");
  const model = String(form.get("ia_model") ?? "gemini-2.5-flash").trim();
  await gravarConfig("ia_provider", provider);
  await gravarConfig("ia_model", model);

  const gemini = String(form.get("gemini_key") ?? "").trim();
  const anthropic = String(form.get("anthropic_key") ?? "").trim();
  if (gemini) await gravarConfig("gemini_api_key", gemini);
  if (anthropic) await gravarConfig("anthropic_api_key", anthropic);

  await auditar(s.email, "ia_configurada", `${provider}/${model}`);
  revalidatePath("/configuracoes");
}

export async function salvarNegocio(form: FormData) {
  const s = await exigirSessao();
  await gravarConfig("negocio_nome", String(form.get("negocio_nome") ?? "").trim() || negocio().nome);
  await gravarConfig("marca_acento", String(form.get("marca_acento") ?? "#FF4F00").trim());
  await auditar(s.email, "negocio_configurado");
  revalidatePath("/", "layout");
}

/** Ciclo do evento ao vivo — fonte unica dos Agentes 01 e 02 (evento.ts). */
export async function salvarEvento(form: FormData) {
  const s = await exigirSessao();
  const { CHAVES_EVENTO, gravarEvento } = await import("@/lib/evento");
  const valores: Record<string, string> = {};
  for (const k of CHAVES_EVENTO) valores[k] = String(form.get(k) ?? "");
  await gravarEvento(valores);
  await auditar(s.email, "evento_configurado", `ciclo ${valores.evento_ciclo} · ${valores.evento_data}`);
  revalidatePath("/configuracoes");
  revalidatePath("/agentes");
}

export type ResultadoSenha = { ok: boolean; erro?: string };

export async function trocarSenha(form: FormData): Promise<ResultadoSenha> {
  const s = await exigirSessao();
  const atual = String(form.get("atual") ?? "");
  const nova = String(form.get("nova") ?? "");
  if (nova.length < 4) return { ok: false, erro: "a nova senha precisa de ao menos 4 caracteres" };

  const user = await db.user.findUnique({ where: { id: s.userId } });
  if (!user || !(await conferirSenha(atual, user.passwordHash))) {
    await auditar(s.email, "troca_senha_negada");
    return { ok: false, erro: "senha atual incorreta" };
  }

  // Trocar a senha derruba TODOS os dispositivos — inclusive os que já não
  // temos em mãos. É o que torna a sessão perpétua segura.
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashSenha(nova), sessionEpoch: new Date() },
  });
  await auditar(s.email, "senha_trocada", "todas as sessoes encerradas");
  return { ok: true };
}


/** "Sair de todos os dispositivos" — invalida as sessões sem trocar a senha. */
export async function sairDeTodosOsDispositivos() {
  const s = await exigirSessao();
  await encerrarTodasAsSessoes(s.userId);
  await auditar(s.email, "sessoes_encerradas", "todos os dispositivos");
  return { ok: true };
}

export async function salvarRobos(form: FormData) {
  const s = await exigirSessao();
  for (const chave of CHAVES_ROBOS) {
    const valor = String(form.get(chave) ?? "").trim();
    if (chave.endsWith("_json") && valor) {
      try {
        JSON.parse(valor);
      } catch {
        throw new Error(`${chave}: JSON inválido — confira aspas e vírgulas`);
      }
    }
    await gravarConfig(chave, valor);
  }
  const { recarregarListasDeAgentes } = await import("@/lib/seletor-agente");
  const { recarregarNumeroUnico } = await import("@/lib/numero-unico");
  await Promise.all([recarregarListasDeAgentes(), recarregarNumeroUnico()]);
  await auditar(s.email, "robos_configurados");
  revalidatePath("/configuracoes");
}
