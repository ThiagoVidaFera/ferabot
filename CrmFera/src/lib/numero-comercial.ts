import { config } from "@/lib/config";

/**
 * NÚMEROS COMERCIAIS COM VOZ PRÓPRIA (opcional, desligado por padrão).
 *
 * Quando um WhatsApp do CRM é de outra pessoa da equipe (um sócio, um vendedor), o agente pode
 * escrever como ela. Configure `personas_json` (tela de Configurações ou env `PERSONAS_JSON`),
 * uma entrada por sessão do WAHA:
 *
 *   {
 *     "comercial": {
 *       "nome": "Paula",
 *       "agentePadrao": "recepcao",
 *       "passagemSilenciosa": true,
 *       "avisarEm": "5511988887777",
 *       "apresentacao": "paula\\s*aqui",
 *       "bloco": "# IDENTIDADE NESTE NÚMERO\nVocê escreve como a Paula, da equipe...",
 *       "mensagemPronta": "^\\s*oi,?\\s*paula"
 *     }
 *   }
 *
 * - `apresentacao`: regex que a 1ª mensagem da conversa precisa conter (o guarda recusa sem ela).
 * - `passagemSilenciosa`: na passagem para humano não sai mensagem, só o aviso.
 * - `mensagemPronta`: regex do texto pronto dos botões das páginas; quem chega assim vira lead de funil.
 * Sem configuração: nenhum número tem persona e o CRM fala com a voz do dono (negocio.json).
 */

export type Persona = {
  nome: string;
  /** agente que atende quando nenhum gatilho de funil casa */
  agentePadrao: string;
  /** humano:true não manda mensagem: só carimba `humano` e avisa */
  passagemSilenciosa: boolean;
  /** WhatsApp da pessoa dona do número: o aviso de passagem vai pra ela também */
  avisarEm: string;
  /** a apresentação que a 1ª mensagem da conversa PRECISA ter */
  apresentacao: RegExp;
  /** vai no fim do prompt e manda mais que a identidade do prompt do agente */
  bloco: string;
};

type PersonaBruta = Omit<Persona, "apresentacao"> & { apresentacao: string; mensagemPronta?: string };

type Estado = { personas: Record<string, Persona>; mensagemPronta: RegExp[] };

function ler(json: string | undefined | null): Estado {
  const vazio: Estado = { personas: {}, mensagemPronta: [] };
  if (!json) return vazio;
  try {
    const bruto = JSON.parse(json) as Record<string, PersonaBruta>;
    const personas: Record<string, Persona> = {};
    const mensagemPronta: RegExp[] = [];
    for (const [sessao, p] of Object.entries(bruto)) {
      if (!p?.nome) continue;
      personas[sessao] = {
        nome: p.nome,
        agentePadrao: p.agentePadrao || "recepcao",
        passagemSilenciosa: Boolean(p.passagemSilenciosa),
        avisarEm: String(p.avisarEm ?? "").replace(/\D/g, ""),
        apresentacao: new RegExp(p.apresentacao || p.nome, "i"),
        bloco: p.bloco ?? "",
      };
      if (p.mensagemPronta) mensagemPronta.push(new RegExp(p.mensagemPronta, "i"));
    }
    return { personas, mensagemPronta };
  } catch (erro) {
    console.error("[numero-comercial] personas_json inválido, personas desligadas:", erro);
    return vazio;
  }
}

let estado: Estado = ler(process.env.PERSONAS_JSON);

/** Relê as personas do Setting (boot e antes de responder). */
export async function recarregarPersonas(): Promise<number> {
  estado = ler(await config("personas_json", "PERSONAS_JSON"));
  return Object.keys(estado.personas).length;
}

/** Só para testes. */
export function _definirPersonas(json: string | null): void {
  estado = ler(json);
}

export function personaDaSessao(sessao: string | null | undefined): Persona | null {
  return (sessao && estado.personas[sessao]) || null;
}

const ORIGENS_ANUNCIO = ["ctwa", "anuncio"];

/** Origem de quem chega pelo texto pronto do botão de uma página (ver `mensagemPronta`). */
export const ORIGEM_MENSAGEM_PRONTA = "funil:whatsapp-mensagem-pronta";

export function origemDaMensagemPronta(corpo: string | null | undefined): string | null {
  const texto = String(corpo ?? "");
  return estado.mensagemPronta.some((r) => r.test(texto)) ? ORIGEM_MENSAGEM_PRONTA : null;
}

/** Lead que o número comercial atende: veio de funil ou de anúncio. */
export function ehLeadComercial(origem: string | null | undefined): boolean {
  const o = String(origem ?? "").toLowerCase();
  return o.startsWith("funil:") || ORIGENS_ANUNCIO.includes(o);
}
