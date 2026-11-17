import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { linhaDoTempo } from "@/lib/timeline";
import { ESTAGIOS, estagio } from "@/lib/estagios";
import { coletarRespostas } from "@/lib/ficha";
import {
  acaoMudarEstagio,
  adicionarNota,
  adicionarTag,
  atualizarContato,
  registrarCall,
  registrarReuniao,
  registrarVendaManual,
} from "../acoes";

const ICONE: Record<string, string> = {
  whatsapp_message: "💬",
  email_sent: "✉️",
  email_open: "👀",
  purchase: "💰",
  refund: "↩️",
  stage_change: "▤",
  note: "📝",
  form_submit: "📋",
  broadcast: "📣",
  acao_agente: "🤖",
  call: "📞",
};

const ROTULO: Record<string, string> = {
  whatsapp_message: "WhatsApp",
  email_sent: "E-mail enviado",
  email_open: "E-mail aberto",
  purchase: "Venda",
  refund: "Reembolso",
  stage_change: "Mudança de estágio",
  note: "Nota",
  form_submit: "Formulário",
  broadcast: "Disparo",
  acao_agente: "Ação de agente",
  call: "Call",
};

function brl(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function resumo(tipo: string, meta: Record<string, unknown>): string {
  if (tipo === "stage_change") return `${meta.de} → ${meta.para}`;
  if (tipo === "purchase") return `${meta.product} · ${brl(Number(meta.valueCents ?? 0))}`;
  if (typeof meta.texto === "string") return meta.texto;
  if (typeof meta.body === "string") return meta.body;
  return "";
}

// GOTCHA 5 do megaprompt: no Next 16, params e Promise.
export default async function DetalheContato({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contato = await db.contact.findUnique({ where: { id } });
  if (!contato) notFound();

  const [eventos, compras] = await Promise.all([
    linhaDoTempo(id),
    db.purchase.findMany({ where: { contactId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  const e = estagio(contato.lifecycleStage);
  const tags = Array.isArray(contato.tags) ? (contato.tags as string[]) : [];
  // O que o lead preencheu (formulário/quiz) mora em customFields — inclusive o
  // anúncio de origem (utm_content). Mesmo leitor da ficha pública `/f/<code>`.
  const campos =
    contato.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Record<string, unknown>)
      : {};
  const respostas = coletarRespostas(campos);
  const ultimaReuniao = eventos.find(
    (ev) => ev.eventType === "call" && typeof (ev.metadata as Record<string, unknown> | null)?.resultado === "string",
  );
  const reuniao = {
    agendada: typeof campos.evento_data === "string" ? campos.evento_data : "",
    ultimo: ultimaReuniao
      ? `${(ultimaReuniao.metadata as Record<string, unknown>).resultado === "compareceu" ? "compareceu" : "não compareceu"} em ${ultimaReuniao.timestamp.toLocaleDateString("pt-BR")}`
      : "",
  };

  return (
    <div>
      <Link href="/contatos" style={{ color: "var(--texto-fraco)", fontSize: 13 }}>
        ← Contatos
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0 22px", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{contato.name}</h1>
        <span
          className="etiqueta"
          style={{ background: e.cor + "22", color: e.cor, border: `1px solid ${e.cor}55` }}
        >
          {e.label}
        </span>
        {contato.purchaseCount > 0 ? (
          <span className="etiqueta" style={{ background: "#10B98122", color: "#047857" }}>
            {brl(contato.totalRevenue)} · {contato.purchaseCount} compra(s)
          </span>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.25fr)", gap: 20 }}>
        {/* Coluna esquerda: dados e ações. LEI 2 — toda tela termina em ação. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {respostas.length ? (
            <div className="card" style={{ padding: 18 }}>
              <h2 style={h2}>Respostas do formulário</h2>
              {respostas.map((r) => (
                <div key={r.pergunta} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: "var(--texto-fraco)" }}>{r.pergunta}</div>
                  <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{r.resposta}</div>
                </div>
              ))}
            </div>
          ) : null}

          <form action={atualizarContato} className="card" style={{ padding: 18 }}>
            <input type="hidden" name="id" value={contato.id} />
            <h2 style={h2}>Dados</h2>
            <Campo rotulo="Nome">
              <input name="name" defaultValue={contato.name} />
            </Campo>
            <Campo rotulo="Telefone">
              <input name="phone" defaultValue={contato.phone ?? ""} />
            </Campo>
            <Campo rotulo="E-mail">
              <input name="email" defaultValue={contato.email ?? ""} />
            </Campo>
            <Campo rotulo="Empresa">
              <input name="company" defaultValue={contato.company ?? ""} />
            </Campo>
            <Campo rotulo="Origem">
              <input name="origem" defaultValue={contato.origem} />
            </Campo>
            <Campo rotulo="Tags (vírgula)">
              <input name="tags" defaultValue={tags.join(", ")} />
            </Campo>
            <button className="btn" type="submit">
              Salvar
            </button>
          </form>

          <form action={acaoMudarEstagio} className="card" style={{ padding: 18 }}>
            <input type="hidden" name="id" value={contato.id} />
            <h2 style={h2}>Mudar estágio</h2>
            <div style={{ display: "flex", gap: 8 }}>
              {/* key = valor atual: forca remount depois do revalidate, senao o React
                  preserva o DOM do select e ele exibe o estagio ANTERIOR. */}
              <select
                key={contato.lifecycleStage}
                name="lifecycleStage"
                defaultValue={contato.lifecycleStage}
              >
                {ESTAGIOS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button className="btn" type="submit">
                Mover
              </button>
            </div>
          </form>

          <form action={adicionarNota} className="card" style={{ padding: 18 }}>
            <input type="hidden" name="id" value={contato.id} />
            <h2 style={h2}>Nota</h2>
            <textarea name="texto" rows={3} placeholder="o que aconteceu…" />
            <button className="btn" type="submit" style={{ marginTop: 10 }}>
              Registrar nota
            </button>
          </form>

          <form action={registrarReuniao} className="card" style={{ padding: 18 }}>
            <input type="hidden" name="id" value={contato.id} />
            <h2 style={h2}>Reunião de 20 min</h2>
            <p style={{ fontSize: 13, color: "var(--texto-fraco)", marginBottom: 10 }}>
              {reuniao.agendada ? `Agendada: ${reuniao.agendada}` : "Sem reunião agendada pela agenda."}
              {reuniao.ultimo ? ` · Último registro: ${reuniao.ultimo}` : ""}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" type="submit" name="resultado" value="compareceu">
                Compareceu
              </button>
              <button className="btn btn-sec" type="submit" name="resultado" value="no_show">
                Não compareceu
              </button>
            </div>
          </form>

          <form action={registrarCall} className="card" style={{ padding: 18 }}>
            <input type="hidden" name="id" value={contato.id} />
            <h2 style={h2}>Call</h2>
            <input name="texto" placeholder="resumo da call" />
            <button className="btn btn-sec" type="submit" style={{ marginTop: 10 }}>
              Registrar call
            </button>
          </form>

          <form action={adicionarTag} className="card" style={{ padding: 18 }}>
            <input type="hidden" name="id" value={contato.id} />
            <h2 style={h2}>Tag</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <input name="tag" placeholder="nova tag" />
              <button className="btn btn-sec" type="submit">
                Add
              </button>
            </div>
          </form>

          <form action={registrarVendaManual} className="card" style={{ padding: 18 }}>
            <input type="hidden" name="id" value={contato.id} />
            <h2 style={h2}>Venda manual</h2>
            <Campo rotulo="Produto">
              <input name="product" placeholder="Implementação FERA" />
            </Campo>
            <Campo rotulo="Valor (R$)">
              <input name="valor" placeholder="5000,00" />
            </Campo>
            <button className="btn" type="submit">
              Registrar venda
            </button>
          </form>

          {contato.phone ? (
            <a
              className="btn"
              href={`https://wa.me/${contato.phone}`}
              target="_blank"
              rel="noreferrer"
              style={{ background: "#25D366" }}
            >
              Abrir no WhatsApp
            </a>
          ) : null}
        </div>

        {/* Coluna direita: LINHA DO TEMPO — append-only, mais recente no topo. */}
        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ ...h2, marginBottom: 14 }}>
            Linha do tempo{" "}
            <span style={{ color: "var(--texto-fraco)", fontWeight: 400 }}>
              · {eventos.length} evento(s)
            </span>
          </h2>

          {compras.length ? (
            <div style={{ fontSize: 13, color: "var(--texto-fraco)", marginBottom: 14 }}>
              Última compra:{" "}
              {contato.lastPurchaseAt?.toLocaleDateString("pt-BR") ?? "—"}
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {eventos.map((ev) => {
              const meta = (ev.metadata ?? {}) as Record<string, unknown>;
              return (
                <div
                  key={ev.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "11px 0",
                    borderBottom: "1px solid var(--linha)",
                  }}
                >
                  <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>
                    {ICONE[ev.eventType] ?? "•"}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {ROTULO[ev.eventType] ?? ev.eventType}
                      {ev.channel ? (
                        <span style={{ color: "var(--texto-fraco)", fontWeight: 400 }}>
                          {" "}
                          · {ev.channel}
                        </span>
                      ) : null}
                    </div>
                    {resumo(ev.eventType, meta) ? (
                      <div style={{ fontSize: 13, color: "var(--texto-fraco)", whiteSpace: "pre-wrap" }}>
                        {resumo(ev.eventType, meta)}
                      </div>
                    ) : null}
                  </div>
                  <span style={{ fontSize: 12, color: "var(--texto-fraco)", whiteSpace: "nowrap" }}>
                    {ev.timestamp.toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
            {!eventos.length ? (
              <p style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
                Nenhum evento ainda.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: 15, fontWeight: 700, marginBottom: 12 };

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>{rotulo}</span>
      <div style={{ marginTop: 5 }}>{children}</div>
    </label>
  );
}
