import { consolidarAnuncios, gerarSugestoes, type LinhaAnuncio } from "@/lib/anuncios";
import { anunciosAtivos, dadosCrmDosAnuncios, insightsDosAnuncios, type VendaPorDia } from "@/lib/anuncios-dados";
import { pausarAnuncio } from "./acoes";

export const dynamic = "force-dynamic";

const PERIODOS = [7, 14, 30] as const;
const DIA_MS = 24 * 60 * 60 * 1000;
const AMARELO = "#FACC15";

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function rotuloDia(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default async function Anuncios({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string; pausado?: string; erro?: string }>;
}) {
  const sp = await searchParams;
  const dias = PERIODOS.find((p) => String(p) === sp.dias) ?? 7;
  const hoje = new Date();
  const ate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
  const de = new Date(ate.getTime() - dias * DIA_MS);

  const [crm, graph] = await Promise.all([dadosCrmDosAnuncios(de, ate), insightsDosAnuncios(de, ate)]);
  const linhas = consolidarAnuncios(graph.insights, crm.contatos);
  const ativos = await anunciosAtivos(linhas.map((l) => l.adId));
  const sugestoes = gerarSugestoes(linhas, ativos);
  const porId = new Map(linhas.map((l) => [l.adId, l]));
  const ticket = crm.totalVendas ? Math.round(crm.totalReceitaCents / crm.totalVendas) : 0;
  const gastoTotal = linhas.reduce((s, l) => s + l.gastoCents, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Anúncios</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {PERIODOS.map((p) => (
            <a key={p} href={`/anuncios?dias=${p}`} className={p === dias ? "btn" : "btn btn-sec"}>
              {p} dias
            </a>
          ))}
        </div>
      </div>
      <p style={{ color: "var(--texto-fraco)", fontSize: 13, marginBottom: 18 }}>
        Quanto vendeu, de onde veio cada venda e quais anúncios estão trazendo cliente. Os que vendem ficam
        amarelos; o resto está só gastando.
      </p>

      {sp.pausado ? <Aviso texto="Anúncio pausado na Meta e registrado na auditoria." /> : null}
      {sp.erro ? <Aviso texto={`Não consegui pausar: ${sp.erro}`} alerta /> : null}
      {graph.aviso ? <Aviso texto={graph.aviso} alerta /> : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Card rotulo="Vendas" valor={String(crm.totalVendas)} />
        <Card rotulo="Receita" valor={brl(crm.totalReceitaCents)} />
        <Card rotulo="Ticket médio" valor={ticket ? brl(ticket) : "—"} />
        <Card rotulo="Investido" valor={gastoTotal ? brl(gastoTotal) : "—"} />
        <Card
          rotulo="ROAS"
          valor={gastoTotal ? `${(crm.totalReceitaCents / gastoTotal).toFixed(2).replace(".", ",")}×` : "—"}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={titulo}>Receita por dia</div>
          <GraficoDias dados={crm.vendasPorDia} de={de} ate={ate} />
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={titulo}>De onde veio cada venda</div>
          {crm.vendasPorOrigem.length ? (
            crm.vendasPorOrigem.map((o) => (
              <div key={o.origem} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "5px 0" }}>
                <span>{o.origem}</span>
                <span>
                  {o.vendas} · <strong>{brl(o.receitaCents)}</strong>
                </span>
              </div>
            ))
          ) : (
            <Vazio texto="Nenhuma venda no período." />
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 20 }}>
        <div style={titulo}>O agente diz o que fazer</div>
        {sugestoes.length ? (
          sugestoes.map((s) => (
            <div
              key={`${s.tipo}-${s.adId}`}
              style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--linha)", flexWrap: "wrap" }}
            >
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.titulo}</div>
                <div style={{ fontSize: 13, color: "var(--texto-fraco)" }}>{s.motivo}</div>
              </div>
              {s.tipo === "pausar" ? (
                <form action={pausarAnuncio}>
                  <input type="hidden" name="adId" value={s.adId} />
                  <input type="hidden" name="nome" value={porId.get(s.adId)?.nome ?? ""} />
                  <button className="btn" type="submit">
                    Pausar
                  </button>
                </form>
              ) : (
                <span className="etiqueta" style={{ background: AMARELO, color: "#1f2937" }}>
                  aumente a verba na Meta
                </span>
              )}
            </div>
          ))
        ) : (
          <Vazio texto="Sem sugestão hoje: nenhum anúncio ativo com dado suficiente, ou sem confirmação de status na Meta." />
        )}
      </div>

      <div className="card" style={{ overflowX: "auto", padding: 14 }}>
        <div style={titulo}>Anúncios</div>
        {linhas.length ? <Tabela linhas={linhas} /> : <Vazio texto="Nenhum anúncio com gasto ou lead no período." />}
      </div>
    </div>
  );
}

function Tabela({ linhas }: { linhas: LinhaAnuncio[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr style={{ color: "var(--texto-fraco)", fontSize: 12, textAlign: "left" }}>
          <th style={th}>Anúncio</th>
          <th style={th}>Campanha</th>
          <th style={th}>Gasto</th>
          <th style={th}>Cliques</th>
          <th style={th}>Leads</th>
          <th style={th}>Vendas</th>
          <th style={th}>Receita</th>
          <th style={th}>ROAS</th>
        </tr>
      </thead>
      <tbody>
        {linhas.map((l) => (
          <tr
            key={l.adId}
            data-situacao={l.situacao}
            style={{ borderTop: "1px solid var(--linha)", background: l.situacao === "vende" ? `${AMARELO}33` : undefined }}
          >
            <td style={{ ...td, fontWeight: 600 }}>
              {l.nome}
              {l.incerto ? (
                <span className="etiqueta" style={{ marginLeft: 8 }} title="O CRM tem venda com nome que serve a mais de um anúncio">
                  atribuição incerta
                </span>
              ) : null}
            </td>
            <td style={{ ...td, color: "var(--texto-fraco)" }}>{l.campanha}</td>
            <td style={td}>{l.gastoCents ? brl(l.gastoCents) : "—"}</td>
            <td style={td}>{l.cliques || "—"}</td>
            <td style={td}>{l.leads}</td>
            <td style={td}>{l.vendas}</td>
            <td style={td}>{l.receitaCents ? brl(l.receitaCents) : "—"}</td>
            <td style={td}>{l.roas === null ? "—" : `${l.roas.toFixed(2).replace(".", ",")}×`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function isoLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Um dia por barra, inclusive os sem venda: o gráfico conta o período inteiro, não só os dias que deram certo. */
function GraficoDias({ dados, de, ate }: { dados: VendaPorDia[]; de: Date; ate: Date }) {
  if (!dados.length) return <Vazio texto="Nenhuma venda no período." />;
  const porDia = new Map(dados.map((d) => [d.dia, d.receitaCents]));
  const dias: { dia: string; receitaCents: number }[] = [];
  for (let t = de.getTime(); t < ate.getTime(); t += DIA_MS) {
    const dia = isoLocal(new Date(t));
    dias.push({ dia, receitaCents: porDia.get(dia) ?? 0 });
  }
  const maior = Math.max(...dias.map((d) => d.receitaCents), 1);
  const largura = 100 / dias.length;
  return (
    <svg viewBox="0 0 100 46" style={{ width: "100%", height: 150 }} role="img" aria-label="Receita por dia">
      {dias.map((d, i) => {
        const h = Math.max((d.receitaCents / maior) * 34, 0.8);
        return (
          <g key={d.dia}>
            <rect x={i * largura + largura * 0.2} y={38 - h} width={largura * 0.6} height={h} fill={AMARELO} rx="0.6" />
            <text x={i * largura + largura / 2} y={44} fontSize="3" textAnchor="middle" fill="currentColor" opacity="0.6">
              {rotuloDia(d.dia)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Aviso({ texto, alerta }: { texto: string; alerta?: boolean }) {
  return (
    <div className="card" style={{ padding: 12, marginBottom: 14, fontSize: 13, borderColor: alerta ? "#F59E0B55" : "#10B98155" }}>
      {texto}
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p style={{ fontSize: 13, color: "var(--texto-fraco)" }}>{texto}</p>;
}

function Card({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>{rotulo}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{valor}</div>
    </div>
  );
}

const titulo = { fontSize: 13, fontWeight: 700, marginBottom: 8 } as const;
const th = { padding: "8px 10px", fontWeight: 600 } as const;
const td = { padding: "8px 10px" } as const;
