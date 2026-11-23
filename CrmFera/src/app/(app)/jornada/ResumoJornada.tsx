import Link from "next/link";
import { jornadaAtual } from "@/lib/jornada-estado";
import { NOME_DA_TRILHA, type PassoJornada } from "@/lib/jornada";
import { BarraDeProgresso } from "./Passos";

function PassoDaVez({ passo }: { passo: PassoJornada }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginTop: 10, fontSize: 14 }}>
      <span className="sobretitulo" style={{ flexShrink: 0 }}>
        {passo.trilha === "conteudo" ? "Conteúdo" : "Técnica"}
      </span>
      <span style={{ minWidth: 0 }}>
        {passo.numero}. {passo.titulo}
        {passo.quemFaz === "equipe" ? <span style={{ color: "var(--texto-fraco)" }}> · a equipe faz</span> : null}
      </span>
    </div>
  );
}

/**
 * Topo da tela inicial enquanto a Jornada não fecha: compacto (o passo da vez em cada trilha e um
 * botão), para o dashboard logo abaixo continuar à vista. Os prompts ficam na tela Jornada.
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
      <Link href="/jornada" className="btn" style={{ marginTop: 12, display: "inline-block", textDecoration: "none", padding: "8px 14px", fontSize: 13 }}>
        Continuar de onde parei
      </Link>
    </section>
  );
}
