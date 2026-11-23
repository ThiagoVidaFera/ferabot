"use client";

import { useState } from "react";

const TEMPO_DO_AVISO_MS = 1800;

interface BotaoCopiarProps {
  texto: string;
  rotulo?: string;
}

export default function BotaoCopiar({ texto, rotulo = "Copiar" }: BotaoCopiarProps) {
  const [aviso, setAviso] = useState("");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setAviso("Copiado");
    } catch {
      setAviso("Selecione o texto e copie à mão");
    }
    setTimeout(() => setAviso(""), TEMPO_DO_AVISO_MS);
  }

  return (
    <button className="btn" type="button" onClick={copiar} style={{ padding: "8px 14px", fontSize: 13 }}>
      {aviso || rotulo}
    </button>
  );
}
