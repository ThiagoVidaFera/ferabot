"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Anexos do inbox: foto e áudio de voz.
 *
 * O áudio é gravado no navegador com MediaRecorder e mandado como PTT (o WAHA
 * converte pra ogg/opus). Sem isso o WhatsApp trataria como "documento de
 * áudio" — que ninguém escuta.
 */

export type ArquivoPronto = {
  tipo: "image" | "voice" | "file";
  base64: string;
  mimetype: string;
  nome: string;
  tamanho: number;
  previewUrl?: string;
};

function comoBase64(blob: Blob): Promise<string> {
  return new Promise((ok, erro) => {
    const fr = new FileReader();
    fr.onload = () => ok(String(fr.result).split(",")[1] ?? "");
    fr.onerror = () => erro(new Error("falha ao ler o arquivo"));
    fr.readAsDataURL(blob);
  });
}

export function BotaoFoto({
  onEscolher,
  desabilitado,
}: {
  onEscolher: (a: ArquivoPronto) => void;
  desabilitado?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*,application/pdf"
        data-anexo
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const base64 = await comoBase64(f);
          onEscolher({
            tipo: f.type.startsWith("image/") ? "image" : "file",
            base64,
            mimetype: f.type || "application/octet-stream",
            nome: f.name,
            tamanho: f.size,
            previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
          });
          e.target.value = "";
        }}
      />
      <button
        type="button"
        title="Enviar foto ou arquivo"
        aria-label="Enviar foto ou arquivo"
        disabled={desabilitado}
        onClick={() => ref.current?.click()}
        style={botao}
      >
        📎
      </button>
    </>
  );
}

export function BotaoAudio({
  onGravar,
  desabilitado,
}: {
  onGravar: (a: ArquivoPronto) => void;
  desabilitado?: boolean;
}) {
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);

  useEffect(() => {
    if (!gravando) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [gravando]);

  async function comecar() {
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // opus é o que o WhatsApp usa; se o navegador não tiver, cai no padrão
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      pedacos.current = [];
      mr.ondataavailable = (e) => e.data.size && pedacos.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(pedacos.current, { type: mime });
        if (blob.size < 1000) {
          setErro("áudio curto demais");
          return;
        }
        onGravar({
          tipo: "voice",
          base64: await comoBase64(blob),
          mimetype: mime.split(";")[0],
          nome: "audio.webm",
          tamanho: blob.size,
        });
      };
      mr.start();
      rec.current = mr;
      setSegundos(0);
      setGravando(true);
    } catch {
      setErro("sem acesso ao microfone");
    }
  }

  function parar(enviar: boolean) {
    const mr = rec.current;
    if (!mr) return;
    if (!enviar) mr.onstop = () => mr.stream.getTracks().forEach((t) => t.stop());
    mr.stop();
    rec.current = null;
    setGravando(false);
  }

  if (gravando) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#EF4444", fontSize: 13, fontWeight: 700 }}>
          ● {String(Math.floor(segundos / 60)).padStart(2, "0")}:
          {String(segundos % 60).padStart(2, "0")}
        </span>
        <button type="button" onClick={() => parar(false)} style={botao} title="Descartar">
          ✕
        </button>
        <button
          type="button"
          onClick={() => parar(true)}
          className="btn"
          style={{ padding: "6px 12px", fontSize: 12 }}
        >
          Usar
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {erro ? <span style={{ color: "#EF4444", fontSize: 11 }}>{erro}</span> : null}
      <button
        type="button"
        title="Gravar áudio"
        aria-label="Gravar áudio"
        data-gravar-audio
        disabled={desabilitado}
        onClick={comecar}
        style={botao}
      >
        🎤
      </button>
    </div>
  );
}

/** Prévia do que vai sair, antes de mandar. */
export function PreviaAnexo({
  arquivo,
  onRemover,
}: {
  arquivo: ArquivoPronto;
  onRemover: () => void;
}) {
  const kb = Math.round(arquivo.tamanho / 1024);
  return (
    <div
      data-previa-anexo
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 8,
        border: "1px solid var(--linha)",
        borderRadius: 10,
        background: "var(--fundo)",
        marginBottom: 8,
      }}
    >
      {arquivo.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={arquivo.previewUrl}
          alt="prévia"
          style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 6 }}
        />
      ) : (
        <span style={{ fontSize: 22 }}>{arquivo.tipo === "voice" ? "🎤" : "📎"}</span>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {arquivo.tipo === "voice" ? "Áudio gravado" : arquivo.nome}
        </div>
        <div style={{ fontSize: 11, color: "var(--texto-fraco)" }}>
          {kb} KB · {arquivo.tipo === "image" ? "vai com legenda se você escrever" : arquivo.mimetype}
        </div>
      </div>
      <button type="button" onClick={onRemover} style={botao} title="Remover">
        ✕
      </button>
    </div>
  );
}

const botao: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--linha)",
  borderRadius: 8,
  padding: "8px 10px",
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
};
