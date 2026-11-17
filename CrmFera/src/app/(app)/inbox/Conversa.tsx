"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { enviarMensagem, enviarMidiaMensagem, marcarLida } from "./acoes";
import { BotaoFoto, BotaoAudio, PreviaAnexo, type ArquivoPronto } from "./Anexos";

export type Balao = {
  id: string;
  body: string;
  direction: string;
  status: string;
  quando: string;
  /** arquivo guardado no volume, quando a mensagem tem mídia */
  midiaId?: string;
  mimetype?: string;
  /** quem escreveu: disparo | agente | celular | inbox | followup */
  origem?: string;
  /** nome do agente, etapa do follow-up ou quem digitou */
  autor?: string;
};

/**
 * Selo de autoria. Todo balao verde parecia igual — agora da pra ver na hora
 * se quem falou foi voce, alguem da equipe pelo aparelho, um disparo ou o agente.
 */
const SELO: Record<string, { icone: string; rotulo: string; cor: string }> = {
  agente: { icone: "🤖", rotulo: "Agente", cor: "#6d28d9" },
  disparo: { icone: "📣", rotulo: "Disparo", cor: "#1d4ed8" },
  broadcast: { icone: "📣", rotulo: "Disparo", cor: "#1d4ed8" },
  followup: { icone: "⏱️", rotulo: "Follow-up", cor: "#b45309" },
  celular: { icone: "📱", rotulo: "Pelo celular", cor: "#047857" },
  inbox: { icone: "✍️", rotulo: "Você, no CRM", cor: "#6b7090" },
};

export type AtalhoRapido = { id: string; title: string; body: string; shortcut: string | null };

export default function Conversa({
  contactId,
  contactName,
  phone,
  mensagens,
  atalhos,
  instanceId,
  numeroQueResponde,
  avisoNumero,
}: {
  contactId: string;
  contactName: string;
  phone: string | null;
  mensagens: Balao[];
  atalhos: AtalhoRapido[];
  instanceId?: string;
  numeroQueResponde?: string;
  /** aviso do número único (numero-unico.ts) quando o número escolhido não é o dele */
  avisoNumero?: string;
}) {
  const [texto, setTexto] = useState("");
  const [anexo, setAnexo] = useState<ArquivoPronto | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarAtalhos, setMostrarAtalhos] = useState(false);
  const fim = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "auto" });
  }, [mensagens.length, contactId]);

  useEffect(() => {
    void marcarLida(contactId);
  }, [contactId]);

  // Digitar "/" no comeco lista as respostas rapidas (contrato do megaprompt).
  // O botao ⚡ abre a mesma lista sem precisar lembrar do atalho.
  useEffect(() => {
    if (texto.startsWith("/")) setMostrarAtalhos(atalhos.length > 0);
  }, [texto, atalhos.length]);

  const filtrados = atalhos.filter(
    (a) =>
      !texto.startsWith("/") ||
      texto === "/" ||
      (a.shortcut ?? "").startsWith(texto) ||
      a.title.toLowerCase().includes(texto.slice(1).toLowerCase()),
  );

  async function mandar() {
    if (enviando) return;
    if (!texto.trim() && !anexo) return;
    // Resposta rapida com lacuna que o CRM nao conseguiu preencher (o lead
    // nao respondeu aquilo). "[TICKET DELE]" chegando no WhatsApp do lead
    // queima a conversa — melhor travar aqui e dizer o que falta.
    const pendentes = [...new Set(texto.match(/\[[^\]\n]{3,}\]/g) ?? [])];
    if (pendentes.length) {
      setErro(`Preencha antes de enviar: ${pendentes.join(", ")}`);
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const r = anexo
        ? await enviarMidiaMensagem(
            contactId,
            anexo.tipo,
            anexo.base64,
            anexo.mimetype,
            anexo.nome,
            // no áudio a legenda não aparece no WhatsApp; só a foto leva texto
            anexo.tipo === "image" ? texto : undefined,
            instanceId,
          )
        : await enviarMensagem(contactId, texto, instanceId);

      if (r.ok) {
        setTexto("");
        setAnexo(null);
        router.refresh();
      } else {
        setErro(r.erro ?? "falha ao enviar");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* No celular esse cabecalho repetia o painel da ficha logo acima. Sobra
          so a linha que diz por qual numero a resposta vai sair (CSS). */}
      <div
        className="conversa-cabecalho"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--linha)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="conversa-nome" style={{ fontWeight: 700 }}>{contactName}</div>
          <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>
            {phone ?? "sem telefone"}
            {numeroQueResponde ? ` · você responde por ${numeroQueResponde}` : ""}
          </div>
        </div>
        <Link href={`/contatos/${contactId}`} className="btn btn-sec conversa-abrir" style={{ marginLeft: "auto", padding: "6px 12px", fontSize: 13 }}>
          Abrir contato
        </Link>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 0 }}>
        {mensagens.map((m) => {
          const meu = m.direction === "outbound";
          return (
            <div
              key={m.id}
              data-balao={m.direction}
              style={{
                display: "flex",
                justifyContent: meu ? "flex-end" : "flex-start",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  maxWidth: "72%",
                  background: meu ? "#dbe5fb" : "var(--painel)",
                  border: meu ? "none" : "1px solid var(--linha)",
                  borderRadius: 12,
                  padding: "9px 12px",
                  fontSize: 14,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {meu && m.origem && SELO[m.origem] ? (
                  <div
                    data-selo={m.origem}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: SELO[m.origem].cor,
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>{SELO[m.origem].icone}</span>
                    <span>
                      {SELO[m.origem].rotulo}
                      {m.autor ? ` · ${m.autor}` : ""}
                    </span>
                  </div>
                ) : null}
                {m.midiaId && m.mimetype?.startsWith("image/") ? (
                  <a href={`/api/midia/${m.midiaId}`} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/midia/${m.midiaId}`}
                      alt={m.body}
                      data-midia="imagem"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 260,
                        borderRadius: 8,
                        display: "block",
                        marginBottom: 6,
                      }}
                    />
                  </a>
                ) : null}
                {m.midiaId && m.mimetype?.startsWith("audio/") ? (
                  <audio
                    controls
                    src={`/api/midia/${m.midiaId}`}
                    data-midia="audio"
                    style={{ width: 230, marginBottom: 6, display: "block" }}
                  />
                ) : null}
                {m.midiaId && !m.mimetype?.startsWith("image/") && !m.mimetype?.startsWith("audio/") ? (
                  <a
                    href={`/api/midia/${m.midiaId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "underline", display: "block", marginBottom: 6 }}
                  >
                    📎 abrir arquivo
                  </a>
                ) : null}
                {m.body}
                <div
                  style={{
                    fontSize: 11,
                    color: m.status === "failed" ? "#EF4444" : "var(--texto-fraco)",
                    marginTop: 4,
                    textAlign: "right",
                  }}
                >
                  {m.quando}
                  {m.status === "failed" ? " · falhou" : ""}
                </div>
              </div>
            </div>
          );
        })}
        {!mensagens.length ? (
          <p style={{ color: "var(--texto-fraco)", fontSize: 14 }}>Nenhuma mensagem ainda.</p>
        ) : null}
        <div ref={fim} />
      </div>

      <div style={{ borderTop: "1px solid var(--linha)", padding: 12, position: "relative" }}>
        {mostrarAtalhos ? (
          <div
            className="card"
            style={{
              position: "absolute",
              bottom: "100%",
              left: 12,
              right: 12,
              marginBottom: 6,
              maxHeight: 220,
              overflowY: "auto",
              padding: 6,
              zIndex: 20,
            }}
          >
            {filtrados.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setTexto(a.body);
                  setMostrarAtalhos(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: 0,
                  padding: "8px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {a.title}{" "}
                  <span style={{ color: "var(--acento)", fontWeight: 400 }}>{a.shortcut}</span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--texto-fraco)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.body}
                </div>
              </button>
            ))}
            {!filtrados.length ? (
              <div style={{ padding: 10, fontSize: 13, color: "var(--texto-fraco)" }}>
                Nenhuma resposta rápida com esse atalho.
              </div>
            ) : null}
          </div>
        ) : null}

        {avisoNumero ? (
          <div
            role="alert"
            data-aviso-numero
            style={{
              background: "#FEF3C7",
              color: "#92400E",
              border: "1px solid #F59E0B",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            ⚠ {avisoNumero}
          </div>
        ) : null}

        {erro ? (
          <div style={{ color: "#EF4444", fontSize: 12, marginBottom: 6 }}>{erro}</div>
        ) : null}

        {anexo ? <PreviaAnexo arquivo={anexo} onRemover={() => setAnexo(null)} /> : null}

        <div className="composer-linha" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <BotaoFoto onEscolher={setAnexo} desabilitado={enviando || !!anexo} />
          <BotaoAudio onGravar={setAnexo} desabilitado={enviando || !!anexo} />
          {atalhos.length ? (
            <button
              type="button"
              className="btn btn-sec"
              title="Mensagens rápidas, já preenchidas com os dados deste lead"
              aria-label="Mensagens rápidas"
              onClick={() => setMostrarAtalhos((v) => !v)}
              style={{ padding: "10px 12px" }}
            >
              ⚡
            </button>
          ) : null}
          <textarea
            data-caixa-envio
            rows={2}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void mandar();
              }
            }}
            placeholder={
              anexo?.tipo === "image"
                ? "legenda da foto (opcional)…"
                : anexo
                  ? "áudio pronto — é só enviar"
                  : "escreva… (⚡ ou / pra usar mensagem rápida)"
            }
            disabled={anexo?.tipo === "voice"}
            className="composer-caixa"
            style={{ resize: "none" }}
          />
          <button
            className="btn"
            onClick={mandar}
            disabled={enviando || (!texto.trim() && !anexo)}
          >
            {enviando ? "…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
