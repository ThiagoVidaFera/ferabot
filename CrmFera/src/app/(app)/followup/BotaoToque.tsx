"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registrarToque, pularEtapa } from "./acoes";

export default function BotaoToque({
  contactId,
  etapa,
}: {
  contactId: string;
  etapa: string;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function rodar(fn: () => Promise<unknown>) {
    setOcupado(true);
    setErro(null);
    try {
      const r = (await fn()) as { ok?: boolean; erro?: string } | undefined;
      if (r && r.ok === false) setErro(r.erro ?? "falhou");
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <Link
        href={`/inbox?c=${contactId}`}
        className="btn"
        style={{ padding: "5px 12px", fontSize: 12 }}
      >
        Falar
      </Link>
      <button
        className="btn btn-sec"
        style={mini}
        disabled={ocupado}
        title="Já falei por fora — marcar como feito"
        onClick={() => rodar(() => registrarToque(contactId, etapa))}
      >
        Feito
      </button>
      <button
        className="btn btn-sec"
        style={mini}
        disabled={ocupado}
        title="Pular esta etapa"
        onClick={() => rodar(() => pularEtapa(contactId, etapa))}
      >
        Pular
      </button>
      {erro ? <span style={{ color: "#EF4444", fontSize: 11 }}>{erro}</span> : null}
    </div>
  );
}

const mini: React.CSSProperties = { padding: "5px 10px", fontSize: 12 };
