"use client";

import { useActionState } from "react";
import { definirSenhaNova, type ResultadoPrimeiroAcesso } from "./acoes";

export default function FormPrimeiroAcesso() {
  const [estado, enviar, ocupado] = useActionState<ResultadoPrimeiroAcesso | null, FormData>(definirSenhaNova, null);

  return (
    <form action={enviar} className="card" style={{ padding: 18 }}>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>Senha nova (8 caracteres ou mais)</span>
        <input name="nova" type="password" autoComplete="new-password" required minLength={8} style={{ marginTop: 5 }} />
      </label>
      <label style={{ display: "block", marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>Repita a senha nova</span>
        <input name="confirmacao" type="password" autoComplete="new-password" required minLength={8} style={{ marginTop: 5 }} />
      </label>
      {estado && !estado.ok ? (
        <p role="alert" style={{ color: "#991b1b", fontSize: 14, margin: "0 0 12px" }}>
          {estado.erro}
        </p>
      ) : null}
      <button className="btn" type="submit" disabled={ocupado} style={{ width: "100%" }}>
        {ocupado ? "Salvando…" : "Salvar e abrir meu painel"}
      </button>
    </form>
  );
}
