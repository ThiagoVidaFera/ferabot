import Link from "next/link";
import { sessaoAtual } from "@/lib/auth";
import { db } from "@/lib/db";
import { ESTAGIOS, estagio } from "@/lib/estagios";
import { filaSemResposta } from "@/lib/fila-sem-resposta";
import { sugestoesGuardadas } from "@/lib/fila-sugestao-servico";
import PainelSemResposta from "./followup/PainelSemResposta";
import AtencaoManual from "./AtencaoManual";
import PainelCustos from "./PainelCustos";
import PainelPropostas from "./PainelPropostas";
import { painelPropostas, lerOrdem, ordenarLinhas, type CampoOrdem, type DirecaoOrdem } from "@/lib/painel-propostas";
import { painelCustos } from "@/lib/painel-custos";
import { leadsParaAtencao } from "@/lib/atencao-manual";
import {
  contar,
  funil,
  historicoDiario,
  resolverPeriodo,
  reunioesPorDia,
} from "@/lib/dashboard";
import {
  CardsEtapa,
  FiltroPeriodo,
  FunilAgendamento,
  HistoricoDiario,
  ReunioesPorDia,
  Sparkline,
} from "./VisaoPeriodo";

const TOPO_PAINEL = 5;

function saudacao(agora: Date): string {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(agora),
  );
  if (hora < 12) return "Bom dia";
  return hora < 18 ? "Boa tarde" : "Boa noite";
}

function brl(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Busca = { p?: string; de?: string; ate?: string; ordem?: string; dir?: string };

export default async function Painel({ searchParams }: { searchParams: Promise<Busca> }) {
  const busca = await searchParams;
  const sessao = await sessaoAtual();
  const primeiroNome = sessao?.name.trim().split(/\s+/)[0] ?? "";
  const periodo = resolverPeriodo(busca.p, busca.de, busca.ate);
  const noPeriodo = { gte: periodo.inicio, lt: periodo.fim };
  const [contatosPeriodo, eventosAgenda, atencao, custos] = await Promise.all([
    db.contact.findMany({
      where: { createdAt: noPeriodo },
      select: {
        createdAt: true,
        lifecycleStage: true,
        messages: { where: { direction: "inbound" }, take: 1, select: { id: true } },
      },
    }),
    db.timelineEvent.findMany({
      where: { eventType: "stage_change", timestamp: noPeriodo, metadata: { path: "$.para", equals: "call_marcada" } },
      select: { timestamp: true },
    }),
    leadsParaAtencao(),
    painelCustos(periodo),
  ]);
  const contatosDash = contatosPeriodo.map((c) => ({
    createdAt: c.createdAt,
    lifecycleStage: c.lifecycleStage,
    respondeu: c.messages.length > 0,
  }));
  const contagemPeriodo = contar(contatosDash);

  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const seteDias = new Date(hoje.getTime() - 7 * 86400000);
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const [novosHoje, novos7d, msgsHoje, disparos7d, vendasMes, porEstagio, propostas, semResposta, cache] =
    await Promise.all([
      db.contact.count({ where: { createdAt: { gte: hoje } } }),
      db.contact.count({ where: { createdAt: { gte: seteDias } } }),
      db.whatsappMessage.count({
        where: { direction: "inbound", timestamp: { gte: hoje } },
      }),
      db.broadcast.count({ where: { status: "concluido", createdAt: { gte: seteDias } } }),
      db.purchase.aggregate({
        _sum: { valueCents: true },
        where: { createdAt: { gte: inicioMes } },
      }),
      db.contact.groupBy({ by: ["lifecycleStage"], _count: true }),
      db.agentAction.findMany({
        where: { status: "proposta" },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { agent: true, contact: true },
      }),
      filaSemResposta(),
      sugestoesGuardadas(),
    ]);

  const contagem = new Map(porEstagio.map((p) => [p.lifecycleStage, p._count]));
  const ordemPropostas = lerOrdem(busca.ordem, busca.dir);
  const emAnalise = await painelPropostas(agora);
  const propostasOrdenadas = { ...emAnalise, linhas: ordenarLinhas(emAnalise.linhas, ordemPropostas.campo, ordemPropostas.dir) };
  // os botões de ordem preservam o período escolhido no filtro do painel
  const hrefOrdem = (campo: CampoOrdem, dir: DirecaoOrdem): string => {
    const q = new URLSearchParams();
    if (busca.p) q.set("p", busca.p);
    if (busca.de) q.set("de", busca.de);
    if (busca.ate) q.set("ate", busca.ate);
    q.set("ordem", campo);
    q.set("dir", dir);
    return `/?${q.toString()}`;
  };

  const historico = historicoDiario(contatosDash, periodo);

  return (
    <div>
      <p className="sobretitulo" style={{ marginBottom: 10 }}>
        Painel · Visão geral
      </p>
      <h1 style={{ marginBottom: 8 }}>
        {saudacao(agora)}
        {primeiroNome ? `, ${primeiroNome}` : ""}.
      </h1>
      <p style={{ color: "var(--texto-fraco)", fontSize: 15, marginBottom: 24 }}>
        {novosHoje} {novosHoje === 1 ? "contato novo" : "contatos novos"} hoje e {propostas.length}{" "}
        {propostas.length === 1 ? "proposta de agente aguardando" : "propostas de agentes aguardando"} aprovação.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="card-marinho" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Contatos novos</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 14 }}>
            <span style={{ fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{novosHoje}</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>+{novos7d}</span>
          </div>
          <div className="sobretitulo" style={{ color: "rgba(255,255,255,.6)", marginTop: 6 }}>
            hoje · {novos7d} em 7 dias
          </div>
          <div style={{ marginTop: 22, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>{msgsHoje}</div>
          <div className="sobretitulo" style={{ color: "rgba(255,255,255,.6)" }}>
            mensagens recebidas hoje
          </div>
        </div>

        <div className="card-azul" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Leads no período</div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em", marginTop: 12 }}>
            {contagemPeriodo.leads}
          </div>
          <div className="sobretitulo" style={{ marginBottom: 14 }}>
            no período selecionado
          </div>
          <Sparkline valores={historico.map((l) => l.leads)} />
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Receita do mês</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", marginTop: 12 }}>
            {brl(vendasMes._sum.valueCents ?? 0)}
          </div>
          <div className="sobretitulo" style={{ color: "var(--texto-fraco)", marginTop: 6 }}>
            vendas registradas
          </div>
          <div style={{ marginTop: 22, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>{disparos7d}</div>
          <div className="sobretitulo" style={{ color: "var(--texto-fraco)" }}>
            disparos concluídos (7d)
          </div>
        </div>
      </div>

      <AtencaoManual itens={atencao} />
      <PainelPropostas dados={propostasOrdenadas} agora={agora} ordem={ordemPropostas} hrefOrdem={hrefOrdem} />
      <FiltroPeriodo periodo={periodo} />
      <PainelCustos dados={custos} />
      <CardsEtapa contagem={contagemPeriodo} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <FunilAgendamento dados={funil(contagemPeriodo)} />
        <ReunioesPorDia dias={reunioesPorDia(eventosAgenda.map((e) => e.timestamp), periodo)} />
      </div>
      <div style={{ marginBottom: 22 }}>
        <HistoricoDiario linhas={historico} />
      </div>

      <PainelSemResposta
        itens={semResposta.slice(0, TOPO_PAINEL)}
        total={semResposta.length}
        cache={cache}
        compacto
      />

      <div className="card" style={{ padding: 18, marginBottom: 22 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Funil de contatos</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ESTAGIOS.map((e) => (
            <Link
              key={e.key}
              href={`/contatos?estagio=${e.key}`}
              style={{
                flex: "1 1 120px",
                border: "1px solid var(--linha)",
                borderRadius: 10,
                padding: "12px 14px",
                borderLeft: `3px solid ${e.cor}`,
              }}
            >
              <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>{e.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{contagem.get(e.key) ?? 0}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Propostas de agentes aguardando</h2>
          <Link href="/agentes" style={{ marginLeft: "auto", fontSize: 13, color: "var(--acento)" }}>
            Ver todas →
          </Link>
        </div>
        {propostas.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {propostas.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--linha)",
                  fontSize: 14,
                }}
              >
                <span style={{ fontWeight: 600 }}>{p.agent.name}</span>
                <span style={{ color: "var(--texto-fraco)" }}>{p.acao}</span>
                {p.contact ? (
                  <Link href={`/contatos/${p.contact.id}`} style={{ color: "var(--acento)" }}>
                    {p.contact.name}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--texto-fraco)", fontSize: 14 }}>
            Nenhuma proposta aguardando aprovação.
          </p>
        )}
      </div>
    </div>
  );
}
