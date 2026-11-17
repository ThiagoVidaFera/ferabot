import { db } from "@/lib/db";
import { configMuitas } from "@/lib/config";
import Numeros from "./Numeros";
import FormSenha from "./FormSenha";
import { salvarWhatsapp, salvarSmtp, salvarIA, salvarNegocio, salvarEvento, salvarRobos } from "./acoes";
import { CHAVES_ROBOS } from "@/lib/chaves-robos";
import { negocio, usandoExemplo } from "@/lib/negocio";
import { urlDoWebhookPadrao } from "@/lib/url";
import { lerEvento } from "@/lib/evento";

export default async function Configuracoes() {
  const [numeros, cfg, evento] = await Promise.all([
    db.whatsappInstance.findMany({ orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    configMuitas([
      "negocio_nome",
      "marca_acento",
      "smtp_host",
      "smtp_porta",
      "smtp_usuario",
      "smtp_remetente",
      "smtp_seguro",
      "smtp_senha",
      "ia_provider",
      "ia_model",
      "gemini_api_key",
      "anthropic_api_key",
      "webhook_url_publica",
      ...CHAVES_ROBOS,
    ]),
    lerEvento(),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Configurações</h1>

      {usandoExemplo() ? (
        <div className="card" style={{ padding: 14, marginBottom: 16, borderColor: "#EF4444" }}>
          <strong style={{ color: "#EF4444" }}>O CRM está usando dados de exemplo.</strong> Os robôs só
          falam o preço, os links e o nome que estão no <code>negocio.json</code>. Peça ao FERABOT:
          &quot;preenche o negocio.json do meu CRM&quot; (ou rode <code>python ScriptsFera/crm.py negocio</code>) e
          reinicie o CRM. Enquanto isso, nenhum aviso sai pro seu WhatsApp.
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
        {/* WhatsApp */}
        <div className="card" style={{ padding: 18 }}>
          <h2 style={h2}>WhatsApp — números conectados</h2>

          <Numeros
            webhookConfigurado={cfg.webhook_url_publica || urlDoWebhookPadrao()}
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

          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "22px 0 12px" }}>
            Adicionar / editar número
          </h3>
          <form action={salvarWhatsapp}>
            <Campo rotulo="Editar um existente (vazio = criar novo)">
              <select name="instanceId" defaultValue="">
                <option value="">— novo número —</option>
                {numeros.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.phoneNumber ?? i.instanceName})
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Apelido (aparece no seletor do Inbox)">
              <input name="nome" placeholder="Principal · Comercial · Equipe" />
            </Campo>
            <Campo rotulo="Provider">
              <select name="provider" defaultValue="waha">
                <option value="waha">WAHA (o que usamos)</option>
                <option value="cloud_api">Cloud API oficial</option>
                <option value="evolution">Evolution (não usamos)</option>
              </select>
            </Campo>
            <Campo rotulo="URL da API">
              <input name="url" placeholder="https://waha.seudominio.com" />
            </Campo>
            <Campo rotulo="API key">
              <input name="apiKey" type="password" placeholder="•••" />
            </Campo>
            <Campo rotulo="Nome da sessão / instância">
              <input name="sessao" placeholder="crm-fera" />
            </Campo>
            <Campo rotulo="Número que vai conectar">
              <input name="numero" placeholder="5511…" />
            </Campo>
            <Campo rotulo="URL do webhook que o provider vai chamar (vazio = este endereço)">
              <input
                name="webhook_url_publica"
                defaultValue={cfg.webhook_url_publica}
                placeholder={urlDoWebhookPadrao()}
              />
            </Campo>
            <button className="btn btn-sec" type="submit">
              Salvar número
            </button>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* SMTP */}
          <form action={salvarSmtp} className="card" style={{ padding: 18 }}>
            <h2 style={h2}>SMTP (e-mail)</h2>
            <Campo rotulo="Host">
              <input name="host" defaultValue={cfg.smtp_host} placeholder="smtp.gmail.com" />
            </Campo>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Campo rotulo="Porta">
                  <input name="porta" defaultValue={cfg.smtp_porta || "587"} />
                </Campo>
              </div>
              <div style={{ flex: 1 }}>
                <Campo rotulo="SSL/TLS">
                  <select name="seguro" defaultValue={cfg.smtp_seguro || "0"}>
                    <option value="0">STARTTLS / nenhum</option>
                    <option value="1">SSL direto (465)</option>
                  </select>
                </Campo>
              </div>
            </div>
            <Campo rotulo="Usuário">
              <input name="usuario" defaultValue={cfg.smtp_usuario} />
            </Campo>
            <Campo rotulo="Senha (em branco mantém a atual)">
              <input name="senha" type="password" placeholder={cfg.smtp_senha ? "•••" : ""} />
            </Campo>
            <Campo rotulo="Remetente">
              <input name="remetente" defaultValue={cfg.smtp_remetente} placeholder="contato@seudominio.com.br" />
            </Campo>
            <button className="btn btn-sec" type="submit">
              Salvar SMTP
            </button>
          </form>

          {/* IA */}
          <form action={salvarIA} className="card" style={{ padding: 18 }}>
            <h2 style={h2}>Inteligência artificial</h2>
            <Campo rotulo="Provider">
              <select name="ia_provider" defaultValue={cfg.ia_provider || "gemini"}>
                <option value="gemini">Google Gemini</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
            </Campo>
            <Campo rotulo="Modelo">
              <input name="ia_model" defaultValue={cfg.ia_model || "gemini-2.5-flash"} />
            </Campo>
            <Campo rotulo="Chave Gemini (em branco mantém)">
              <input name="gemini_key" type="password" placeholder={cfg.gemini_api_key ? "•••" : ""} />
            </Campo>
            <Campo rotulo="Chave Anthropic (em branco mantém)">
              <input
                name="anthropic_key"
                type="password"
                placeholder={cfg.anthropic_api_key ? "•••" : ""}
              />
            </Campo>
            <button className="btn btn-sec" type="submit">
              Salvar IA
            </button>
          </form>

          {/* Negócio */}
          <form action={salvarNegocio} className="card" style={{ padding: 18 }}>
            <h2 style={h2}>Negócio</h2>
            <Campo rotulo="Nome (aparece no topo)">
              <input name="negocio_nome" defaultValue={cfg.negocio_nome || negocio().nome} />
            </Campo>
            <Campo rotulo="Cor de acento">
              <input name="marca_acento" defaultValue={cfg.marca_acento || "#FF4F00"} />
            </Campo>
            <button className="btn btn-sec" type="submit">
              Salvar
            </button>
          </form>

          {/* Ciclo do evento ao vivo — fonte única de data/links dos Agentes 01 e 02 */}
          <form action={salvarEvento} className="card" style={{ padding: 18 }}>
            <h2 style={h2}>Evento ao vivo — ciclo atual</h2>
            <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginBottom: 12 }}>
              Data, links e brinde vivem <strong>aqui, num lugar só</strong>. Os agentes de
              nutrição e de venda do lançamento leem daqui a cada mensagem (
              <code>{"{{evento.data}}"}</code>, <code>{"{{evento.linkSala}}"}</code>…). Ciclo
              novo = número novo (a tag <code>inscrito-evento-c{evento.ciclo}</code> nunca é
              reaproveitada) e os dois agentes voltam pra <em>sugere</em> por 1 dia.
              {!evento.definido ? (
                <>
                  {" "}
                  <strong style={{ color: "#EF4444" }}>Sem nome e data os agentes 01/02 não rodam.</strong>
                </>
              ) : null}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,120px) minmax(0,1fr)", gap: 10 }}>
              <Campo rotulo="Ciclo (NN)">
                <input name="evento_ciclo" defaultValue={evento.ciclo} placeholder="01" />
              </Campo>
              <Campo rotulo="Nome do evento (como está na página)">
                <input name="evento_nome" defaultValue={evento.nome} />
              </Campo>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,140px) minmax(0,1fr)", gap: 10 }}>
              <Campo rotulo="Ingresso (vazio = grátis)">
                <input name="evento_ingresso" defaultValue={evento.ingresso} placeholder="R$ 10" />
              </Campo>
              <Campo rotulo="Checkout do ingresso">
                <input name="evento_link_ingresso" defaultValue={evento.linkIngresso} placeholder="https://…" />
              </Campo>
            </div>
            <Campo rotulo="Dia da semana, data e horário (data ÚNICA deste ciclo)">
              <input name="evento_data" defaultValue={evento.data} placeholder="terça, 25/08, às 19h30 (horário de Brasília)" />
            </Campo>
            <Campo rotulo="Link da sala (transmissão)">
              <input name="evento_link_sala" defaultValue={evento.linkSala} placeholder="https://…" />
            </Campo>
            <Campo rotulo="Link do grupo de WhatsApp (se existir)">
              <input name="evento_link_grupo" defaultValue={evento.linkGrupo} placeholder="https://chat.whatsapp.com/…" />
            </Campo>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 10 }}>
              <Campo rotulo="Brinde da inscrição">
                <input name="evento_brinde" defaultValue={evento.brinde} placeholder="PDF As 50 buscas…" />
              </Campo>
              <Campo rotulo="Link do brinde">
                <input name="evento_brinde_link" defaultValue={evento.brindeLink} placeholder="https://…" />
              </Campo>
            </div>
            <Campo rotulo="O que a pessoa vai ver no evento (2 frases, sem jargão)">
              <textarea name="evento_o_que_vai_ver" rows={2} defaultValue={evento.oQueVaiVer} />
            </Campo>
            <Campo rotulo="Datas de ciclos antigos a corrigir (se aparecerem no histórico)">
              <input name="evento_datas_antigas" defaultValue={evento.datasAntigas} placeholder="23/06, 28/07" />
            </Campo>
            <Campo rotulo="Fim da condição especial (carrinho fechou/fecha em)">
              <input name="evento_fim_condicao" defaultValue={evento.fimCondicao} placeholder="domingo 31/08" />
            </Campo>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 10 }}>
              <Campo rotulo="Próximo evento (data)">
                <input name="evento_proximo" defaultValue={evento.proximo} placeholder="terça, 29/09, 19h30" />
              </Campo>
              <Campo rotulo="Link de inscrição do próximo">
                <input name="evento_link_inscricao" defaultValue={evento.linkInscricao} placeholder="https://…" />
              </Campo>
            </div>
            <button className="btn btn-sec" type="submit">
              Salvar ciclo
            </button>
          </form>

          {/* Robôs por número — avançado */}
          <form action={salvarRobos} className="card" style={{ padding: 18 }}>
            <h2 style={h2}>Robôs por número (avançado)</h2>
            <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginBottom: 12 }}>
              Com um número só conectado, deixe tudo vazio: ele é o número oficial e todos os agentes
              respondem nele. Preencha só se também conectar um celular PESSOAL (onde o robô fala só com
              lead de funil) ou o número de alguém da equipe com voz própria.
            </p>
            <Campo rotulo="Sessões pessoais (nomes das sessões, separados por vírgula)">
              <input name="sessoes_pessoais" defaultValue={cfg.sessoes_pessoais} placeholder="celular-dono" />
            </Campo>
            <Campo rotulo="Agentes que podem falar nos números pessoais (slugs)">
              <input name="agentes_numero_pessoal" defaultValue={cfg.agentes_numero_pessoal} placeholder="qualificacao, recepcao" />
            </Campo>
            <Campo rotulo="Agentes com preço público na página (podem falar o valor)">
              <input name="agentes_preco_publico" defaultValue={cfg.agentes_preco_publico} placeholder="" />
            </Campo>
            <Campo rotulo="Agentes que falam como o próprio dono, em primeira pessoa (slugs)">
              <input name="agentes_voz_do_dono" defaultValue={cfg.agentes_voz_do_dono} placeholder="" />
            </Campo>
            <Campo rotulo="Personas por número (JSON)">
              <textarea
                name="personas_json"
                rows={4}
                defaultValue={cfg.personas_json}
                placeholder='{"comercial": {"nome": "Paula", "agentePadrao": "recepcao", "passagemSilenciosa": true, "avisarEm": "5511988887777", "apresentacao": "paula\s*aqui", "bloco": "Você escreve como a Paula, da equipe."}}'
              />
            </Campo>
            <Campo rotulo="Número único por origem (JSON)">
              <textarea
                name="numero_unico_json"
                rows={2}
                defaultValue={cfg.numero_unico_json}
                placeholder='{"sessao": "comercial", "marcas": ["funil x"], "aviso": "Responda pelo número comercial"}'
              />
            </Campo>
            <button className="btn btn-sec" type="submit">
              Salvar robôs
            </button>
          </form>

          <FormSenha />
        </div>
      </div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: 15, fontWeight: 700, marginBottom: 12 };

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>{rotulo}</span>
      <div style={{ marginTop: 5 }}>{children}</div>
    </label>
  );
}
