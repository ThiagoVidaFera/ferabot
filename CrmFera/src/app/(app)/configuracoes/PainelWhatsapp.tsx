"use client";

import { useCallback, useEffect, useState } from "react";
import { conectarWhatsapp, statusWhatsapp, type EstadoConexao } from "./acoes";

const COR: Record<string, string> = {
  conectado: "#10B981",
  conectando: "#F59E0B",
  desconectado: "#EF4444",
};

const ROTULO: Record<string, string> = {
  conectado: "Conectado",
  conectando: "Aguardando leitura do QR",
  desconectado: "Desconectado",
};

export default function PainelWhatsapp({
  statusInicial,
  webhookConfigurado,
}: {
  statusInicial: string;
  webhookConfigurado: string;
}) {
  const [estado, setEstado] = useState<EstadoConexao>({
    status: (statusInicial as EstadoConexao["status"]) ?? "desconectado",
  });
  const [ocupado, setOcupado] = useState(false);
  const [seguirStatus, setSeguirStatus] = useState(false);

  // A URL que o PROVIDER vai chamar. O origin do navegador so serve quando o
  // provider enxerga o mesmo endereco que voce — com WAHA em outra maquina
  // (VPS), tem que ser um endereco que ELE alcanca. Por isso e configuravel.
  const urlWebhook = useCallback(() => {
    if (webhookConfigurado) return webhookConfigurado;
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/webhooks/evolution`;
  }, [webhookConfigurado]);

  async function conectar() {
    setOcupado(true);
    try {
      const r = await conectarWhatsapp(urlWebhook());
      setEstado(r);
      setSeguirStatus(true);
    } finally {
      setOcupado(false);
    }
  }

  // Poll de status a cada 5s enquanto nao conectar (contrato do megaprompt).
  useEffect(() => {
    if (!seguirStatus || estado.status === "conectado") return;
    const t = setInterval(async () => {
      const r = await statusWhatsapp();
      setEstado(r);
      if (r.status === "conectado") setSeguirStatus(false);
    }, 5000);
    return () => clearInterval(t);
  }, [seguirStatus, estado.status]);

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span
          className="etiqueta"
          data-status-whats={estado.status}
          style={{ background: (COR[estado.status] ?? "#6B7280") + "22", color: COR[estado.status] }}
        >
          ● {ROTULO[estado.status] ?? estado.status}
        </span>
        <button className="btn" onClick={conectar} disabled={ocupado}>
          {ocupado ? "Conectando…" : "Conectar"}
        </button>
        <button
          className="btn btn-sec"
          onClick={async () => setEstado(await statusWhatsapp())}
          disabled={ocupado}
        >
          Atualizar status
        </button>
      </div>

      {estado.erro ? (
        <p style={{ color: "#EF4444", fontSize: 13, marginTop: 10 }}>{estado.erro}</p>
      ) : null}
      {estado.detalhe ? (
        <p style={{ color: "var(--texto-fraco)", fontSize: 12, marginTop: 6 }}>
          provider respondeu: {estado.detalhe}
        </p>
      ) : null}

      {estado.qr ? (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 13, color: "var(--texto-fraco)", marginBottom: 8 }}>
            Abra o WhatsApp no celular → Aparelhos conectados → Conectar aparelho.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={estado.qr}
            alt="QR code do WhatsApp"
            data-qr="1"
            style={{ width: 260, height: 260, borderRadius: 12, background: "#fff", padding: 8 }}
          />
        </div>
      ) : null}

      <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 14 }}>
        Webhook de entrada: <code>{urlWebhook()}</code>
      </p>
    </div>
  );
}
