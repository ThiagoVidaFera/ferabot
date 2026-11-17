"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { salvarTemplate, excluirTemplate } from "./acoes";

export type TemplateEditavel = {
  id: string;
  name: string;
  subject: string;
  html: string;
};

export default function EditorTemplate({ template }: { template: TemplateEditavel }) {
  const [aberto, setAberto] = useState(false);
  const [html, setHtml] = useState(template.html);
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  async function salvar(form: FormData) {
    setOcupado(true);
    try {
      await salvarTemplate(form);
      setAberto(false);
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div style={{ border: "1px solid var(--linha)", borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <strong style={{ fontSize: 14 }}>{template.name}</strong>
        <span style={{ color: "var(--texto-fraco)", fontSize: 13 }}>{template.subject}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button className="btn btn-sec" style={mini} onClick={() => setAberto((a) => !a)}>
            {aberto ? "Fechar" : "Editar"}
          </button>
          <button
            className="btn btn-sec"
            style={mini}
            disabled={ocupado}
            onClick={async () => {
              setOcupado(true);
              try {
                await excluirTemplate(template.id);
                router.refresh();
              } finally {
                setOcupado(false);
              }
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {aberto ? (
        <form action={salvar} style={{ marginTop: 12 }}>
          <input type="hidden" name="id" value={template.id} />
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
            <div>
              <input name="name" defaultValue={template.name} style={{ marginBottom: 8 }} />
              <input name="subject" defaultValue={template.subject} style={{ marginBottom: 8 }} />
              <textarea
                name="html"
                rows={10}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--texto-fraco)", marginBottom: 6 }}>
                Prévia
              </div>
              <div
                style={{
                  background: "#fff",
                  color: "#111",
                  borderRadius: 8,
                  padding: 14,
                  minHeight: 200,
                  overflow: "auto",
                  fontSize: 14,
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </div>
          <button className="btn" type="submit" disabled={ocupado} style={{ marginTop: 12 }}>
            {ocupado ? "Salvando…" : "Salvar"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

const mini: React.CSSProperties = { padding: "5px 10px", fontSize: 12 };
