import { jornadaAtual, lerEntregas } from "@/lib/jornada-estado";
import { NOME_DA_TRILHA, type Trilha } from "@/lib/jornada";
import { BarraDeProgresso, CartaoPasso } from "./Passos";
import { promptDoPasso } from "./ligacao";

export const dynamic = "force-dynamic";

const ENTREGAS_NA_TELA = 8;
const TRILHAS: Trilha[] = ["conteudo", "tecnica"];
const EXPLICA: Record<Trilha, string> = {
  conteudo: "A sua parte: narrativa, YouTube e posts. Gravar e aparecer é seu.",
  tecnica: "A parte de montar: chaves, página, WhatsApp e anúncio. O FERABOT conduz (ou a equipe monta, conforme o seu nível).",
};

function quando(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function JornadaPagina() {
  const [jornada, entregas] = await Promise.all([jornadaAtual(), lerEntregas()]);
  const prompts = await Promise.all(jornada.passos.map(promptDoPasso));

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 22, margin: "0 0 6px" }}>Jornada</h1>
      <p style={{ margin: "0 0 14px", color: "var(--texto-fraco)", fontSize: 14 }}>
        {jornada.concluida
          ? `Os ${jornada.total} passos estão de pé. Agora é rotina: lead respondido no mesmo dia e criativo novo toda semana.`
          : `${jornada.feitos} de ${jornada.total} passos feitos. As duas trilhas andam juntas: enquanto a parte técnica é montada, você já grava. Cada item se marca sozinho quando acontece de verdade.`}
      </p>
      <BarraDeProgresso jornada={jornada} />

      {TRILHAS.map((trilha) => (
        <section key={trilha} style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 15, margin: "0 0 4px" }}>{NOME_DA_TRILHA[trilha]}</h2>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--texto-fraco)" }}>{EXPLICA[trilha]}</p>
          <div style={{ display: "grid", gap: 14 }}>
            {jornada.passos.map((passo, i) =>
              passo.trilha === trilha ? <CartaoPasso key={passo.id} passo={passo} prompt={prompts[i]} /> : null,
            )}
          </div>
        </section>
      ))}

      {entregas.length > 0 ? (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>O que o FERABOT já entregou</h2>
          <div className="card" style={{ padding: "6px 16px" }}>
            {entregas.slice(0, ENTREGAS_NA_TELA).map((e) => (
              <div
                key={`${e.em}-${e.oque}`}
                style={{ padding: "10px 0", borderBottom: "1px solid var(--linha)", fontSize: 14, overflowWrap: "anywhere" }}
              >
                <span style={{ color: "var(--texto-fraco)", fontSize: 12 }}>
                  {quando(e.em)} · {e.bot}
                </span>
                <div>
                  {e.oque}
                  {e.link ? (
                    <>
                      {" "}
                      <a href={e.link} target="_blank" rel="noreferrer" style={{ color: "var(--acento)", fontWeight: 600 }}>
                        abrir
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
