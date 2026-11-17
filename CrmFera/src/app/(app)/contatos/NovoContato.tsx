"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarContato } from "./acoes";
import { ESTAGIOS } from "@/lib/estagios";

export default function NovoContato() {
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  async function enviar(form: FormData) {
    setSalvando(true);
    try {
      const id = await criarContato(form);
      setAberto(false);
      router.push(`/contatos/${id}`);
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <button className="btn" onClick={() => setAberto(true)}>
        Novo contato
      </button>
    );
  }

  return (
    <div style={fundo} onClick={() => setAberto(false)}>
      <form
        action={enviar}
        className="card"
        style={caixa}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Novo contato</h2>

        <Campo rotulo="Nome *">
          <input name="name" required autoFocus />
        </Campo>
        <Campo rotulo="Telefone (WhatsApp)">
          <input name="phone" placeholder="11 99999-9999" />
        </Campo>
        <Campo rotulo="E-mail">
          <input name="email" type="email" />
        </Campo>
        <Campo rotulo="Empresa">
          <input name="company" />
        </Campo>
        <Campo rotulo="Estágio">
          <select name="lifecycleStage" defaultValue="novo">
            {ESTAGIOS.map((e) => (
              <option key={e.key} value={e.key}>
                {e.label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Origem">
          <select name="origem" defaultValue="outro">
            {["base", "indicacao", "anuncio", "organico", "outro"].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Tags (separadas por vírgula)">
          <input name="tags" placeholder="mentoria, quente" />
        </Campo>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button className="btn" type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : "Criar contato"}
          </button>
          <button className="btn btn-sec" type="button" onClick={() => setAberto(false)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>{rotulo}</span>
      <div style={{ marginTop: 5 }}>{children}</div>
    </label>
  );
}

export const fundo: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,26,74,.45)",
  display: "flex",
  justifyContent: "flex-end",
  zIndex: 50,
};

export const caixa: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  height: "100dvh",
  padding: 28,
  overflowY: "auto",
  textAlign: "left",
  borderRadius: "var(--raio-card) 0 0 var(--raio-card)",
  animation: "gaveta-entra .22s ease-out",
};
