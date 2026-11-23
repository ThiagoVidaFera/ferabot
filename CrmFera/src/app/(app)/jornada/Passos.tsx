import Link from "next/link";
import { NOME_DA_TRILHA, type Jornada, type PassoJornada } from "@/lib/jornada";
import BotaoCopiar from "./BotaoCopiar";

const VERDE = "#16a34a";

export function BarraDeProgresso({ jornada }: { jornada: Jornada }) {
  const porcento = Math.round((jornada.feitos / jornada.total) * 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={jornada.total}
      aria-valuenow={jornada.feitos}
      aria-label="Andamento da Jornada"
      style={{ height: 8, borderRadius: 999, background: "var(--linha)", overflow: "hidden" }}
    >
      <div style={{ width: `${porcento}%`, height: "100%", background: VERDE }} />
    </div>
  );
}

export function CaixaDePrompt({ prompt }: { prompt: string }) {
  const [primeira, ...resto] = prompt.split("\n");
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, color: "var(--texto-fraco)", marginBottom: 6 }}>
        Copie o prompt inteiro e cole no Claude Code, dentro da pasta do FERABOT. Ele te guia clique a clique.
      </div>
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          background: "var(--azul-claro)",
          fontSize: 13,
          overflowWrap: "anywhere",
        }}
      >
        <div style={{ fontWeight: 600 }}>{primeira}</div>
        {resto.length ? (
          <details style={{ marginTop: 6 }}>
            <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--acento)", fontWeight: 600 }}>
              Ver o prompt inteiro
            </summary>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: "8px 0 0", fontSize: 13, lineHeight: 1.5 }}>
              {resto.join("\n").trim()}
            </pre>
          </details>
        ) : null}
      </div>
      <div style={{ marginTop: 8 }}>
        <BotaoCopiar texto={prompt} />
      </div>
    </div>
  );
}

function Marcador({ passo }: { passo: PassoJornada }) {
  const fundo = passo.feito ? VERDE : passo.atual ? "var(--acento)" : "var(--linha)";
  const cor = passo.feito || passo.atual ? "#fff" : "var(--texto-fraco)";
  return (
    <span
      aria-hidden
      style={{
        width: 30,
        height: 30,
        borderRadius: 999,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 14,
        background: fundo,
        color: cor,
      }}
    >
      {passo.feito ? "✓" : passo.numero}
    </span>
  );
}

export function CartaoPasso({ passo, prompt }: { passo: PassoJornada; prompt: string }) {
  return (
    <section
      className="card"
      style={{ padding: 18, borderColor: passo.atual ? "var(--acento)" : undefined, opacity: passo.feito ? 0.78 : 1 }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Marcador passo={passo} />
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>{passo.titulo}</h2>
          <div style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 2 }}>
            {NOME_DA_TRILHA[passo.trilha]} · {passo.feito ? "Feito" : passo.atual ? "Passo da vez" : "Depois"}
          </div>
        </div>
      </div>

      <p style={{ margin: "12px 0 10px", fontSize: 14 }}>{passo.porque}</p>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
        {passo.itens.map((item) => (
          <li key={item.texto} style={{ display: "flex", gap: 8, fontSize: 14, alignItems: "baseline" }}>
            <span aria-hidden style={{ color: item.feito ? VERDE : "var(--texto-fraco)", fontWeight: 700 }}>
              {item.feito ? "✓" : "○"}
            </span>
            <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
              <span className="sr-only">{item.feito ? "Feito: " : "Falta: "}</span>
              {item.texto}
              {item.link ? (
                <>
                  {" "}
                  <a href={item.link} target="_blank" rel="noreferrer" style={{ color: "var(--acento)", fontWeight: 600 }}>
                    abrir
                  </a>
                </>
              ) : null}
              {item.detalhe ? <span style={{ display: "block", fontSize: 12, color: "var(--texto-fraco)" }}>{item.detalhe}</span> : null}
            </span>
          </li>
        ))}
      </ul>

      {!passo.feito && passo.quemFaz === "equipe" && !passo.prompt ? (
        <p style={{ margin: "12px 0 0", fontSize: 13, padding: "10px 12px", borderRadius: 10, background: "var(--azul-claro)" }}>
          Quem faz: a equipe do Thiago. Você não precisa fazer nada aqui. O check aparece sozinho quando ficar pronto.
        </p>
      ) : null}
      {!passo.feito ? (
        <>
          {prompt ? <CaixaDePrompt prompt={prompt} /> : null}
          {passo.tela ? (
            <Link
              href={passo.tela.href}
              className="btn btn-sec"
              style={{ marginTop: 10, padding: "8px 14px", fontSize: 13, textDecoration: "none" }}
            >
              {passo.tela.rotulo}
            </Link>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
