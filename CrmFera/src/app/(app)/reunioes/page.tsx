import Link from "next/link";
import { db } from "@/lib/db";
import { classificarReunioes, type Reuniao } from "@/lib/reunioes";
import { registrarReuniao, qualificarReuniao } from "../contatos/acoes";

export const dynamic = "force-dynamic";

const FUSO = "America/Sao_Paulo";

function dataHora(d: Date): string {
  return d.toLocaleString("pt-BR", {
    timeZone: FUSO,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Alternar({ id, campo, opcoes }: { id: string; campo: string; opcoes: { valor: string; rotulo: string; ativo: boolean }[] }) {
  return (
    <form action={qualificarReuniao} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="campo" value={campo} />
      {opcoes.map((o) => (
        <button
          key={o.valor}
          className={o.ativo ? "btn" : "btn btn-sec"}
          type="submit"
          name="valor"
          value={o.valor}
          style={{ padding: "5px 10px", fontSize: 12 }}
        >
          {o.rotulo}
        </button>
      ))}
    </form>
  );
}

function Cartao({ r, acoes }: { r: Reuniao; acoes: boolean }) {
  return (
    <div className="card" style={{ padding: 12, display: "grid", gap: 6 }}>
      <Link href={`/contatos/${r.id}`} style={{ fontWeight: 600, fontSize: 14 }}>
        {r.nome}
      </Link>
      <div style={{ fontSize: 13 }}>{dataHora(r.quando)}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span className="etiqueta" title="Página em que a pessoa reservou o horário">
          📄 {r.pagina}
        </span>
        {r.canal ? (
          <span className="etiqueta" title="Campanha / meio do link (UTM)">
            {r.canal}
          </span>
        ) : null}
        {r.semResultado ? (
          <span className="etiqueta" style={{ color: "#b45309" }}>
            passou — marcar resultado
          </span>
        ) : null}
        {r.link ? (
          <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--acento)" }}>
            link da reunião
          </a>
        ) : null}
      </div>
      <Alternar
        id={r.id}
        campo="temperatura"
        opcoes={[
          { valor: r.temperatura === "quente" ? "limpar" : "quente", rotulo: "🔥 Quente", ativo: r.temperatura === "quente" },
          { valor: r.temperatura === "frio" ? "limpar" : "frio", rotulo: "🧊 Frio", ativo: r.temperatura === "frio" },
        ]}
      />
      <Alternar
        id={r.id}
        campo="proposta"
        opcoes={[
          { valor: "sim", rotulo: "Recebeu proposta", ativo: r.propostaRecebida },
          { valor: "nao", rotulo: "Sem proposta", ativo: !r.propostaRecebida },
        ]}
      />
      {acoes ? (
        <form action={registrarReuniao} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input type="hidden" name="id" value={r.id} />
          <button className="btn" type="submit" name="resultado" value="compareceu" style={{ padding: "6px 10px", fontSize: 12 }}>
            Compareceu
          </button>
          <button className="btn btn-sec" type="submit" name="resultado" value="no_show" style={{ padding: "6px 10px", fontSize: 12 }}>
            Não compareceu
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Coluna({ titulo, itens, acoes, vazio }: { titulo: string; itens: Reuniao[]; acoes: boolean; vazio: string }) {
  return (
    <section style={{ display: "grid", gap: 10, alignContent: "start" }}>
      <h2 style={{ fontSize: 15, fontWeight: 700 }}>
        {titulo} <span style={{ color: "var(--texto-fraco)", fontWeight: 400 }}>· {itens.length}</span>
      </h2>
      {itens.length === 0 ? (
        <p style={{ color: "var(--texto-fraco)", fontSize: 13 }}>{vazio}</p>
      ) : (
        itens.map((r) => <Cartao key={r.id} r={r} acoes={acoes && r.semResultado} />)
      )}
    </section>
  );
}

export default async function Reunioes() {
  // customFields é JSON em texto no SQLite: o filtro por dentro dele é por LIKE.
  const ids = await db.$queryRaw<{ id: string }[]>`SELECT id FROM Contact WHERE customFields LIKE '%"evento_data"%'`;
  const contatos = await db.contact.findMany({
    where: { id: { in: ids.map((i) => i.id) } },
    select: {
      id: true,
      name: true,
      phone: true,
      origem: true,
      customFields: true,
      tags: true,
      timelineEvents: { where: { eventType: "call" }, select: { metadata: true, timestamp: true } },
    },
  });

  const r = classificarReunioes(
    contatos.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      origem: c.origem,
      customFields: c.customFields,
      tags: c.tags,
      eventos: c.timelineEvents.flatMap((e) => {
        const res = (e.metadata as Record<string, unknown> | null)?.resultado;
        return typeof res === "string" ? [{ resultado: res, timestamp: e.timestamp }] : [];
      }),
    })),
  );

  const total = r.aRealizar.length + r.realizadas.length + r.noShow.length;
  const decididas = r.realizadas.length + r.noShow.length;
  const taxa = decididas ? Math.round((r.realizadas.length / decididas) * 100) : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Reuniões</h1>
        <span style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
          {total} marcadas em todos os funis{taxa !== null ? ` · comparecimento ${taxa}%` : ""}
        </span>
      </div>
      <p style={{ color: "var(--texto-fraco)", fontSize: 13, marginBottom: 18 }}>
        Horário de Brasília. Reunião que já passou e ainda não tem resultado fica em &quot;A realizar&quot; com os botões pra marcar.
      </p>
      <div className="leads-kanban" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <Coluna titulo="A realizar" itens={r.aRealizar} acoes vazio="Nenhuma reunião pela frente." />
        <Coluna titulo="Realizadas" itens={r.realizadas} acoes={false} vazio="Ninguém marcado como compareceu ainda." />
        <Coluna titulo="No show" itens={r.noShow} acoes={false} vazio="Nenhum no show registrado." />
      </div>
    </div>
  );
}
