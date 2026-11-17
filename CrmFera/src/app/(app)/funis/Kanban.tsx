"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { moverDeal, excluirDeal } from "./acoes";

export type CartaoDeal = {
  id: string;
  titulo: string;
  valueCents: number;
  contactId: string;
  contactName: string;
};

export type ColunaKanban = {
  id: string;
  name: string;
  deals: CartaoDeal[];
};

function brl(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Kanban({ colunas }: { colunas: ColunaKanban[] }) {
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  async function soltar(stageId: string) {
    const dealId = arrastando;
    setArrastando(null);
    setAlvo(null);
    if (!dealId) return;

    setOcupado(true);
    try {
      await moverDeal(dealId, stageId);
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  async function remover(dealId: string) {
    setOcupado(true);
    try {
      await excluirDeal(dealId);
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        paddingBottom: 8,
        opacity: ocupado ? 0.6 : 1,
      }}
    >
      {colunas.map((col) => {
        const total = col.deals.reduce((s, d) => s + d.valueCents, 0);
        return (
          <div
            key={col.id}
            data-coluna={col.name}
            onDragOver={(e) => {
              e.preventDefault();
              setAlvo(col.id);
            }}
            onDragLeave={() => setAlvo((a) => (a === col.id ? null : a))}
            onDrop={(e) => {
              e.preventDefault();
              void soltar(col.id);
            }}
            className="card"
            style={{
              minWidth: 232,
              flex: "1 0 232px",
              padding: 12,
              background: alvo === col.id ? "#e8ecf8" : "var(--painel)",
              borderColor: alvo === col.id ? "var(--acento)" : "var(--linha)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <strong style={{ fontSize: 14 }}>{col.name}</strong>
              <span style={{ fontSize: 12, color: "var(--texto-fraco)" }}>{col.deals.length}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--texto-fraco)" }}>
                {brl(total)}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>
              {col.deals.map((d) => (
                <div
                  key={d.id}
                  draggable
                  data-deal={d.id}
                  onDragStart={() => setArrastando(d.id)}
                  onDragEnd={() => setArrastando(null)}
                  style={{
                    border: "1px solid var(--linha)",
                    borderRadius: 10,
                    padding: "10px 11px",
                    background: "var(--fundo)",
                    cursor: "grab",
                    opacity: arrastando === d.id ? 0.4 : 1,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.titulo}</div>
                  <Link
                    href={`/contatos/${d.contactId}`}
                    style={{ fontSize: 12, color: "var(--texto-fraco)" }}
                  >
                    {d.contactName}
                  </Link>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--acento)" }}>
                      {brl(d.valueCents)}
                    </span>
                    <button
                      onClick={() => remover(d.id)}
                      title="Excluir negócio"
                      style={{
                        marginLeft: "auto",
                        background: "none",
                        border: 0,
                        color: "var(--texto-fraco)",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {!col.deals.length ? (
                <div style={{ fontSize: 12, color: "var(--texto-fraco)", padding: "10px 2px" }}>
                  arraste um negócio pra cá
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
