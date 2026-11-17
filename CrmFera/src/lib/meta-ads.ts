import https from "node:https";
import { config } from "@/lib/config";

/**
 * Criativo do anúncio que trouxe o lead — imagem e destino.
 *
 * O painel de captação entrega só o NOME do anúncio ("ad-leadform-01 | seu
 * cliente esta procurando"). Nome não diz nada pra quem vai atender: o que
 * ajuda é VER a peça que a pessoa clicou e saber pra onde ela foi.
 *
 * Duas armadilhas da Graph que moldaram este arquivo:
 *
 * 1. **A URL da imagem é assinada e EXPIRA** (`oe=` no fim). Guardar a URL num
 *    banco entrega imagem quebrada dias depois. Por isso o cache é curto e em
 *    memória — a ficha é aberta minutos depois do aviso, não meses.
 * 2. **Anúncio de lead form não tem página de destino** no sentido comum: o
 *    destino é o formulário instantâneo. Mesmo assim o `link_data.link` existe
 *    (é pra onde vai quem clica no post), e é ele que mostramos.
 * 3. **Não dá pra listar a conta inteira com o criativo expandido.** A Graph
 *    responde "Please reduce the amount of data you're asking for" já com
 *    `limit=300`. Por isso a busca é PONTUAL, por nome (`filtering` CONTAIN),
 *    e o cache guarda uma entrada por anúncio consultado.
 */

export type CriativoDoAnuncio = {
  nome: string;
  imagem?: string;
  destino?: string;
  permalink?: string;
};

const VALIDADE_MS = 60 * 60 * 1000; // a URL assinada da imagem não vive muito
const cache = new Map<string, { em: number; valor: CriativoDoAnuncio | null }>();

function get(url: string, timeoutMs = 20000): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let corpo = "";
      res.setEncoding("utf8");
      res.on("data", (p) => {
        corpo += p;
      });
      res.on("end", () => resolve(corpo));
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

type AdGraph = {
  name?: string;
  creative?: {
    thumbnail_url?: string;
    image_url?: string;
    effective_object_story_id?: string;
    object_story_spec?: {
      link_data?: { link?: string };
      video_data?: { call_to_action?: { value?: { link?: string } } };
    };
  };
};

/** O nome vem com sufixos ("| seu cliente esta procurando"); o prefixo basta e
 *  é o que sobrevive a rename de variação. */
function termoDeBusca(nome: string): string {
  const corte = nome.split(/[|·]/)[0].trim();
  return (corte || nome).slice(0, 60);
}

async function buscar(nome: string): Promise<CriativoDoAnuncio | null> {
  const token = await config("meta_ads_token", "META_ADS_TOKEN");
  const conta = (await config("meta_ads_account", "META_ADS_ACCOUNT")).replace(/^act_/, "");
  if (!token || !conta) {
    console.log("[meta-ads] sem META_ADS_TOKEN/META_ADS_ACCOUNT — a ficha mostra só o nome do anúncio");
    return null;
  }

  const filtro = JSON.stringify([
    { field: "ad.name", operator: "CONTAIN", value: termoDeBusca(nome) },
  ]);
  const campos = "name,creative{image_url,thumbnail_url,effective_object_story_id,object_story_spec}";
  const url =
    `https://graph.facebook.com/v21.0/act_${conta}/ads` +
    `?filtering=${encodeURIComponent(filtro)}` +
    `&fields=${encodeURIComponent(campos)}&limit=5&access_token=${encodeURIComponent(token)}`;

  const dados = JSON.parse(await get(url)) as { data?: AdGraph[]; error?: { message?: string } };
  if (dados.error) {
    console.log("[meta-ads] Graph recusou:", String(dados.error.message).slice(0, 160));
    return null;
  }
  const lista = dados.data ?? [];
  const ad =
    lista.find((a) => String(a.name ?? "").toLowerCase() === nome.toLowerCase()) ?? lista[0];
  if (!ad) return null;

  const c = ad.creative ?? {};
  const oss = c.object_story_spec ?? {};
  const story = c.effective_object_story_id;
  return {
    nome: String(ad.name ?? nome),
    imagem: c.image_url || c.thumbnail_url || undefined,
    destino: oss.link_data?.link || oss.video_data?.call_to_action?.value?.link || undefined,
    permalink: story ? `https://www.facebook.com/${story.split("_").pop()}` : undefined,
  };
}

/** Nunca levanta: sem criativo, a ficha mostra o nome do anúncio e segue. */
export async function criativoDoAnuncio(nomeDoAd: unknown): Promise<CriativoDoAnuncio | null> {
  const nome = String(nomeDoAd ?? "").trim();
  if (!nome) return null;
  const chave = nome.toLowerCase();
  const guardado = cache.get(chave);
  if (guardado && Date.now() - guardado.em < VALIDADE_MS) {
    return guardado.valor ?? { nome };
  }
  try {
    const valor = await buscar(nome);
    cache.set(chave, { em: Date.now(), valor });
    return valor ?? { nome };
  } catch (e) {
    console.log("[meta-ads] falhou:", e instanceof Error ? e.message : String(e));
    return { nome };
  }
}


/* ── Anúncio por ID (CTWA) ──────────────────────────────────────────────────
   O `referral` do Click-to-WhatsApp entrega o ID do anúncio em `source_id`.
   Buscar por ID é melhor que por nome em tudo: é exato, sobrevive a rename, e
   traz conjunto e campanha na mesma chamada — o que a tela de Aquisição
   precisa pra fechar CPL. */

export type AnuncioCtwa = {
  adId: string;
  nome?: string;
  adset?: string;
  campanha?: string;
  imagem?: string;
  destino?: string;
};

const cacheId = new Map<string, { em: number; valor: AnuncioCtwa | null }>();

/**
 * Nunca levanta. Sem token vivo devolve `null` e quem chama guarda o ID cru —
 * o nome pode ser resolvido depois, o ID não se recupera.
 */
export async function anuncioPorId(adId: string): Promise<AnuncioCtwa | null> {
  const id = String(adId ?? "").trim();
  if (!/^[0-9]{6,}$/.test(id)) return null;

  const guardado = cacheId.get(id);
  if (guardado && Date.now() - guardado.em < VALIDADE_MS) return guardado.valor;

  const token = await config("meta_ads_token", "META_ADS_TOKEN");
  if (!token) {
    console.log("[meta-ads] sem META_ADS_TOKEN — o CTWA guarda o ad id sem o nome");
    return null;
  }

  try {
    const campos = "name,adset{name},campaign{name},creative{image_url,thumbnail_url,object_story_spec}";
    const url =
      `https://graph.facebook.com/v21.0/${encodeURIComponent(id)}` +
      `?fields=${encodeURIComponent(campos)}&access_token=${encodeURIComponent(token)}`;
    const d = JSON.parse(await get(url)) as {
      name?: string;
      adset?: { name?: string };
      campaign?: { name?: string };
      creative?: AdGraph["creative"];
      error?: { message?: string };
    };
    if (d.error) {
      console.log("[meta-ads] Graph recusou o ad", id, String(d.error.message).slice(0, 160));
      cacheId.set(id, { em: Date.now(), valor: null });
      return null;
    }
    const oss = d.creative?.object_story_spec ?? {};
    const valor: AnuncioCtwa = {
      adId: id,
      nome: d.name,
      adset: d.adset?.name,
      campanha: d.campaign?.name,
      imagem: d.creative?.image_url || d.creative?.thumbnail_url || undefined,
      destino: oss.link_data?.link || oss.video_data?.call_to_action?.value?.link || undefined,
    };
    cacheId.set(id, { em: Date.now(), valor });
    return valor;
  } catch (e) {
    console.log("[meta-ads] anuncioPorId falhou:", e instanceof Error ? e.message : String(e));
    return null;
  }
}
