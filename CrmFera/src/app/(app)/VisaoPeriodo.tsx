import Link from "next/link";
import {
  GRUPOS,
  diaCurto,
  pct,
  type Contagem,
  type LinhaDia,
  type Periodo,
  type PeriodoKey,
} from "@/lib/dashboard";

const ABAS: { key: PeriodoKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mês" },
];

const FAIXAS_FUNIL = [
  { label: "LEADS", cor: "#13286c", topo: 0, base: 11 },
  { label: "INTERAGIU", cor: "#2f55c9", topo: 11, base: 23 },
  { label: "AGENDADO", cor: "#6f93e8", topo: 23, base: 33 },
];

export function FiltroPeriodo({ periodo }: { periodo: Periodo }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
      {ABAS.map((a) => (
        <Link
          key={a.key}
          href={`/?p=${a.key}`}
          className="pilula"
          aria-pressed={periodo.key === a.key}
          style={{ fontSize: 13, padding: "7px 14px" }}
        >
          {a.label}
        </Link>
      ))}
      <form method="get" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <input type="hidden" name="p" value="custom" />
        <input type="date" name="de" defaultValue={periodo.de} aria-label="De" style={{ width: "auto" }} />
        <span style={{ color: "var(--texto-fraco)" }}>→</span>
        <input type="date" name="ate" defaultValue={periodo.ate} aria-label="Até" style={{ width: "auto" }} />
        <button
          type="submit"
          className="pilula"
          aria-pressed={periodo.key === "custom"}
          style={{ fontSize: 13, padding: "7px 14px", border: 0, cursor: "pointer" }}
        >
          Personalizado
        </button>
      </form>
    </div>
  );
}

export function CardsEtapa({ contagem }: { contagem: Contagem }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 12,
        marginBottom: 18,
      }}
    >
      {GRUPOS.map((g) => (
        <div key={g.key} className="card" style={{ padding: 16, borderTop: `2px solid ${g.cor}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: g.cor }}>
            {g.label.toUpperCase()}
          </div>
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 700 }}>{contagem[g.key]}</span>{" "}
            <span style={{ fontSize: 12, color: "var(--texto-fraco)" }}>
              ({pct(contagem[g.key], contagem.leads)}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FunilAgendamento({
  dados,
}: {
  dados: { leads: number; interagiu: number; agendado: number };
}) {
  const valores = [dados.leads, dados.interagiu, dados.agendado];
  const conv = [pct(dados.interagiu, dados.leads), pct(dados.agendado, dados.interagiu)];
  // trapézio: largura vai de 100 (topo) a 34 (base) em 33 de altura
  const larg = (y: number) => 100 - y * 2;
  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Funil de agendamento</h2>
      <p style={{ fontSize: 12, color: "var(--texto-fraco)", margin: "4px 0 12px" }}>
        Leads → Interagiu → Agendado
      </p>
      <svg viewBox="0 0 100 34" style={{ width: "100%", maxWidth: 560, display: "block", margin: "0 auto" }}>
        {FAIXAS_FUNIL.map((f, i) => {
          const a = larg(f.topo) / 2;
          const b = larg(f.base) / 2;
          return (
            <g key={f.label}>
              <polygon
                points={`${50 - a},${f.topo} ${50 + a},${f.topo} ${50 + b},${f.base} ${50 - b},${f.base}`}
                fill={f.cor}
              />
              <text x="50" y={f.topo + 4.2} textAnchor="middle" fontSize="1.9" fill="#fff" opacity="0.8">
                {f.label}
              </text>
              <text x="50" y={f.topo + 7.4} textAnchor="middle" fontSize="3.6" fontWeight="700" fill="#fff">
                {valores[i]}
              </text>
              {i > 0 ? (
                <text x="50" y={f.topo + 0.9} textAnchor="middle" fontSize="1.8" fill="#fff" fontWeight="700">
                  ▾ {conv[i - 1]}%
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ReunioesPorDia({ dias }: { dias: { dia: string; total: number }[] }) {
  const total = dias.reduce((s, d) => s + d.total, 0);
  const max = Math.max(1, ...dias.map((d) => d.total));
  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Reuniões agendadas por dia</h2>
      <p style={{ fontSize: 12, color: "var(--texto-fraco)", margin: "4px 0 12px" }}>
        {total} {total === 1 ? "reunião" : "reuniões"} no período
      </p>
      {total === 0 ? (
        <p style={{ color: "#a16207", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
          Nenhuma reunião agendada no período selecionado
        </p>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 180, overflowX: "auto" }}>
          {dias.map((d) => (
            <div key={d.dia} style={{ flex: "1 0 22px", textAlign: "center", fontSize: 10 }}>
              <div style={{ color: "var(--texto-fraco)" }}>{d.total || ""}</div>
              <div
                title={`${diaCurto(d.dia)}: ${d.total}`}
                style={{
                  height: `${(d.total / max) * 130}px`,
                  minHeight: d.total ? 4 : 1,
                  background: d.total ? "var(--acento)" : "var(--linha)",
                  borderRadius: 3,
                }}
              />
              <div style={{ color: "var(--texto-fraco)", marginTop: 4 }}>{diaCurto(d.dia)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HistoricoDiario({ linhas }: { linhas: LinhaDia[] }) {
  const th = { padding: "8px 10px", fontSize: 11, textAlign: "right" as const, letterSpacing: 0.5 };
  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Histórico diário</h2>
      <p style={{ fontSize: 12, color: "var(--texto-fraco)", margin: "4px 0 12px" }}>
        Distribuição dos leads por etapa, dia a dia
      </p>
      <div style={{ overflow: "auto", maxHeight: 360 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr style={{ color: "var(--texto-fraco)" }}>
              <th style={{ ...th, textAlign: "left" }}>DATA</th>
              <th style={th}>LEADS</th>
              {GRUPOS.map((g) => (
                <th key={g.key} style={{ ...th, color: g.cor }}>
                  {g.label.toUpperCase()}
                </th>
              ))}
              <th style={th}>TAXA</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.dia} style={{ borderTop: "1px solid var(--linha)" }}>
                <td style={{ ...th, textAlign: "left", fontSize: 13, fontWeight: 600 }}>{diaCurto(l.dia)}</td>
                <td style={{ ...th, fontSize: 13 }}>{l.leads}</td>
                {GRUPOS.map((g) => (
                  <td
                    key={g.key}
                    style={{ ...th, fontSize: 13, color: l[g.key] ? g.cor : "var(--texto-fraco)", opacity: l[g.key] ? 1 : 0.5 }}
                  >
                    {l[g.key]}
                  </td>
                ))}
                <td style={{ ...th, fontSize: 13, color: "var(--texto-fraco)" }}>
                  {l.taxa === null ? "—" : `${l.taxa}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Linha de área, sem eixos: só a forma da curva, como nos cartões da referência. */
export function Sparkline({ valores }: { valores: readonly number[] }) {
  if (valores.length < 2) return null;
  const max = Math.max(1, ...valores);
  const passo = 100 / (valores.length - 1);
  const pontos = valores.map((v, i) => `${(i * passo).toFixed(2)},${(28 - (v / max) * 24).toFixed(2)}`);
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: "100%", height: 72, display: "block" }} aria-hidden="true">
      <polygon points={`0,30 ${pontos.join(" ")} 100,30`} fill="rgba(26,47,143,.16)" />
      <polyline
        points={pontos.join(" ")}
        fill="none"
        stroke="var(--acento)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}
