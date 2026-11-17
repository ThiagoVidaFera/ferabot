"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  mudarEstadoConversa,
  alternarCallRealizada,
  alternarPropostaEnviada,
  alternarHumano,
} from "./acoes";
import type { EstadoConversa } from "./estados";

/** Botões de estado da conversa. Aparecem no item da lista, no hover. */
export default function AcoesConversa({
  contactId,
  estado,
  temCall,
  callRealizada,
  propostaEnviada,
  humano,
}: {
  contactId: string;
  estado: EstadoConversa;
  /** call agendada (estágio call_marcada) — só muda a dica do botão */
  temCall?: boolean;
  callRealizada?: boolean;
  propostaEnviada?: boolean;
  humano?: boolean;
}) {
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  async function mudar(e: React.MouseEvent, novo: EstadoConversa) {
    // o item da lista é um Link — sem isso o clique navega em vez de agir
    e.preventDefault();
    e.stopPropagation();
    setOcupado(true);
    try {
      await mudarEstadoConversa(contactId, novo);
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  const botao = (
    titulo: string,
    icone: string,
    novo: EstadoConversa,
    ativo = false,
  ) => (
    <button
      title={titulo}
      aria-label={titulo}
      data-acao-conversa={novo}
      disabled={ocupado}
      onClick={(e) => mudar(e, novo)}
      style={{
        background: "none",
        border: 0,
        cursor: "pointer",
        fontSize: 13,
        lineHeight: 1,
        padding: 3,
        borderRadius: 6,
        opacity: ocupado ? 0.4 : ativo ? 1 : 0.55,
        filter: ativo ? "none" : "grayscale(1)",
      }}
    >
      {icone}
    </button>
  );

  const toggle = (
    titulo: string,
    icone: string,
    chave: string,
    ativo: boolean,
    aoClicar: (e: React.MouseEvent) => void,
  ) => (
    <button
      title={titulo}
      aria-label={titulo}
      data-acao-conversa={chave}
      disabled={ocupado}
      onClick={aoClicar}
      style={{
        background: "none",
        border: 0,
        cursor: "pointer",
        fontSize: 13,
        lineHeight: 1,
        padding: 3,
        borderRadius: 6,
        opacity: ocupado ? 0.4 : ativo ? 1 : 0.55,
        filter: ativo ? "none" : "grayscale(1)",
      }}
    >
      {icone}
    </button>
  );

  async function executar(e: React.MouseEvent, acao: () => Promise<void>) {
    e.preventDefault();
    e.stopPropagation();
    setOcupado(true);
    try {
      await acao();
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  async function alternarSoHumano(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOcupado(true);
    try {
      await alternarHumano(contactId, !humano);
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 2 }} onClick={(e) => e.preventDefault()}>
      {toggle(
        callRealizada
          ? "Call realizada — clique pra desfazer"
          : temCall
            ? "Call marcada — clique pra registrar como REALIZADA"
            : "Registrar call realizada",
        "📅",
        "call",
        !!callRealizada,
        (e) => executar(e, () => alternarCallRealizada(contactId, !callRealizada)),
      )}
      {toggle(
        propostaEnviada
          ? "Proposta enviada — clique pra desfazer"
          : "Proposta enviada (ligada sozinha quando a call é realizada)",
        "📄",
        "proposta",
        !!propostaEnviada,
        (e) => executar(e, () => alternarPropostaEnviada(contactId, !propostaEnviada)),
      )}
      {estado === "destacada"
        ? botao("Tirar destaque", "⭐", "andamento", true)
        : botao("Destacar", "⭐", "destacada")}
      <button
        title={humano ? "Só humano ATIVO — clique pra religar o robô" : "Só humano: o robô nunca mais responde"}
        aria-label={humano ? "Religar o robô" : "Só humano"}
        data-acao-conversa="humano"
        disabled={ocupado}
        onClick={alternarSoHumano}
        style={{
          background: humano ? "rgba(255,79,0,0.18)" : "none",
          border: 0,
          cursor: "pointer",
          fontSize: 13,
          lineHeight: 1,
          padding: 3,
          borderRadius: 6,
          opacity: ocupado ? 0.4 : humano ? 1 : 0.55,
          filter: humano ? "none" : "grayscale(1)",
        }}
      >
        🧑
      </button>
      {estado === "arquivada"
        ? botao("Desarquivar", "📤", "andamento", true)
        : botao("Arquivar", "📦", "arquivada")}
      {botao("Excluir do inbox (histórico fica)", "🗑️", "excluida")}
    </div>
  );
}
