import {
  COR_TIPO,
  ROTULO_TIPO,
  agruparPorDia,
  diaBrasilia,
  gradeDoMes,
  horaBrasilia,
  listarContasPfm,
  mesAtualBrasilia,
  mesValido,
  mesVizinho,
  nomeDoMes,
  postsAgendados,
  temChavePostForMe,
  type ContaPfm,
  type PostAgendado,
} from "@/lib/calendario-posts";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DIAS_SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const PLATAFORMA: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", youtube: "YouTube" };

type Busca = { conta?: string; mes?: string; atualizar?: string; salvo?: string; erro?: string };

export default async function Calendario({ searchParams }: { searchParams: Promise<Busca> }) {
  const sp = await searchParams;
  const temChave = await temChavePostForMe();
  const contas = temChave ? await listarContasPfm(sp.atualizar === "1") : { dados: [], erro: null };
  const conta =
    contas.dados.find((c) => c.id === sp.conta) ??
    contas.dados.find((c) => c.plataforma === "instagram") ??
    contas.dados[0];
  const mes = mesValido(sp.mes) ? sp.mes : mesAtualBrasilia();
  const posts = conta ? await postsAgendados(conta, sp.atualizar === "1") : { dados: [], erro: null };
  const porDia = agruparPorDia(posts.dados);
  const doMes = [...porDia.entries()].filter(([d]) => d.startsWith(mes));
  const hoje = diaBrasilia(new Date().toISOString());
  const link = (extra: Partial<Busca>) => {
    const q = new URLSearchParams();
    const c = extra.conta ?? conta?.id;
    const m = extra.mes ?? mes;
    if (c) q.set("conta", c);
    if (m) q.set("mes", m);
    if (extra.atualizar) q.set("atualizar", extra.atualizar);
    return `/calendario?${q}`;
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Calendário de posts</h1>
        <span style={{ fontSize: 12, color: "var(--texto-fraco)" }}>
          {conta ? `${posts.dados.length} agendados em ${conta.nome}` : "agendados no Post for Me"}
        </span>
        {conta ? (
          <a href={link({ atualizar: "1" })} className="btn btn-sec" style={{ marginLeft: "auto", fontSize: 12 }}>
            Atualizar agora
          </a>
        ) : null}
      </div>
      <p style={{ color: "var(--texto-fraco)", fontSize: 13, marginBottom: 14 }}>
        Escolha o perfil e veja em que dias já tem post marcado. A fonte é o agendador (Post for Me), não os registros das pastas.
      </p>

      {sp.salvo ? <Aviso texto="Chave gravada." /> : null}
      {sp.erro === "chave" ? <Aviso alerta texto="Chave inválida." /> : null}
      {!temChave ? <FormChave /> : null}
      {contas.erro ? <Aviso alerta texto={`Contas: ${contas.erro}`} /> : null}
      {posts.erro ? <Aviso alerta texto={`Posts de ${conta?.nome}: ${posts.erro}`} /> : null}

      {contas.dados.length ? <Perfis contas={contas.dados} atual={conta?.id ?? ""} mes={mes} /> : null}

      {conta ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 10px", flexWrap: "wrap" }}>
            <a className="btn btn-sec" href={link({ mes: mesVizinho(mes, -1) })} aria-label="mês anterior">
              ‹
            </a>
            <h2 style={{ fontSize: 17, fontWeight: 700, textTransform: "capitalize", minWidth: 190, textAlign: "center" }}>{nomeDoMes(mes)}</h2>
            <a className="btn btn-sec" href={link({ mes: mesVizinho(mes, 1) })} aria-label="mês seguinte">
              ›
            </a>
            {mes !== mesAtualBrasilia() ? (
              <a href={link({ mes: mesAtualBrasilia() })} style={{ fontSize: 12 }}>
                hoje
              </a>
            ) : null}
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--texto-fraco)" }}>
              {doMes.reduce((s, [, l]) => s + l.length, 0)} posts em {doMes.length} dias neste mês
            </span>
          </div>

          <Grade mes={mes} porDia={porDia} hoje={hoje} />

          <Legenda />

          <section style={{ marginTop: 18 }}>
            {doMes.length ? (
              doMes.map(([dia, lista]) => <Dia key={dia} dia={dia} posts={lista} hoje={hoje} />)
            ) : (
              <p style={{ fontSize: 13, color: "var(--texto-fraco)" }}>Nenhum post agendado para {conta.nome} neste mês.</p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function Perfis({ contas, atual, mes }: { contas: ContaPfm[]; atual: string; mes: string }) {
  const plataformas = [...new Set(contas.map((c) => c.plataforma))];
  return (
    <div className="card" style={{ padding: 12 }}>
      {plataformas.map((p) => (
        <div key={p} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "var(--texto-fraco)", minWidth: 70 }}>{PLATAFORMA[p] ?? p}</span>
          {contas
            .filter((c) => c.plataforma === p)
            .map((c) => (
              <a key={c.id} className="pilula" aria-pressed={c.id === atual} href={`/calendario?conta=${c.id}&mes=${mes}`} title={c.id}>
                {c.nome}
                {c.status && c.status !== "connected" ? " ⚠" : ""}
              </a>
            ))}
        </div>
      ))}
    </div>
  );
}

function Grade({ mes, porDia, hoje }: { mes: string; porDia: Map<string, PostAgendado[]>; hoje: string }) {
  return (
    <div className="card" style={{ padding: 10, overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(44px, 1fr))", gap: 4, minWidth: 330 }}>
        {DIAS_SEMANA.map((d) => (
          <div key={d} style={{ fontSize: 11, color: "var(--texto-fraco)", textAlign: "center", padding: 2 }}>
            {d}
          </div>
        ))}
        {gradeDoMes(mes)
          .flat()
          .map((cel, i) => {
            const lista = cel.dia ? porDia.get(cel.dia) ?? [] : [];
            const ehHoje = cel.dia === hoje;
            const passado = cel.dia !== null && cel.dia < hoje;
            return (
              <a
                key={cel.dia ?? `v${i}`}
                href={cel.dia && lista.length ? `#d-${cel.dia}` : undefined}
                style={{
                  minHeight: 56,
                  border: `1px solid ${ehHoje ? "var(--marinho)" : "var(--linha)"}`,
                  borderRadius: 6,
                  padding: 4,
                  background: cel.dia ? (lista.length ? "#2563EB0F" : "transparent") : "transparent",
                  opacity: passado && !lista.length ? 0.45 : 1,
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: ehHoje ? 700 : 500 }}>{cel.numero ?? ""}</span>
                {lista.length ? <Pontos posts={lista} /> : null}
              </a>
            );
          })}
      </div>
    </div>
  );
}

/** Um ponto por post, na cor do tipo; muitos posts viram contagem. */
function Pontos({ posts }: { posts: PostAgendado[] }) {
  const porTipo = new Map<PostAgendado["tipo"], number>();
  for (const p of posts) porTipo.set(p.tipo, (porTipo.get(p.tipo) ?? 0) + 1);
  return (
    <span style={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
      {[...porTipo.entries()].map(([tipo, n]) => (
        <span
          key={tipo}
          title={`${n} ${ROTULO_TIPO[tipo]}`}
          style={{
            fontSize: 10,
            lineHeight: "14px",
            minWidth: 14,
            padding: "0 4px",
            borderRadius: 7,
            background: COR_TIPO[tipo],
            color: "#fff",
            textAlign: "center",
            fontWeight: 700,
          }}
        >
          {n}
        </span>
      ))}
    </span>
  );
}

function Legenda() {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, color: "var(--texto-fraco)", marginTop: 8 }}>
      {(Object.keys(ROTULO_TIPO) as PostAgendado["tipo"][])
        .filter((t) => t !== "outro")
        .map((t) => (
          <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: COR_TIPO[t], display: "inline-block" }} /> {ROTULO_TIPO[t]}
          </span>
        ))}
    </div>
  );
}

function Dia({ dia, posts, hoje }: { dia: string; posts: PostAgendado[]; hoje: string }) {
  const rotulo = new Date(`${dia}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" });
  return (
    <div id={`d-${dia}`} className="card" style={{ padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, textTransform: "capitalize" }}>
        {rotulo}
        {dia === hoje ? <span className="etiqueta" style={{ marginLeft: 8 }}>hoje</span> : null}
      </div>
      {posts.map((p) => (
        <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", borderTop: "1px solid var(--linha)" }}>
          {p.midia && p.midiaTipo === "imagem" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.midia} alt="" width={44} height={44} style={{ objectFit: "cover", borderRadius: 4, flex: "0 0 44px" }} loading="lazy" />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 4, background: "var(--linha)", flex: "0 0 44px", fontSize: 10, display: "grid", placeItems: "center" }}>
              {p.midiaTipo === "video" ? "vídeo" : "—"}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13 }}>
              <strong>{horaBrasilia(p.quando)}</strong>{" "}
              <span className="etiqueta" style={{ background: COR_TIPO[p.tipo], color: "#fff" }}>
                {ROTULO_TIPO[p.tipo]}
              </span>
              {p.qtdMidia > 1 ? <span style={{ fontSize: 11, color: "var(--texto-fraco)" }}> · {p.qtdMidia} mídias</span> : null}
            </div>
            <div style={{ fontSize: 12, color: "var(--texto-fraco)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70vw" }}>
              {p.legenda || <em>sem legenda</em>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FormChave() {
  return (
    <div className="card" style={{ padding: 14, marginBottom: 14, fontSize: 14, lineHeight: 1.55 }}>
      <strong>O calendário mostra os posts que o FERABOT agendou para você.</strong> Para isso ele usa o Post for Me
      (serviço barato que publica no dia e hora marcados). Crie a conta em postforme.dev, conecte o seu Instagram e cole
      a chave na tela Chaves.{" "}
      <Link href="/chaves" style={{ color: "var(--acento)", fontWeight: 600 }}>
        Abrir Chaves
      </Link>
      <div style={{ marginTop: 8, fontSize: 13, color: "var(--texto-fraco)" }}>
        Depois, no Claude Code: <em>/fera agenda os posts da semana do meu plano</em>. Eles aparecem aqui.
      </div>
    </div>
  );
}

function Aviso({ texto, alerta }: { texto: string; alerta?: boolean }) {
  return (
    <div className="card" style={{ padding: 12, marginBottom: 14, fontSize: 13, borderColor: alerta ? "#F59E0B55" : "#10B98155" }}>
      {texto}
    </div>
  );
}
