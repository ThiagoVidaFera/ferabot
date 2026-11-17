"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { religarAgente } from "./acoes";

/**
 * Aparece quando a conversa tem a tag `humano`: o agente saiu porque alguem do
 * time digitou (regra de 28/10/2026) ou porque ele mesmo passou a conversa.
 * Um toque devolve a conversa pro agente.
 */
export default function BotaoReligarAgente({ contactId }: { contactId: string }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function religar() {
    setOcupado(true);
    setErro(null);
    try {
      await religarAgente(contactId);
      router.refresh();
    } catch {
      setErro("não deu certo — tente de novo");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div
      style={{
        border: "1px dashed var(--linha)",
        borderRadius: 10,
        padding: 10,
        marginBottom: 16,
        fontSize: 13,
      }}
    >
      <div style={{ color: "var(--texto-fraco)", marginBottom: 6 }}>
        🤖 Agente pausado nesta conversa — alguém do time assumiu.
      </div>
      <button type="button" className="btn btn-sec" disabled={ocupado} onClick={religar} style={{ padding: "5px 9px", fontSize: 12 }}>
        {ocupado ? "Religando…" : "Religar agente"}
      </button>
      {erro ? <div style={{ color: "#EF4444", fontSize: 11, marginTop: 4 }}>{erro}</div> : null}
    </div>
  );
}
