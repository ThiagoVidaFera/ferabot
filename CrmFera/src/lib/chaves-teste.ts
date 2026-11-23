/**
 * Teste de cada chave contra o serviço dela, na hora em que o dono salva.
 * `ok: null` = não existe teste automático para essa chave (fica "salva", não "funcionando").
 */
export type ResultadoTeste = { ok: boolean | null; msg: string };

const TEMPO_LIMITE_MS = 12000;

type Buscar = (url: string, init?: RequestInit) => Promise<Response>;

async function responde(buscar: Buscar, url: string, headers: Record<string, string>): Promise<number> {
  const resposta = await buscar(url, { headers, signal: AbortSignal.timeout(TEMPO_LIMITE_MS), cache: "no-store" });
  return resposta.status;
}

function pelaResposta(status: number, servico: string): ResultadoTeste {
  if (status >= 200 && status < 300) return { ok: true, msg: `${servico} aceitou a chave.` };
  if (status === 401 || status === 403 || status === 400) {
    return { ok: false, msg: `${servico} recusou a chave. Confira se copiou inteira e se ela não venceu.` };
  }
  return { ok: null, msg: `${servico} respondeu ${status}. A chave ficou salva; teste de novo em alguns minutos.` };
}

function peloFormato(valor: string, regra: RegExp, esperado: string): ResultadoTeste {
  return regra.test(valor)
    ? { ok: null, msg: "Formato certo. Essa chave não tem teste automático." }
    : { ok: false, msg: `Formato estranho. O esperado é ${esperado}.` };
}

/**
 * `outras` traz as chaves já salvas, para os testes que dependem de um par
 * (a conta de anúncios só se confere com o token).
 */
export async function testarChave(
  env: string,
  valor: string,
  outras: Record<string, string> = {},
  buscar: Buscar = fetch,
): Promise<ResultadoTeste> {
  try {
    switch (env) {
      case "GEMINI_API_KEY":
        return pelaResposta(
          await responde(buscar, "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", {
            "x-goog-api-key": valor,
          }),
          "O Gemini",
        );
      case "NETLIFY_AUTH_TOKEN":
        return pelaResposta(
          await responde(buscar, "https://api.netlify.com/api/v1/user", { Authorization: `Bearer ${valor}` }),
          "A Netlify",
        );
      case "META_ACCESS_TOKEN":
        return pelaResposta(
          await responde(buscar, "https://graph.facebook.com/me?fields=id", { Authorization: `Bearer ${valor}` }),
          "A Meta",
        );
      case "META_AD_ACCOUNT_ID": {
        if (!/^act_\d+$/.test(valor)) return { ok: false, msg: "Formato estranho. O esperado é act_ seguido só de números." };
        const token = outras.META_ACCESS_TOKEN;
        if (!token) return { ok: null, msg: "Formato certo. Salve o token do Meta Ads para eu conferir a conta." };
        return pelaResposta(
          await responde(buscar, `https://graph.facebook.com/${valor}?fields=name`, { Authorization: `Bearer ${token}` }),
          "A Meta",
        );
      }
      case "ELEVENLABS_API_KEY":
        return pelaResposta(
          await responde(buscar, "https://api.elevenlabs.io/v1/models", { "xi-api-key": valor }),
          "A ElevenLabs",
        );
      case "YT_CLIENT_ID":
        return peloFormato(valor, /\.apps\.googleusercontent\.com$/, "terminar com .apps.googleusercontent.com");
      case "YT_CLIENT_SECRET":
        return peloFormato(valor, /^GOCSPX-/, "começar com GOCSPX-");
      case "YT_REFRESH_TOKEN":
      case "GCAL_REFRESH_TOKEN":
        return peloFormato(valor, /^1\/\//, "começar com 1//");
      case "FAL_KEY":
        return peloFormato(valor, /^[^:\s]+:[^:\s]+$/, "id:segredo");
      case "RESEND_API_KEY":
        return peloFormato(valor, /^re_/, "começar com re_");
      case "IG_USER_ID":
        return peloFormato(valor, /^\d{5,}$/, "só números");
      case "META_PIXEL_ID": {
        if (!/^\d{10,20}$/.test(valor)) return { ok: false, msg: "Formato estranho. O id do pixel é só número, com 15 ou 16 dígitos." };
        const token = outras.META_ACCESS_TOKEN;
        if (!token) return { ok: null, msg: "Formato certo. Salve o token da Meta para eu conferir o pixel." };
        return pelaResposta(
          await responde(buscar, `https://graph.facebook.com/v21.0/${valor}?fields=name`, { Authorization: `Bearer ${token}` }),
          "A Meta",
        );
      }
      default:
        return { ok: null, msg: "Chave salva. Essa não tem teste automático." };
    }
  } catch {
    // Mensagem fixa de propósito: o texto do erro de rede pode citar o valor enviado,
    // e este resultado é gravado em claro e mostrado na tela.
    return { ok: null, msg: "Não consegui falar com o serviço agora. A chave ficou salva; teste de novo." };
  }
}

export type ContaInstagram = { pagina: string; id: string; usuario: string };

/**
 * As contas do Instagram ligadas às Páginas que o token do Meta enxerga. É assim que o painel
 * acha sozinho o id do Instagram: o mesmo token do usuário do sistema serve para anúncio,
 * publicação e Direct. Erro de rede ou permissão = lista vazia (o dono cola o id à mão).
 */
export async function contasInstagramDoToken(token: string, buscar: Buscar = fetch): Promise<ContaInstagram[]> {
  try {
    const url = "https://graph.facebook.com/v21.0/me/accounts?fields=name,instagram_business_account%7Bid,username%7D&limit=50";
    const resposta = await buscar(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      cache: "no-store",
    });
    if (!resposta.ok) return [];
    const corpo = (await resposta.json()) as { data?: { name?: string; instagram_business_account?: { id?: string; username?: string } }[] };
    return (corpo.data ?? [])
      .filter((p) => p.instagram_business_account?.id && /^\d+$/.test(p.instagram_business_account.id))
      .map((p) => ({
        pagina: String(p.name ?? "").slice(0, 120),
        id: String(p.instagram_business_account?.id),
        usuario: String(p.instagram_business_account?.username ?? "").slice(0, 60),
      }));
  } catch {
    return [];
  }
}
