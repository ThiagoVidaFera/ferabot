"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { restaurarVersao } from "../acoes";

export type VersaoPrompt = {
  id: string;
  versao: number;
  autor: string;
  prompt: string;
  quando: string;
};

export default function Versoes({
  agentId,
  ativa,
  versoes,
}: {
  agentId: string;
  ativa: string | null;
  versoes: VersaoPrompt[];
}) {
  const [aberta, setAberta] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  if (!versoes.length) {
    return (
      <p style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
        Nenhuma versão ainda — salve o prompt pra criar a v1.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {versoes.map((v) => (
        <div
          key={v.id}
          data-versao={v.versao}
          style={{ padding: "10px 0", borderBottom: "1px solid var(--linha)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 13 }}>v{v.versao}</strong>
            {v.id === ativa ? (
              <span className="etiqueta" style={{ background: "#10B98122", color: "#047857" }}>
                ativa
              </span>
            ) : null}
            <span style={{ fontSize: 12, color: "var(--texto-fraco)" }}>
              {v.quando} · {v.autor}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button
                className="btn btn-sec"
                style={mini}
                onClick={() => setAberta((a) => (a === v.id ? null : v.id))}
              >
                {aberta === v.id ? "Fechar" : "Ver"}
              </button>
              {v.id !== ativa ? (
                <button
                  className="btn btn-sec"
                  style={mini}
                  disabled={ocupado}
                  onClick={async () => {
                    setOcupado(true);
                    try {
                      await restaurarVersao(agentId, v.id);
                      router.refresh();
                    } finally {
                      setOcupado(false);
                    }
                  }}
                >
                  Restaurar
                </button>
              ) : null}
            </div>
          </div>
          {aberta === v.id ? (
            <pre
              style={{
                marginTop: 8,
                background: "var(--fundo)",
                border: "1px solid var(--linha)",
                borderRadius: 8,
                padding: 12,
                fontSize: 12,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {v.prompt}
            </pre>
          ) : null}
        </div>
      ))}
    </div>
  );
}

const mini: React.CSSProperties = { padding: "5px 10px", fontSize: 12 };
