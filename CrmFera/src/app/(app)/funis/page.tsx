import { db } from "@/lib/db";
import Kanban, { type ColunaKanban } from "./Kanban";
import { criarDeal } from "./acoes";

export default async function Funis() {
  const pipeline = await db.pipeline.findFirst({
    include: { stages: { orderBy: { ordem: "asc" } } },
  });

  if (!pipeline) {
    return (
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Funis</h1>
        <p style={{ color: "var(--texto-fraco)", marginTop: 8 }}>
          Nenhum pipeline criado. Rode o seed (<code>npx tsx prisma/seed.ts</code>).
        </p>
      </div>
    );
  }

  const [deals, contatos] = await Promise.all([
    db.deal.findMany({ include: { contact: true }, orderBy: { updatedAt: "desc" } }),
    db.contact.findMany({ orderBy: { name: "asc" }, take: 500 }),
  ]);

  const colunas: ColunaKanban[] = pipeline.stages.map((s) => ({
    id: s.id,
    name: s.name,
    deals: deals
      .filter((d) => d.stageId === s.id)
      .map((d) => ({
        id: d.id,
        titulo: d.titulo,
        valueCents: d.valueCents,
        contactId: d.contactId,
        contactName: d.contact.name,
      })),
  }));

  const totalAberto = deals
    .filter((d) => {
      const st = pipeline.stages.find((s) => s.id === d.stageId);
      return st && !["Cliente", "Perdido"].includes(st.name);
    })
    .reduce((s, d) => s + d.valueCents, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Funis</h1>
        <span style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
          {pipeline.name} · {deals.length} negócio(s) ·{" "}
          {(totalAberto / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em
          aberto
        </span>
      </div>

      <form
        action={criarDeal}
        className="card"
        style={{
          padding: 14,
          marginBottom: 16,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <label style={{ flex: "1 1 200px" }}>
          <span style={rot}>Contato</span>
          <select name="contactId" required>
            {contatos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ flex: "1 1 180px" }}>
          <span style={rot}>Título</span>
          <input name="titulo" placeholder="Implementação FERA" required />
        </label>
        <label style={{ flex: "0 1 130px" }}>
          <span style={rot}>Valor (R$)</span>
          <input name="valor" placeholder="5000,00" />
        </label>
        <label style={{ flex: "0 1 160px" }}>
          <span style={rot}>Estágio</span>
          <select name="stageId" defaultValue={pipeline.stages[0]?.id}>
            {pipeline.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" type="submit">
          Criar negócio
        </button>
      </form>

      <Kanban colunas={colunas} />
    </div>
  );
}

const rot: React.CSSProperties = {
  fontSize: 12,
  color: "var(--texto-fraco)",
  display: "block",
  marginBottom: 4,
};
