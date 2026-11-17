import Link from "next/link";
import type { PainelCustos as Dados } from "@/lib/painel-custos";

const FUSO = "America/Sao_Paulo";

function brl(centavos: number | null): string {
  if (centavos === null) return "—";
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function diaMes(d: Date): string {
  return d.toLocaleDateString("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit" });
}

function quando(d: Date): string {
  return d.toLocaleString("pt-BR", { timeZone: FUSO, weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const GRADE = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 } as const;

interface CartaoProps {
  rotulo: string;
  valor: string;
  detalhe: string;
  cor: string;
  href?: string;
}

function Cartao({ rotulo, valor, detalhe, cor, href }: CartaoProps) {
  const corpo = (
    <div className="card" style={{ padding: 16, borderTop: `2px solid ${cor}`, height: "100%" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: cor }}>{rotulo.toUpperCase()}</div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 6 }}>{valor}</div>
      <div style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 4 }}>{detalhe}</div>
    </div>
  );
  return href ? <Link href={href}>{corpo}</Link> : corpo;
}

export default function PainelCustos({ dados }: { dados: Dados }) {
  const { custos, reunioes, leads, propostas, custoAte } = dados;
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Custo no período</h2>
        <span style={{ fontSize: 12, color: "var(--texto-fraco)" }}>
          {brl(custos.custoTotalCents)} investidos em anúncio
          {custoAte ? ` · custo lançado até ${diaMes(custoAte)}` : " · nenhum custo lançado"}
        </span>
      </div>
      <div style={{ ...GRADE, marginBottom: 14 }}>
        <Cartao rotulo="Custo por lead" valor={brl(custos.cplCents)} detalhe={plural(leads, "lead", "leads")} cor="#13286c" />
        <Cartao
          rotulo="Custo por reunião"
          valor={brl(custos.porRealizadaCents)}
          detalhe={`${plural(reunioes.realizadas, "realizada", "realizadas")} · ${brl(custos.porMarcadaCents)} por marcada`}
          cor="#2f55c9"
          href="/reunioes"
        />
        <Cartao
          rotulo="Custo por proposta"
          valor={brl(custos.porPropostaCents)}
          detalhe={plural(propostas, "proposta enviada", "propostas enviadas")}
          cor="#EA580C"
        />
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Reuniões</h2>
      <div style={GRADE}>
        <Cartao
          rotulo="Realizadas"
          valor={String(reunioes.realizadas)}
          detalhe={reunioes.comparecimento === null ? "no período" : `comparecimento ${reunioes.comparecimento}%`}
          cor="#16a34a"
          href="/reunioes"
        />
        <Cartao rotulo="No show" valor={String(reunioes.noShow)} detalhe="no período" cor="#dc2626" href="/reunioes" />
        <Cartao
          rotulo="A realizar"
          valor={String(reunioes.aRealizar)}
          detalhe={reunioes.proxima ? `próxima ${quando(reunioes.proxima)}` : "nenhuma marcada"}
          cor="#6f93e8"
          href="/reunioes"
        />
        {reunioes.semResultado > 0 ? (
          <Cartao
            rotulo="Marcar resultado"
            valor={String(reunioes.semResultado)}
            detalhe="já passaram e ninguém marcou se veio"
            cor="#b45309"
            href="/reunioes"
          />
        ) : null}
      </div>
      <p style={{ fontSize: 11, color: "var(--texto-fraco)", marginTop: 8 }}>
        Custo por lead usa todo o gasto. Custo por reunião e por proposta deixa de fora o low ticket LATAM, que não marca reunião.
      </p>
    </section>
  );
}
