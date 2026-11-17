/**
 * Tela de reuniões: junta o que a agenda grava no contato (customFields.evento_data)
 * com o resultado que o closer marca (evento `call` com `resultado`).
 * Só existe a reunião MAIS RECENTE de cada contato — remarcar sobrescreve a data.
 */

import { origemDaReuniao } from "./pagina-reuniao";

export type ResultadoReuniao = "compareceu" | "no_show";

export interface EventoResultado {
  resultado: string;
  timestamp: Date;
}

export interface ContatoReuniao {
  id: string;
  name: string;
  phone: string | null;
  origem: string;
  customFields: unknown;
  eventos: EventoResultado[];
  tags?: unknown;
}

/** Tags próprias da tela (prefixo evita colidir com "frio"/"quente" de importação e estágio). */
export const TAG_QUENTE = "reuniao-quente";
export const TAG_FRIA = "reuniao-fria";
export const TAG_PROPOSTA = "proposta-recebida";

export type Temperatura = "quente" | "frio" | null;

export interface Reuniao {
  id: string;
  nome: string;
  phone: string | null;
  origem: string;
  funil: string;
  /** página que gerou a reunião (nome legível; nunca vazio) */
  pagina: string;
  /** campanha/meio da UTM (ex.: "grupo-bastidores · grupo"), null sem UTM */
  canal: string | null;
  quando: Date;
  link: string;
  /** passou do horário e ninguém marcou se compareceu */
  semResultado: boolean;
  temperatura: Temperatura;
  propostaRecebida: boolean;
}

export interface Reunioes {
  aRealizar: Reuniao[];
  realizadas: Reuniao[];
  noShow: Reuniao[];
}

// O resultado é marcado depois da reunião; margem pra quem marca um pouco antes.
const MARGEM_MS = 2 * 60 * 60 * 1000;

function texto(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function classificarReunioes(contatos: ContatoReuniao[], agora: Date = new Date()): Reunioes {
  const aRealizar: Reuniao[] = [];
  const realizadas: Reuniao[] = [];
  const noShow: Reuniao[] = [];

  for (const c of contatos) {
    const campos = c.customFields && typeof c.customFields === "object" ? (c.customFields as Record<string, unknown>) : {};
    const bruto = texto(campos.evento_data);
    const quando = bruto ? new Date(bruto) : null;
    if (!quando || Number.isNaN(quando.getTime())) continue;

    const tags = Array.isArray(c.tags) ? (c.tags as unknown[]) : [];
    const origemPagina = origemDaReuniao(campos);
    const base: Reuniao = {
      id: c.id,
      nome: c.name,
      phone: c.phone,
      origem: c.origem,
      funil: texto(campos.funil) || c.origem,
      pagina: origemPagina.pagina,
      canal: origemPagina.canal,
      quando,
      link: texto(campos.link_reuniao),
      semResultado: false,
      temperatura: tags.includes(TAG_QUENTE) ? "quente" : tags.includes(TAG_FRIA) ? "frio" : null,
      propostaRecebida: tags.includes(TAG_PROPOSTA),
    };

    // resultado só vale se foi marcado depois do horário da reunião ATUAL (remarcou = zera)
    const marcado = c.eventos
      .filter((e) => (e.resultado === "compareceu" || e.resultado === "no_show") && e.timestamp.getTime() >= quando.getTime() - MARGEM_MS)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (marcado?.resultado === "compareceu") realizadas.push(base);
    else if (marcado?.resultado === "no_show") noShow.push(base);
    else aRealizar.push({ ...base, semResultado: quando.getTime() <= agora.getTime() });
  }

  const asc = (a: Reuniao, b: Reuniao) => a.quando.getTime() - b.quando.getTime();
  const desc = (a: Reuniao, b: Reuniao) => b.quando.getTime() - a.quando.getTime();
  return { aRealizar: aRealizar.sort(asc), realizadas: realizadas.sort(desc), noShow: noShow.sort(desc) };
}
