"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { excluirContato } from "./acoes";

/** Exclui o lead da base (apaga também histórico, mensagens e compras dele). */
export default function BotaoExcluir({ id, nome }: { id: string; nome: string }) {
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  async function excluir() {
    const ok = window.confirm(
      `Excluir "${nome}" da base?\n\nIsso apaga também as mensagens, a linha do tempo e as compras dele. Não dá pra desfazer.`,
    );
    if (!ok) return;
    setOcupado(true);
    try {
      await excluirContato(id);
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <button
      type="button"
      title="Excluir lead"
      aria-label={`Excluir ${nome}`}
      data-excluir-contato={id}
      disabled={ocupado}
      onClick={excluir}
      style={{
        background: "none",
        border: 0,
        cursor: "pointer",
        fontSize: 14,
        lineHeight: 1,
        padding: "2px 4px",
        marginLeft: 6,
        borderRadius: 6,
        opacity: ocupado ? 0.4 : 0.6,
      }}
    >
      🗑️
    </button>
  );
}
