import { CONTAS, STATUS, listarRoteiros } from "@/lib/roteiros";
import { mudarStatusRoteiro } from "./acoes";

export const dynamic = "force-dynamic";

export default async function Roteiros({
  searchParams,
}: {
  searchParams: Promise<{ conta?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const todos = await listarRoteiros();
  const contaAtiva = CONTAS.find((c) => c.id === sp.conta)?.id;
  const statusAtivo = STATUS.find((s) => s.id === sp.status)?.id;
  const visiveis = todos.filter(
    (r) => (!contaAtiva || r.conta === contaAtiva) && (!statusAtivo || r.status === statusAtivo),
  );
  const aGravar = todos.filter((r) => r.status === "a_gravar").length;
  const href = (conta?: string, status?: string) => {
    const q = new URLSearchParams();
    if (conta) q.set("conta", conta);
    if (status) q.set("status", status);
    const t = q.toString();
    return t ? `/roteiros?${t}` : "/roteiros";
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Roteiros</h1>
        <span style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
          {aGravar} a gravar · {todos.length} no total
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <a className={contaAtiva ? "btn btn-sec" : "btn"} href={href(undefined, statusAtivo)}>
          Todas as contas
        </a>
        {CONTAS.map((c) => (
          <a key={c.id} className={contaAtiva === c.id ? "btn" : "btn btn-sec"} href={href(c.id, statusAtivo)}>
            {c.rotulo}
          </a>
        ))}
        <span style={{ width: 12 }} />
        {STATUS.map((s) => (
          <a
            key={s.id}
            className={statusAtivo === s.id ? "btn" : "btn btn-sec"}
            href={href(contaAtiva, statusAtivo === s.id ? undefined : s.id)}
          >
            {s.rotulo}
          </a>
        ))}
      </div>

      {CONTAS.filter((c) => !contaAtiva || c.id === contaAtiva).map((c) => {
        const daConta = visiveis.filter((r) => r.conta === c.id);
        return (
          <section key={c.id} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>
              {c.rotulo}{" "}
              <span style={{ color: "var(--texto-fraco)", fontWeight: 400, fontSize: 13 }}>({daConta.length})</span>
            </h2>
            {daConta.length === 0 ? (
              <div className="card" style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
                Nenhum roteiro neste filtro.
              </div>
            ) : (
              daConta.map((r) => (
                <details key={r.id} className="card" style={{ marginBottom: 10 }}>
                  <summary style={{ cursor: "pointer", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 15 }}>{r.titulo}</strong>
                    {r.palavra ? <span className="etiqueta">{r.palavra}</span> : null}
                    <span className="etiqueta" style={{ marginLeft: "auto" }}>
                      {STATUS.find((s) => s.id === r.status)?.rotulo ?? r.status}
                    </span>
                  </summary>

                  <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5 }}>
                    {r.headline ? (
                      <p>
                        <strong>Headline na tela:</strong> {r.headline}
                      </p>
                    ) : null}
                    {r.mecanica ? <p style={{ color: "var(--texto-fraco)" }}>{r.mecanica}</p> : null}

                    <div style={{ overflowX: "auto", margin: "12px 0" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ textAlign: "left" }}>
                            <th style={{ padding: 6 }}>Tempo</th>
                            <th style={{ padding: 6 }}>Tela</th>
                            <th style={{ padding: 6 }}>Fala</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.beats.map((b, i) => (
                            <tr key={i} style={{ verticalAlign: "top", borderTop: "1px solid rgba(128,128,128,.25)" }}>
                              <td style={{ padding: 6, whiteSpace: "nowrap" }}>{b.tempo}</td>
                              <td style={{ padding: 6, minWidth: 180 }}>{b.tela}</td>
                              <td style={{ padding: 6, minWidth: 220 }}>{b.fala}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {r.pendencias ? (
                      <p>
                        <strong>Antes de gravar:</strong> {r.pendencias}
                      </p>
                    ) : null}
                    {r.origem ? (
                      <p style={{ color: "var(--texto-fraco)", fontSize: 12 }}>Origem: {r.origem}</p>
                    ) : null}

                    <form action={mudarStatusRoteiro} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <input type="hidden" name="id" value={r.id} />
                      {STATUS.filter((s) => s.id !== r.status).map((s) => (
                        <button key={s.id} className="btn btn-sec" type="submit" name="status" value={s.id}>
                          Marcar como {s.rotulo.toLowerCase()}
                        </button>
                      ))}
                    </form>
                  </div>
                </details>
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}
