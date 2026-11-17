import Link from "next/link";
import { db } from "@/lib/db";
import { descreverPayload, ROTULO_ACAO } from "@/lib/agentes";
import Trilha, { type ItemTrilha } from "./Trilha";
import { criarAgente, instalarAgentesPadrao } from "./acoes";

export default async function Agentes() {
  const [agentes, acoes] = await Promise.all([
    db.agent.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { actions: true } } },
    }),
    db.agentAction.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 60,
      include: { agent: true, contact: true },
    }),
  ]);

  // propostas primeiro, o resto por data
  const ordenadas = [
    ...acoes.filter((a) => a.status === "proposta"),
    ...acoes.filter((a) => a.status !== "proposta"),
  ];

  const itens: ItemTrilha[] = ordenadas.map((a) => ({
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

  const pendentes = itens.filter((i) => i.status === "proposta").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Agentes</h1>
        <span style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
          {agentes.length} agente(s) · {pendentes} proposta(s) aguardando
        </span>
        <form action={instalarAgentesPadrao} style={{ marginLeft: "auto" }}>
          <button className="btn btn-sec" type="submit" title="Cria os que faltam; não mexe em prompt de agente que já existe">
            Instalar agentes do playbook
          </button>
        </form>
      </div>

      <div className="card" style={{ overflowX: "auto", marginBottom: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ color: "var(--texto-fraco)", fontSize: 12, textAlign: "left" }}>
              <th style={th}>Nome</th>
              <th style={th}>Canal</th>
              <th style={th}>Gatilho</th>
              <th style={th}>Modo</th>
              <th style={th}>Ativo</th>
              <th style={th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {agentes.map((a) => (
              <tr key={a.id} data-agente={a.slug} style={{ borderTop: "1px solid var(--linha)" }}>
                <td style={td}>
                  <Link href={`/agentes/${a.id}`} style={{ fontWeight: 600 }}>
                    {a.name}
                  </Link>
                  <div style={{ fontSize: 11, color: "var(--texto-fraco)" }}>{a.slug}</div>
                </td>
                <td style={{ ...td, color: "var(--texto-fraco)" }}>{a.canal}</td>
                <td style={{ ...td, color: "var(--texto-fraco)", fontSize: 12 }}>
                  {[a.gatilhoTag, a.gatilhoEstagio && `estágio ${a.gatilhoEstagio}`, a.gatilhoOrigem && `origem ${a.gatilhoOrigem}`]
                    .filter(Boolean)
                    .join(" · ") || (a.slug === "recepcao" ? "porta do anúncio (sem tag)" : "—")}
                  {a.prioridade ? ` · p${a.prioridade}` : ""}
                </td>
                <td style={td}>
                  <span
                    className="etiqueta"
                    style={{
                      background: a.modo === "autonomo" ? "#EF444422" : "#3B82F622",
                      color: a.modo === "autonomo" ? "#EF4444" : "#3B82F6",
                    }}
                  >
                    {a.modo}
                  </span>
                </td>
                <td style={td}>
                  <span
                    className="etiqueta"
                    data-ativo={a.ativo ? "1" : "0"}
                    style={{
                      background: a.ativo ? "#10B98122" : "#6B728022",
                      color: a.ativo ? "#10B981" : "#6B7280",
                    }}
                  >
                    {a.ativo ? "ativo" : "desligado"}
                  </span>
                </td>
                <td style={{ ...td, color: "var(--texto-fraco)" }}>{a._count.actions}</td>
              </tr>
            ))}
            {!agentes.length ? (
              <tr>
                <td colSpan={6} style={{ ...td, color: "var(--texto-fraco)", textAlign: "center" }}>
                  Nenhum agente ainda. Instale os do playbook ou cadastre o primeiro abaixo.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,340px) minmax(0,1fr)", gap: 16 }}>
        <form action={criarAgente} className="card" style={{ padding: 18 }}>
          <h2 style={h2}>Novo agente</h2>
          <Campo rotulo="Nome">
            <input name="name" required placeholder="Follow-up de leads frios" />
          </Campo>
          <Campo rotulo="Canal">
            <select name="canal" defaultValue="whatsapp">
              <option value="whatsapp">WhatsApp</option>
              <option value="email">E-mail</option>
              <option value="sistema">Sistema</option>
            </select>
          </Campo>
          <Campo rotulo="Modelo">
            <select name="model" defaultValue="gemini-2.5-flash">
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
              <option value="claude-sonnet-5">claude-sonnet-5</option>
            </select>
          </Campo>
          <Campo rotulo="Prompt (vive no banco, editável aqui)">
            <textarea name="prompt" rows={7} placeholder="Você é o agente que…" />
          </Campo>
          <button className="btn" type="submit">
            Cadastrar agente
          </button>
          <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 8 }}>
            Nasce desligado e no modo <strong>sugere</strong>. Nada sai sem você aprovar.
          </p>
        </form>

        <div className="card" style={{ padding: 18 }}>
          <h2 style={h2}>Ações dos agentes</h2>
          <Trilha itens={itens} />
        </div>
      </div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: 15, fontWeight: 700, marginBottom: 12 };
const th: React.CSSProperties = { padding: "10px 14px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "11px 14px" };

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>{rotulo}</span>
      <div style={{ marginTop: 5 }}>{children}</div>
    </label>
  );
}
