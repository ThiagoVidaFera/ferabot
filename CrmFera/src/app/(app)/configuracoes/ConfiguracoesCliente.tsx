import { db } from "@/lib/db";
import { config, configMuitas } from "@/lib/config";
import { negocio } from "@/lib/negocio";
import { urlDoWebhookPadrao } from "@/lib/url";
import { ultimoTesteWhatsapp } from "@/lib/whatsapp-cliente";
import { lerPlano, lerProgresso } from "@/lib/plano-cliente-banco";
import { sessaoAtual, conferirSenha } from "@/lib/auth";
import { SENHA_INICIAL } from "@/lib/hospedado";
import PlanoCliente from "./PlanoCliente";
import Numeros from "./Numeros";
import FormSenha from "./FormSenha";
import FormSmtp from "./FormSmtp";
import { Campo, h2 } from "./campos";
import { salvarNegocio, salvarWhatsapp } from "./acoes";
import { ligarServidorWhatsappAcao } from "./acoes-cliente";
import BotaoCopiar from "../jornada/BotaoCopiar";

import { promptCompleto } from "@/lib/prompts-jornada";
import { CaixaDePrompt } from "../jornada/Passos";

const PROMPT_WHATSAPP = promptCompleto("whatsapp");
const PROMPT_EMAIL = promptCompleto("email");
const GRAPH = "https://graph.facebook.com/v21.0";

function Aviso({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <p
      role="status"
      style={{
        margin: "0 0 12px",
        padding: "10px 12px",
        borderRadius: 10,
        fontSize: 14,
        background: ok ? "#e8f6ec" : "#fdecec",
        color: ok ? "#14532d" : "#991b1b",
      }}
    >
      {msg}
    </p>
  );
}

function ServidorWhatsapp({ url, sessao }: { url: string; sessao: string }) {
  return (
    <form action={ligarServidorWhatsappAcao} style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Servidor do seu WhatsApp</h3>
      <Campo rotulo="Endereço do servidor (começa com https://)">
        <input name="url" defaultValue={url} placeholder="https://whatsapp.seudominio.com.br" required inputMode="url" />
      </Campo>
      <Campo rotulo="Chave do servidor">
        <input name="apiKey" type="password" autoComplete="off" required placeholder={url ? "Cole de novo para trocar" : ""} />
      </Campo>
      <Campo rotulo="Nome da sessão">
        <input name="sessao" defaultValue={sessao || "principal"} />
      </Campo>
      <button className="btn" type="submit">
        Ligar e testar
      </button>
    </form>
  );
}

function ApiOficial({ webhook, verifyToken }: { webhook: string; verifyToken: string }) {
  return (
    <details style={{ marginTop: 18 }}>
      <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Depois: API oficial do WhatsApp (Meta)</summary>
      <p style={{ fontSize: 13, color: "var(--texto-fraco)", margin: "10px 0" }}>
        Para quando você for disparar para lista ou tiver volume todo dia. Sem risco de bloqueio por QR, com custo por
        conversa cobrado pela Meta. Peça no chat: <em>/fera quero passar meu WhatsApp para a API oficial</em>.
      </p>
      <form action={salvarWhatsapp}>
        <input type="hidden" name="provider" value="cloud_api" />
        <input type="hidden" name="url" value={GRAPH} />
        <input type="hidden" name="nome" value="Oficial" />
        <Campo rotulo="ID do número (phone_number_id)">
          <input name="sessao" inputMode="numeric" placeholder="123456789012345" />
        </Campo>
        <Campo rotulo="Token permanente do usuário do sistema">
          <input name="apiKey" type="password" autoComplete="off" />
        </Campo>
        <button className="btn btn-sec" type="submit">
          Salvar API oficial
        </button>
      </form>
      <div style={{ fontSize: 13, marginTop: 14, overflowWrap: "anywhere" }}>
        <div style={{ color: "var(--texto-fraco)" }}>No app da Meta, em Webhooks, use:</div>
        <div style={{ marginTop: 6 }}>
          URL de retorno: <code>{webhook}</code>
        </div>
        <div style={{ marginTop: 4 }}>
          Token de verificação: <code>{verifyToken || "peça ao suporte"}</code>
        </div>
      </div>
    </details>
  );
}

/** O cliente ainda entra com a senha de entrada? (só ele mesmo, pela sessão atual) */
async function usaSenhaInicial(): Promise<boolean> {
  const sessao = await sessaoAtual();
  if (!sessao || !SENHA_INICIAL) return false;
  const user = await db.user.findUnique({ where: { id: sessao.userId }, select: { passwordHash: true } });
  return user ? conferirSenha(SENHA_INICIAL, user.passwordHash) : false;
}

/** Perfil do painel hospedado: o plano do cliente primeiro, depois o que ele configura. Uma coluna que cabe no celular. */
export default async function ConfiguracoesCliente() {
  const [numeros, cfg, ultimo, webhookBase, plano, senhaInicial, progresso] = await Promise.all([
    db.whatsappInstance.findMany({ orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    configMuitas(["negocio_nome", "marca_acento", "smtp_host", "smtp_porta", "smtp_usuario", "smtp_remetente", "smtp_seguro", "smtp_senha"]),
    ultimoTesteWhatsapp(),
    config("webhook_url_publica", "WEBHOOK_URL_PUBLICA", urlDoWebhookPadrao()),
    lerPlano(),
    usaSenhaInicial(),
    lerProgresso(),
  ]);
  const padrao = numeros.find((n) => n.isDefault) ?? numeros[0];
  const servidorUrl = padrao?.provider === "waha" ? padrao.evolutionApiUrl ?? "" : "";
  const webhookComToken = process.env.WEBHOOK_TOKEN ? `${webhookBase}?token=${process.env.WEBHOOK_TOKEN}` : webhookBase;

  return (
    <div style={{ maxWidth: 760, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Seu perfil</h1>
      {senhaInicial ? (
        <Aviso ok={false} msg="Você ainda entra com a senha de entrada. Troque por uma só sua no fim desta tela: é aqui que ficam seus leads e suas chaves." />
      ) : null}

      <PlanoCliente plano={plano} progresso={progresso} />

      <section className="card" style={{ padding: 18 }}>
        <h2 style={h2}>Seu WhatsApp</h2>
        <p style={{ fontSize: 14, margin: "0 0 12px" }}>
          O WhatsApp roda num servidor seu (VPS). O número é seu e não divide endereço com ninguém. O painel só conversa
          com ele.
        </p>
        {ultimo ? <Aviso ok={ultimo.ok} msg={ultimo.msg} /> : null}

        {padrao ? (
          <Numeros
            simples
            webhookConfigurado={webhookBase}
            numeros={numeros.map((i) => ({
              id: i.id,
              name: i.name,
              provider: i.provider,
              url: i.evolutionApiUrl ?? "",
              sessao: i.instanceName ?? "",
              phone: i.phoneNumber,
              status: i.status,
              padrao: i.isDefault,
            }))}
          />
        ) : (
          <div style={{ fontSize: 14 }}>
            <p style={{ margin: "0 0 8px" }}>Ainda não tem o servidor? O FERABOT monta com você. Cole no Claude Code:</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 100%", minWidth: 0 }}>
                <CaixaDePrompt prompt={PROMPT_WHATSAPP} />
              </div>
            </div>
          </div>
        )}

        <ServidorWhatsapp url={servidorUrl} sessao={padrao?.instanceName ?? ""} />
        <ApiOficial webhook={webhookComToken} verifyToken={process.env.META_VERIFY_TOKEN ?? ""} />
      </section>

      <form action={salvarNegocio} className="card" style={{ padding: 18 }}>
        <h2 style={h2}>Seu negócio</h2>
        <Campo rotulo="Nome que aparece no topo">
          <input name="negocio_nome" defaultValue={cfg.negocio_nome || negocio().nome} />
        </Campo>
        <Campo rotulo="Cor de destaque">
          <input name="marca_acento" defaultValue={cfg.marca_acento || "#FF4F00"} />
        </Campo>
        <button className="btn btn-sec" type="submit">
          Salvar
        </button>
      </form>

      <details className="card" style={{ padding: 18 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 15 }}>E-mail (opcional)</summary>
        <p style={{ fontSize: 14, margin: "12px 0 6px" }}>
          Serve para o painel mandar e-mail com o seu nome (confirmação, lembrete, material). Usa o Resend, que é grátis
          até 3 mil e-mails por mês. Você precisa de um domínio próprio. O jeito fácil:
        </p>
        <ol style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 4px", paddingLeft: 20 }}>
          <li>Crie a conta em resend.com.</li>
          <li>Em Domains, cadastre o seu domínio e copie os registros para onde ele está registrado. Espere ficar Verified.</li>
          <li>Em API Keys, crie uma chave e copie na hora.</li>
          <li>
            Preencha aqui embaixo: servidor <code>smtp.resend.com</code>, porta <code>465</code>, conexão segura ligada,
            usuário <code>resend</code>, senha = a chave, remetente = um e-mail do seu domínio.
          </li>
          <li>Salve e mande um e-mail de teste.</li>
        </ol>
        <CaixaDePrompt prompt={PROMPT_EMAIL} />
        <FormSmtp cfg={cfg} embutido />
      </details>

      <div id="senha">
        <FormSenha />
      </div>
    </div>
  );
}
