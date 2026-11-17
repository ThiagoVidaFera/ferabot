import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { descreverPayload, ROTULO_ACAO } from "@/lib/agentes";
import Trilha, { type ItemTrilha } from "../Trilha";
import Versoes from "./Versoes";
import { salvarPrompt, alterarAgente } from "../acoes";
import { variaveisDe, contextoDeVariaveis } from "@/lib/prompt-vars";

export default async function PaginaAgente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const agente = await db.agent.findUnique({ where: { id } });
  if (!agente) notFound();

  const [versoes, acoes] = await Promise.all([
    db.agentPromptVersion.findMany({ where: { agentId: id }, orderBy: { versao: "desc" } }),
    db.agentAction.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { agent: true, contact: true },
    }),
  ]);

  const itens: ItemTrilha[] = acoes.map((a) => ({
    id: a.id,
    agente: a.agent.name,
    acao: a.acao,
    rotulo: ROTULO_ACAO[a.acao] ?? a.acao,
    resumo: descreverPayload(a.acao, (a.payload ?? {}) as Record<string, unknown>),
    status: a.status,
    contactId: a.contactId,
    contato: a.contact?.name ?? null,
    quando: a.createdAt.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    aprovadoPor: a.aprovadoPor,
  }));

  const versaoAtiva = versoes.find((v) => v.id === agente.activeVersionId);

  // Variaveis `{{...}}` do prompt: quais ele usa e quais estao vazias/desconhecidas
  // na fonte unica. E o "nenhum colchete vermelho sobrou" do playbook, so que
  // checado pela maquina.
  const { vars } = await contextoDeVariaveis();
  const usadas = variaveisDe(agente.prompt);
  const desconhecidas = usadas.filter((v) => !(v in vars));
  const vazias = usadas.filter((v) => v in vars && !vars[v]);

  return (
    <div>
      <Link href="/agentes" style={{ color: "var(--texto-fraco)", fontSize: 13 }}>
        ← Agentes
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0 20px", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{agente.name}</h1>
        <span className="etiqueta" style={{ background: "#26262955", color: "var(--texto-fraco)" }}>
          {agente.slug}
        </span>
        {versaoAtiva ? (
          <span className="etiqueta" style={{ background: "#1a2f8f18", color: "var(--acento)" }}>
            prompt v{versaoAtiva.versao}
          </span>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <form action={salvarPrompt} className="card" style={{ padding: 18 }}>
            <input type="hidden" name="agentId" value={agente.id} />
            <h2 style={h2}>Prompt</h2>
            <textarea
              name="prompt"
              rows={14}
              defaultValue={agente.prompt}
              data-prompt
              placeholder="Você é o agente que…"
            />
            <button className="btn" type="submit" style={{ marginTop: 10 }}>
              Salvar prompt
            </button>
            <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 8 }}>
              Salvar cria uma <strong>versão nova</strong>. O texto anterior nunca é
              sobrescrito — dá pra saber com qual prompt cada mensagem foi gerada.
            </p>
            {usadas.length ? (
              <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 6 }} data-variaveis>
                Variáveis da fonte única usadas: {usadas.length} ·{" "}
                {desconhecidas.length ? (
                  <span style={{ color: "#EF4444" }}>
                    desconhecidas: {desconhecidas.join(", ")} ·{" "}
                  </span>
                ) : null}
                {vazias.length ? (
                  <span style={{ color: "#b45309" }}>
                    vazias (preencher em Configurações/ofertas): {vazias.join(", ")}
                  </span>
                ) : (
                  <span style={{ color: "#047857" }}>todas preenchidas</span>
                )}
              </p>
            ) : null}
          </form>

          <form action={alterarAgente} className="card" style={{ padding: 18 }}>
            <input type="hidden" name="agentId" value={agente.id} />
            <h2 style={h2}>Operação</h2>

            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>Modo</span>
              <select name="modo" defaultValue={agente.modo} key={agente.modo} style={{ marginTop: 5 }}>
                <option value="sugere">sugere — propõe e espera você aprovar</option>
                <option value="autonomo">autônomo — executa sozinho</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>Modelo</span>
              <select name="model" defaultValue={agente.model} key={agente.model} style={{ marginTop: 5 }}>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="claude-sonnet-5">claude-sonnet-5</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>
                Agenda — quando ele acorda sozinho
              </span>
              <select
                name="agenda"
                defaultValue={agente.agenda ?? ""}
                key={agente.agenda ?? "vazio"}
                style={{ marginTop: 5 }}
              >
                <option value="">só quando chamarem a API</option>
                <option value="diaria:07:00">todo dia às 07:00</option>
                <option value="diaria:09:00">todo dia às 09:00</option>
                <option value="diaria:13:00">todo dia às 13:00</option>
                <option value="diaria:18:00">todo dia às 18:00</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>
                Fila que ele varre
              </span>
              <select
                name="alvo"
                defaultValue={agente.alvo ?? "followup"}
                key={agente.alvo ?? "followup"}
                style={{ marginTop: 5 }}
              >
                <option value="followup">fila de follow-up (quem não respondeu)</option>
                <option value="novos">contatos novos das últimas 48h</option>
              </select>
            </label>

            {agente.ultimaRodada ? (
              <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginBottom: 12 }}>
                Última rodada: {agente.ultimaRodada.toLocaleString("pt-BR")}
              </p>
            ) : null}

            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "6px 0 10px" }}>
              Gatilho — quem este agente atende na conversa 1:1
            </h3>
            <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginBottom: 10 }}>
              Uma tag por porta, um agente por tag. Tag terminada em <code>-</code> casa com
              qualquer ciclo (<code>inscrito-evento-</code>). Vários valores separados por
              vírgula. Sem gatilho o agente não é escolhido — só a <code>recepcao</code> roda
              sem gatilho, como porta do anúncio.
            </p>
            <label style={{ display: "block", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>Tag(s)</span>
              <input
                name="gatilhoTag"
                defaultValue={agente.gatilhoTag ?? ""}
                placeholder="quente-yt"
                style={{ marginTop: 5 }}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ display: "block", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>Estágio</span>
                <input
                  name="gatilhoEstagio"
                  defaultValue={agente.gatilhoEstagio ?? ""}
                  placeholder="proposta"
                  style={{ marginTop: 5 }}
                />
              </label>
              <label style={{ display: "block", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>Origem</span>
                <input
                  name="gatilhoOrigem"
                  defaultValue={agente.gatilhoOrigem ?? ""}
                  placeholder="anuncio"
                  style={{ marginTop: 5 }}
                />
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ display: "block", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>
                  Prioridade (venda &gt; nutrição)
                </span>
                <input
                  name="prioridade"
                  type="number"
                  defaultValue={agente.prioridade}
                  style={{ marginTop: 5 }}
                />
              </label>
              <label style={{ display: "block", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>
                  Intervalo entre partes [QUEBRA] (ms)
                </span>
                <input
                  name="delayQuebraMs"
                  type="number"
                  min={0}
                  max={15000}
                  step={100}
                  defaultValue={agente.delayQuebraMs}
                  style={{ marginTop: 5 }}
                />
              </label>
            </div>

            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 14 }}>
              <input
                type="checkbox"
                name="ativo"
                value="1"
                defaultChecked={agente.ativo}
                style={{ width: "auto" }}
              />
              Agente ligado
            </label>

            <button className="btn btn-sec" type="submit">
              Salvar operação
            </button>

            {agente.modo === "autonomo" ? (
              <p style={{ fontSize: 12, color: "#EF4444", marginTop: 10 }}>
                ⚠ No modo autônomo as ações saem <strong>sem aprovação</strong>. Mensagem
                enviada não volta.
              </p>
            ) : null}
          </form>

          <div className="card" style={{ padding: 18 }}>
            <h2 style={h2}>Token da API</h2>
            <code
              data-token
              style={{
                display: "block",
                background: "var(--fundo)",
                border: "1px solid var(--linha)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12,
                wordBreak: "break-all",
              }}
            >
              {agente.apiToken}
            </code>
            <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 10 }}>
              Mande no header <code>x-agent-token</code>. Endpoints:
            </p>
            <ul style={{ fontSize: 12, color: "var(--texto-fraco)", paddingLeft: 18, marginTop: 6 }}>
              <li>
                <code>GET /api/agentes/contatos?estagio=&amp;busca=</code>
              </li>
              <li>
                <code>GET /api/agentes/contatos/:id</code>
              </li>
              <li>
                <code>POST /api/agentes/acoes</code> — {"{contactId, acao, payload}"}
              </li>
            </ul>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h2 style={h2}>Ações deste agente</h2>
            <Trilha itens={itens} />
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h2 style={h2}>Histórico do prompt</h2>
            <Versoes
              agentId={agente.id}
              ativa={agente.activeVersionId}
              versoes={versoes.map((v) => ({
                id: v.id,
                versao: v.versao,
                autor: v.autor,
                prompt: v.prompt,
                quando: v.createdAt.toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: 15, fontWeight: 700, marginBottom: 12 };
