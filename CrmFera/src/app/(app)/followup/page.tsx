import Link from "next/link";
import { filaDoDia, etapas } from "@/lib/followup";
import { filaSemResposta } from "@/lib/fila-sem-resposta";
import { sugestoesGuardadas } from "@/lib/fila-sugestao-servico";
import { estagio } from "@/lib/estagios";
import { db } from "@/lib/db";
import BotaoToque from "./BotaoToque";
import PainelSemResposta from "./PainelSemResposta";

const LIMITE_TELA = 50;

function quando(d: Date | null): string {
  if (!d) return "nunca";
  const h = Math.floor((Date.now() - d.getTime()) / 3600000);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

export default async function Followup() {
  const [fila, semResposta, cache, lista, agentes] = await Promise.all([
    filaDoDia(),
    filaSemResposta(),
    sugestoesGuardadas(),
    etapas(),
    db.agent.findMany({ where: { ativo: true, alvo: "followup" }, select: { name: true } }),
  ]);

  const porEtapa = new Map<string, number>();
  for (const f of fila) porEtapa.set(f.etapa.chave, (porEtapa.get(f.etapa.chave) ?? 0) + 1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Follow-up</h1>
        <span style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
          {fila.length} na fila · {semResposta.length} esperando você
        </span>
      </div>
      <p style={{ color: "var(--texto-fraco)", fontSize: 13, marginBottom: 18 }}>
        O relógio conta do <strong>nosso último contato</strong>, não da chegada do lead. Quem
        respondeu sai da régua e vai pra lista de cima.
      </p>

      {/* Quem falou e ninguém respondeu — vem primeiro de propósito */}
      <PainelSemResposta itens={semResposta.slice(0, LIMITE_TELA)} total={semResposta.length} cache={cache} />

      {/* Régua */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {lista.map((e) => (
          <div
            key={e.chave}
            className="card"
            style={{ padding: "10px 14px", flex: "1 1 130px", borderLeft: "3px solid var(--acento)" }}
          >
            <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>
              {e.chave} · {e.rotulo}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{porEtapa.get(e.chave) ?? 0}</div>
            <div style={{ fontSize: 11, color: "var(--texto-fraco)" }}>
              {e.aposDias === 0 ? "na chegada" : `${e.aposDias}d sem contato`}
            </div>
          </div>
        ))}
      </div>

      {agentes.length ? (
        <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginBottom: 12 }}>
          🤖 {agentes.map((a) => a.name).join(", ")} escreve as mensagens desta fila e deixa como
          proposta em <Link href="/agentes" style={{ color: "var(--acento)" }}>Agentes</Link>.
        </p>
      ) : null}

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ color: "var(--texto-fraco)", fontSize: 12, textAlign: "left" }}>
              <th style={th}>Contato</th>
              <th style={th}>Etapa</th>
              <th style={th}>Sem contato</th>
              <th style={th}>Último toque nosso</th>
              <th style={th}>Estágio</th>
              <th style={th}>Origem</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {fila.map((f) => {
              const e = estagio(f.estagio);
              return (
                <tr key={f.contactId} data-fila={f.contactId} style={{ borderTop: "1px solid var(--linha)" }}>
                  <td style={td}>
                    <Link href={`/contatos/${f.contactId}`} style={{ fontWeight: 600 }}>
                      {f.nome}
                    </Link>
                    <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>{f.telefone}</div>
                  </td>
                  <td style={td}>
                    <span className="etiqueta" style={{ background: "#1a2f8f18", color: "var(--acento)" }}>
                      {f.etapa.chave}
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>{f.diasSemContato}d</td>
                  <td style={{ ...td, color: "var(--texto-fraco)" }}>{quando(f.ultimoNosso)}</td>
                  <td style={td}>
                    <span
                      className="etiqueta"
                      style={{ background: e.cor + "22", color: e.cor }}
                    >
                      {e.label}
                    </span>
                  </td>
                  <td style={{ ...td, color: "var(--texto-fraco)" }}>{f.origem}</td>
                  <td style={td}>
                    <BotaoToque contactId={f.contactId} etapa={f.etapa.chave} />
                  </td>
                </tr>
              );
            })}
            {!fila.length ? (
              <tr>
                <td colSpan={7} style={{ ...td, color: "var(--texto-fraco)", textAlign: "center" }}>
                  Fila vazia — ninguém está esperando toque hoje.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: 15, fontWeight: 700, marginBottom: 12 };
const th: React.CSSProperties = { padding: "10px 14px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "11px 14px" };
