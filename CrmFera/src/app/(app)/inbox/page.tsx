import Link from "next/link";
import { db } from "@/lib/db";
import { instancias } from "@/lib/whatsapp";
import Conversa, { type Balao } from "./Conversa";
import { salvarQuickReply } from "./acoes";
import { personalizarAtalho, lerPrimeiraMensagem } from "@/lib/atalhos";
import { ESTADOS_CONVERSA, type EstadoConversa, type AbaInbox } from "./estados";
import AcoesConversa from "./AcoesConversa";
import FichaLead, { nomeExibido } from "./FichaLead";
import { carregarFicha } from "./ficha-dados";
import { tagsDe } from "@/lib/tags";
import { avisoNumeroUnico } from "@/lib/numero-unico";
import type { Prisma } from "@/generated/prisma/client";

function hora(d: Date) {
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  return mesmoDia
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function bonito(numero: string | null): string {
  if (!numero) return "sem número";
  const d = numero.replace(/\D/g, "");
  if (d.length === 13) return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return numero;
}

export default async function Inbox({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; n?: string; aba?: string; q?: string }>;
}) {
  const { c, n, aba, q: qBruto } = await searchParams;
  const q = qBruto?.trim().slice(0, 80) || undefined;
  const abaAtiva = (ESTADOS_CONVERSA.find((e) => e.key === aba)?.key ?? "andamento") as AbaInbox;

  const nums = await instancias();
  // `n` = id da instância escolhida no seletor. Vazio = todos os números.
  const numeroAtivo = n && n !== "todos" ? nums.find((i) => i.id === n) : null;

  const filtroInstancia: Prisma.WhatsappMessageWhereInput = numeroAtivo
    ? { instanceId: numeroAtivo.id }
    : {};

  // Busca: nome, número (só dígitos) ou texto de qualquer mensagem da conversa.
  const digitos = q?.replace(/\D/g, "") ?? "";
  const filtroBusca: Prisma.WhatsappMessageWhereInput = q
    ? {
        OR: [
          { body: { contains: q } },
          { contact: { name: { contains: q } } },
          ...(digitos.length >= 3 ? [{ contact: { phone: { contains: digitos } } }] : []),
        ],
      }
    : {};

  const ultimas = await db.whatsappMessage.findMany({
    where: { contactId: { not: null }, ...filtroInstancia, ...filtroBusca },
    orderBy: { timestamp: "desc" },
    take: 400,
    include: { contact: true },
  });

  const estados = await db.conversationState.findMany();
  const mapaEstado = new Map(estados.map((e) => [e.contactId, e.estado as EstadoConversa]));
  const estadoDe = (id: string): EstadoConversa => mapaEstado.get(id) ?? "andamento";

  const vistos = new Set<string>();
  const conversas = ultimas
    .filter((m) => {
      if (!m.contactId || vistos.has(m.contactId)) return false;
      vistos.add(m.contactId);
      return true;
    })
    .map((m) => ({
      contactId: m.contactId as string,
      nome: nomeExibido(m.contact?.name ?? "Sem nome", m.contact?.phone ?? null),
      previa: m.body.slice(0, 60),
      quando: hora(m.timestamp),
      instanceId: m.instanceId,
      estado: estadoDe(m.contactId as string),
      temCall: m.contact?.lifecycleStage === "call_marcada",
      humano: tagsDe(m.contact?.tags).includes("humano"),
      callRealizada: tagsDe(m.contact?.tags).includes("call-realizada"),
      propostaEnviada: m.contact?.lifecycleStage === "proposta",
    }));

  /**
   * Em qual aba a conversa aparece. A call é derivada do estágio, então cai
   * aqui sozinha — mas arquivar/destacar são decisões suas e ganham dela.
   */
  const abaDa = (cv: { estado: EstadoConversa; temCall: boolean }): AbaInbox =>
    cv.estado !== "andamento" ? cv.estado : cv.temCall ? "call_marcada" : "andamento";

  // Contagem por aba ANTES de filtrar — os números das abas precisam do total.
  const porAba = new Map<AbaInbox, number>();
  for (const cv of conversas) {
    const a = abaDa(cv);
    porAba.set(a, (porAba.get(a) ?? 0) + 1);
  }

  // "excluida" some de todas as abas (soft delete: o histórico continua no contato).
  // Buscando, procura em todas as abas (menos as excluídas).
  const visiveis = conversas.filter((cv) => (q ? cv.estado !== "excluida" : abaDa(cv) === abaAtiva));

  const naoLidas = await db.whatsappMessage.groupBy({
    by: ["contactId"],
    where: { direction: "inbound", status: { not: "read" }, ...filtroInstancia },
    _count: true,
  });
  const mapaNaoLidas = new Map(naoLidas.map((x) => [x.contactId, x._count]));

  // Quantas conversas por número, pra mostrar no seletor
  const porInstancia = await db.whatsappMessage.groupBy({
    by: ["instanceId"],
    where: { contactId: { not: null } },
    _count: true,
  });
  const contagem = new Map(porInstancia.map((x) => [x.instanceId, x._count]));

  const ativo = c ?? visiveis[0]?.contactId ?? null;

  const [contatoAtivo, mensagens, atalhos] = await Promise.all([
    ativo ? db.contact.findUnique({ where: { id: ativo } }) : null,
    ativo
      ? db.whatsappMessage.findMany({
          where: { contactId: ativo, ...filtroInstancia },
          orderBy: { timestamp: "asc" },
          take: 300,
        })
      : [],
    db.quickReply.findMany({ orderBy: { title: "asc" } }),
  ]);

  // Primeira mensagem do lead: as páginas mandam nome e dificuldade nela.
  const primeiraDoLead = lerPrimeiraMensagem(mensagens.find((m) => m.direction === "inbound")?.body);

  // Ficha carregada UMA vez e usada nas duas variantes (coluna e mobile).
  const dadosFicha = contatoAtivo ? await carregarFicha(contatoAtivo.id) : null;

  // Nome do agente pra mostrar no selo em vez do slug cru.
  const agentes = await db.agent.findMany({ select: { slug: true, name: true } });
  const nomeAgente = new Map(agentes.map((a) => [a.slug, a.name]));

  const baloes: Balao[] = mensagens.map((m) => {
    const meta = (m.metadata ?? {}) as Record<string, unknown>;
    const origem = typeof meta.origem === "string" ? meta.origem : undefined;

    let autor: string | undefined;
    if (origem === "agente" && typeof meta.agente === "string") {
      autor = nomeAgente.get(meta.agente) ?? meta.agente;
    } else if (origem === "followup" && typeof meta.followup === "string") {
      autor = meta.followup;
    } else if (typeof meta.ator === "string") {
      autor = meta.ator.split("@")[0];
    }

    return {
      id: m.id,
      body: m.body,
      direction: m.direction,
      status: m.status,
      quando: hora(m.timestamp),
      midiaId: typeof meta.midiaId === "string" ? meta.midiaId : undefined,
      mimetype: typeof meta.mimetype === "string" ? meta.mimetype : undefined,
      origem,
      autor,
    };
  });

  // Por qual número responder: o escolhido no seletor, senão o que recebeu
  // a última mensagem desta conversa.
  const instanciaDaConversa =
    numeroAtivo?.id ?? mensagens[mensagens.length - 1]?.instanceId ?? undefined;
  const quemResponde = nums.find((i) => i.id === instanciaDaConversa);
  // Número único (numero-unico.ts): lead respondido por outro número ganha aviso no composer.
  const avisoNumero = contatoAtivo ? avisoNumeroUnico(contatoAtivo.origem, quemResponde?.instanceName) : null;

  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ c, n, aba, q, ...extra })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/inbox?${s}` : "/inbox";
  };

  return (
    <div className={`inbox-pagina${ativo ? " tem-selecao" : ""}`}>
      <div className="inbox-chrome" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Inbox</h1>
        <span style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
          {visiveis.length} conversa(s)
        </span>
        <form method="get" action="/inbox" style={{ display: "flex", gap: 6, flex: "1 1 260px", maxWidth: 420 }}>
          {n ? <input type="hidden" name="n" value={n} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nome, número ou mensagem"
            aria-label="Buscar conversas"
            style={{ flex: 1 }}
          />
          <button className="btn" type="submit">
            Buscar
          </button>
          {q ? (
            <Link href={qs({ q: undefined, c: undefined })} className="btn-sec" style={{ whiteSpace: "nowrap" }}>
              Limpar
            </Link>
          ) : null}
        </form>
        <details style={{ marginLeft: "auto" }}>
          <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--acento)" }}>
            Respostas rápidas ({atalhos.length})
          </summary>
          <form
            action={salvarQuickReply}
            className="card"
            style={{ padding: 14, marginTop: 8, width: 320 }}
          >
            <input name="title" placeholder="Título" required style={{ marginBottom: 8 }} />
            <input name="shortcut" placeholder="/oi" style={{ marginBottom: 8 }} />
            <textarea name="body" rows={3} placeholder="Texto da resposta" required />
            <button className="btn" type="submit" style={{ marginTop: 8 }}>
              Salvar resposta rápida
            </button>
          </form>
        </details>
      </div>

      {/* Abas de atendimento */}
      <div className="inbox-chrome" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {ESTADOS_CONVERSA.map((e) => (
          <Link
            key={e.key}
            href={qs({ aba: e.key === "andamento" ? undefined : e.key, c: undefined })}
            className="etiqueta"
            data-aba={e.key}
            style={{
              ...chip(abaAtiva === e.key),
              padding: "6px 12px",
              fontSize: 13,
            }}
          >
            {e.icone} {e.label} <span style={{ opacity: 0.75 }}>{porAba.get(e.key) ?? 0}</span>
          </Link>
        ))}
      </div>

      {/* Seletor de número conectado */}
      <div className="inbox-chrome" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <Link
          href={qs({ n: undefined, c: undefined })}
          className="etiqueta"
          data-num="todos"
          style={chip(!numeroAtivo)}
        >
          Todos os números
        </Link>
        {nums.map((i) => {
          const on = i.status === "conectado";
          return (
            <Link
              key={i.id}
              href={qs({ n: i.id, c: undefined })}
              className="etiqueta"
              data-num={i.id}
              style={chip(numeroAtivo?.id === i.id)}
              title={i.instanceName ?? ""}
            >
              <span style={{ color: on ? "#10B981" : "#EF4444" }}>●</span> {i.name} ·{" "}
              {bonito(i.phoneNumber)}{" "}
              <span style={{ opacity: 0.7 }}>{contagem.get(i.id) ?? 0}</span>
            </Link>
          );
        })}
        {!nums.length ? (
          <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>
            Nenhum número conectado — configure em Configurações.
          </span>
        ) : null}
      </div>

      <div
        className={`card inbox-grade${ativo ? " tem-selecao" : ""}`}
        style={{
          display: "grid",
          // 3 colunas no desktop: lista · conversa · ficha do lead.
          // No mobile (globals.css, .inbox-grade) vira 1 coluna e alterna
          // lista/conversa por classe — nunca as duas empilhadas.
          gridTemplateColumns: "minmax(0,290px) minmax(0,1fr) minmax(0,270px)",
          height: "calc(100dvh - 190px)",
          overflow: "hidden",
        }}
      >
        <div style={{ borderRight: "1px solid var(--linha)", overflowY: "auto" }}>
          {visiveis.map((cv) => {
            const nn = mapaNaoLidas.get(cv.contactId) ?? 0;
            const selecionada = cv.contactId === ativo;
            const dona = nums.find((i) => i.id === cv.instanceId);
            return (
              <Link
                key={cv.contactId}
                href={qs({ c: cv.contactId })}
                data-conversa={cv.contactId}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--linha)",
                  background: selecionada ? "#e8ecf8" : "transparent",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{cv.nome}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--texto-fraco)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cv.previa}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                    {!numeroAtivo && dona ? (
                      <span style={{ fontSize: 11, color: "var(--acento)" }}>via {dona.name}</span>
                    ) : null}
                    {cv.temCall && abaAtiva !== "call_marcada" ? (
                      <span style={{ fontSize: 11, color: "#7c3aed" }}>📅 call marcada</span>
                    ) : null}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--texto-fraco)" }}>{cv.quando}</div>
                  <AcoesConversa
                    contactId={cv.contactId}
                    estado={cv.estado}
                    temCall={cv.temCall}
                    callRealizada={cv.callRealizada}
                    propostaEnviada={cv.propostaEnviada}
                    humano={cv.humano}
                  />
                  {nn > 0 ? (
                    <span
                      className="etiqueta"
                      data-nao-lidas={nn}
                      style={{ background: "var(--acento)", color: "#fff", marginTop: 4 }}
                    >
                      {nn}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
          {!visiveis.length ? (
            <p style={{ padding: 16, color: "var(--texto-fraco)", fontSize: 14 }}>
              {q ? (
                <>Nenhuma conversa encontrada para <strong>“{q}”</strong></>
              ) : (
                <>
                  Nenhuma conversa em{" "}
                  <strong>{ESTADOS_CONVERSA.find((e) => e.key === abaAtiva)?.label}</strong>
                </>
              )}
              {numeroAtivo ? ` no número ${numeroAtivo.name}` : ""}.
            </p>
          ) : null}
        </div>

        <div
          style={{
            minWidth: 0,
            minHeight: 0,
            display: "grid",
            gridTemplateRows: contatoAtivo ? "auto auto minmax(0,1fr)" : "minmax(0,1fr)",
            height: "100%",
          }}
        >
          {contatoAtivo ? (
            <Link
              href={qs({ c: undefined })}
              className="inbox-voltar-mobile"
              style={{
                display: "none",
                alignItems: "center",
                gap: 6,
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--acento)",
                borderBottom: "1px solid var(--linha)",
              }}
            >
              ← Voltar pra lista
            </Link>
          ) : null}
          {dadosFicha ? (
            <div className="ficha-mobile" style={{ display: "none", overflowY: "auto", maxHeight: "55dvh" }}>
              <FichaLead dados={dadosFicha} variante="mobile" />
            </div>
          ) : null}
          {contatoAtivo ? (
            <Conversa
              key={`${contatoAtivo.id}-${instanciaDaConversa ?? "x"}`}
              contactId={contatoAtivo.id}
              contactName={contatoAtivo.name}
              phone={contatoAtivo.phone}
              mensagens={baloes}
              instanceId={instanciaDaConversa}
              numeroQueResponde={quemResponde ? bonito(quemResponde.phoneNumber) : undefined}
              avisoNumero={avisoNumero ?? undefined}
              atalhos={atalhos.map((a) => ({
                id: a.id,
                title: a.title,
                body: personalizarAtalho(a.body, contatoAtivo, undefined, primeiraDoLead),
                shortcut: a.shortcut,
              }))}
            />
          ) : (
            <div style={{ padding: 20, color: "var(--texto-fraco)" }}>
              Escolha uma conversa à esquerda.
            </div>
          )}
        </div>

        <div className="ficha-lead" style={{ minWidth: 0, minHeight: 0, display: "flex" }}>
          {dadosFicha ? <FichaLead dados={dadosFicha} /> : null}
        </div>
      </div>
    </div>
  );
}

function chip(ativo: boolean): React.CSSProperties {
  return {
    background: ativo ? "var(--acento)" : "transparent",
    color: ativo ? "#fff" : "var(--texto-fraco)",
    border: `1px solid ${ativo ? "transparent" : "var(--linha)"}`,
    cursor: "pointer",
  };
}
