import { db } from "@/lib/db";
import { painelHospedado } from "@/lib/hospedado";
import { contarProgresso, lerPlano, lerProgresso } from "@/lib/plano-cliente-banco";

const NOME_ORIGEM: Record<string, string> = {
  anuncio: "Anúncio",
  organico: "Orgânico",
  indicacao: "Indicação",
  base: "Base",
  outro: "Outro",
};

function nomeDaOrigem(origem: string): string {
  if (origem.startsWith("funil:")) return `Página ${origem.slice(6)}`;
  return NOME_ORIGEM[origem] ?? origem;
}

function inicioDoMes(agora = new Date()): Date {
  return new Date(agora.getFullYear(), agora.getMonth(), 1);
}

/**
 * A leitura do mês do cliente da consultoria: leads, de onde vieram, conversas e vídeos.
 * É a entrega que ele vê todo mês da mensalidade, no topo da tela inicial.
 */
export default async function LeituraDoMes() {
  if (!painelHospedado()) return null;
  const desde = inicioDoMes();
  const [porOrigem, conversas, plano, progresso] = await Promise.all([
    db.contact.groupBy({ by: ["origem"], where: { createdAt: { gte: desde } }, _count: { _all: true } }),
    db.whatsappMessage.groupBy({ by: ["contactId"], where: { timestamp: { gte: desde }, direction: "inbound" } }),
    lerPlano(),
    lerProgresso(),
  ]);
  const leads = porOrigem.reduce((soma, o) => soma + o._count._all, 0);
  const videos = contarProgresso(plano, progresso);
  const mes = desde.toLocaleDateString("pt-BR", { month: "long" });
  const origens = [...porOrigem].sort((a, b) => b._count._all - a._count._all);

  const numero = (valor: number, rotulo: string) => (
    <div style={{ flex: "1 1 90px", minWidth: 0 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{valor}</div>
      <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>{rotulo}</div>
    </div>
  );

  return (
    <section className="card" style={{ padding: 18, marginBottom: 22 }}>
      <div className="sobretitulo">Seu mês de {mes}</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
        {numero(leads, "leads novos")}
        {numero(conversas.length, "pessoas que escreveram")}
        {numero(videos.publicados, `vídeos publicados de ${videos.roteiros}`)}
      </div>
      {origens.length ? (
        <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
          {origens.map((o) => (
            <li key={o.origem}>
              {nomeDaOrigem(o.origem)}: {o._count._all}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--texto-fraco)" }}>
          Nenhum lead novo este mês ainda. O passo da vez na Jornada é o que destrava isso.
        </p>
      )}
    </section>
  );
}
