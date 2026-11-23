import { lerBriefing, MINIMO_RESPOSTA, PERGUNTAS_BRIEFING, respondidas } from "@/lib/briefing-cliente";
import BotaoCopiar from "../jornada/BotaoCopiar";
import { salvarBriefingAcao } from "./acoes";

export const dynamic = "force-dynamic";

const PROMPT_DEPOIS =
  "/fera Respondi o briefing do meu negócio no painel. Puxe do painel (python ScriptsFera/painel.py puxar), leia o briefing e o meu plano, e monte a minha primeira página de captura no padrão: dois caminhos (reunião de 20 minutos e conversa no WhatsApp), formulário curto, lead salvo no painel e evento Lead para a Meta. Me mostre o texto antes de montar. Depois, faça 3 posts que convidam para essa página.";

/** O briefing do negócio, com as palavras do dono. Base da primeira página e dos primeiros posts. */
export default async function Briefing({ searchParams }: { searchParams: Promise<{ salvo?: string }> }) {
  const sp = await searchParams;
  const briefing = await lerBriefing();
  const feitas = respondidas(briefing);

  return (
    <div style={{ maxWidth: 680, display: "grid", gap: 16 }}>
      <div>
        <div className="sobretitulo">Briefing do negócio</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "4px 0 6px" }}>Conte o seu negócio com as suas palavras</h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
          Escreva como você falaria para uma amiga. Não precisa ficar bonito: o FERABOT transforma isso na sua primeira
          página de captura e nos posts que convidam para ela. Pode salvar e voltar depois. {feitas} de{" "}
          {PERGUNTAS_BRIEFING.length} respondidas.
        </p>
      </div>

      {sp.salvo ? (
        <p role="status" style={{ margin: 0, padding: "10px 12px", borderRadius: 10, background: "#e8f6ec", color: "#14532d", fontSize: 14 }}>
          Briefing salvo.
        </p>
      ) : null}

      <form action={salvarBriefingAcao} className="card" style={{ padding: 18, display: "grid", gap: 16 }}>
        {PERGUNTAS_BRIEFING.map((p, i) => (
          <label key={p.id} style={{ display: "block" }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              {i + 1}. {p.titulo}
            </span>
            <span style={{ display: "block", fontSize: 13, color: "var(--texto-fraco)", margin: "2px 0 6px" }}>{p.ajuda}</span>
            <textarea
              name={p.id}
              defaultValue={briefing[p.id] ?? ""}
              rows={4}
              minLength={0}
              placeholder={`Pelo menos ${MINIMO_RESPOSTA} caracteres`}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </label>
        ))}
        <button className="btn" type="submit">
          Salvar o briefing
        </button>
      </form>

      {feitas === PERGUNTAS_BRIEFING.length ? (
        <section className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 6px" }}>Próximo passo: a sua primeira página e os posts</h2>
          <p style={{ fontSize: 14, margin: "0 0 8px" }}>Copie e cole no Claude Code, na pasta do FERABOT (modelo Sonnet):</p>
          <code style={{ display: "block", padding: "10px 12px", borderRadius: 10, background: "var(--azul-claro)", fontSize: 13, overflowWrap: "anywhere" }}>
            {PROMPT_DEPOIS}
          </code>
          <div style={{ marginTop: 8 }}>
            <BotaoCopiar texto={PROMPT_DEPOIS} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
