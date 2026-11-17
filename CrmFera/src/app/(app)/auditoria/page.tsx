import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * LEI 5 — "tudo auditado". De nada adianta gravar AuditEvent se ninguem
 * consegue ler. Esta e a tela que torna a auditoria verificavel.
 */
export default async function Auditoria({
  searchParams,
}: {
  searchParams: Promise<{ ator?: string; busca?: string }>;
}) {
  const sp = await searchParams;
  const busca = (sp.busca ?? "").trim();

  const where: Prisma.AuditEventWhereInput = {};
  if (sp.ator) where.actor = sp.ator;
  if (busca) {
    // o ator entra na busca — "webhook:venda" ou "agente:x" e o jeito natural de filtrar
    where.OR = [
      { action: { contains: busca } },
      { detail: { contains: busca } },
      { actor: { contains: busca } },
    ];
  }

  const [eventos, atores, total] = await Promise.all([
    db.auditEvent.findMany({ where, orderBy: { createdAt: "desc" }, take: 300 }),
    db.auditEvent.groupBy({ by: ["actor"], _count: true, orderBy: { _count: { actor: "desc" } } }),
    db.auditEvent.count(),
  ]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Auditoria</h1>
        <span style={{ color: "var(--texto-fraco)", fontSize: 14 }}>{total} registro(s)</span>
      </div>

      <form method="get" style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          name="busca"
          defaultValue={busca}
          placeholder="buscar ator, ação ou detalhe…"
          style={{ maxWidth: 320 }}
        />
        <select name="ator" defaultValue={sp.ator ?? ""} style={{ maxWidth: 260 }}>
          <option value="">todos os atores</option>
          {atores.map((a) => (
            <option key={a.actor} value={a.actor}>
              {a.actor} ({a._count})
            </option>
          ))}
        </select>
        <button className="btn btn-sec" type="submit">
          Filtrar
        </button>
      </form>

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ color: "var(--texto-fraco)", fontSize: 12, textAlign: "left" }}>
              <th style={th}>Quando</th>
              <th style={th}>Ator</th>
              <th style={th}>Ação</th>
              <th style={th}>Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((e) => {
              const ehAgente = e.actor.startsWith("agente:") || e.actor.startsWith("webhook:");
              return (
                <tr key={e.id} style={{ borderTop: "1px solid var(--linha)" }}>
                  <td style={{ ...td, color: "var(--texto-fraco)", whiteSpace: "nowrap" }}>
                    {e.createdAt.toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td style={td}>
                    <span
                      className="etiqueta"
                      style={{
                        background: ehAgente ? "#8B5CF622" : "#3B82F622",
                        color: ehAgente ? "#8B5CF6" : "#3B82F6",
                      }}
                    >
                      {e.actor}
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>{e.action}</td>
                  <td style={{ ...td, color: "var(--texto-fraco)", wordBreak: "break-word" }}>
                    {e.detail ?? "—"}
                  </td>
                </tr>
              );
            })}
            {!eventos.length ? (
              <tr>
                <td colSpan={4} style={{ ...td, color: "var(--texto-fraco)", textAlign: "center" }}>
                  Nenhum registro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "10px 14px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px 14px" };
