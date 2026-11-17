"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { previaCSV, importarCSV, type PreviaCSV } from "./acoes";
import { fundo, caixa } from "./NovoContato";

export default function ImportarCSV() {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [previa, setPrevia] = useState<PreviaCSV | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const router = useRouter();

  function fechar() {
    setAberto(false);
    setTexto("");
    setPrevia(null);
    setResultado(null);
  }

  async function lerArquivo(f: File) {
    const t = await f.text();
    setTexto(t);
    setOcupado(true);
    try {
      setPrevia(await previaCSV(t));
    } finally {
      setOcupado(false);
    }
  }

  async function gravar() {
    setOcupado(true);
    try {
      const r = await importarCSV(texto);
      setResultado(`${r.criados} criados · ${r.existentes} já existiam`);
      setPrevia(null);
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  if (!aberto) {
    return (
      <button className="btn btn-sec" onClick={() => setAberto(true)}>
        Importar CSV
      </button>
    );
  }

  return (
    <div style={fundo} onClick={fechar}>
      <div className="card" style={{ ...caixa, maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Importar CSV</h2>
        <p style={{ color: "var(--texto-fraco)", fontSize: 13, marginBottom: 16 }}>
          Colunas aceitas: <code>name, phone, email, tags</code>. Contato que já existe
          (mesmo telefone ou e-mail) é ignorado, nunca duplicado.
        </p>

        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void lerArquivo(f);
          }}
        />

        {previa ? (
          <>
            <p style={{ fontSize: 13, margin: "16px 0 8px" }}>
              <strong>{previa.total}</strong> linhas no arquivo. Prévia das{" "}
              {previa.linhas.length} primeiras:
            </p>
            <div style={{ overflowX: "auto", border: "1px solid var(--linha)", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ color: "var(--texto-fraco)", textAlign: "left" }}>
                    {previa.colunas.map((c) => (
                      <th key={c} style={{ padding: "8px 10px" }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previa.linhas.map((l, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--linha)" }}>
                      {previa.colunas.map((c) => (
                        <td key={c} style={{ padding: "7px 10px" }}>
                          {l[c]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={gravar} disabled={ocupado}>
                {ocupado ? "Importando…" : `Importar ${previa.total} contatos`}
              </button>
              <button className="btn btn-sec" onClick={fechar}>
                Cancelar
              </button>
            </div>
          </>
        ) : null}

        {resultado ? (
          <>
            <p style={{ marginTop: 16, color: "#047857", fontWeight: 600 }}>{resultado}</p>
            <button className="btn" style={{ marginTop: 12 }} onClick={fechar}>
              Fechar
            </button>
          </>
        ) : null}

        {!previa && !resultado ? (
          <button className="btn btn-sec" style={{ marginTop: 16 }} onClick={fechar}>
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  );
}
