import { db } from "@/lib/db";
import { auditar } from "@/lib/audit";
import { registrarEvento } from "@/lib/timeline";
import { normalizarTelefone } from "@/lib/telefone";
import { config } from "@/lib/config";
import { MAPA_STATUS_CRM_LEADS, ehEstagio } from "@/lib/estagios";

/**
 * Importa um painel de leads ANTIGO (opcional) para dentro do CRM.
 *
 * Só funciona com `leads_url` / `LEADS_URL` e `leads_senha` / `LEADS_SENHA` configurados: um painel
 * com a API `/api/leads` (lista de leads com fonte, telefone e respostas). Sem configuração, o botão
 * de importar responde que não há painel antigo. Para planilha, use Contatos > Importar CSV.
 *
 * O que ganhamos aqui é o que o painel antigo não tinha: linha do tempo,
 * identidade única por pessoa e ligação com venda.
 */

export type LeadRemoto = {
  id?: string;
  nome?: string;
  primeiro_nome?: string;
  telefone?: string;
  email?: string;
  instagram?: string;
  funil?: string;
  fonte?: string;
  form_id?: string;
  ad?: string;
  objetivo?: string;
  chips?: string[];
  temp?: string;
  temp_label?: string;
  abertura?: string;
  created_time?: string;
  numero_suspeito?: boolean;
};

export type ResultadoImport = {
  ok: boolean;
  lidos: number;
  criados: number;
  atualizados: number;
  descartados: number;
  erro?: string;
  porFonte: Record<string, number>;
};

const FONTE_PARA_ORIGEM: Record<string, string> = {
  "Facebook Lead Ads": "anuncio",
  "Quiz 4 Funis (WhatsApp)": "funil:quiz-whatsapp",
  "Quiz Repelente (site)": "funil:quiz-repelente",
  "Livro 4 Motores": "funil:livro-4-motores",
  Diagnóstico: "funil:diagnostico",
};

function origemDe(l: LeadRemoto): string {
  const f = (l.fonte ?? "").trim();
  if (FONTE_PARA_ORIGEM[f]) return FONTE_PARA_ORIGEM[f];
  if (l.funil) {
    return (
      "funil:" +
      l.funil
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }
  return f ? "anuncio" : "outro";
}

/** Chave curta pra identidade — o painel antigo já dá ids únicos por fonte. */
function fonteCurta(l: LeadRemoto): string {
  const f = (l.fonte ?? "externo").toLowerCase();
  if (f.includes("facebook")) return "facebook_leads";
  if (f.includes("whatsapp")) return "zernio";
  if (f.includes("repelente")) return "netlify_forms";
  if (f.includes("livro")) return "livro";
  if (f.includes("diagn")) return "diagnostico";
  return "painel_antigo";
}

export async function importarDoPainelAntigo(
  ator = "sistema",
  limite = 5000,
): Promise<ResultadoImport> {
  const base = await config("leads_url", "LEADS_URL");
  const senha = await config("leads_senha", "LEADS_SENHA");

  const vazio: ResultadoImport = {
    ok: false,
    lidos: 0,
    criados: 0,
    atualizados: 0,
    descartados: 0,
    porFonte: {},
  };

  let leads: LeadRemoto[] = [];
  let statusRemoto: Record<string, string> = {};

  try {
    if (!base) return { ...vazio, erro: "nenhum painel antigo configurado (LEADS_URL). Para planilha, use Importar CSV" };
    const [rLeads, rStatus] = await Promise.all([
      fetch(`${base}/api/leads`, {
        headers: { "x-crm-pass": senha },
        signal: AbortSignal.timeout(120000),
      }),
      fetch(`${base}/api/status`, {
        headers: { "x-crm-pass": senha },
        signal: AbortSignal.timeout(60000),
      }).catch(() => null),
    ]);

    if (!rLeads.ok) {
      return { ...vazio, erro: `painel antigo respondeu HTTP ${rLeads.status}` };
    }
    const corpo = (await rLeads.json()) as { leads?: LeadRemoto[] } | LeadRemoto[];
    leads = (Array.isArray(corpo) ? corpo : (corpo.leads ?? [])).slice(0, limite);

    if (rStatus?.ok) {
      const j = (await rStatus.json()) as { map?: Record<string, string> };
      statusRemoto = j.map ?? {};
    }
  } catch (e) {
    return { ...vazio, erro: e instanceof Error ? e.message : String(e) };
  }

  let criados = 0;
  let atualizados = 0;
  let descartados = 0;
  const porFonte: Record<string, number> = {};

  for (const l of leads) {
    const phone = normalizarTelefone(l.telefone);
    const email = (l.email ?? "").trim().toLowerCase() || null;

    // A regra que o painel antigo não tinha: sem forma de contato, não é lead.
    // É isso que evita repetir aqui as 2.760 linhas vazias de agosto.
    if (!phone && !email) {
      descartados++;
      continue;
    }

    const nome = (l.nome ?? l.primeiro_nome ?? "").trim() || phone || email || "Sem nome";
    const origem = origemDe(l);
    const fonte = fonteCurta(l);
    porFonte[l.fonte ?? "?"] = (porFonte[l.fonte ?? "?"] ?? 0) + 1;

    // Qualificação: é o que o lead respondeu. Vai pro customFields e aparece
    // na ficha do inbox — era exatamente o que faltava pra responder no escuro.
    const campos: Record<string, unknown> = {};
    if (l.instagram) campos.instagram = l.instagram.replace(/^@/, "");
    if (l.ad) campos.campanha = l.ad;
    if (l.form_id) campos.form_id = l.form_id;
    if (l.funil) campos.funil = l.funil;
    if (l.objetivo) campos.objetivo = l.objetivo;
    if (Array.isArray(l.chips) && l.chips.length) campos.chips = l.chips;
    if (l.abertura) campos.abertura_ia = l.abertura;
    if (l.numero_suspeito) campos.numero_suspeito = true;

    const tags: string[] = [];
    if (l.temp_label) tags.push(l.temp_label);
    else if (l.temp) tags.push(l.temp === "HOT" ? "quente" : "frio");

    const criadoEm = l.created_time ? new Date(l.created_time) : null;
    const criadoValido = criadoEm && !Number.isNaN(criadoEm.getTime()) ? criadoEm : null;

    // Estágio: respeita o pipeline que já foi trabalhado no painel antigo.
    const st = l.id ? statusRemoto[l.id] : undefined;
    const estagioMapeado = st ? MAPA_STATUS_CRM_LEADS[st] : undefined;

    const existente =
      (phone ? await db.contact.findFirst({ where: { phone } }) : null) ??
      (email ? await db.contact.findFirst({ where: { email } }) : null);

    if (existente) {
      const camposAtuais =
        existente.customFields && typeof existente.customFields === "object"
          ? (existente.customFields as Record<string, unknown>)
          : {};
      const tagsAtuais = Array.isArray(existente.tags) ? (existente.tags as string[]) : [];

      await db.contact.update({
        where: { id: existente.id },
        data: {
          // não sobrescreve o que já é melhor no CRM
          name: existente.name === existente.phone && nome ? nome : existente.name,
          email: existente.email ?? email,
          phone: existente.phone ?? phone,
          origem: existente.origem === "outro" ? origem : existente.origem,
          customFields: { ...campos, ...camposAtuais } as never,
          tags: Array.from(new Set([...tagsAtuais, ...tags])) as never,
          ...(estagioMapeado && existente.lifecycleStage === "novo" && ehEstagio(estagioMapeado)
            ? { lifecycleStage: estagioMapeado }
            : {}),
        },
      });
      atualizados++;
    } else {
      const contato = await db.contact.create({
        data: {
          name: nome,
          phone,
          email,
          origem,
          lifecycleStage:
            estagioMapeado && ehEstagio(estagioMapeado) ? estagioMapeado : "novo",
          tags: tags as never,
          customFields: campos as never,
          ...(criadoValido ? { createdAt: criadoValido } : {}),
        },
      });

      // O evento nasce com a data REAL de entrada — senão a régua de follow-up
      // trataria um lead de junho como se tivesse chegado hoje.
      await registrarEvento({
        contactId: contato.id,
        eventType: "form_submit",
        channel: "sistema",
        metadata: {
          texto: `Entrou por ${l.fonte ?? "fonte externa"}${l.funil ? " · " + l.funil : ""}`,
          chips: l.chips ?? [],
          campanha: l.ad ?? null,
        },
        timestamp: criadoValido ?? new Date(),
      });
      criados++;
    }

    // Identidade: liga a pessoa à linha original da fonte, sem duplicar contato.
    if (l.id) {
      try {
        const alvo =
          existente ??
          (await db.contact.findFirst({
            where: phone ? { phone } : { email },
          }));
        if (alvo) {
          await db.contactIdentity.create({
            data: {
              contactId: alvo.id,
              fonte,
              externalId: l.id,
              payload: { funil: l.funil ?? null, fonte: l.fonte ?? null } as never,
            },
          });
        }
      } catch {
        // @@unique([fonte, externalId]) — já ligada
      }
    }
  }

  await auditar(
    ator,
    "leads_importados",
    `${leads.length} lidos · ${criados} novos · ${atualizados} atualizados · ${descartados} sem contato`,
  );

  return {
    ok: true,
    lidos: leads.length,
    criados,
    atualizados,
    descartados,
    porFonte,
  };
}
