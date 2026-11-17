import { db } from "@/lib/db";
import { ESTAGIOS } from "@/lib/estagios";
import { criarLista, criarBroadcast } from "./acoes";
import BotoesBroadcast, { BotaoExcluirLista } from "./Botoes";

const ROTULO_CANAL: Record<string, string> = {
  whatsapp_1x1: "WhatsApp 1x1",
  whatsapp_grupo: "WhatsApp grupo",
  email: "E-mail",
};

const COR_STATUS: Record<string, string> = {
  rascunho: "#6B7280",
  agendado: "#F59E0B",
  enviando: "#3B82F6",
  concluido: "#10B981",
  erro: "#EF4444",
};

export default async function Disparos() {
  const [listas, grupos, broadcasts] = await Promise.all([
    db.contactList.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    }),
    db.group.findMany({ where: { ativo: true }, orderBy: { name: "asc" } }),
    db.broadcast.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Disparos</h1>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
        {/* Criar broadcast */}
        <form action={criarBroadcast} className="card" style={{ padding: 18 }}>
          <h2 style={h2}>Novo disparo</h2>

          <Campo rotulo="Título">
            <input name="titulo" required placeholder="Aviso da turma de agosto" />
          </Campo>

          <Campo rotulo="Canal">
            <select name="canal" defaultValue="whatsapp_1x1">
              <option value="whatsapp_1x1">WhatsApp 1x1</option>
              <option value="whatsapp_grupo">WhatsApp grupo</option>
              <option value="email">E-mail</option>
            </select>
          </Campo>

          <Campo rotulo="Conteúdo — use {{nome}} pro primeiro nome">
            <textarea
              name="conteudo"
              rows={5}
              required
              placeholder="Oi {{nome}}, abri 3 vagas essa semana…"
            />
          </Campo>

          <Campo rotulo="Mídia (URL, opcional)">
            <input name="mediaUrl" placeholder="https://…" />
          </Campo>

          <Campo rotulo="Lista de destino (1x1 e e-mail)">
            <select name="listId" defaultValue="">
              <option value="">— escolha —</option>
              {listas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l._count.members})
                </option>
              ))}
            </select>
          </Campo>

          {grupos.length ? (
            <Campo rotulo="Grupos de destino (canal grupo)">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {grupos.map((g) => (
                  <label key={g.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                    <input
                      type="checkbox"
                      name="groupIds"
                      value={g.externalId}
                      style={{ width: "auto" }}
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            </Campo>
          ) : (
            <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginBottom: 12 }}>
              Nenhum grupo sincronizado ainda (tela Grupos, na fase 4).
            </p>
          )}

          <Campo rotulo="Agendar para">
            <input type="datetime-local" name="agendadoPara" />
          </Campo>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 14 }}>
            <input type="checkbox" name="agora" value="1" style={{ width: "auto" }} />
            Enviar agora (ignora o agendamento)
          </label>

          <button className="btn" type="submit">
            Criar disparo
          </button>
        </form>

        {/* Listas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <form action={criarLista} className="card" style={{ padding: 18 }}>
            <h2 style={h2}>Nova lista</h2>
            <Campo rotulo="Nome">
              <input name="name" required placeholder="Leads quentes de agosto" />
            </Campo>
            <Campo rotulo="Lista dinâmica por tag (opcional — ex.: inscrito-evento-c01)">
              <input name="tag" placeholder="inscrito-evento-c01" />
            </Campo>
            <Campo rotulo="Preencher com contatos do estágio (opcional)">
              <select name="estagio" defaultValue="">
                <option value="">— lista vazia —</option>
                {ESTAGIOS.map((e) => (
                  <option key={e.key} value={e.key}>
                    {e.label}
                  </option>
                ))}
              </select>
            </Campo>
            <button className="btn btn-sec" type="submit">
              Criar lista
            </button>
          </form>

          <div className="card" style={{ padding: 18 }}>
            <h2 style={h2}>Listas</h2>
            {listas.length ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {listas.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 0",
                      borderBottom: "1px solid var(--linha)",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{l.name}</span>
                    <span style={{ color: "var(--texto-fraco)", fontSize: 12 }}>
                      {l._count.members} contato(s)
                    </span>
                    <div style={{ marginLeft: "auto" }}>
                      <BotaoExcluirLista id={l.id} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--texto-fraco)", fontSize: 14 }}>Nenhuma lista ainda.</p>
            )}
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="card" style={{ marginTop: 20, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ color: "var(--texto-fraco)", fontSize: 12, textAlign: "left" }}>
              <th style={th}>Título</th>
              <th style={th}>Canal</th>
              <th style={th}>Status</th>
              <th style={th}>Agendado</th>
              <th style={th}>Enviados</th>
              <th style={th}>Falhas</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {broadcasts.map((b) => (
              <tr key={b.id} data-broadcast={b.id} style={{ borderTop: "1px solid var(--linha)" }}>
                <td style={{ ...td, fontWeight: 600 }}>{b.titulo}</td>
                <td style={{ ...td, color: "var(--texto-fraco)" }}>
                  {ROTULO_CANAL[b.canal] ?? b.canal}
                </td>
                <td style={td}>
                  <span
                    className="etiqueta"
                    data-status={b.status}
                    style={{
                      background: (COR_STATUS[b.status] ?? "#6B7280") + "22",
                      color: COR_STATUS[b.status] ?? "#6B7280",
                    }}
                  >
                    {b.status}
                  </span>
                </td>
                <td style={{ ...td, color: "var(--texto-fraco)" }}>
                  {b.agendadoPara
                    ? b.agendadoPara.toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td style={{ ...td, fontWeight: 600 }} data-enviados={b.enviados}>
                  {b.enviados}
                </td>
                <td style={{ ...td, color: b.falhas ? "#EF4444" : "var(--texto-fraco)" }}>
                  {b.falhas}
                </td>
                <td style={td}>
                  <BotoesBroadcast id={b.id} status={b.status} />
                </td>
              </tr>
            ))}
            {!broadcasts.length ? (
              <tr>
                <td colSpan={7} style={{ ...td, color: "var(--texto-fraco)", textAlign: "center" }}>
                  Nenhum disparo ainda.
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

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>{rotulo}</span>
      <div style={{ marginTop: 5 }}>{children}</div>
    </label>
  );
}
