import Link from "next/link";
import { ROTULO_ATENCAO, type ItemAtencao } from "@/lib/atencao-manual";

function quando(d: Date): string {
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Leads que precisam de gente e que a fila "sem resposta" não enxerga. */
export default function AtencaoManual({ itens }: { itens: ItemAtencao[] }) {
  if (!itens.length) return null;
  return (
    <div className="card" style={{ padding: 18, marginBottom: 18, borderColor: "#e0a96b" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>⚠️ Precisam de atenção manual</h2>
        <span className="etiqueta" style={{ background: "var(--acento)", color: "#fff" }}>
          {itens.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {itens.map((i) => (
          <Link
            key={i.contactId}
            href={`/contatos/${i.contactId}`}
            data-atencao={i.motivo}
            style={{ display: "flex", gap: 10, padding: "9px 0", borderTop: "1px solid var(--linha)", fontSize: 14, flexWrap: "wrap" }}
          >
            <span style={{ fontWeight: 600 }}>{i.nome}</span>
            <span style={{ color: "var(--texto-fraco)" }}>{i.telefone ?? "sem telefone"}</span>
            <span style={{ color: "#a16207", flex: "1 1 260px" }}>{ROTULO_ATENCAO[i.motivo]}</span>
            <span style={{ color: "var(--texto-fraco)", fontSize: 12 }}>{quando(i.desde)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
