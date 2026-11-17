import { configMuitas, gravarConfig } from "@/lib/config";

/**
 * O CICLO do evento ao vivo (workshop/aula) — fonte unica de data, links e
 * brinde dos Agentes 01 e 02. "Data, link e preco vivem no CRM, num lugar so.
 * Ciclo novo = atualizar la" (playbook). Editavel em /configuracoes.
 *
 * Ciclo novo, tag nova: `inscrito-evento-c02` nunca reaproveita a do c01.
 */

export const CHAVES_EVENTO = [
  "evento_ciclo",
  "evento_nome",
  "evento_data",
  "evento_link_sala",
  "evento_link_grupo",
  "evento_brinde",
  "evento_brinde_link",
  "evento_o_que_vai_ver",
  "evento_datas_antigas",
  "evento_fim_condicao",
  "evento_proximo",
  "evento_link_inscricao",
  // Evento PAGO: preco do ingresso ("R$ 10") e o checkout dele. Vazios = evento gratuito.
  "evento_ingresso",
  "evento_link_ingresso",
] as const;

export type ChaveEvento = (typeof CHAVES_EVENTO)[number];

export type Evento = {
  ciclo: string;
  nome: string;
  data: string;
  linkSala: string;
  linkGrupo: string;
  brinde: string;
  brindeLink: string;
  oQueVaiVer: string;
  datasAntigas: string;
  fimCondicao: string;
  proximo: string;
  linkInscricao: string;
  /** "R$ 10" — vazio = evento gratuito. */
  ingresso: string;
  /** Checkout do ingresso. E o UNICO caso em que agente manda checkout direto. */
  linkIngresso: string;
  /** true quando tem nome E data — sem isso os agentes 01/02 nao devem rodar. */
  definido: boolean;
  /** true quando o evento e pago (tem preco de ingresso). */
  pago: boolean;
};

const PADRAO: Record<ChaveEvento, string> = {
  evento_ciclo: "01",
  evento_nome: "",
  evento_data: "",
  evento_link_sala: "",
  evento_link_grupo: "",
  evento_brinde: "",
  evento_brinde_link: "",
  evento_o_que_vai_ver: "",
  evento_datas_antigas: "",
  evento_fim_condicao: "",
  evento_proximo: "",
  evento_link_inscricao: "",
  evento_ingresso: "",
  evento_link_ingresso: "",
};

export async function lerEvento(): Promise<Evento> {
  const v = await configMuitas([...CHAVES_EVENTO]);
  const pega = (k: ChaveEvento) => (v[k] ?? "").trim() || PADRAO[k];
  const nome = pega("evento_nome");
  const data = pega("evento_data");
  return {
    ciclo: pega("evento_ciclo").replace(/\D/g, "").padStart(2, "0") || "01",
    nome,
    data,
    linkSala: pega("evento_link_sala"),
    linkGrupo: pega("evento_link_grupo"),
    brinde: pega("evento_brinde"),
    brindeLink: pega("evento_brinde_link"),
    oQueVaiVer: pega("evento_o_que_vai_ver"),
    datasAntigas: pega("evento_datas_antigas"),
    fimCondicao: pega("evento_fim_condicao"),
    proximo: pega("evento_proximo"),
    linkInscricao: pega("evento_link_inscricao"),
    ingresso: pega("evento_ingresso"),
    linkIngresso: pega("evento_link_ingresso"),
    definido: Boolean(nome && data),
    pago: Boolean(pega("evento_ingresso")),
  };
}

export async function gravarEvento(valores: Partial<Record<ChaveEvento, string>>) {
  for (const k of CHAVES_EVENTO) {
    if (valores[k] !== undefined) await gravarConfig(k, String(valores[k]).trim());
  }
}

/** Links do ciclo que o guarda precisa aceitar (sala, grupo, brinde, inscricao, ingresso). */
export function linksDoEvento(e: Evento): string[] {
  return [e.linkSala, e.linkGrupo, e.brindeLink, e.linkInscricao, e.linkIngresso].filter((l) =>
    /^https?:\/\//i.test(l),
  );
}

/** Precos que o ciclo autoriza o agente a citar (so digitos): o ingresso. */
export function precosDoEvento(e: Evento): string[] {
  return (e.ingresso.match(/[\d.,]+/g) ?? [])
    .map((v) => v.replace(/,\d{2}$/, "").replace(/\D/g, ""))
    .filter(Boolean);
}
