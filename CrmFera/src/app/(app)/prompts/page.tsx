import Link from "next/link";
import BotaoCopiar from "../jornada/BotaoCopiar";
import {
  AVISO_TELAS_MUDAM,
  COMO_ABRIR,
  EXEMPLO_BOM,
  EXEMPLO_RUIM,
  MODELO_DE_PROMPT,
  PROMPT_ESPIAR_CONCORRENTE,
  REGRAS,
  SECOES,
  SOCORRO,
  TUTORIAIS,
  totalDePrompts,
  type ItemDePrompt,
} from "@/lib/promptbook";

const ESTILO_SUMARIO = { cursor: "pointer", fontWeight: 700, fontSize: 16, listStylePosition: "inside" } as const;

function CaixaCopiavel({ texto }: { texto: string }) {
  return (
    <div style={{ marginTop: 8 }}>
      <pre
        style={{
          margin: "0 0 8px",
          padding: "10px 12px",
          borderRadius: 10,
          background: "var(--azul-claro)",
          fontSize: 13,
          lineHeight: 1.5,
          fontFamily: "inherit",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {texto}
      </pre>
      <BotaoCopiar texto={texto} />
    </div>
  );
}

function Prompt({ item }: { item: ItemDePrompt }) {
  return (
    <div style={{ borderTop: "1px solid var(--linha)", paddingTop: 12, marginTop: 12 }}>
      <h3 style={{ fontSize: 15, margin: "0 0 2px" }}>{item.titulo}</h3>
      <p style={{ fontSize: 13, color: "var(--texto-fraco)", margin: 0 }}>{item.para}</p>
      <CaixaCopiavel texto={item.prompt} />
    </div>
  );
}

function ComoPedir() {
  return (
    <section className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 17, margin: "0 0 10px" }}>1. Como pedir ao FERABOT</h2>
      <p style={{ fontSize: 14, lineHeight: 1.55, margin: "0 0 10px" }}>{COMO_ABRIR}</p>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
        {REGRAS.map((r) => (
          <li key={r.titulo} style={{ marginBottom: 4 }}>
            <strong>{r.titulo}.</strong> {r.texto}
          </li>
        ))}
      </ul>
      <h3 style={{ fontSize: 15, margin: "16px 0 6px" }}>O modelo de um bom prompt</h3>
      <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
        {MODELO_DE_PROMPT.map((m) => (
          <li key={m.parte}>
            <strong>{m.parte}:</strong> {m.pergunta}
          </li>
        ))}
      </ol>
      <p style={{ fontSize: 13, margin: "12px 0 4px", color: "var(--texto-fraco)" }}>Ruim (ele vai ter que adivinhar):</p>
      <p style={{ fontSize: 14, margin: 0, padding: "8px 12px", borderRadius: 10, border: "1px solid var(--linha)" }}>
        {EXEMPLO_RUIM}
      </p>
      <p style={{ fontSize: 13, margin: "12px 0 0", color: "var(--texto-fraco)" }}>Bom (as quatro partes estão lá):</p>
      <CaixaCopiavel texto={EXEMPLO_BOM} />
    </section>
  );
}

/** Guia de prompts: o promptbook do FERABOT dentro do painel, para o dono usar sozinho. */
export default function GuiaDePrompts() {
  return (
    <div style={{ maxWidth: 680, display: "grid", gap: 16 }}>
      <div>
        <div className="sobretitulo">Guia de prompts</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "4px 0 6px" }}>Tudo o que dá para pedir ao FERABOT</h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
          São {totalDePrompts()} prompts prontos. Escolha pelo objetivo, aperte Copiar, troque o que está entre colchetes e
          cole no Claude Code.
        </p>
      </div>

      <ComoPedir />

      <section className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>2. Prompts por objetivo</h2>
        <p style={{ fontSize: 13, color: "var(--texto-fraco)", margin: "0 0 4px" }}>Toque num grupo para abrir.</p>
        {SECOES.map((s) => (
          <details key={s.id} id={s.id} style={{ borderTop: "1px solid var(--linha)", padding: "12px 0" }}>
            <summary style={ESTILO_SUMARIO}>
              {s.titulo} <span style={{ fontWeight: 400, fontSize: 13, color: "var(--texto-fraco)" }}>({s.itens.length})</span>
            </summary>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: "8px 0 0" }}>{s.resumo}</p>
            {s.itens.map((item) => (
              <Prompt key={item.titulo} item={item} />
            ))}
          </details>
        ))}
      </section>

      <section className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>3. Travou? Cole um destes</h2>
        <p style={{ fontSize: 14, margin: 0 }}>
          Nada aqui quebra o seu computador. Se preferir, descreva com as suas palavras: o Claude entende.
        </p>
        {SOCORRO.map((item) => (
          <Prompt key={item.titulo} item={item} />
        ))}
      </section>

      <section className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>4. Como pegar cada chave</h2>
        <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>
          Chave é como uma senha: vai só na tela{" "}
          <Link href="/chaves" style={{ color: "var(--acento)", fontWeight: 600 }}>
            Chaves
          </Link>{" "}
          do painel, nunca no chat, no WhatsApp ou no e-mail. Faça uma de cada vez.
        </p>
        {TUTORIAIS.map((t) => (
          <details key={t.id} id={`chave-${t.id}`} style={{ borderTop: "1px solid var(--linha)", padding: "12px 0", marginTop: 12 }}>
            <summary style={ESTILO_SUMARIO}>
              {t.titulo} <span style={{ fontWeight: 400, fontSize: 13, color: "var(--texto-fraco)" }}>{t.tempo}</span>
            </summary>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: "8px 0 0" }}>{t.para}</p>
            <ol style={{ margin: "8px 0 0", paddingLeft: 22, fontSize: 14, lineHeight: 1.6 }}>
              {t.passos.map((p) => (
                <li key={p} style={{ marginBottom: 4 }}>
                  {p}
                </li>
              ))}
            </ol>
            {t.envs.length ? (
              <Link
                href="/chaves"
                className="btn"
                style={{ marginTop: 10, display: "inline-block", textDecoration: "none", padding: "8px 14px", fontSize: 13 }}
              >
                Abrir Chaves
              </Link>
            ) : null}
            {t.id === "scrapecreators" ? (
              <>
                <p style={{ fontSize: 13, color: "var(--texto-fraco)", margin: "12px 0 0" }}>
                  Com a chave testada, peça para espiar um concorrente:
                </p>
                <CaixaCopiavel texto={PROMPT_ESPIAR_CONCORRENTE} />
              </>
            ) : null}
          </details>
        ))}
        <p style={{ fontSize: 13, color: "var(--texto-fraco)", margin: "12px 0 0" }}>{AVISO_TELAS_MUDAM}</p>
      </section>
    </div>
  );
}
