import { db } from "@/lib/db";
import { negocio } from "@/lib/negocio";
import { enviarConviteAulaSeElegivel } from "@/lib/convite-aula";
import { config, aplicarVariaveis } from "@/lib/config";
import { conexaoPorId, enviarTexto, enviarTemplate } from "@/lib/whatsapp";
import { registrarEvento } from "@/lib/timeline";
import { auditar } from "@/lib/audit";
import { filaDoDia, type ItemFila } from "@/lib/followup";
import { tagsDe, temControle } from "@/lib/tags";
import { reuniaoFutura } from "@/lib/seletor-agente";
import { semAutomacao } from "@/lib/estagios";
import { podeTocarContato } from "@/lib/pode-tocar";

/**
 * Follow-up AUTOMÁTICO — a peça que faltava.
 *
 * A régua (`followup.ts`) sempre esteve certa: conta do NOSSO último contato,
 * tira quem respondeu, cada etapa entra uma vez. O que não existia era alguém
 * apertando o botão. Medido em 30/08/2026: **92 leads parados**, 91 deles
 * esperando um retorno NOSSO, 34 há mais de 8 dias. A fila estava perfeita e
 * completamente inerte.
 *
 * Nasce DESLIGADO (`followup_auto = "0"`). Ligar é decisão do dono, porque
 * isso manda mensagem pra gente de verdade.
 *
 * Regras anti-ban (skill `whatsapp-envio`), que moldaram o desenho:
 *   - nunca texto idêntico em massa → variantes rotacionadas por etapa;
 *   - ritmo → poucos por tick; o cron do host roda a cada minuto e o
 *     espaçamento sai de graça, sem `sleep` pendurado numa rota HTTP;
 *   - cap diário.
 */

/** Quantos toques por tick. O espaçamento vem da frequência do cron. */
const POR_TICK = 2;

/**
 * Lead que veio do WhatsApp tem o número como `name`. Um "Oi 5511900001539"
 * entrega que é robô na primeira linha — melhor não chamar pelo nome.
 */
function saudacao(nome: string, phone: string | null): string {
  const so = (v: string) => v.replace(/\D/g, "");
  if (!nome?.trim()) return "Oi";
  if (phone && so(nome) === so(phone)) return "Oi";
  if (/^\d+$/.test(so(nome)) && so(nome).length >= 10) return "Oi";
  return `Oi ${nome.trim().split(/\s+/)[0]}`;
}

/**
 * Texto padrão por etapa. Sem pedido de desculpa e sem licença de fuga
 * ("pode ignorar", "se não for seu momento") — as duas coisas que a copy de
 * reengajamento do workspace proíbe. Abre em continuidade e fecha em ação.
 */
const TEXTOS: Record<string, string[]> = {
  D2: [
    "{{ola}}, dando continuidade ao que a gente começou aqui.\n\n" +
      "Parei na sua meta — é dela que sai a oferta inteira.\n\n" +
      "Me manda em uma linha o que você ajuda seu cliente a conseguir, do jeito que vier, que eu afino e te devolvo pronta.",
    "{{ola}}, voltando de onde a gente parou.\n\n" +
      "Falta só você me dizer a meta que entrega pro seu cliente pra eu reescrever sua oferta.\n\n" +
      "Pode mandar torta que eu ajusto aqui.",
  ],
  D5: [
    "{{ola}}, sua oferta ficou no meio do caminho aqui.\n\n" +
      "Quem me manda a meta específica sai daqui em uns 3 minutos com a promessa reescrita.\n\n" +
      "Me conta o que você entrega e eu sigo de onde a gente parou.",
    "{{ola}}, retomando a sua oferta.\n\n" +
      "O que trava a maioria é a meta genérica: \"te ajudo a ter mais saúde\" não vende, " +
      "\"perder 6 kg em 8 semanas\" vende.\n\n" +
      "Me manda a sua que eu deixo nesse ponto.",
  ],
  D12: [
    "{{ola}}, esse é o último toque que eu dou por aqui.\n\n" +
      "A sua oferta reescrita continua de pé — leva 3 minutos e não custa nada.\n\n" +
      "Me manda a meta que você entrega pro seu cliente e eu termino contigo hoje.",
    "{{ola}}, fechando o que a gente abriu.\n\n" +
      "Ainda dá pra eu te devolver sua promessa reescrita, específica e pronta pra vender.\n\n" +
      "Responde com a meta do seu cliente que eu faço agora.",
  ],
};

async function textosDaEtapa(chave: string): Promise<string[]> {
  const bruto = await config("followup_textos");
  if (bruto) {
    try {
      const mapa = JSON.parse(bruto) as Record<string, string[]>;
      const lista = mapa[chave];
      if (Array.isArray(lista) && lista.length) return lista;
    } catch {
      /* config inválida cai no padrão — nunca deixa a fila parada por JSON torto */
    }
  }
  return TEXTOS[chave] ?? [];
}

/** Rotaciona pelo id do contato: determinístico e distribui sem estado. */
function escolher(lista: string[], semente: string): string {
  let n = 0;
  for (const c of semente) n = (n + c.charCodeAt(0)) % 997;
  return lista[n % lista.length];
}

/**
 * Quantos TOQUES DA RÉGUA sairam hoje.
 *
 * Contava toda mensagem de WhatsApp do dia — e o agente de recepção, sozinho,
 * passa de 30 num dia movimentado. O cap estourava com tráfego que não é dele
 * e a régua nunca enviava nada, sem erro nenhum aparecendo.
 *
 * Cada toque grava um `AuditEvent` próprio; é ele que conta.
 */
async function jaMandouHoje(): Promise<number> {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  return db.auditEvent.count({
    where: { createdAt: { gte: inicio }, actor: "cron:followup", action: "toque_enviado" },
  });
}

/**
 * Números NOSSOS que viraram Contato e entram na fila como se fossem lead.
 * O de notificação é o caso real: ele recebe os avisos por WhatsApp, então o
 * CRM cria contato pra ele — e em 30/08 ele estava na fila dos 92, a um clique
 * de receber um follow-up de reengajamento do próprio sistema.
 */
export async function internos(): Promise<Set<string>> {
  const so = (v: string) => v.replace(/\D/g, "");
  // o WhatsApp do dono e o de avisos nunca entram na fila (equipe: `telefones_internos`, separados por vírgula)
  const chaves = ["notificar_whatsapp", "dono_telefone"];
  const nums = await Promise.all(chaves.map((k) => config(k)));
  const equipe = (await config("telefones_internos", "TELEFONES_INTERNOS")).split(",");
  const set = new Set([...nums, ...equipe, negocio().dono.whatsapp].map(so).filter((n) => n.length >= 12));
  for (const i of await db.whatsappInstance.findMany({ select: { phoneNumber: true } })) {
    if (i.phoneNumber) set.add(so(i.phoneNumber));
  }
  return set;
}

/**
 * A régua só toca quem está NA MESMA CONVERSA que a copy assume.
 *
 * A prévia de 30/08 mostrou por quê: a fila trouxe 128 candidatos da base
 * inteira, incluindo o Evandro com **76 dias** sem contato, que veio do funil
 * do livro. Ele receberia "fechando o que a gente abriu — sua promessa
 * reescrita", texto do funil de mentoria. Mensagem que não bate com o que a
 * pessoa viveu é pior que silêncio: queima o contato e ensina a bloquear.
 *
 * O escopo é o NÚMERO por onde a conversa aconteceu — é ele que define de qual
 * funil a pessoa veio, não a origem gravada no contato.
 */
async function noEscopo(): Promise<Set<string> | null> {
  const fone = (await config("followup_instancia", "FOLLOWUP_INSTANCIA")).replace(
    /\D/g,
    "",
  );
  if (!fone) return null; // sem escopo configurado = régua vale pra base toda

  const inst = await db.whatsappInstance.findFirst({ where: { phoneNumber: fone } });
  if (!inst) return new Set(); // escopo pedido mas número não existe: não toca em ninguém

  const linhas = await db.whatsappMessage.findMany({
    where: { instanceId: inst.id, direction: "inbound" },
    select: { contactId: true },
    distinct: ["contactId"],
  });
  return new Set(linhas.map((l) => l.contactId).filter((x): x is string => !!x));
}

/**
 * Por qual número o toque sai. Tem que ser o MESMO da conversa.
 *
 * `conexaoPadrao()` pode apontar pro celular pessoal do dono, e nenhum dos 118
 * leads da recepção tem `instanceId` gravado no contato (conferido em
 * 30/08/2026: zero de 118). Sem isso, o follow-up sairia do número pessoal
 * do dono pra gente que só falou com o número oficial — remetente estranho,
 * conversa órfã e risco de bloqueio.
 *
 * A fonte confiável é a última mensagem trocada: ela sabe por onde a conversa
 * aconteceu. Sem instância identificada, o toque é PULADO — nunca cai no padrão.
 */
async function instanciaDaConversa(contactId: string): Promise<string | null> {
  // Tem que ser onde o LEAD escreveu, nao a ultima mensagem qualquer.
  // Pegando a ultima mensagem em geral, um disparo de reengajamento feito pelo
  // numero pessoal do dono vira a "instancia da conversa" — e o follow-up
  // sai do celular dele pra quem so falou com o numero oficial. Aconteceu uma
  // vez em 30/08 antes deste ajuste.
  //
  // A janela de 24h tambem pertence ao numero que RECEBEU: e' a mensagem
  // inbound que a abre.
  const dele = await db.whatsappMessage.findFirst({
    where: { contactId, direction: "inbound", instanceId: { not: null } },
    orderBy: { timestamp: "desc" },
    select: { instanceId: true },
  });
  return dele?.instanceId ?? null;
}

/**
 * A janela de 24h da API oficial — o motivo real de a régua nunca ter existido.
 *
 * Descoberto em 30/08/2026 ao ligar o cron pela primeira vez: **HTTP 422** em
 * todos os toques. A Cloud API só entrega TEXTO LIVRE até 24h depois da última
 * mensagem do lead; fora disso, só template aprovado. Os 81 da fila estão
 * parados há 5-10 dias — nenhum texto livre sai pra eles, hoje nem nunca.
 *
 * Enquanto não houver template aprovado na WABA (em 30/08: **zero**), esses
 * contatos são pulados com motivo explícito, em vez de martelar a Graph e
 * encher a auditoria de 422. Conversa em número WAHA não tem essa regra e segue.
 */
const JANELA_MS = 24 * 60 * 60 * 1000;

async function foraDaJanela(contactId: string, instanceId: string): Promise<boolean> {
  const inst = await db.whatsappInstance.findUnique({ where: { id: instanceId } });
  if (inst?.provider !== "cloud_api") return false;

  const ultimaDele = await db.whatsappMessage.findFirst({
    where: { contactId, direction: "inbound" },
    orderBy: { timestamp: "desc" },
    select: { timestamp: true },
  });
  if (!ultimaDele) return true;
  return Date.now() - ultimaDele.timestamp.getTime() > JANELA_MS;
}

export type PreviaToque = {
  telefone: string;
  etapa: string;
  dias: number;
  /** "texto livre" ou "template:<nome>" — dentro ou fora da janela de 24h */
  via: string;
  texto: string;
};

export type ResultadoTick = {
  ligado: boolean;
  candidatos: number;
  enviados: number;
  motivo?: string;
  /** só no modo teste: quem receberia o quê, sem mandar nada */
  previa?: PreviaToque[];
};

/** Um tick do cron. Nunca levanta: fila parada é melhor que fila que derruba. */
export async function processarFollowup(): Promise<ResultadoTick> {
  try {
    // "0" desligado · "teste" calcula e mostra sem enviar · "1" envia
    const modo = await config("followup_auto", "FOLLOWUP_AUTO", "0");
    if (modo !== "1" && modo !== "teste") {
      return { ligado: false, candidatos: 0, enviados: 0, motivo: "desligado" };
    }
    const seco = modo === "teste";

    const cap = Number(await config("followup_cap_dia", undefined, "30")) || 30;
    if (!seco && (await jaMandouHoje()) >= cap) {
      return { ligado: true, candidatos: 0, enviados: 0, motivo: "cap diario atingido" };
    }

    // 1000, não 200: `filaDoDia` monta em ordem de atividade recente e PARA no
    // limite. Com 200, os disparos de reengajamento diários (que renovam a
    // atividade de centenas de contatos) enchiam as vagas antes dos leads da
    // recepção serem avaliados — 65 leads em D5 ficavam invisíveis pra régua.
    // O escopo e o cap diário fazem o corte depois; aqui só não pode faltar.
    const fila = await filaDoDia(1000);
    const nossos = await internos();
    const escopo = await noEscopo();
    // D0 é o primeiro contato — quem faz isso é o agente, não a régua.
    const alvos = fila.filter(
      (i: ItemFila) =>
        i.etapa.chave !== "D0" &&
        i.telefone &&
        !nossos.has(String(i.telefone).replace(/\D/g, "")) &&
        (!escopo || escopo.has(i.contactId)),
    );
    if (!alvos.length) return { ligado: true, candidatos: 0, enviados: 0 };

    let enviados = 0;
    const previa: PreviaToque[] = [];

    // No teste a lista INTEIRA é montada — o valor está em ver quem entraria,
    // não em simular o ritmo.
    for (const item of seco ? alvos : alvos.slice(0, POR_TICK)) {
      const contato = await db.contact.findUnique({ where: { id: item.contactId } });
      if (!contato?.phone) continue;
      // "Só humano" (tag humano/controle-*): a régua também fica de fora.
      if (temControle(tagsDe(contato.tags))) continue;
      if (semAutomacao(contato.lifecycleStage)) continue; // contato pessoal: nunca recebe automação
      // Reunião futura agendada: só o robô da agenda fala (preparo e lembrete).
      if (reuniaoFutura(contato.customFields)) continue;

      const lista = await textosDaEtapa(item.etapa.chave);
      if (!lista.length) continue;

      const campos =
        contato.customFields && typeof contato.customFields === "object"
          ? (contato.customFields as Record<string, unknown>)
          : {};
      const texto = aplicarVariaveis(
        escolher(lista, contato.id).replace(/\{\{\s*ola\s*\}\}/gi, saudacao(contato.name, contato.phone)),
        contato,
      );

      if (seco) {
        const toqueSeco = await podeTocarContato({ contactId: contato.id, regua: "followup-auto", seco: true });
        if (!toqueSeco.liberado) continue;
        const inst = await instanciaDaConversa(contato.id);
        const foraSeco = inst ? await foraDaJanela(contato.id, inst) : false;
        const tpl = (await config("followup_template", "FOLLOWUP_TEMPLATE")).trim();
        if (foraSeco && !tpl) continue;
        previa.push({
          telefone: contato.phone,
          etapa: item.etapa.chave,
          dias: item.diasSemContato,
          via: foraSeco ? `template:${tpl}` : "texto livre",
          texto: foraSeco ? `[template ${tpl}]` : texto,
        });
        continue;
      }

      const instanceId =
        (typeof campos.instanceId === "string" ? campos.instanceId : null) ??
        (await instanciaDaConversa(contato.id));
      if (!instanceId) {
        await auditar("cron:followup", "toque_pulado", `${contato.id}: sem instancia da conversa`);
        continue;
      }
      const fora = await foraDaJanela(contato.id, instanceId);
      const template = (await config("followup_template", "FOLLOWUP_TEMPLATE")).trim();

      // Fora da janela de 24h a Cloud API recusa texto livre (HTTP 422). O
      // template aprovado e' a UNICA porta — e o papel dele nao e' vender, e'
      // fazer a pessoa responder: a resposta reabre a janela e a regua volta a
      // mandar os textos normais no proximo tick.
      if (fora && !template) {
        if (!seco) {
          await auditar(
            "cron:followup",
            "toque_pulado",
            `${contato.id}: fora da janela de 24h e sem template configurado`,
          );
        }
        continue;
      }

      const conexaoDaConversa = await conexaoPorId(instanceId);
      if (!conexaoDaConversa) return { ligado: true, candidatos: alvos.length, enviados, motivo: "WhatsApp nao conectado" };
      // Guarda central (13/11/2026): compra, opt-out, adiamento, "vamos fechar", última fala do lead, número único.
      const toque = await podeTocarContato({ contactId: contato.id, regua: "followup-auto", conexao: conexaoDaConversa });
      if (!toque.liberado) continue;
      const conexao = toque.conexao ?? conexaoDaConversa;
      const destino =
        typeof campos.whatsapp_chat_id === "string" && campos.whatsapp_chat_id
          ? campos.whatsapp_chat_id
          : contato.phone;

      const r = fora
        ? await enviarTemplate(conexao, destino, template)
        : await enviarTexto(conexao, destino, texto);
      if (!r.ok) {
        await auditar("cron:followup", "toque_falhou", `${contato.id}: ${r.erro ?? "?"}`);
        continue;
      }

      await db.whatsappMessage.create({
        data: {
          contactId: contato.id,
          instanceId: conexao.instanceId ?? null,
          fromNumber: "crm",
          toNumber: contato.phone,
          body: fora ? `[template ${template}]` : texto,
          direction: "outbound",
          status: "sent",
          externalId: r.externalId ?? null,
          metadata: { origem: "followup", followup: item.etapa.chave, ator: "cron" } as never,
        },
      });
      // O carimbo `followup` é o que impede a etapa de repetir — a linha do
      // tempo é o registro, não uma tabela de controle (LEI 3).
      await registrarEvento({
        contactId: contato.id,
        eventType: "whatsapp_message",
        channel: "whatsapp",
        metadata: {
          direcao: "enviada",
          texto: fora ? `[template ${template}]` : texto,
          followup: item.etapa.chave,
          ator: "cron",
          ...(fora ? { template } : {}),
        },
      });
      await auditar("cron:followup", "toque_enviado", `${contato.id} · ${item.etapa.chave}`);
      // fora da janela de 24h só template sai: não dá pra mandar convite em texto livre
      if (!fora) await enviarConviteAulaSeElegivel({ contactId: contato.id, conexao, destino });
      enviados++;
    }

    if (seco) {
      return { ligado: true, candidatos: alvos.length, enviados: 0, motivo: "modo teste — nada enviado", previa };
    }
    return { ligado: true, candidatos: alvos.length, enviados };
  } catch (e) {
    return {
      ligado: true,
      candidatos: 0,
      enviados: 0,
      motivo: e instanceof Error ? e.message : String(e),
    };
  }
}
