import Link from "next/link";
import { paginasDoDono } from "@/lib/paginas-cliente";

export const dynamic = "force-dynamic";

function quando(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });
}

/** As páginas que o FERABOT publicou na conta Netlify do dono, com o link de cada uma. */
export default async function Paginas({ searchParams }: { searchParams: Promise<{ atualizar?: string }> }) {
  const sp = await searchParams;
  const { paginas, erro, semChave } = await paginasDoDono(sp.atualizar === "1");

  return (
    <div style={{ maxWidth: 760, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Suas páginas</h1>
        {!semChave ? (
          <a href="/paginas?atualizar=1" className="btn btn-sec" style={{ marginLeft: "auto", fontSize: 12, textDecoration: "none" }}>
            Atualizar
          </a>
        ) : null}
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--texto-fraco)" }}>
        Todas as páginas que o FERABOT publicou na sua conta da Netlify, da mais nova para a mais antiga.
      </p>

      {semChave ? (
        <div className="card" style={{ padding: 16, fontSize: 14, lineHeight: 1.55 }}>
          As suas páginas aparecem aqui depois que a chave da Netlify estiver salva.{" "}
          <Link href="/chaves" style={{ color: "var(--acento)", fontWeight: 600 }}>
            Abrir Chaves
          </Link>
          <div style={{ marginTop: 8, fontSize: 13, color: "var(--texto-fraco)" }}>
            Para criar a primeira: Jornada, passo 3, ou o Guia de prompts, prompt da página de captura.
          </div>
        </div>
      ) : null}

      {erro ? (
        <div className="card" style={{ padding: 14, fontSize: 14, borderColor: "#F59E0B55" }}>
          {erro}
        </div>
      ) : null}

      {!semChave && !erro && paginas.length === 0 ? (
        <div className="card" style={{ padding: 16, fontSize: 14 }}>
          Nenhuma página ainda. Comece pela página de captura (Jornada, passo 3).
        </div>
      ) : null}

      {paginas.map((p) => (
        <section key={p.id} className="card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
          {p.captura ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.captura} alt="" width={72} height={54} style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
          ) : null}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, overflowWrap: "anywhere" }}>{p.nome}</div>
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: "var(--acento)", overflowWrap: "anywhere" }}
            >
              {p.url.replace(/^https:\/\//, "")}
            </a>
            {p.atualizadaEm ? (
              <div style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 2 }}>Publicada em {quando(p.atualizadaEm)}</div>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
