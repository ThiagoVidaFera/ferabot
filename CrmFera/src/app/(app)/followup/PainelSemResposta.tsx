import Link from "next/link";
import { cacheValido, type Cache } from "@/lib/fila-sugestao-cache";
import type { ItemSemResposta } from "@/lib/fila-sem-resposta";
import type { Nivel } from "@/lib/fila-prioridade";
import SugestaoResposta from "./SugestaoResposta";

const COR_NIVEL: Record<Nivel, string> = {
  urgente: "#EF4444",
  alta: "#F59E0B",
  normal: "#64748B",
};

const ROTULO_NIVEL: Record<Nivel, string> = {
  urgente: "URGENTE",
  alta: "ALTA",
  normal: "NORMAL",
};

function tempo(horas: number): string {
  if (horas < 1) return "menos de 1h";
  if (horas < 24) return `${Math.floor(horas)}h`;
  return `${Math.floor(horas / 24)}d`;
}

function rotuloJanela(i: ItemSemResposta): string {
  if (i.janela.estado === "fechada") return i.exigeTemplate ? "janela fechada · só template" : "janela fechada";
  const h = Math.max(1, Math.round(i.janela.horasRestantes ?? 0));
  return i.janela.estado === "fechando" ? `janela fecha em ${h}h` : `janela aberta · ${h}h`;
}

type Props = {
  itens: ItemSemResposta[];
  total: number;
  cache: Cache;
  /** Painel (home): so o topo, sem sugestao inline, com link pra fila inteira. */
  compacto?: boolean;
};

/** Destaque "quem falou e ninguem respondeu" — usado no topo do Painel e do Follow-up. */
export default function PainelSemResposta({ itens, total, cache, compacto = false }: Props) {
  const urgentes = itens.filter((i) => i.prioridade.nivel === "urgente").length;
  const cor = urgentes ? "#EF4444" : total ? "#F59E0B" : "var(--linha)";

  return (
    <div
      id="sem-resposta"
      className="card"
      style={{ padding: 18, marginBottom: 18, borderColor: cor, borderWidth: total ? 2 : 1 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>
          🚨 Falaram e ninguém respondeu{" "}
          <span style={{ color: "var(--texto-fraco)", fontWeight: 400 }}>({total})</span>
        </h2>
        {urgentes ? (
          <span className="etiqueta" style={{ background: "#EF444422", color: "#EF4444" }}>
            {urgentes} urgente{urgentes > 1 ? "s" : ""}
          </span>
        ) : null}
        {compacto ? (
          <Link href="/followup#sem-resposta" style={{ marginLeft: "auto", fontSize: 13, color: "var(--acento)" }}>
            Ver fila inteira →
          </Link>
        ) : null}
      </div>
      <p style={{ color: "var(--texto-fraco)", fontSize: 12, marginBottom: 12 }}>
        A última mensagem é do lead. Ordem: tempo parado, calor, janela de 24h, ticket e origem.
        O CRM só lista e sugere — quem envia é você.
      </p>

      {itens.length ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {itens.map((i) => (
            <div
              key={i.contactId}
              data-sem-resposta={i.contactId}
              style={{ padding: "10px 0", borderTop: "1px solid var(--linha)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span
                  className="etiqueta"
                  style={{ background: COR_NIVEL[i.prioridade.nivel] + "22", color: COR_NIVEL[i.prioridade.nivel] }}
                >
                  {ROTULO_NIVEL[i.prioridade.nivel]} · {i.prioridade.pontos}
                </span>
                <Link href={`/contatos/${i.contactId}`} style={{ fontWeight: 600, fontSize: 14 }}>
                  {i.nome}
                </Link>
                <span style={{ color: "var(--texto-fraco)", fontSize: 12 }}>
                  parado há {tempo(i.horasParado)}
                  {i.mensagensSemResposta > 1 ? ` · ${i.mensagensSemResposta} mensagens` : ""} · {rotuloJanela(i)}
                </span>
              </div>
              <div style={{ fontSize: 13, margin: "4px 0", color: "var(--texto)" }}>
                “{i.ultimaMensagem.texto.slice(0, 160)}
                {i.ultimaMensagem.texto.length > 160 ? "…" : ""}”
              </div>
              <div style={{ fontSize: 11, color: "var(--texto-fraco)" }}>{i.prioridade.motivos.join(" · ")}</div>
              {compacto ? null : (
                <SugestaoResposta
                  contactId={i.contactId}
                  inicial={cacheValido(cache, i.contactId, i.ultimaMensagem.em)}
                  exigeTemplate={i.exigeTemplate}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
          Ninguém esperando resposta. Caixa limpa. ✓
        </p>
      )}
      {compacto && total > itens.length ? (
        <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 8 }}>
          + {total - itens.length} na fila de Follow-up.
        </p>
      ) : null}
    </div>
  );
}
