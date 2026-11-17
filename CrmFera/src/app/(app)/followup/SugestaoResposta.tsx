"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sugerirRespostaAcao } from "./sugestao-acao";
import { retirarDasAutomacoes } from "./acoes";

type Props = {
  contactId: string;
  /** Sugestao ja gerada pela rotina do dia (cache), se houver. */
  inicial: string | null;
  exigeTemplate: boolean;
};

/** Sugere e deixa copiar. NUNCA envia: enviar e ato humano, no Inbox. */
export default function SugestaoResposta({ contactId, inicial, exigeTemplate }: Props) {
  const [texto, setTexto] = useState<string | null>(inicial);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const router = useRouter();

  async function retirar() {
    if (!window.confirm("Retirar este lead de TODAS as automações?\n\nNenhum robô, régua, follow-up ou disparo fala mais com ele, e ele sai desta fila. Dá pra desfazer mudando o estágio.")) return;
    setOcupado(true);
    setErro(null);
    try {
      await retirarDasAutomacoes(contactId);
      router.refresh();
    } catch {
      setErro("não consegui retirar agora — tente de novo");
      setOcupado(false);
    }
  }

  async function gerar(forcar: boolean) {
    setOcupado(true);
    setErro(null);
    try {
      const r = await sugerirRespostaAcao(contactId, forcar);
      if (r.ok) setTexto(r.texto);
      else setErro(r.erro);
    } catch {
      setErro("não consegui gerar agora — tente de novo");
    } finally {
      setOcupado(false);
    }
  }

  async function copiar() {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("o navegador não deixou copiar — selecione o texto à mão");
    }
  }

  return (
    <div style={{ width: "100%", marginTop: 8 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn" style={mini} disabled={ocupado} onClick={() => gerar(Boolean(texto))}>
          {ocupado ? "Gerando…" : texto ? "Gerar de novo" : "Sugerir resposta"}
        </button>
        {texto ? (
          <button className="btn btn-sec" style={mini} onClick={copiar}>
            {copiado ? "Copiado ✓" : "Copiar"}
          </button>
        ) : null}
        <Link href={`/inbox?c=${contactId}`} className="btn btn-sec" style={mini}>
          Abrir conversa
        </Link>
        <button className="btn btn-sec" style={mini} disabled={ocupado} onClick={retirar} data-retirar-automacoes={contactId}>
          Retirar das automações
        </button>
        {erro ? <span style={{ color: "#EF4444", fontSize: 12 }}>{erro}</span> : null}
      </div>
      {texto ? (
        <>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              fontSize: 13,
              background: "var(--painel)",
              border: "1px solid var(--linha)",
              borderRadius: 8,
              padding: 10,
              margin: "8px 0 0",
            }}
          >
            {texto}
          </pre>
          <div style={{ fontSize: 11, color: "var(--texto-fraco)", marginTop: 4 }}>
            Sugestão — nada foi enviado.{" "}
            {exigeTemplate
              ? "Janela fechada no número oficial: só template aprovado entrega; mande pelo celular."
              : "Revise e envie pelo Inbox ou pelo celular."}
          </div>
        </>
      ) : null}
    </div>
  );
}

const mini: React.CSSProperties = { padding: "5px 12px", fontSize: 12 };
