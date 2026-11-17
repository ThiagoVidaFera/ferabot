/**
 * De qual página saiu a reunião (painel /reunioes).
 *
 * A página de agendamento grava a chave dela em `customFields.pagina`. Sem essa chave, a página é
 * deduzida de `origem_url` (o caminho da URL vira o nome: `/agendar/` -> "agendar"). Para dar nome
 * bonito a uma chave, acrescente em `PAGINAS_REUNIAO`.
 */

export const PAGINAS_REUNIAO: Readonly<Record<string, string>> = {
  agendar: "Página de agendamento",
  home: "Página inicial",
};

export const SEM_PAGINA = "Página não registrada";

export interface OrigemReuniao {
  /** chave da página (ex.: "agendar") ou null se não deu para saber */
  chave: string | null;
  /** nome legível, sempre preenchido */
  pagina: string;
  /** de onde veio o clique (ex.: "grupo · whatsapp"), null sem UTM */
  canal: string | null;
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function paginaPorUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const caminho = u.pathname.replace(/\/+$/, "") || "/";
  if (caminho === "/") return "home";
  const primeiro = caminho.split("/").filter(Boolean)[0];
  return primeiro ? primeiro.toLowerCase() : null;
}

function nomeDaChave(chave: string): string {
  return PAGINAS_REUNIAO[chave] ?? `Página ${chave.replace(/[-_]+/g, " ")}`;
}

export function origemDaReuniao(customFields: unknown): OrigemReuniao {
  const c = customFields && typeof customFields === "object" ? (customFields as Record<string, unknown>) : {};

  const gravada = texto(c.pagina);
  const chave = gravada || paginaPorUrl(texto(c.origem_url));

  const campanha = texto(c.campanha);
  const medio = texto(c.utm_medium);
  const partes = [campanha, medio].filter((p, i, a) => p && a.indexOf(p) === i);

  return {
    chave: chave || null,
    pagina: chave ? nomeDaChave(chave) : SEM_PAGINA,
    canal: partes.length ? partes.join(" · ") : null,
  };
}
