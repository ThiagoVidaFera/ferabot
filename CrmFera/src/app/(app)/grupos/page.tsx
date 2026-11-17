import Link from "next/link";
import { db } from "@/lib/db";
import { conexaoPadrao } from "@/lib/whatsapp";
import { wagmDisponivel } from "@/lib/wagm";
import { dispararParaGrupos } from "./acoes";
import { BotaoSincronizar, BotaoAlternar, BotaoSyncWagm } from "./Botoes";

const COR_STATUS: Record<string, string> = {
  pending: "#F59E0B",
  done: "#10B981",
  error: "#EF4444",
  canceled: "#6B7280",
};

function quando(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Grupos({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; c?: string }>;
}) {
  const sp = await searchParams;
  const aba = sp.aba ?? "campanhas";

  const [grupos, conexao, campanhas, agendadas, temWagm, volume] = await Promise.all([
    db.group.findMany({ orderBy: [{ ativo: "desc" }, { tamanho: "desc" }, { name: "asc" }] }),
    conexaoPadrao(),
    db.campanhaGrupo.findMany({
      orderBy: [{ agendadoPara: "desc" }, { criadoEm: "desc" }],
      take: 60,
      include: { _count: { select: { entregas: true } } },
    }),
    db.campanhaGrupo.count({ where: { status: "pending" } }),
    wagmDisponivel(),
    db.envioDiario.findMany({ orderBy: { dia: "desc" }, take: 14 }),
  ]);

  const doWagm = grupos.filter((g) => g.fonte === "wagm");
  const doWaha = grupos.filter((g) => g.fonte !== "wagm");
  const ativos = grupos.filter((g) => g.ativo);
  const alcance = doWagm.filter((g) => g.ativo).reduce((s, g) => s + g.tamanho, 0);

  const detalhe = sp.c
    ? await db.campanhaGrupo.findUnique({
        where: { id: sp.c },
        include: {
          entregas: { orderBy: { concluidoEm: "desc" }, take: 200, include: { grupo: true } },
        },
      })
    : null;

  const abas = [
    { key: "campanhas", label: "📣 Campanhas", n: campanhas.length },
    { key: "catalogo", label: "👥 Grupos", n: grupos.length },
    { key: "disparar", label: "✉️ Disparar agora", n: 0 },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Grupos</h1>
        <span style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
          {ativos.length} ativo(s) de {grupos.length} · alcance ~
          {alcance.toLocaleString("pt-BR")} pessoas
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <BotaoSyncWagm disponivel={temWagm} />
          <BotaoSincronizar />
        </div>
      </div>

      <p style={{ color: "var(--texto-fraco)", fontSize: 13, marginBottom: 16 }}>
        Os avisos de grupo são disparados pelo WAGM (gerenciador de grupos, opcional) — com jitter,
        cap diário e rotação de variantes. Aqui você <strong>enxerga</strong> o que foi agendado,
        entregue e o que falhou.
      </p>

      {!temWagm ? (
        <div className="card" style={{ padding: 14, marginBottom: 16, borderColor: "#F59E0B55", fontSize: 13 }}>
          O banco do WAGM não está montado neste container — as campanhas abaixo são o último
          espelho gravado. (Monte <code>/opt/wagm/app</code> como <code>/mnt/wagm</code> read-only.)
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {abas.map((a) => (
          <Link
            key={a.key}
            href={`/grupos?aba=${a.key}`}
            className="etiqueta"
            data-aba={a.key}
            style={{
              padding: "6px 12px",
              fontSize: 13,
              background: aba === a.key ? "var(--acento)" : "transparent",
              color: aba === a.key ? "#fff" : "var(--texto-fraco)",
              border: `1px solid ${aba === a.key ? "transparent" : "var(--linha)"}`,
            }}
          >
            {a.label} {a.n ? <span style={{ opacity: 0.75 }}>{a.n}</span> : null}
          </Link>
        ))}
      </div>

      {aba === "campanhas" ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <Mini rotulo="Agendadas" valor={String(agendadas)} cor={agendadas ? "#F59E0B" : undefined} />
            <Mini rotulo="Concluídas" valor={String(campanhas.filter((c) => c.status === "done").length)} />
            <Mini
              rotulo="Com erro"
              valor={String(campanhas.filter((c) => c.status === "error").length)}
              cor="#EF4444"
            />
            <Mini
              rotulo="Enviadas hoje"
              valor={String(volume.find((v) => v.dia === new Date().toISOString().slice(0, 10))?.enviados ?? 0)}
            />
          </div>

          {detalhe ? (
            <div className="card" style={{ padding: 18, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700 }}>
                  {detalhe.campanha ?? `Job #${detalhe.jobId}`}
                </h2>
                <span
                  className="etiqueta"
                  style={{
                    background: (COR_STATUS[detalhe.status] ?? "#6B7280") + "22",
                    color: COR_STATUS[detalhe.status],
                  }}
                >
                  {detalhe.status}
                </span>
                <Link href="/grupos?aba=campanhas" style={{ marginLeft: "auto", fontSize: 13, color: "var(--acento)" }}>
                  fechar
                </Link>
              </div>
              <pre
                style={{
                  background: "var(--fundo)",
                  border: "1px solid var(--linha)",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 12,
                  whiteSpace: "pre-wrap",
                  margin: "12px 0",
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {detalhe.texto || "(sem texto)"}
              </pre>
              <div style={{ display: "flex", gap: 14, fontSize: 13, flexWrap: "wrap", marginBottom: 10 }}>
                <span>
                  ✅ {detalhe.entregas.filter((e) => e.status === "delivered").length} entregues
                </span>
                <span style={{ color: "#b45309" }}>
                  ⏭️ {detalhe.entregas.filter((e) => e.status === "skipped").length} pulados
                </span>
                <span style={{ color: "#EF4444" }}>
                  ⚠️ {detalhe.entregas.filter((e) => !["delivered", "skipped"].includes(e.status)).length} erro
                </span>
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto" }}>
                {detalhe.entregas.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      display: "flex",
                      gap: 8,
                      padding: "6px 0",
                      borderBottom: "1px solid var(--linha)",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ minWidth: 62, color: e.status === "delivered" ? "#10B981" : "#F59E0B" }}>
                      {e.status}
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>{e.grupo?.name ?? e.jid}</span>
                    <span style={{ color: "var(--texto-fraco)" }}>{quando(e.concluidoEm)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="card" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ color: "var(--texto-fraco)", fontSize: 12, textAlign: "left" }}>
                  <th style={th}>Campanha</th>
                  <th style={th}>Status</th>
                  <th style={th}>Quando</th>
                  <th style={th}>Alvo</th>
                  <th style={th}>Entregas</th>
                  <th style={th}>Prévia</th>
                </tr>
              </thead>
              <tbody>
                {campanhas.map((c) => (
                  <tr key={c.id} data-campanha={c.jobId} style={{ borderTop: "1px solid var(--linha)" }}>
                    <td style={td}>
                      <Link href={`/grupos?aba=campanhas&c=${c.id}`} style={{ fontWeight: 600 }}>
                        {c.campanha ?? `Job #${c.jobId}`}
                      </Link>
                    </td>
                    <td style={td}>
                      <span
                        className="etiqueta"
                        data-status={c.status}
                        style={{
                          background: (COR_STATUS[c.status] ?? "#6B7280") + "22",
                          color: COR_STATUS[c.status] ?? "#6B7280",
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ ...td, color: "var(--texto-fraco)" }}>{quando(c.agendadoPara)}</td>
                    <td style={{ ...td, color: "var(--texto-fraco)" }}>{c.alvo}</td>
                    <td style={td}>{c._count.entregas}</td>
                    <td style={{ ...td, color: "var(--texto-fraco)", maxWidth: 320 }}>
                      {c.texto.replace(/\s+/g, " ").slice(0, 70)}…
                    </td>
                  </tr>
                ))}
                {!campanhas.length ? (
                  <tr>
                    <td colSpan={6} style={{ ...td, color: "var(--texto-fraco)", textAlign: "center" }}>
                      Nenhuma campanha espelhada — clique em <strong>Sincronizar WAGM</strong>.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {aba === "catalogo" ? (
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ color: "var(--texto-fraco)", fontSize: 12, textAlign: "left" }}>
                <th style={th}>Grupo</th>
                <th style={th}>Fonte</th>
                <th style={th}>Membros</th>
                <th style={th}>Admin</th>
                <th style={th}>Sincronizado</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => (
                <tr
                  key={g.id}
                  data-grupo={g.externalId}
                  style={{ borderTop: "1px solid var(--linha)", opacity: g.ativo ? 1 : 0.45 }}
                >
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: "var(--texto-fraco)" }}>{g.externalId}</div>
                  </td>
                  <td style={td}>
                    <span
                      className="etiqueta"
                      style={{
                        background: g.fonte === "wagm" ? "#8B5CF622" : "#3B82F622",
                        color: g.fonte === "wagm" ? "#8B5CF6" : "#3B82F6",
                      }}
                    >
                      {g.fonte}
                    </span>
                  </td>
                  <td style={td}>{g.tamanho || "—"}</td>
                  <td style={{ ...td, color: "var(--texto-fraco)" }}>{g.ehAdmin ? "sim" : "—"}</td>
                  <td style={{ ...td, color: "var(--texto-fraco)" }}>{quando(g.syncAt)}</td>
                  <td style={td}>
                    <BotaoAlternar id={g.id} ativo={g.ativo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {aba === "disparar" ? (
        <form action={dispararParaGrupos} className="card" style={{ padding: 18, maxWidth: 620 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Disparo pelo CRM</h2>
          <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginBottom: 14 }}>
            Este caminho usa a conexão do CRM ({conexao ? conexao.sessao : "não conectada"}) e é pra
            aviso pontual. <strong>Campanha grande continua no WAGM</strong>, que tem rotação de
            variantes e cap diário — texto idêntico em massa derruba número.
          </p>

          <textarea name="conteudo" rows={5} required placeholder="Aviso pra turma…" />

          <div style={{ fontSize: 13, color: "var(--texto-fraco)", margin: "12px 0 6px" }}>
            Grupos de destino
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, maxHeight: 260, overflowY: "auto" }}>
            {doWaha.filter((g) => g.ativo).map((g) => (
              <label key={g.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                <input type="checkbox" name="groupIds" value={g.externalId} style={{ width: "auto" }} />
                {g.name}
              </label>
            ))}
            {!doWaha.filter((g) => g.ativo).length ? (
              <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>
                Nenhum grupo na conexão do CRM. Os {doWagm.length} do WAGM são disparados por lá.
              </span>
            ) : null}
          </div>

          <button className="btn" type="submit" disabled={!doWaha.some((g) => g.ativo)}>
            Disparar
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Mini({ rotulo, valor, cor }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>{rotulo}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: cor }}>{valor}</div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "10px 12px", fontWeight: 600, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };
