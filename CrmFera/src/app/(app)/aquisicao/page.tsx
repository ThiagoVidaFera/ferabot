import { db } from "@/lib/db";
import { resumoAquisicao } from "@/lib/aquisicao";
import { lancarCusto } from "./acoes";

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function pct(v: number) {
  return (v * 100).toFixed(1).replace(".", ",") + "%";
}
function mesLabel(ym: string) {
  const [a, m] = ym.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default async function Aquisicao({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const sp = await searchParams;
  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const mes = sp.mes ?? mesAtual;
  const [ano, m] = mes.split("-").map(Number);

  const de = new Date(ano, m - 1, 1);
  const ate = new Date(ano, m, 1);

  const [r, origens, compras, leadsCtwa] = await Promise.all([
    resumoAquisicao(de, ate),
    db.contact.groupBy({ by: ["origem"], _count: true }),
    db.purchase.findMany({ select: { createdAt: true } }),
    // A quebra por ANÚNCIO é o que a origem sozinha não conta: "ctwa" diz que
    // custou dinheiro, não qual peça trouxe. `customFields` é JSON — o SQLite
    // não agrupa por dentro dele, então a soma é feita aqui, em memória, sobre
    // a janela do mês (algumas centenas de linhas, não a base inteira).
    db.contact.findMany({
      where: { origem: "ctwa", createdAt: { gte: de, lt: ate } },
      select: { customFields: true, purchaseCount: true, totalRevenue: true },
    }),
  ]);

  const porAnuncio = new Map<
    string,
    { anuncio: string; campanha: string; leads: number; clientes: number; receitaCents: number }
  >();
  for (const c of leadsCtwa) {
    const campos =
      c.customFields && typeof c.customFields === "object"
        ? (c.customFields as Record<string, unknown>)
        : {};
    const id = String(campos.ctwa_ad_id ?? "");
    const nome = String(campos.anuncio ?? "") || (id ? `ID ${id}` : "sem identificação");
    const chave = id || nome;
    const atual =
      porAnuncio.get(chave) ??
      { anuncio: nome, campanha: String(campos.campanha ?? "") || "—", leads: 0, clientes: 0, receitaCents: 0 };
    atual.leads++;
    if (c.purchaseCount > 0) atual.clientes++;
    atual.receitaCents += c.totalRevenue;
    porAnuncio.set(chave, atual);
  }
  const linhasAnuncio = [...porAnuncio.values()].sort((a, b) => b.leads - a.leads);

  const opcoes = Array.from(
    new Set([
      mesAtual,
      ...compras.map(
        (x) => `${x.createdAt.getFullYear()}-${String(x.createdAt.getMonth() + 1).padStart(2, "0")}`,
      ),
    ]),
  )
    .sort()
    .reverse();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Aquisição</h1>
        <form method="get" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <select name="mes" defaultValue={mes} style={{ width: "auto" }}>
            {opcoes.map((mm) => (
              <option key={mm} value={mm}>
                {mesLabel(mm)}
              </option>
            ))}
          </select>
          <button className="btn btn-sec" type="submit">
            Ver
          </button>
        </form>
      </div>
      <p style={{ color: "var(--texto-fraco)", fontSize: 13, marginBottom: 18 }}>
        Lead aqui é contato <strong>com telefone ou e-mail</strong> — linha vazia não entra na conta
        e não desinfla o seu custo por lead.
      </p>

      {!r.temCusto ? (
        <div className="card" style={{ padding: 16, marginBottom: 16, borderColor: "#F59E0B55" }}>
          <strong style={{ fontSize: 14 }}>Sem custo lançado neste período.</strong>
          <p style={{ fontSize: 13, color: "var(--texto-fraco)", marginTop: 6 }}>
            Receita e conversão já aparecem abaixo. CPL, CAC e ROAS só fazem sentido com o gasto de
            anúncio — lance no formulário no fim da página ou mande pro <code>POST /api/custos</code>.
          </p>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Card rotulo="Leads" valor={String(r.totais.leads)} />
        <Card
          rotulo="Reuniões realizadas"
          valor={String(r.totais.realizadas)}
          extra={`de ${r.totais.agendadas} marcadas${r.totais.cprCents ? ` · ${brl(r.totais.cprCents)} cada` : ""}`}
        />
        <Card rotulo="Clientes" valor={String(r.totais.clientes)} extra={pct(r.totais.conversao)} />
        <Card rotulo="Receita" valor={brl(r.totais.receitaCents)} />
        <Card rotulo="Investido" valor={brl(r.totais.custoCents)} />
        <Card
          rotulo="Resultado"
          valor={r.totais.margemCents === null ? "—" : brl(r.totais.margemCents)}
          cor={
            r.totais.margemCents === null
              ? undefined
              : r.totais.margemCents >= 0
                ? "#10B981"
                : "#EF4444"
          }
          extra={r.totais.roas ? `ROAS ${r.totais.roas.toFixed(2)}×` : undefined}
        />
      </div>

      {linhasAnuncio.length ? (
        <div className="card" style={{ overflowX: "auto", marginBottom: 20, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            Anúncios que abriram conversa no WhatsApp (CTWA)
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ color: "var(--texto-fraco)", fontSize: 12, textAlign: "left" }}>
                <th style={th}>Anúncio</th>
                <th style={th}>Campanha</th>
                <th style={th}>Leads</th>
                <th style={th}>Clientes</th>
                <th style={th}>Receita</th>
              </tr>
            </thead>
            <tbody>
              {linhasAnuncio.map((l) => (
                <tr key={l.anuncio} style={{ borderTop: "1px solid var(--linha)" }}>
                  <td style={{ ...td, fontWeight: 600 }}>{l.anuncio}</td>
                  <td style={{ ...td, color: "var(--texto-fraco)" }}>{l.campanha}</td>
                  <td style={td}>{l.leads}</td>
                  <td style={td}>{l.clientes}</td>
                  <td style={td}>{brl(l.receitaCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="card" style={{ overflowX: "auto", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ color: "var(--texto-fraco)", fontSize: 12, textAlign: "left" }}>
              <th style={th}>Funil / origem</th>
              <th style={th}>Leads</th>
              <th style={th}>Reuniões marcadas</th>
              <th style={th}>Realizadas</th>
              <th style={th}>Clientes</th>
              <th style={th}>Conversão</th>
              <th style={th}>Receita</th>
              <th style={th}>Investido</th>
              <th style={th}>CPL</th>
              <th style={th}>Custo/reunião realizada</th>
              <th style={th}>CAC</th>
              <th style={th}>ROAS</th>
              <th style={th}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {r.linhas.map((l) => (
              <tr key={l.origem} data-funil={l.origem} style={{ borderTop: "1px solid var(--linha)" }}>
                <td style={{ ...td, fontWeight: 600 }}>{l.origem}</td>
                <td style={td}>{l.leads}</td>
                <td style={td}>{l.agendadas || "—"}</td>
                <td style={td}>{l.agendadas ? l.realizadas : "—"}</td>
                <td style={td}>{l.clientes}</td>
                <td style={{ ...td, color: "var(--texto-fraco)" }}>{pct(l.conversao)}</td>
                <td style={td}>{brl(l.receitaCents)}</td>
                <td style={td}>{l.custoCents ? brl(l.custoCents) : "—"}</td>
                <td style={td}>{l.cplCents === null ? "—" : brl(l.cplCents)}</td>
                <td style={td}>{l.cprCents === null ? "—" : brl(l.cprCents)}</td>
                <td style={td}>{l.cacCents === null ? "—" : brl(l.cacCents)}</td>
                <td
                  style={{
                    ...td,
                    fontWeight: 600,
                    color: l.roas === null ? undefined : l.roas >= 1 ? "#10B981" : "#EF4444",
                  }}
                >
                  {l.roas === null ? "—" : l.roas.toFixed(2) + "×"}
                </td>
                <td
                  style={{
                    ...td,
                    fontWeight: 700,
                    color:
                      l.margemCents === null ? undefined : l.margemCents >= 0 ? "#10B981" : "#EF4444",
                  }}
                >
                  {l.margemCents === null ? "—" : brl(l.margemCents)}
                </td>
              </tr>
            ))}
            {!r.linhas.length ? (
              <tr>
                <td colSpan={13} style={{ ...td, color: "var(--texto-fraco)", textAlign: "center" }}>
                  Nenhum dado no período.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <form
        action={lancarCusto}
        className="card"
        style={{ padding: 18, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}
      >
        <div style={{ flex: "0 1 150px" }}>
          <span style={rot}>Dia</span>
          <input
            type="date"
            name="data"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div style={{ flex: "1 1 180px" }}>
          <span style={rot}>Origem / funil</span>
          <input name="origem" list="origens" required placeholder="anuncio, checkout, funil:livro…" />
          <datalist id="origens">
            {origens.map((o) => (
              <option key={o.origem} value={o.origem} />
            ))}
          </datalist>
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <span style={rot}>Campanha (opcional)</span>
          <input name="campanha" placeholder="CBO Quiz Repelente" />
        </div>
        <div style={{ flex: "0 1 140px" }}>
          <span style={rot}>Investido (R$)</span>
          <input name="valor" required placeholder="150,00" />
        </div>
        <button className="btn" type="submit">
          Lançar custo
        </button>
      </form>
    </div>
  );
}

function Card({
  rotulo,
  valor,
  extra,
  cor,
}: {
  rotulo: string;
  valor: string;
  extra?: string;
  cor?: string;
}) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>{rotulo}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: cor }}>{valor}</div>
      {extra ? (
        <div style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 2 }}>{extra}</div>
      ) : null}
    </div>
  );
}

const th: React.CSSProperties = { padding: "10px 12px", fontWeight: 600, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", whiteSpace: "nowrap" };
const rot: React.CSSProperties = {
  fontSize: 12,
  color: "var(--texto-fraco)",
  display: "block",
  marginBottom: 4,
};
