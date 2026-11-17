import Link from "next/link";
import { db } from "@/lib/db";
import { ESTAGIOS, estagio } from "@/lib/estagios";
import NovoContato from "./NovoContato";
import ImportarCSV from "./ImportarCSV";
import ImportarPainel from "./ImportarPainel";
import BotaoExcluir from "./BotaoExcluir";
import type { Prisma } from "@/generated/prisma/client";

function quando(d: Date | null) {
  if (!d) return "—";
  const dias = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `${dias}d`;
  return d.toLocaleDateString("pt-BR");
}

export default async function Contatos({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; estagio?: string; origem?: string; tag?: string }>;
}) {
  const sp = await searchParams;
  const busca = (sp.busca ?? "").trim();

  const where: Prisma.ContactWhereInput = {};
  if (sp.estagio) where.lifecycleStage = sp.estagio;
  if (sp.origem) where.origem = sp.origem;
  if (busca) {
    const digitos = busca.replace(/\D/g, "");
    where.OR = [
      { name: { contains: busca } },
      { email: { contains: busca.toLowerCase() } },
      ...(digitos ? [{ phone: { contains: digitos } }] : []),
    ];
  }

  const [contatos, total, porEstagio, origens] = await Promise.all([
    db.contact.findMany({
      where,
      orderBy: [{ lastActivityAt: "desc" }, { createdAt: "desc" }],
      take: 300,
    }),
    db.contact.count(),
    db.contact.groupBy({ by: ["lifecycleStage"], _count: true }),
    db.contact.groupBy({ by: ["origem"], _count: true }),
  ]);

  const contagem = new Map(porEstagio.map((p) => [p.lifecycleStage, p._count]));
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { busca: sp.busca, estagio: sp.estagio, origem: sp.origem, ...extra };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/contatos?${s}` : "/contatos";
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Contatos</h1>
        <span style={{ color: "var(--texto-fraco)", fontSize: 14 }}>{total} no total</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <ImportarPainel />
          <ImportarCSV />
          <NovoContato />
        </div>
      </div>

      <form method="get" style={{ marginBottom: 12 }}>
        {sp.estagio ? <input type="hidden" name="estagio" value={sp.estagio} /> : null}
        {sp.origem ? <input type="hidden" name="origem" value={sp.origem} /> : null}
        <input
          name="busca"
          defaultValue={busca}
          placeholder="buscar nome / e-mail / telefone…"
          style={{ maxWidth: 420 }}
        />
      </form>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <Link href={qs({ estagio: undefined })} className="etiqueta" style={chip(!sp.estagio)}>
          Todos
        </Link>
        {ESTAGIOS.map((e) => (
          <Link
            key={e.key}
            href={qs({ estagio: e.key })}
            className="etiqueta"
            style={chip(sp.estagio === e.key, e.cor)}
          >
            {e.label} {contagem.get(e.key) ?? 0}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        <Link href={qs({ origem: undefined })} className="etiqueta" style={chip(!sp.origem)}>
          Toda origem
        </Link>
        {origens.map((o) => (
          <Link
            key={o.origem}
            href={qs({ origem: o.origem })}
            className="etiqueta"
            style={chip(sp.origem === o.origem)}
          >
            {o.origem} {o._count}
          </Link>
        ))}
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ color: "var(--texto-fraco)", fontSize: 12, textAlign: "left" }}>
              <th style={th}>Nome</th>
              <th style={th}>Telefone</th>
              <th style={th}>Estágio</th>
              <th style={th}>Origem</th>
              <th style={th}>Tags</th>
              <th style={th}>Última atividade</th>
            </tr>
          </thead>
          <tbody>
            {contatos.map((c) => {
              const e = estagio(c.lifecycleStage);
              const tags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
              return (
                <tr key={c.id} style={{ borderTop: "1px solid var(--linha)" }}>
                  <td style={td}>
                    <Link href={`/contatos/${c.id}`} style={{ fontWeight: 600 }}>
                      {c.name}
                    </Link>
                    <BotaoExcluir id={c.id} nome={c.name} />
                    {c.email ? (
                      <div style={{ color: "var(--texto-fraco)", fontSize: 12 }}>{c.email}</div>
                    ) : null}
                  </td>
                  <td style={td}>{c.phone ?? "—"}</td>
                  <td style={td}>
                    <span
                      className="etiqueta"
                      style={{ background: e.cor + "22", color: e.cor, border: `1px solid ${e.cor}55` }}
                    >
                      {e.label}
                    </span>
                  </td>
                  <td style={{ ...td, color: "var(--texto-fraco)" }}>{c.origem}</td>
                  <td style={td}>
                    {tags.length ? (
                      <span style={{ color: "var(--texto-fraco)", fontSize: 12 }}>
                        {tags.join(" · ")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ ...td, color: "var(--texto-fraco)" }}>{quando(c.lastActivityAt)}</td>
                </tr>
              );
            })}
            {!contatos.length ? (
              <tr>
                <td colSpan={6} style={{ ...td, color: "var(--texto-fraco)", textAlign: "center" }}>
                  Nenhum contato encontrado.
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
const td: React.CSSProperties = { padding: "11px 14px", verticalAlign: "top" };

function chip(ativo: boolean, cor?: string): React.CSSProperties {
  return {
    background: ativo ? (cor ?? "var(--acento)") : "transparent",
    color: ativo ? "#fff" : "var(--texto-fraco)",
    border: `1px solid ${ativo ? "transparent" : "var(--linha)"}`,
    cursor: "pointer",
  };
}
