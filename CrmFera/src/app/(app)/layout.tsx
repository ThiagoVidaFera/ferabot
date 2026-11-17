import { redirect } from "next/navigation";
import NavLink from "./NavLink";
import { sessaoAtual } from "@/lib/auth";
import { db } from "@/lib/db";
import { negocio as negocioDoArquivo } from "@/lib/negocio";
import { contarSemResposta } from "@/lib/fila-sem-resposta";

// As 10 telas na ordem do megaprompt.
const MENU = [
  { href: "/", label: "Painel", icone: "painel" },
  { href: "/leads", label: "Leads", icone: "leads" },
  { href: "/contatos", label: "Contatos", icone: "contatos" },
  { href: "/inbox", label: "Inbox", icone: "inbox" },
  { href: "/followup", label: "Follow-up", icone: "followup" },
  { href: "/grupos", label: "Grupos", icone: "grupos" },
  { href: "/disparos", label: "Disparos", icone: "disparos" },
  { href: "/email", label: "E-mail", icone: "email" },
  { href: "/funis", label: "Funis", icone: "funis" },
  { href: "/vendas", label: "Vendas", icone: "vendas" },
  { href: "/reunioes", label: "Reuniões", icone: "reunioes" },
  { href: "/aquisicao", label: "Aquisição", icone: "aquisicao" },
  { href: "/anuncios", label: "Anúncios", icone: "anuncios" },
  { href: "/roteiros", label: "Roteiros", icone: "roteiros" },
  { href: "/agentes", label: "Agentes", icone: "agentes" },
  { href: "/auditoria", label: "Auditoria", icone: "auditoria" },
  { href: "/configuracoes", label: "Configurações", icone: "configuracoes" },
];

/**
 * Os mesmos links servem a barra lateral do desktop e a gaveta do celular.
 * `compacto` só muda o alvo de toque — o conteúdo é idêntico de propósito:
 * menu que muda de item entre telas obriga a reaprender onde as coisas estão.
 */
function MenuLinks({
  pendentes,
  semResposta,
  compacto,
}: {
  pendentes: number;
  semResposta: number;
  compacto?: boolean;
}) {
  return (
    <>
      {MENU.map((m) => (
        <NavLink key={m.href} href={m.href} label={m.label} icone={m.icone} compacto={compacto}>
          {m.href === "/followup" && semResposta > 0 ? (
            <span
              className="etiqueta"
              style={{ marginLeft: "auto", background: "#EF4444", color: "#fff" }}
              title="Falaram e ninguém respondeu"
            >
              {semResposta}
            </span>
          ) : null}
          {m.href === "/agentes" && pendentes > 0 ? (
            <span
              className="etiqueta"
              style={{ marginLeft: "auto", background: "#fff", color: "var(--marinho)" }}
            >
              {pendentes}
            </span>
          ) : null}
        </NavLink>
      ))}
    </>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/login");

  // nome no topo: o da tela de Configurações vence; senão o do negocio.json
  const negocio =
    (await db.setting.findUnique({ where: { key: "negocio_nome" } }))?.value || negocioDoArquivo().nome;
  const pendentes = await db.agentAction.count({ where: { status: "proposta" } });
  // O selo nunca derruba a navegação: se a contagem falhar, some o selo, não a página.
  const semResposta = await contarSemResposta().catch(() => 0);

  return (
    <div style={{ display: "flex", minHeight: "100dvh" }}>
      <aside
        className="nav-lateral"
        style={{
          width: 216,
          flexShrink: 0,
          padding: "24px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          position: "sticky",
          top: 0,
          height: "100dvh",
        }}
      >
        <div style={{ padding: "0 10px 18px" }}>
          <div className="nav-marca">{negocio}</div>
          <div style={{ fontSize: 10, letterSpacing: 2.4, color: "rgba(255,255,255,.55)", fontWeight: 700, marginTop: 2 }}>
            O CÉREBRO
          </div>
        </div>

        <MenuLinks pendentes={pendentes} semResposta={semResposta} />

        <form method="post" action="/api/logout" style={{ marginTop: "auto" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", padding: "0 10px 8px" }}>
            {sessao.name}
          </div>
          <button className="btn btn-sec" style={{ width: "100%" }} type="submit">
            Sair
          </button>
        </form>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Barra de topo do celular. A lateral de 216px comia 58% de uma tela
            de 375px e espremia o conteúdo numa coluna ilegível — era isso que
            fazia o link do aviso de lead abrir uma tela cortada. */}
        <header className="topo-mobile">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.6)", fontWeight: 700 }}>
              O CÉREBRO
            </span>
            <strong style={{ fontSize: 15 }}>{negocio}</strong>
          </div>
          <details className="menu-gaveta">
            <summary aria-label="Abrir menu">☰ Menu</summary>
            <nav>
              <MenuLinks pendentes={pendentes} semResposta={semResposta} compacto />
              <form method="post" action="/api/logout" style={{ marginTop: 10 }}>
                <button className="btn btn-sec" style={{ width: "100%" }} type="submit">
                  Sair
                </button>
              </form>
            </nav>
          </details>
        </header>

        <main className="app-main" style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
