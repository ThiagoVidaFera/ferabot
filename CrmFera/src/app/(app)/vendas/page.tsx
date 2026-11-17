import Link from "next/link";
import { db } from "@/lib/db";

function brl(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mesLabel(ym: string) {
  const [a, m] = ym.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default async function Vendas({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const sp = await searchParams;
  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const mes = sp.mes ?? mesAtual;

  const [ano, m] = mes.split("-").map(Number);
  const inicio = new Date(ano, m - 1, 1);
  const fim = new Date(ano, m, 1);

  const [compras, agregado, todas] = await Promise.all([
    db.purchase.findMany({
      where: { createdAt: { gte: inicio, lt: fim } },
      orderBy: { createdAt: "desc" },
      include: { contact: true },
      take: 500,
    }),
    db.purchase.aggregate({
      _sum: { valueCents: true },
      _count: true,
      where: { createdAt: { gte: inicio, lt: fim } },
    }),
    db.purchase.findMany({ select: { createdAt: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const meses = Array.from(
    new Set(
      todas.map(
        (c) => `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`,
      ),
    ),
  );
  if (!meses.includes(mesAtual)) meses.unshift(mesAtual);

  const total = agregado._sum.valueCents ?? 0;
  const ticket = agregado._count ? Math.round(total / agregado._count) : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Vendas</h1>
        <form method="get" style={{ marginLeft: "auto" }}>
          <select name="mes" defaultValue={mes} style={{ width: "auto" }}>
            {meses.map((mm) => (
              <option key={mm} value={mm}>
                {mesLabel(mm)}
              </option>
            ))}
          </select>
          <button className="btn btn-sec" type="submit" style={{ marginLeft: 8 }}>
            Filtrar
          </button>
        </form>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>Total do período</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{brl(total)}</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>Vendas</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{agregado._count}</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>Ticket médio</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{brl(ticket)}</div>
        </div>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ color: "var(--texto-fraco)", fontSize: 12, textAlign: "left" }}>
              <th style={th}>Data</th>
              <th style={th}>Contato</th>
              <th style={th}>Produto</th>
              <th style={th}>Valor</th>
              <th style={th}>Origem</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid var(--linha)" }}>
                <td style={td}>
                  {c.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </td>
                <td style={td}>
                  <Link href={`/contatos/${c.contactId}`} style={{ fontWeight: 600 }}>
                    {c.contact.name}
                  </Link>
                </td>
                <td style={td}>{c.product}</td>
                <td style={{ ...td, fontWeight: 600 }}>{brl(c.valueCents)}</td>
                <td style={{ ...td, color: "var(--texto-fraco)" }}>{c.origem ?? "—"}</td>
              </tr>
            ))}
            {!compras.length ? (
              <tr>
                <td colSpan={5} style={{ ...td, color: "var(--texto-fraco)", textAlign: "center" }}>
                  Nenhuma venda no período.
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
const td: React.CSSProperties = { padding: "11px 14px" };
