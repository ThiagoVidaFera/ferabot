"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { aprovarAcao, recusarAcao, desfazerAcao } from "./acoes";

export type ItemTrilha = {
  id: string;
  agente: string;
  acao: string;
  rotulo: string;
  resumo: string;
  status: string;
  contactId: string | null;
  contato: string | null;
  quando: string;
  aprovadoPor: string | null;
};

const COR: Record<string, string> = {
  proposta: "#F59E0B",
  aprovada: "#3B82F6",
  executada: "#10B981",
  recusada: "#6B7280",
  erro: "#EF4444",
};

export default function Trilha({ itens }: { itens: ItemTrilha[] }) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ id: string; texto: string; ok: boolean } | null>(null);
  const router = useRouter();

  async function aprovar(id: string) {
    setOcupado(id);
    setAviso(null);
    try {
      const r = await aprovarAcao(id);
      setAviso({
        id,
        ok: r.ok,
        texto: r.ok ? "Executada." : (r.erro ?? "falhou"),
      });
      router.refresh();
    } finally {
      setOcupado(null);
    }
  }

  async function recusar(id: string) {
    setOcupado(id);
    try {
      await recusarAcao(id);
      router.refresh();
    } finally {
      setOcupado(null);
    }
  }

  async function desfazer(id: string) {
    setOcupado(id);
    setAviso(null);
    try {
      const r = await desfazerAcao(id);
      setAviso({ id, ok: r.ok, texto: r.erro ?? "Desfeita." });
      router.refresh();
    } finally {
      setOcupado(null);
    }
  }

  if (!itens.length) {
    return (
      <p style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
        Nenhuma ação de agente ainda.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {itens.map((i) => (
        <div
          key={i.id}
          data-acao={i.id}
          data-status={i.status}
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 0",
            borderBottom: "1px solid var(--linha)",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <span
            className="etiqueta"
            style={{ background: (COR[i.status] ?? "#6B7280") + "22", color: COR[i.status] }}
          >
            {i.status}
          </span>

          <div style={{ minWidth: 220, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {i.agente} · {i.rotulo}
              {i.contactId ? (
                <>
                  {" → "}
                  <Link href={`/contatos/${i.contactId}`} style={{ color: "var(--acento)" }}>
                    {i.contato}
                  </Link>
                </>
              ) : null}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--texto-fraco)",
                whiteSpace: "pre-wrap",
                marginTop: 3,
              }}
            >
              {i.resumo}
            </div>
            <div style={{ fontSize: 11, color: "var(--texto-fraco)", marginTop: 4 }}>
              {i.quando}
              {i.aprovadoPor ? ` · por ${i.aprovadoPor}` : ""}
            </div>
            {aviso?.id === i.id ? (
              <div
                style={{ fontSize: 12, marginTop: 5, color: aviso.ok ? "#10B981" : "#EF4444" }}
              >
                {aviso.texto}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {i.status === "proposta" ? (
              <>
                <button
                  className="btn"
                  data-aprovar={i.id}
                  disabled={ocupado === i.id}
                  style={mini}
                  onClick={() => aprovar(i.id)}
                >
                  {ocupado === i.id ? "…" : "Aprovar"}
                </button>
                <button
                  className="btn btn-sec"
                  disabled={ocupado === i.id}
                  style={mini}
                  onClick={() => recusar(i.id)}
                >
                  Recusar
                </button>
              </>
            ) : null}
            {i.status === "executada" ? (
              <button
                className="btn btn-sec"
                disabled={ocupado === i.id}
                style={mini}
                title="Recuo em 1 clique"
                onClick={() => desfazer(i.id)}
              >
                Desfazer
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

const mini: React.CSSProperties = { padding: "6px 12px", fontSize: 12 };
