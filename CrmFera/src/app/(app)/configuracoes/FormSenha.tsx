"use client";

import { useState } from "react";
import { trocarSenha, sairDeTodosOsDispositivos } from "./acoes";

export default function FormSenha() {
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(form: FormData) {
    setOcupado(true);
    setMsg(null);
    try {
      const r = await trocarSenha(form);
      setMsg({ ok: r.ok, texto: r.ok ? "Senha trocada." : (r.erro ?? "falhou") });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form action={enviar} className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Trocar senha</h2>
      <label style={{ display: "block", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>Senha atual</span>
        <input name="atual" type="password" required style={{ marginTop: 5 }} />
      </label>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>Nova senha</span>
        <input name="nova" type="password" required style={{ marginTop: 5 }} />
      </label>
      {msg ? (
        <p style={{ fontSize: 13, color: msg.ok ? "#10B981" : "#EF4444", marginBottom: 10 }}>
          {msg.texto}
        </p>
      ) : null}
      <button className="btn btn-sec" type="submit" disabled={ocupado}>
        {ocupado ? "Trocando…" : "Trocar senha"}
      </button>

      <hr style={{ border: 0, borderTop: "1px solid var(--linha)", margin: "18px 0 14px" }} />

      <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginBottom: 10 }}>
        Você fica logado neste aparelho indefinidamente. Se perder um celular ou
        quiser cortar todos os acessos, use o botão abaixo — você precisará
        entrar de novo em todos os aparelhos, inclusive neste.
      </p>
      <button
        className="btn btn-sec"
        type="button"
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true);
          setMsg(null);
          try {
            await sairDeTodosOsDispositivos();
            setMsg({ ok: true, texto: "Sessões encerradas. Recarregue para entrar de novo." });
          } finally {
            setOcupado(false);
          }
        }}
      >
        Sair de todos os dispositivos
      </button>
    </form>
  );
}
