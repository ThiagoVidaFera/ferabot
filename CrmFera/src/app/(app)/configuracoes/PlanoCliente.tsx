import type { PlanoCliente as Plano, RoteiroYoutube } from "@/lib/plano-cliente";
import { temConteudo } from "@/lib/plano-cliente";
import { chaveDoPost, type ProgressoRoteiro, type ProgressoRoteiros } from "@/lib/plano-cliente-banco";
import BotaoCopiar from "../jornada/BotaoCopiar";
import { h2 } from "./campos";
import { aprovarPlanoAcao, marcarPostAcao, marcarRoteiroAcao } from "./acoes-cliente";

const PROMPT_PLANO = "/fera vamos refinar a minha narrativa e o meu mecanismo único";

const bloco = { fontSize: 14, lineHeight: 1.5, margin: "0 0 12px", whiteSpace: "pre-wrap" as const, overflowWrap: "anywhere" as const };
const rotulo = { fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" as const, color: "var(--texto-fraco)", margin: "14px 0 6px" };
const item = { borderTop: "1px solid var(--linha, #e5e7eb)", padding: "10px 0" };
const VERDE = "#16a34a";
const NOME_REDE: Record<string, string> = { instagram: "Instagram", youtube: "YouTube", site: "Site", whatsapp: "WhatsApp", tiktok: "TikTok" };

function dataCurta(iso?: string): string {
  return iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
}

function selo(lote?: string): string {
  if (!lote) return "";
  const [ano, mes] = lote.split("-");
  return ` · lote ${mes}/${ano}`;
}

function Copiavel({ titulo, texto, extra }: { titulo: string; texto: string; extra?: string }) {
  return (
    <details style={item}>
      <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
        {titulo}
        {extra ? <span style={{ fontWeight: 400, color: "var(--texto-fraco)" }}> · {extra}</span> : null}
      </summary>
      <p style={{ ...bloco, marginTop: 10 }}>{texto}</p>
      <BotaoCopiar texto={texto} />
    </details>
  );
}

function EstadoRoteiro({ p }: { p?: ProgressoRoteiro }) {
  if (p?.publicado) return <span style={{ color: VERDE, fontWeight: 600 }}> · publicado {dataCurta(p.publicado)}</span>;
  if (p?.gravado) return <span style={{ color: "var(--acento)", fontWeight: 600 }}> · gravado {dataCurta(p.gravado)}</span>;
  return null;
}

function Roteiro({ r, numero, progresso }: { r: RoteiroYoutube; numero: number; progresso?: ProgressoRoteiro }) {
  const texto = r.gancho ? `Gancho: ${r.gancho}\n\n${r.roteiro}` : r.roteiro;
  return (
    <details style={item}>
      <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
        {numero}. {r.titulo}
        <span style={{ fontWeight: 400, color: "var(--texto-fraco)" }}>{selo(r.lote)}</span>
        <EstadoRoteiro p={progresso} />
      </summary>
      <p style={{ ...bloco, marginTop: 10 }}>{texto}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <BotaoCopiar texto={texto} />
        {!progresso?.gravado ? (
          <form action={marcarRoteiroAcao}>
            <input type="hidden" name="titulo" value={r.titulo} />
            <input type="hidden" name="etapa" value="gravado" />
            <button className="btn btn-sec" type="submit" style={{ padding: "8px 14px", fontSize: 13 }}>
              Gravei
            </button>
          </form>
        ) : null}
      </div>
      {!progresso?.publicado ? (
        <form action={marcarRoteiroAcao} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <input type="hidden" name="titulo" value={r.titulo} />
          <input type="hidden" name="etapa" value="publicado" />
          <input
            name="link"
            inputMode="url"
            placeholder="Link do vídeo no YouTube (opcional)"
            style={{ flex: "1 1 200px", minWidth: 0 }}
          />
          <button className="btn" type="submit" style={{ padding: "8px 14px", fontSize: 13 }}>
            Publiquei
          </button>
        </form>
      ) : null}
    </details>
  );
}

function Aprovacao({ aprovadoEm }: { aprovadoEm?: string }) {
  if (aprovadoEm) {
    return (
      <p style={{ fontSize: 13, color: VERDE, fontWeight: 600, margin: "12px 0 0" }}>
        Você aprovou em {dataCurta(aprovadoEm)}.
      </p>
    );
  }
  return (
    <form action={aprovarPlanoAcao} style={{ marginTop: 14 }}>
      <p style={{ fontSize: 13, color: "var(--texto-fraco)", margin: "0 0 8px" }}>
        Leu e é isso mesmo? Aprove para fechar o passo da narrativa. Quer mudar algo? Peça ao FERABOT antes.
      </p>
      <button className="btn" type="submit">
        Aprovei a minha narrativa
      </button>
    </form>
  );
}

/** O plano do cliente, no topo do perfil: o que ele repete, grava e posta. */
export default function PlanoCliente({ plano, progresso }: { plano: Plano; progresso: ProgressoRoteiros }) {
  if (!temConteudo(plano)) {
    return (
      <section id="plano" className="card" style={{ padding: 18 }}>
        <h2 style={h2}>Seu plano</h2>
        <p style={{ fontSize: 14, margin: "0 0 8px" }}>
          Sua big idea, seu mecanismo, as headlines, os roteiros do YouTube e as ideias de post aparecem aqui. Para montar
          com o FERABOT, cole no Claude Code:
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <code style={{ flex: "1 1 240px", padding: "10px 12px", borderRadius: 10, background: "var(--azul-claro)" }}>
            {PROMPT_PLANO}
          </code>
          <BotaoCopiar texto={PROMPT_PLANO} />
        </div>
      </section>
    );
  }

  const temNarrativa = Boolean(plano.bigIdea || plano.mecanismo.nome);
  const publicados = plano.roteirosYoutube.filter((r) => progresso[r.titulo]?.publicado).length;

  return (
    <>
      <section id="plano" className="card" style={{ padding: 18 }}>
        <h2 style={h2}>Seu plano</h2>
        {plano.bigIdea ? (
          <>
            <div style={rotulo}>Big idea</div>
            <p style={{ ...bloco, fontSize: 16, fontWeight: 600 }}>{plano.bigIdea}</p>
          </>
        ) : null}
        {plano.mecanismo.nome ? (
          <>
            <div style={rotulo}>Mecanismo único</div>
            <p style={{ ...bloco, fontWeight: 600, marginBottom: 4 }}>{plano.mecanismo.nome}</p>
            {plano.mecanismo.explicacao ? <p style={bloco}>{plano.mecanismo.explicacao}</p> : null}
          </>
        ) : null}
        {plano.headlines.length ? (
          <>
            <div style={rotulo}>Headlines para repetir</div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.5 }}>
              {plano.headlines.map((h) => (
                <li key={h} style={{ marginBottom: 6, overflowWrap: "anywhere" }}>
                  {h}
                </li>
              ))}
            </ol>
          </>
        ) : null}
        {plano.redes && Object.keys(plano.redes).length ? (
          <>
            <div style={rotulo}>Suas redes</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
              {Object.entries(plano.redes).map(([rede, valor]) => (
                <li key={rede} style={{ overflowWrap: "anywhere" }}>
                  {NOME_REDE[rede] ?? rede}: {valor}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {temNarrativa ? <Aprovacao aprovadoEm={plano.aprovadoEm} /> : null}
        {plano.atualizadoEm ? (
          <p style={{ fontSize: 12, color: "var(--texto-fraco)", margin: "12px 0 0" }}>
            Atualizado em {dataCurta(plano.atualizadoEm)}. Quer mudar? Peça ao FERABOT: <em>{PROMPT_PLANO}</em>
          </p>
        ) : null}
      </section>

      {plano.roteirosYoutube.length ? (
        <section id="youtube" className="card" style={{ padding: 18 }}>
          <h2 style={h2}>Roteiros do YouTube</h2>
          <p style={{ fontSize: 13, color: "var(--texto-fraco)", margin: "0 0 6px" }}>
            {publicados} de {plano.roteirosYoutube.length} publicados. Grave na ordem e marque aqui: eu acompanho do meu
            lado.
          </p>
          {plano.roteirosYoutube.map((r, i) => (
            <Roteiro key={`${i}-${r.titulo}`} r={r} numero={i + 1} progresso={progresso[r.titulo]} />
          ))}
        </section>
      ) : null}

      {plano.postsInstagram.length ? (
        <section id="posts" className="card" style={{ padding: 18 }}>
          <h2 style={h2}>Posts para o Instagram</h2>
          <p style={{ fontSize: 13, color: "var(--texto-fraco)", margin: "0 0 6px" }}>
            Toque no título, aperte Copiar, cole no Instagram e publique. Depois volte aqui e aperte Publiquei.
          </p>
          {plano.postsInstagram.map((p, i) => {
            const publicado = progresso[chaveDoPost(p.titulo)]?.publicado;
            return (
              <div key={`${i}-${p.titulo}`}>
                <Copiavel
                  titulo={p.titulo}
                  extra={`${p.formato}${selo(p.lote)}${publicado ? ` · publicado ${dataCurta(publicado)}` : ""}`}
                  texto={p.texto}
                />
                {!publicado ? (
                  <form action={marcarPostAcao} style={{ margin: "-4px 0 8px" }}>
                    <input type="hidden" name="titulo" value={p.titulo} />
                    <button className="btn btn-sec" type="submit" style={{ padding: "6px 12px", fontSize: 12 }}>
                      Publiquei este post
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : null}
    </>
  );
}
