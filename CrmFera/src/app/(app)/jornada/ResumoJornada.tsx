import Link from "next/link";
import { jornadaAtual } from "@/lib/jornada-estado";
import { NOME_DA_TRILHA, type PassoJornada } from "@/lib/jornada";
import { BarraDeProgresso, CaixaDePrompt } from "./Passos";
import { promptDoPasso } from "./ligacao";

async function PassoDaVez({ passo }: { passo: PassoJornada }) {
  const prompt = await promptDoPasso(passo);
  const falta = passo.itens.filter((i) => !i.feito);
  return (
    <div style={{ borderTop: "1px solid var(--linha)", paddingTop: 12, marginTop: 12 }}>
      <div className="sobretitulo">
        {NOME_DA_TRILHA[passo.trilha]} · passo {passo.numero}
      </div>
      <h3 style={{ fontSize: 16, margin: "4px 0 6px" }}>{passo.titulo}</h3>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
        {falta.map((item) => (
          <li key={item.texto}>Falta: {item.texto}</li>
        ))}
      </ul>
      {prompt ? <CaixaDePrompt prompt={prompt} /> : null}
      {passo.quemFaz === "equipe" ? (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--texto-fraco)" }}>Quem faz: a equipe do Thiago.</p>
      ) : passo.tela ? (
        <Link href={passo.tela.href} className="btn btn-sec" style={{ marginTop: 10, padding: "8px 14px", fontSize: 13, textDecoration: "none", display: "inline-block" }}>
          {passo.tela.rotulo}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Topo da tela inicial enquanto a Jornada não fecha: o passo da vez em cada trilha e o que
 * colar para andar. Some sozinho quando todos os passos estão feitos.
 */
export default async function ResumoJornada() {
  const jornada = await jornadaAtual();
  if (jornada.concluida) return null;
  const daVez = [jornada.atuais.conteudo, jornada.atuais.tecnica].filter((p): p is PassoJornada => p !== null);

  return (
    <section className="card" style={{ padding: 18, marginBottom: 22, borderColor: "var(--acento)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <div className="sobretitulo">
          Jornada · {jornada.feitos} de {jornada.total} feitos
        </div>
        <Link href="/jornada" style={{ fontSize: 13, color: "var(--acento)", fontWeight: 600 }}>
          Ver os {jornada.total} passos
        </Link>
      </div>
      <div style={{ marginTop: 10 }}>
        <BarraDeProgresso jornada={jornada} />
      </div>
      {daVez.map((passo) => (
        <PassoDaVez key={passo.id} passo={passo} />
      ))}
    </section>
  );
}
