import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { conexaoPadrao, enviarTexto } from "@/lib/whatsapp";
import { criarFicha, coletarRespostas, origemDoLead, type DadosLead } from "@/lib/ficha";
import { auditar } from "@/lib/audit";
import https from "node:https";
import { negocio } from "@/lib/negocio";

/**
 * Aviso no WhatsApp do DONO quando o lead RESPONDE (e quando um formulário é preenchido).
 *
 *     nós falamos com o lead  ->  nada
 *     o lead responde         ->  aviso com a ficha, para o dono
 *
 * O dono é o do negocio.json (`dono.whatsapp`). O aviso sai pelo CallMeBot (se configurado em
 * Setting `callmebot_phone` e `callmebot_apikey`) e, sem ele, pelo próprio WhatsApp conectado
 * no CRM, para o celular do dono.
 *
 * Um aviso por lead (tabela `Notificacao`, @@unique[tipo, chave]). Da segunda mensagem em diante a
 * conversa já está aberta no celular.
 */

export type Dono = {
  chave: string;
  nome: string;
  telefone: string;
  callmebotPhone: string;
  callmebotKey: string;
};

/** O dono do negócio (negocio.json). `null` quando não há WhatsApp do dono configurado. */
export async function donoPadrao(): Promise<Dono | null> {
  const n = negocio();
  const telefone = (await config("dono_telefone", "DONO_TELEFONE", n.dono.whatsapp)).replace(/\D/g, "");
  if (!telefone) return null;
  return {
    chave: "dono",
    nome: n.dono.primeiroNome,
    telefone,
    callmebotPhone: await config("callmebot_phone", "CALLMEBOT_PHONE"),
    callmebotKey: await config("callmebot_apikey", "CALLMEBOT_APIKEY"),
  };
}

/**
 * Número que recebeu -> dono do aviso. Todo número conectado no CRM é do negócio, então o aviso
 * vai sempre para o dono. `null` = número vazio (ninguém é avisado).
 */
export async function donoDoNumero(numero?: string | null): Promise<Dono | null> {
  const n = String(numero ?? "").replace(/\D/g, "");
  if (!n) return null;
  return donoPadrao();
}

/* ── Enriquecimento ────────────────────────────────────────────────────────
   O Contact do CRM tem nome, telefone e os chips. Se existir um painel de captação externo
   (Setting `leads_url` + `leads_senha`), o que o lead RESPONDEU lá entra na ficha, com cache curto.
   Sem painel configurado, a ficha sai só com o que o CRM tem. */
type CacheLeads = { em: number; leads: Record<string, DadosLead> };
let cache: CacheLeads = { em: 0, leads: {} };
const VALIDADE_CACHE_MS = 5 * 60 * 1000;

function chaveTelefone(t: unknown): string {
  const d = String(t ?? "").replace(/\D/g, "");
  // o WhatsApp às vezes entrega o número sem o 9º dígito; a chave ignora ele
  return d.length === 13 && d[4] === "9" ? d.slice(0, 4) + d.slice(5) : d;
}

async function leadDoPainel(telefone: string): Promise<DadosLead | null> {
  const agora = Date.now();
  if (agora - cache.em > VALIDADE_CACHE_MS) {
    try {
      const base = await config("leads_url", "LEADS_URL", "");
      const senha = await config("leads_senha", "LEADS_SENHA", "");
      if (!base) return null;
      const r = await fetch(`${base}/api/leads`, {
        headers: { "x-crm-pass": senha },
        signal: AbortSignal.timeout(60000),
      });
      if (r.ok) {
        const corpo = (await r.json()) as { leads?: DadosLead[] } | DadosLead[];
        const lista = Array.isArray(corpo) ? corpo : (corpo.leads ?? []);
        const mapa: Record<string, DadosLead> = {};
        for (const l of lista) {
          const k = chaveTelefone(l.telefone ?? l.whatsapp);
          if (k && !mapa[k]) mapa[k] = l;
        }
        cache = { em: agora, leads: mapa };
      }
    } catch {
      // painel fora do ar: a ficha sai com o que o CRM tem. Aviso atrasado por
      // causa de enriquecimento seria pior do que aviso mais simples.
    }
  }
  return cache.leads[chaveTelefone(telefone)] ?? null;
}

function semAcento(texto: string): string {
  return texto.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7E\n]/g, "");
}

const TETO_CALLMEBOT = 700;

/**
 * GET cru por `node:https`.
 *
 * O `fetch` global aqui é o do Next, e contra a api.callmebot.com ele responde
 * `fetch failed` — o MESMO endereço funciona no Node puro do mesmo container
 * (conferido em 19/08/2026). Não vale caçar o porquê dentro do runtime do
 * framework: o aviso não pode depender disso.
 */
function get(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 20000 },
      (res) => {
        let corpo = "";
        res.setEncoding("utf8");
        res.on("data", (p) => {
          if (corpo.length < 2000) corpo += p;
        });
        res.on("end", () => resolve(corpo));
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

async function callmebot(dono: Dono, texto: string): Promise<boolean> {
  // Falha de canal principal NUNCA pode ser silenciosa: sem log, o aviso cai na
  // reserva pra sempre e ninguem descobre que o CallMeBot parou.
  if (!dono.callmebotPhone || !dono.callmebotKey) {
    console.log(`[aviso-lead] callmebot sem credencial para ${dono.chave} ` +
      `(phone=${dono.callmebotPhone ? "ok" : "vazio"} key=${dono.callmebotKey ? "ok" : "vazio"})`);
    return false;
  }
  const url =
    "https://api.callmebot.com/whatsapp.php?phone=" +
    encodeURIComponent(dono.callmebotPhone) +
    "&text=" + encodeURIComponent(semAcento(texto).slice(0, TETO_CALLMEBOT)) +
    "&apikey=" + encodeURIComponent(dono.callmebotKey);
  try {
    const corpo = (await get(url)).toLowerCase();
    // o CallMeBot responde 200 também quando recusa; o corpo é quem conta
    if (corpo.includes("error") || (corpo.includes("apikey") && corpo.includes("invalid"))) {
      console.log("[aviso-lead] callmebot recusou:", corpo.slice(0, 180));
      return false;
    }
    return true;
  } catch (e) {
    console.log("[aviso-lead] callmebot falhou:", e instanceof Error ? e.message : String(e));
    return false;
  }
}

/** Reserva: sai do WhatsApp conectado do CRM pro celular do dono. */
async function reserva(dono: Dono, texto: string): Promise<boolean> {
  try {
    const conexao = await conexaoPadrao();
    if (!conexao) return false;
    const r = await enviarTexto(conexao, dono.telefone, texto);
    return r.ok;
  } catch {
    return false;
  }
}

function primeiraLinha(dados: DadosLead, nome: string): string {
  const prof = String(dados.objetivo ?? dados.profissao ?? "").trim();
  return prof ? `${nome} - ${prof}` : nome;
}

function linhaOrigem(dados: DadosLead): string {
  const funil = String(dados.funil ?? dados.fonte ?? "").trim();
  const bonito = funil;
  const score = dados.score;
  if (score !== undefined && score !== null && score !== "") return `${bonito} - Score ${score}/100`;
  return bonito;
}

export type ResultadoAvisoLead = { enviado: boolean; motivo?: string; ficha?: string; para?: string };

/**
 * Chamado quando chega mensagem DO LEAD. Não levanta: o aviso é conveniência,
 * gravar a mensagem é obrigação.
 */
export async function avisarRespostaDeLead(
  contactId: string,
  numeroQueRecebeu: string | null | undefined,
  textoRecebido: string,
): Promise<ResultadoAvisoLead> {
  try {
    if ((await config("aviso_lead_ativo", "AVISO_LEAD_ATIVO", "1")) === "0") {
      return { enviado: false, motivo: "desligado" };
    }
    const dono = await donoDoNumero(numeroQueRecebeu);
    if (!dono) return { enviado: false, motivo: "numero sem dono" };
    // os agentes respondem os leads; o aviso "lead respondeu" pode ser desligado com
    // aviso_lead_dono = 0. Religa com 1.
    if ((await config(`aviso_lead_${dono.chave}`, undefined, "1")) === "0") {
      return { enviado: false, motivo: "desligado para o dono" };
    }

    const contato = await db.contact.findUnique({ where: { id: contactId } });
    if (!contato) return { enviado: false, motivo: "contato nao encontrado" };

    // Tem que ser RESPOSTA: se nunca falamos com ele, não há o que responder.
    const nossa = await db.whatsappMessage.findFirst({
      where: { contactId, direction: "outbound" },
      orderBy: { timestamp: "desc" },
    });
    if (!nossa) return { enviado: false, motivo: "nao e resposta (sem mensagem nossa antes)" };

    // Um aviso por lead, por dono. Da segunda em diante a conversa já está
    // aberta no celular — avisar de novo vira ruído e ele para de olhar.
    const chave = `${contactId}:${dono.chave}`;
    try {
      await db.notificacao.create({
        data: { tipo: "resposta_lead", chave, detalhe: textoRecebido.slice(0, 200) },
      });
    } catch {
      return { enviado: false, motivo: "ja avisado" };
    }

    const campos = (contato.customFields ?? {}) as Record<string, unknown>;
    const doPainel = (await leadDoPainel(contato.phone ?? "")) ?? {};
    const dados: DadosLead = {
      ...doPainel,
      nome: contato.name || String(doPainel.nome ?? ""),
      telefone: contato.phone ?? String(doPainel.telefone ?? ""),
      email: contato.email ?? doPainel.email,
      instagram: doPainel.instagram ?? campos.instagram,
      funil: doPainel.funil ?? campos.funil ?? contato.origem,
      // a ficha publica resolve o criativo pelo NOME do anuncio (`dados.ad`);
      // o CTWA carimba esse nome em `campos.anuncio`.
      ad: doPainel.ad ?? campos.anuncio,
      campanha: doPainel.campanha ?? campos.campanha,
      ctwa_ad_id: campos.ctwa_ad_id,
      ctwa_clid: campos.ctwa_clid,
    };

    const base = await config("app_url", "APP_URL", "http://localhost:3900");
    let ficha = "";
    try {
      ficha = (await criarFicha(dados, base)).url;
    } catch {
      /* sem ficha o aviso ainda vale — vai com o contato por extenso */
    }

    const nome = String(dados.nome || "Sem nome");
    const trecho = textoRecebido.replace(/\s+/g, " ").slice(0, 120);
    const linhas = [
      "Lead RESPONDEU voce",
      primeiraLinha(dados, nome),
      linhaOrigem(dados),
      `Ele disse: "${trecho}"`,
    ];
    linhas.push(ficha || `https://wa.me/${String(dados.telefone).replace(/\D/g, "")}`);
    const texto = linhas.filter(Boolean).join("\n");

    let canal = "";
    if (await callmebot(dono, texto)) canal = "callmebot";
    else if (await reserva(dono, texto)) canal = "waha";

    if (!canal) {
      // deixa tentar de novo na próxima mensagem dele
      await db.notificacao.deleteMany({ where: { tipo: "resposta_lead", chave } });
      await auditar("sistema", "aviso_lead_falhou", `${dono.chave}: ${contactId}`);
      return { enviado: false, motivo: "nenhum canal entregou" };
    }

    await auditar("sistema", "aviso_lead_enviado", `${dono.chave}: ${contactId} (${canal})`);
    return { enviado: true, ficha, para: dono.chave };
  } catch (e) {
    return { enviado: false, motivo: e instanceof Error ? e.message : String(e) };
  }
}


/**
 * Aviso de FORMULÁRIO PREENCHIDO — o lead terminou um quiz/diagnóstico.
 *
 * Existe desde 28/08/2026. Até então nenhum preenchimento avisava nada: o
 * `avaliarEAvisar` do `/api/leads/entrada` exige 55 pontos de "calor", e esse
 * placar conta comportamento de WhatsApp — quem acabou de sair do formulário
 * tem 10. Na prática o dono via o lead entrar no CRM e nunca as respostas.
 *
 * Um aviso por pessoa POR FUNIL (`Notificacao` @@unique[tipo, chave]): funis
 * que salvam a cada etapa mandam vários POSTs do mesmo
 * lead, e avisar em todos vira ruído — e ruído faz parar de olhar todos.
 */
export async function avisarFormularioPreenchido(
  contactId: string,
  dados: DadosLead,
): Promise<ResultadoAvisoLead> {
  try {
    if ((await config("aviso_form_ativo", "AVISO_FORM_ATIVO", "1")) === "0") {
      return { enviado: false, motivo: "desligado" };
    }
    const dono = await donoPadrao();
    if (!dono) return { enviado: false, motivo: "sem dono configurado" };

    const contato = await db.contact.findUnique({ where: { id: contactId } });
    if (!contato) return { enviado: false, motivo: "contato nao encontrado" };

    const funil = String(dados.funil ?? contato.origem ?? "form").trim() || "form";
    const chave = `${contactId}:${funil}:${dono.chave}`;
    try {
      await db.notificacao.create({
        data: { tipo: "form_preenchido", chave, detalhe: funil.slice(0, 200) },
      });
    } catch {
      return { enviado: false, motivo: "ja avisado" };
    }

    const base = await config("app_url", "APP_URL", "http://localhost:3900");
    let ficha = "";
    try {
      ficha = (await criarFicha(dados, base)).url;
    } catch {
      /* sem ficha o aviso ainda vale — vai com o WhatsApp do lead */
    }

    const nome = String(dados.nome || contato.name || "Sem nome");
    const telefone = String(dados.telefone ?? contato.phone ?? "").replace(/\D/g, "");
    const email = String(dados.email ?? contato.email ?? "").trim();
    const instagram = String(dados.instagram ?? "").replace(/^@/, "").trim();
    const origem = origemDoLead({ ...dados, funil });

    // Máximo de informação que o lead preencheu, não só o nome + origem crua: o dono precisa
    // decidir sem abrir o link.
    const linhas = [
      "Lead novo preencheu formulario",
      primeiraLinha(dados, nome),
      `Origem: ${origem.titulo}`,
    ];
    if (telefone) linhas.push(`WhatsApp: ${telefone}`);
    if (email) linhas.push(`Email: ${email}`);
    if (instagram) linhas.push(`Instagram: @${instagram}`);
    for (const { pergunta, resposta } of coletarRespostas(dados)) {
      linhas.push(`${pergunta}: ${resposta}`);
    }
    linhas.push(ficha || (telefone ? `https://wa.me/${telefone}` : ""));
    const texto = linhas.filter(Boolean).join("\n");

    let canal = "";
    if (await callmebot(dono, texto)) canal = "callmebot";
    else if (await reserva(dono, texto)) canal = "waha";

    if (!canal) {
      await db.notificacao.deleteMany({ where: { tipo: "form_preenchido", chave } });
      await auditar("sistema", "aviso_form_falhou", `${dono.chave}: ${contactId}`);
      return { enviado: false, motivo: "nenhum canal entregou" };
    }

    await auditar("sistema", "aviso_form_enviado", `${dono.chave}: ${contactId} (${canal}) ${funil}`);
    return { enviado: true, ficha, para: dono.chave };
  } catch (e) {
    return { enviado: false, motivo: e instanceof Error ? e.message : String(e) };
  }
}
