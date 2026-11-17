"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importarPainelAntigo } from "./acoes";
import { fundo, caixa } from "./NovoContato";

type Resultado = {
  ok: boolean;
  lidos: number;
  criados: number;
  atualizados: number;
  descartados: number;
  erro?: string;
  porFonte: Record<string, number>;
};

export default function ImportarPainel() {
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [r, setR] = useState<Resultado | null>(null);
  const router = useRouter();

  async function importar() {
    setOcupado(true);
    setR(null);
    try {
      setR((await importarPainelAntigo()) as Resultado);
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  if (!aberto) {
    return (
      <button className="btn btn-sec" onClick={() => setAberto(true)}>
        Importar do painel antigo
      </button>
    );
  }

  return (
    <div style={fundo} onClick={() => !ocupado && setAberto(false)}>
      <div className="card" style={{ ...caixa, maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          Importar do painel antigo
        </h2>
        <p style={{ color: "var(--texto-fraco)", fontSize: 13, marginBottom: 16 }}>
          Puxa os leads do painel antigo configurado em <code>LEADS_URL</code> com a qualificação que eles responderam
          (campanha, Instagram, respostas do quiz). Contato que já existe aqui é{" "}
          <strong>enriquecido</strong>, nunca duplicado. Quem não tem telefone nem e-mail é
          descartado.
        </p>

        {!r ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={importar} disabled={ocupado}>
              {ocupado ? "Importando… (pode levar 1 min)" : "Importar agora"}
            </button>
            <button className="btn btn-sec" onClick={() => setAberto(false)} disabled={ocupado}>
              Cancelar
            </button>
          </div>
        ) : (
          <>
            {r.ok ? (
              <div style={{ fontSize: 14 }}>
                <p style={{ color: "#047857", fontWeight: 600, marginBottom: 10 }}>
                  {r.criados} novos · {r.atualizados} atualizados
                </p>
                <p style={{ color: "var(--texto-fraco)", fontSize: 13 }}>
                  {r.lidos} lidos · {r.descartados} descartados por não ter telefone nem e-mail
                </p>
                <div style={{ marginTop: 12 }}>
                  {Object.entries(r.porFonte).map(([f, n]) => (
                    <div key={f} style={{ fontSize: 13, display: "flex", gap: 8 }}>
                      <span style={{ color: "var(--texto-fraco)", minWidth: 190 }}>{f}</span>
                      <strong>{n}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: "#EF4444", fontSize: 14 }}>{r.erro}</p>
            )}
            <button
              className="btn"
              style={{ marginTop: 16 }}
              onClick={() => {
                setAberto(false);
                setR(null);
              }}
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
