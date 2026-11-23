import { db } from "@/lib/db";
import { config, gravarConfig } from "@/lib/config";
import { urlDoWebhookPadrao } from "@/lib/url";
import { conexaoPadrao, estadoSessao, iniciarSessao, type EstadoSessao } from "@/lib/whatsapp";
import { motivoServidorRecusado, normalizarServidor, painelHospedado } from "@/lib/hospedado";

/**
 * Liga o WhatsApp que roda no servidor do cliente (WAHA, por QR code) a este painel.
 * Fluxo: confere o endereço, confere a chave, grava como número padrão e cria a sessão
 * já com o webhook deste painel. O QR aparece em Configurações.
 */
const K_ULTIMO = "whatsapp_ultimo_teste";
const TEMPO_TESTE_MS = 15000;
const SESSAO_PADRAO = "principal";

export type ResultadoLigacao = { ok: boolean; msg: string; status?: EstadoSessao["status"]; em: string };

export type DadosServidor = { url: unknown; apiKey: unknown; sessao?: unknown };

function texto(valor: unknown, limite = 500): string {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}

async function guardar(resultado: Omit<ResultadoLigacao, "em">): Promise<ResultadoLigacao> {
  const completo = { ...resultado, em: new Date().toISOString() };
  await gravarConfig(K_ULTIMO, JSON.stringify(completo));
  return completo;
}

export async function ultimoTesteWhatsapp(): Promise<ResultadoLigacao | null> {
  const bruto = await config(K_ULTIMO);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as ResultadoLigacao;
  } catch {
    return null;
  }
}

/** A chave abre o servidor? 401/403 = chave errada; sem resposta = servidor fora do ar. */
async function conferirServidor(url: string, apiKey: string): Promise<string | null> {
  try {
    const r = await fetch(`${url}/api/sessions?all=true`, {
      headers: { "X-Api-Key": apiKey },
      signal: AbortSignal.timeout(TEMPO_TESTE_MS),
      cache: "no-store",
    });
    if (r.status === 401 || r.status === 403) return "O servidor recusou a chave. Confira se copiou a chave inteira.";
    if (!r.ok) return `O servidor respondeu ${r.status}. Confira se o endereço é o do WhatsApp.`;
    return null;
  } catch {
    // mensagem fixa: o erro de rede pode citar o endereço com detalhes do servidor
    return "Não consegui falar com o servidor. Confira se ele está ligado e se o endereço está certo.";
  }
}

async function gravarComoPadrao(url: string, apiKey: string, sessao: string): Promise<void> {
  const atual = await db.whatsappInstance.findFirst({ where: { isDefault: true }, orderBy: { createdAt: "desc" } });
  const dados = { provider: "waha", evolutionApiUrl: url, evolutionApiKey: apiKey, instanceName: sessao };
  if (atual) {
    await db.whatsappInstance.update({ where: { id: atual.id }, data: { ...dados, status: "desconectado" } });
    return;
  }
  await db.whatsappInstance.create({ data: { ...dados, name: "Principal", isDefault: true } });
}

async function webhookDestePainel(): Promise<string> {
  return config("webhook_url_publica", "WEBHOOK_URL_PUBLICA", urlDoWebhookPadrao());
}

export async function ligarServidorWhatsapp(dados: DadosServidor): Promise<ResultadoLigacao> {
  const urlBruta = texto(dados.url);
  const apiKey = texto(dados.apiKey, 200);
  const sessao = texto(dados.sessao, 60) || SESSAO_PADRAO;
  if (!urlBruta || !apiKey) return guardar({ ok: false, msg: "Faltou o endereço ou a chave do servidor." });
  if (!/^[a-zA-Z0-9_-]+$/.test(sessao)) return guardar({ ok: false, msg: "Nome de sessão inválido. Use letras, números e hífen." });
  if (/[^\x21-\x7e]/.test(apiKey)) return guardar({ ok: false, msg: "A chave tem espaço ou caractere inválido. Copie de novo." });

  const motivo = painelHospedado() ? motivoServidorRecusado(urlBruta) : null;
  if (motivo) return guardar({ ok: false, msg: motivo });
  const url = normalizarServidor(urlBruta);

  const recusa = await conferirServidor(url, apiKey);
  if (recusa) return guardar({ ok: false, msg: recusa });

  await gravarComoPadrao(url, apiKey, sessao);
  const conexao = await conexaoPadrao();
  if (!conexao) return guardar({ ok: false, msg: "Não consegui gravar o servidor. Tente de novo." });

  const subiu = await iniciarSessao(conexao, await webhookDestePainel());
  const estado = await atualizarEstadoWhatsapp();
  if (!subiu) return guardar({ ok: false, msg: "O servidor aceitou a chave, mas a sessão não iniciou. Tente de novo em 1 minuto.", status: estado.status });
  const msg =
    estado.status === "conectado"
      ? "WhatsApp ligado e conectado."
      : "Servidor ligado. Agora clique em Conectar e leia o QR code com o celular do número.";
  return guardar({ ok: true, msg, status: estado.status });
}

/** Consulta o servidor e grava o estado no número padrão (é o que a Jornada lê). */
export async function atualizarEstadoWhatsapp(): Promise<EstadoSessao> {
  const conexao = await conexaoPadrao();
  if (!conexao?.instanceId) return { status: "desconectado" };
  const estado = await estadoSessao(conexao);
  await db.whatsappInstance.update({
    where: { id: conexao.instanceId },
    data: { status: estado.status, ...(estado.telefone ? { phoneNumber: estado.telefone } : {}) },
  });
  return estado;
}
