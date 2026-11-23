import { lerIndicadores } from "@/lib/indicadores";
import { painelHospedado } from "@/lib/hospedado";

function quando(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
}

/** "Meus números": os cartões que o FERABOT do dono manda para o painel. */
export default async function MeusNumeros() {
  if (!painelHospedado()) return null;
  const indicadores = await lerIndicadores();

  return (
    <section className="card" style={{ padding: 18, marginBottom: 22 }}>
      <div className="sobretitulo">Meus números</div>
      {indicadores.length === 0 ? (
        <p style={{ fontSize: 14, margin: "8px 0 0", lineHeight: 1.55 }}>
          Esta área é sua: uso, posts feitos, custo das ferramentas de IA, integrações. Peça ao FERABOT com os prompts de{" "}
          <a href="/prompts#personalizar" style={{ color: "var(--acento)", fontWeight: 600 }}>
            Personalize o seu painel
          </a>
          .
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginTop: 10 }}>
          {indicadores.map((i) => (
            <div key={i.id} style={{ minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, overflowWrap: "anywhere" }}>{i.valor}</div>
              <div style={{ fontSize: 13 }}>{i.titulo}</div>
              <div style={{ fontSize: 11, color: "var(--texto-fraco)" }}>
                {i.detalhe ? `${i.detalhe} · ` : ""}
                {i.tipo === "estimado" ? "estimado · " : ""}
                {quando(i.atualizadoEm)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
