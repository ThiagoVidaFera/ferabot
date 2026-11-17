"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adicionarNumero,
  conectarWhatsapp,
  statusWhatsapp,
  definirPadrao,
  removerInstancia,
  type EstadoConexao,
} from "./acoes";

export type NumeroConectado = {
  id: string;
  name: string;
  provider: string;
  url: string;
  sessao: string;
  phone: string | null;
  status: string;
  padrao: boolean;
};

const COR: Record<string, string> = {
  conectado: "#10B981",
  conectando: "#F59E0B",
  desconectado: "#EF4444",
};

const ROTULO: Record<string, string> = {
  conectado: "Conectado",
  conectando: "Aguardando leitura do QR",
  desconectado: "Desconectado — clique em Conectar",
};

export default function Numeros({
  numeros,
  webhookConfigurado,
}: {
  numeros: NumeroConectado[];
  webhookConfigurado: string;
}) {
  const [estados, setEstados] = useState<Record<string, EstadoConexao>>(() =>
    Object.fromEntries(
      numeros.map((n) => [n.id, { status: n.status as EstadoConexao["status"] }]),
    ),
  );
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [seguindo, setSeguindo] = useState<string | null>(null);
  const [novo, setNovo] = useState("");
  const [criando, setCriando] = useState(false);
  const [erroNovo, setErroNovo] = useState<string | null>(null);
  const router = useRouter();

  const urlWebhook = useCallback(() => {
    if (webhookConfigurado) return webhookConfigurado;
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/webhooks/evolution`;
  }, [webhookConfigurado]);

  async function conectar(id: string) {
    setOcupado(id);
    try {
      const r = await conectarWhatsapp(urlWebhook(), id);
      setEstados((e) => ({ ...e, [id]: r }));
      setSeguindo(id);
    } finally {
      setOcupado(null);
    }
  }

  async function atualizar(id: string) {
    setOcupado(id);
    try {
      const r = await statusWhatsapp(id);
      setEstados((e) => ({ ...e, [id]: r }));
      // Sessao caida nao emite QR sozinha: quem religa e o Conectar. Sem esse
      // aviso o botao parecia quebrado.
      if (r.status !== "conectado" && !r.qr) setSeguindo(null);
    } finally {
      setOcupado(null);
    }
  }

  async function adicionar() {
    const apelido = novo.trim();
    if (!apelido) return;
    setCriando(true);
    setErroNovo(null);
    try {
      const r = await adicionarNumero(apelido, urlWebhook());
      if (!r.ok || !r.id) {
        setErroNovo(r.erro ?? "nao consegui criar o telefone");
        return;
      }
      setEstados((e) => ({ ...e, [r.id as string]: r.estado ?? { status: "conectando" } }));
      setSeguindo(r.id);
      setNovo("");
      router.refresh();
    } finally {
      setCriando(false);
    }
  }

  // Poll de 5s enquanto um número específico não conecta.
  useEffect(() => {
    if (!seguindo) return;
    const atual = estados[seguindo];
    if (atual?.status === "conectado") {
      setSeguindo(null);
      router.refresh();
      return;
    }
    const t = setInterval(async () => {
      const r = await statusWhatsapp(seguindo);
      setEstados((e) => ({ ...e, [seguindo]: r }));
    }, 5000);
    return () => clearInterval(t);
  }, [seguindo, estados, router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
      {!numeros.length ? (
        <p style={{ fontSize: 13, color: "var(--texto-fraco)" }}>
          Nenhum telefone conectado ainda. Adicione um abaixo.
        </p>
      ) : null}

      {numeros.map((n) => {
        const e = estados[n.id] ?? { status: n.status as EstadoConexao["status"] };
        return (
          <div
            key={n.id}
            data-numero={n.id}
            style={{ border: "1px solid var(--linha)", borderRadius: 10, padding: 12 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 14 }}>{n.name}</strong>
              {n.padrao ? (
                <span className="etiqueta" style={{ background: "#1a2f8f18", color: "var(--acento)" }}>
                  padrão
                </span>
              ) : null}
              <span
                className="etiqueta"
                data-status-num={e.status}
                style={{ background: (COR[e.status] ?? "#6B7280") + "22", color: COR[e.status] }}
              >
                ● {ROTULO[e.status] ?? e.status}
              </span>
            </div>

            <div style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 4 }}>
              {n.phone ?? "sem número"} · sessão <code>{n.sessao}</code>
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <button
                className="btn"
                style={mini}
                disabled={ocupado === n.id}
                onClick={() => conectar(n.id)}
              >
                {ocupado === n.id ? "…" : "Conectar"}
              </button>
              <button
                className="btn btn-sec"
                style={mini}
                disabled={ocupado === n.id}
                onClick={() => atualizar(n.id)}
              >
                Atualizar status
              </button>
              {!n.padrao ? (
                <button
                  className="btn btn-sec"
                  style={mini}
                  onClick={async () => {
                    await definirPadrao(n.id);
                    router.refresh();
                  }}
                >
                  Tornar padrão
                </button>
              ) : null}
              <button
                className="btn btn-sec"
                style={{ ...mini, marginLeft: "auto" }}
                title="Remover do CRM (não desconecta o WhatsApp)"
                onClick={async () => {
                  await removerInstancia(n.id);
                  router.refresh();
                }}
              >
                ✕
              </button>
            </div>

            {e.erro ? (
              <p style={{ color: "#EF4444", fontSize: 12, marginTop: 8 }}>{e.erro}</p>
            ) : null}
            {e.detalhe ? (
              <p style={{ color: "var(--texto-fraco)", fontSize: 11, marginTop: 6 }}>
                provider: {e.detalhe}
              </p>
            ) : null}

            {e.qr ? (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginBottom: 6 }}>
                  WhatsApp → Aparelhos conectados → Conectar aparelho
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.qr}
                  alt="QR code"
                  data-qr="1"
                  style={{ width: 220, height: 220, borderRadius: 10, background: "#fff", padding: 6 }}
                />
              </div>
            ) : null}
          </div>
        );
      })}

      {/* Adicionar telefone: a pessoa so da o apelido — o CRM cria a sessao,
          aponta o webhook e mostra o QR. Nada de URL nem chave na mao. */}
      <div
        style={{
          border: "1px dashed var(--linha)",
          borderRadius: 10,
          padding: 12,
          marginTop: 4,
        }}
      >
        <strong style={{ fontSize: 14 }}>Adicionar novo telefone</strong>
        <p style={{ fontSize: 12, color: "var(--texto-fraco)", margin: "4px 0 10px" }}>
          Dê um apelido, clique em criar e leia o QR no aparelho. O resto o CRM ajusta sozinho.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={novo}
            onChange={(ev) => setNovo(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") adicionar();
            }}
            placeholder="Comercial · Equipe · Suporte"
            data-novo-numero="1"
            style={{ flex: 1, minWidth: 180 }}
          />
          <button
            className="btn"
            style={mini}
            disabled={criando || novo.trim().length < 2}
            onClick={adicionar}
          >
            {criando ? "Criando…" : "Criar e gerar QR"}
          </button>
        </div>
        {erroNovo ? (
          <p style={{ color: "#EF4444", fontSize: 12, marginTop: 8 }}>{erroNovo}</p>
        ) : null}
      </div>

      <p style={{ fontSize: 12, color: "var(--texto-fraco)" }}>
        Webhook de entrada: <code>{urlWebhook()}</code>
      </p>
    </div>
  );
}

const mini: React.CSSProperties = { padding: "6px 12px", fontSize: 12 };
