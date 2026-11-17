import Link from "next/link";
import {
  painelLeads,
  ehStatusManual,
  LIMITE_CARTOES,
  type Marca,
  type CartaoLead as CartaoDoPainel,
  type StatusResposta,
} from "@/lib/painel-leads";
import CartaoLead, { type DadosCartao } from "./CartaoLead";
import { estagio } from "@/lib/estagios";
import { negocio } from "@/lib/negocio";
import { nomeExibido } from "../inbox/FichaLead";

/** Marca principal = @ do negocio.json; a segunda só aparece com MARCA_SECUNDARIA_FUNIS (painel-leads.ts). */
const MARCA_PRINCIPAL = negocio().dono.instagram || negocio().nome;
const MARCA_SECUNDARIA = process.env.MARCA_SECUNDARIA_NOME || "Marca 2";
const MARCAS: Array<{ chave: Marca | undefined; rotulo: string }> = [
  { chave: undefined, rotulo: "Todas" },
  { chave: "fera", rotulo: MARCA_PRINCIPAL },
  ...(process.env.MARCA_SECUNDARIA_FUNIS ? [{ chave: "lsc" as Marca, rotulo: MARCA_SECUNDARIA }] : []),
];

/** Status calculado: rótulo da opção "auto" do seletor e cor da borda. */
const AUTO: Record<StatusResposta, { rotulo: string; cor: string | null }> = {
  esperando: { rotulo: "⏳ Esperando você", cor: "#F59E0B" },
  nunca: { rotulo: "📵 Nunca contatado", cor: "#EF4444" },
  ok: { rotulo: "✓ Em dia", cor: null },
};

function quando(d: Date): string {
  const h = Math.floor((Date.now() - d.getTime()) / 3600000);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

/** "funil:agendar-jornada-compra-lsc" → "agendar jornada compra lsc" */
function origemLegivel(origem: string): string {
  return origem.replace(/^funil:/, "").replace(/-/g, " ");
}

function urlFiltro(marca: Marca | undefined, sem: boolean): string {
  const p = new URLSearchParams();
  if (marca) p.set("marca", marca);
  if (sem) p.set("sem", "1");
  const q = p.toString();
  return q ? `/leads?${q}` : "/leads";
}

function paraCartao(c: CartaoDoPainel): DadosCartao {
  const manual = ehStatusManual(c.estagio);
  const est = estagio(c.estagio);
  return {
    id: c.id,
    nome: nomeExibido(c.nome, c.phone),
    // Quem tem telefone abre direto na conversa — é lá que se responde.
    href: c.phone ? `/inbox?c=${c.id}` : `/contatos/${c.id}`,
    quando: quando(c.criadoEm),
    origem: origemLegivel(c.origem),
    marca: c.marca === "lsc" ? MARCA_SECUNDARIA : MARCA_PRINCIPAL,
    produtoSugerido: negocio().ofertas[0]?.nome ?? "",
    estagio: manual ? null : { label: est.label, cor: est.cor },
    valorStatus: manual ? c.estagio : "auto",
    rotuloAuto: AUTO[c.status].rotulo,
    corBorda: manual ? est.cor : AUTO[c.status].cor,
  };
}

export default async function Leads({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string; sem?: string }>;
}) {
  const sp = await searchParams;
  const marca: Marca | undefined = sp.marca === "fera" || sp.marca === "lsc" ? sp.marca : undefined;
  const soSemResposta = sp.sem === "1";

  const colunas = await painelLeads({ marca, soSemResposta });
  const totalSem = colunas.reduce((s, c) => s + c.semResposta, 0);
  const total = colunas.reduce((s, c) => s + c.total, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Leads</h1>
        <span style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
          {total} lead(s) · <strong style={{ color: "var(--acento)" }}>{totalSem} sem resposta</strong>
        </span>
      </div>
      <p style={{ color: "var(--texto-fraco)", fontSize: 13, marginBottom: 14 }}>
        Agrupados por <strong>quando chegaram</strong>. Sem resposta = ele escreveu e ninguém
        respondeu, nunca recebeu nada nosso, ou foi marcado como sem resposta. Clientes, perdidos
        e excluídos ficam fora.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {MARCAS.map((m) => (
          <Link
            key={m.rotulo}
            href={urlFiltro(m.chave, soSemResposta)}
            className={marca === m.chave ? "btn" : "btn btn-sec"}
          >
            {m.rotulo}
          </Link>
        ))}
        <Link
          href={urlFiltro(marca, !soSemResposta)}
          className={soSemResposta ? "btn" : "btn btn-sec"}
          style={{ marginLeft: "auto" }}
        >
          {soSemResposta ? "✓ Só sem resposta" : "Só sem resposta"}
        </Link>
      </div>

      <div className="leads-kanban">
        {colunas.map((col) => (
          <section key={col.chave} className="card" data-coluna={col.chave} style={{ padding: 12, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <strong style={{ fontSize: 14 }}>{col.titulo}</strong>
              <span style={{ fontSize: 12, color: "var(--texto-fraco)" }}>{col.total}</span>
              {col.semResposta ? (
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--acento)", fontWeight: 600 }}>
                  {col.semResposta} sem resposta
                </span>
              ) : null}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {col.cartoes.map((c) => (
                <CartaoLead key={c.id} c={paraCartao(c)} />
              ))}
              {!col.cartoes.length ? (
                <div style={{ fontSize: 12, color: "var(--texto-fraco)", padding: "10px 2px" }}>
                  nenhum lead aqui
                </div>
              ) : null}
              {col.total > LIMITE_CARTOES ? (
                <Link href="/contatos" style={{ fontSize: 12, color: "var(--texto-fraco)", padding: "6px 2px" }}>
                  + {col.total - LIMITE_CARTOES} — ver todos em Contatos
                </Link>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
