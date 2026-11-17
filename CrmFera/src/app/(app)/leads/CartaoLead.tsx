"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trocarStatusLead, marcarGanho, marcarPerdido } from "./acoes";
import { mudarEstadoConversa } from "../inbox/acoes";

export type DadosCartao = {
  id: string;
  nome: string;
  href: string;
  quando: string;
  origem: string;
  marca: string;
  /** produto sugerido ao marcar ganho (vem do negocio.json, editável antes de confirmar) */
  produtoSugerido: string;
  /** etiqueta do estágio quando ele não é um dos status do seletor */
  estagio: { label: string; cor: string } | null;
  /** "proposta" | "futuro" | "sem_resposta", ou "auto" pro status calculado */
  valorStatus: string;
  rotuloAuto: string;
  corBorda: string | null;
};

const MANUAIS: Array<{ valor: string; rotulo: string }> = [
  { valor: "proposta", rotulo: "📄 Analisando proposta" },
  { valor: "futuro", rotulo: "🗓️ Futuro" },
  { valor: "sem_resposta", rotulo: "🔇 Sem resposta" },
  // Os dois de fechamento pedem um dado antes de gravar — por isso abrem um painel.
  { valor: "ganho", rotulo: "✅ Ganho" },
  { valor: "perdido", rotulo: "❌ Perdido" },
];

const MOTIVOS_PERDA: Array<{ valor: string; rotulo: string }> = [
  { valor: "sem_dinheiro", rotulo: "Sem dinheiro" },
  { valor: "sem_resposta", rotulo: "Sem resposta" },
  { valor: "sem_perfil", rotulo: "Sem perfil" },
];

export default function CartaoLead({ c }: { c: DadosCartao }) {
  const [ocupado, setOcupado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState(c.valorStatus);
  const [produto, setProduto] = useState(c.produtoSugerido);
  const [valor, setValor] = useState("");
  const router = useRouter();

  async function executar(acao: () => Promise<void>) {
    setOcupado(true);
    setErro(null);
    try {
      await acao();
      router.refresh();
    } catch {
      setErro("não deu certo — tente de novo");
    } finally {
      setOcupado(false);
    }
  }

  function escolher(v: string) {
    setSelecionado(v);
    setErro(null);
    if (v !== "ganho" && v !== "perdido") void executar(() => trocarStatusLead(c.id, v));
  }

  function cancelarFechamento() {
    setSelecionado(c.valorStatus);
    setErro(null);
  }

  function confirmarGanho() {
    if (!/\d/.test(valor)) {
      setErro("informe o valor da venda");
      return;
    }
    void executar(() => marcarGanho(c.id, produto, valor));
  }

  return (
    <div
      data-lead={c.id}
      style={{
        border: "1px solid var(--linha)",
        borderLeft: c.corBorda ? `3px solid ${c.corBorda}` : "1px solid var(--linha)",
        borderRadius: 10,
        padding: "10px 11px",
        background: "var(--fundo)",
        opacity: ocupado ? 0.5 : 1,
      }}
    >
      <Link href={c.href} style={{ display: "block" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
          <strong style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {c.nome}
          </strong>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--texto-fraco)", whiteSpace: "nowrap" }}>
            {c.quando}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 3 }}>
          <span style={{ fontSize: 12, color: "var(--texto-fraco)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {c.origem} · {c.marca}
          </span>
          {c.estagio ? (
            <span
              className="etiqueta"
              style={{ marginLeft: "auto", background: `${c.estagio.cor}22`, color: c.estagio.cor, fontSize: 11, padding: "2px 7px" }}
            >
              {c.estagio.label}
            </span>
          ) : null}
        </div>
      </Link>

      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8 }}>
        <select
          aria-label="Status do lead"
          value={selecionado}
          disabled={ocupado}
          onChange={(e) => escolher(e.target.value)}
          style={{ flex: 1, minWidth: 0, fontSize: 12, padding: "5px 6px" }}
        >
          <option value="auto">{c.rotuloAuto}</option>
          {MANUAIS.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.rotulo}
            </option>
          ))}
        </select>

        {confirmando ? (
          <>
            <button
              type="button"
              className="btn"
              disabled={ocupado}
              onClick={() => executar(() => mudarEstadoConversa(c.id, "excluida"))}
              style={{ padding: "5px 9px", fontSize: 12, background: "#EF4444" }}
            >
              Excluir
            </button>
            <button
              type="button"
              className="btn btn-sec"
              onClick={() => setConfirmando(false)}
              style={{ padding: "5px 9px", fontSize: 12 }}
            >
              Não
            </button>
          </>
        ) : (
          <button
            type="button"
            title="Excluir lead"
            aria-label="Excluir lead"
            onClick={() => setConfirmando(true)}
            style={{
              background: "none",
              border: 0,
              color: "var(--texto-fraco)",
              cursor: "pointer",
              fontSize: 14,
              padding: "4px 6px",
            }}
          >
            🗑
          </button>
        )}
      </div>

      {selecionado === "ganho" ? (
        <div data-painel="ganho" style={painel}>
          <input
            aria-label="Produto vendido"
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            style={{ fontSize: 12, padding: "6px 8px" }}
          />
          <input
            aria-label="Valor da venda"
            inputMode="decimal"
            placeholder="Valor da venda (R$) — ex.: 7.500"
            value={valor}
            autoFocus
            onChange={(e) => {
              setValor(e.target.value);
              setErro(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmarGanho();
            }}
            style={{ fontSize: 12, padding: "6px 8px" }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn" disabled={ocupado} onClick={confirmarGanho} style={botao}>
              Registrar venda
            </button>
            <button type="button" className="btn btn-sec" onClick={cancelarFechamento} style={botao}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {selecionado === "perdido" ? (
        <div data-painel="perdido" style={painel}>
          <span style={{ fontSize: 12, color: "var(--texto-fraco)" }}>Motivo da perda:</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MOTIVOS_PERDA.map((m) => (
              <button
                key={m.valor}
                type="button"
                className="btn btn-sec"
                disabled={ocupado}
                onClick={() => executar(() => marcarPerdido(c.id, m.valor))}
                style={botao}
              >
                {m.rotulo}
              </button>
            ))}
            <button type="button" className="btn btn-sec" onClick={cancelarFechamento} style={{ ...botao, opacity: 0.7 }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {erro ? <div style={{ color: "#EF4444", fontSize: 11, marginTop: 4 }}>{erro}</div> : null}
    </div>
  );
}

const painel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginTop: 8,
  padding: 8,
  border: "1px dashed var(--linha)",
  borderRadius: 8,
};

const botao: React.CSSProperties = { padding: "5px 9px", fontSize: 12 };
