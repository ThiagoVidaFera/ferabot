"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelarBroadcast, dispararAgora, excluirBroadcast, excluirLista } from "./acoes";

export default function BotoesBroadcast({ id, status }: { id: string; status: string }) {
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  async function rodar(fn: () => Promise<void>) {
    setOcupado(true);
    try {
      await fn();
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {status === "agendado" ? (
        <button
          className="btn btn-sec"
          disabled={ocupado}
          style={mini}
          onClick={() => rodar(() => cancelarBroadcast(id))}
        >
          Cancelar
        </button>
      ) : null}
      {status === "rascunho" || status === "erro" ? (
        <button
          className="btn"
          disabled={ocupado}
          style={mini}
          onClick={() => rodar(() => dispararAgora(id))}
        >
          Disparar
        </button>
      ) : null}
      {status !== "enviando" ? (
        <button
          className="btn btn-sec"
          disabled={ocupado}
          style={mini}
          title="Excluir"
          onClick={() => rodar(() => excluirBroadcast(id))}
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

export function BotaoExcluirLista({ id }: { id: string }) {
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  return (
    <button
      className="btn btn-sec"
      disabled={ocupado}
      style={mini}
      onClick={async () => {
        setOcupado(true);
        try {
          await excluirLista(id);
          router.refresh();
        } finally {
          setOcupado(false);
        }
      }}
    >
      ✕
    </button>
  );
}

const mini: React.CSSProperties = { padding: "5px 10px", fontSize: 12 };
