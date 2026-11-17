import Link from "next/link";
import { DIRECAO_PADRAO, type CampoOrdem, type DirecaoOrdem, type LinhaProposta, type PainelPropostas as Dados } from "@/lib/painel-propostas";

const FUSO = "America/Sao_Paulo";

function brl(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function dataHora(d: Date): string {
  return d.toLocaleString("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function diaMes(d: Date): string {
  return d.toLocaleDateString("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit" });
}

function haQuanto(d: Date, agora: Date): string {
  const horas = Math.floor((agora.getTime() - d.getTime()) / 3_600_000);
  if (horas < 1) return "agora há pouco";
  if (horas < 24) return `há ${horas}h`;
  return `há ${Math.floor(horas / 24)}d`;
}

function corDaChance(pct: number): string {
  if (pct >= 20) return "#0F9D6B";
  if (pct >= 10) return "#C2790A";
  return "#6B7280";
}

function Pontos({ feitos, total }: { feitos: number; total: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 3, verticalAlign: "middle" }} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: i < feitos ? "var(--acento)" : "transparent",
            border: `1.5px solid ${i < feitos ? "var(--acento)" : "var(--linha)"}`,
          }}
        />
      ))}
    </span>
  );
}

/** Botão redondo com o símbolo do WhatsApp: abre a conversa com o lead (wa.me) em outra aba. */
function BotaoWhatsapp({ telefone, nome }: { telefone: string | null; nome: string }) {
  if (!telefone) return null;
  return (
    <a
      href={`https://wa.me/${telefone}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir a conversa com ${nome} no WhatsApp`}
      title="Abrir a conversa no WhatsApp"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: 999,
        background: "#25D366",
        flex: "none",
      }}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="#fff" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    </a>
  );
}

const ROTULO_ORDEM: Record<CampoOrdem, string> = {
  chance: "Chance",
  proposta: "Data da proposta",
  ultima: "Última mensagem enviada",
  proximo: "Próximo follow-up",
};

/** Botões de ordenação: clicar escolhe o campo; clicar de novo no ativo inverte o sentido. */
function BotoesDeOrdem({
  ordem,
  href,
}: {
  ordem: { campo: CampoOrdem; dir: DirecaoOrdem };
  href: (campo: CampoOrdem, dir: DirecaoOrdem) => string;
}) {
  const campos: CampoOrdem[] = ["chance", "proposta", "ultima", "proximo"];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: "var(--texto-fraco)" }}>Ordenar por</span>
      {campos.map((c) => {
        const ativo = ordem.campo === c;
        const proxima: DirecaoOrdem = ativo ? (ordem.dir === "asc" ? "desc" : "asc") : DIRECAO_PADRAO[c];
        return (
          <Link
            key={c}
            href={href(c, proxima)}
            aria-pressed={ativo}
            title={ativo ? "Clique para inverter a ordem" : `Ordenar por ${ROTULO_ORDEM[c].toLowerCase()}`}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              border: "1px solid var(--linha)",
              background: ativo ? "var(--acento)" : "transparent",
              color: ativo ? "#fff" : "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {ROTULO_ORDEM[c]}
            {ativo ? (ordem.dir === "asc" ? " ↑" : " ↓") : ""}
          </Link>
        );
      })}
    </div>
  );
}

/** O "!" de ação manual: círculo vermelho antes do nome, com o motivo no tooltip. */
const ALERTA = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  marginRight: 6,
  borderRadius: "50%",
  background: "#dc2626",
  color: "#fff",
  fontSize: 12,
  fontWeight: 800,
  cursor: "help",
  verticalAlign: "middle",
} as const;

const MOTIVO = { display: "block", fontSize: 11, color: "var(--texto-fraco)", whiteSpace: "normal", maxWidth: 220 } as const;

function Proximo({ l }: { l: LinhaProposta }) {
  if (!l.proximo) return <span style={MOTIVO}>{l.motivo ?? "sem próximo toque"}</span>;
  return (
    <span>
      D+{l.proximo.d} · {diaMes(l.proximo.quando)}
      {l.motivo ? <span style={MOTIVO}>{l.motivo}</span> : null}
    </span>
  );
}

const CELULA = { padding: "10px 12px", borderBottom: "1px solid var(--linha)", fontSize: 13, verticalAlign: "middle" } as const;
const CABECALHO = {
  padding: "8px 12px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.8,
  textAlign: "left",
  color: "var(--texto-fraco)",
  borderBottom: "1px solid var(--linha)",
  whiteSpace: "nowrap",
} as const;

export default function PainelPropostas({
  dados,
  agora,
  ordem,
  hrefOrdem,
}: {
  dados: Dados;
  agora: Date;
  ordem: { campo: CampoOrdem; dir: DirecaoOrdem };
  hrefOrdem: (campo: CampoOrdem, dir: DirecaoOrdem) => string;
}) {
  const { linhas, totalCentavos, esperadoCentavos } = dados;
  return (
    <section className="card" style={{ padding: 18, marginBottom: 22 }}>
      <style>{`
        .pp-tabela { min-width: 760px; }
        .pp-col-m { display: none; }
        @media (max-width: 700px) {
          .pp-tabela { min-width: 0; }
          .pp-col-d { display: none; }
          .pp-col-m { display: block; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Propostas em análise</h2>
        <span style={{ fontSize: 12, color: "var(--texto-fraco)" }}>
          {linhas.length} {linhas.length === 1 ? "lead" : "leads"} · {brl(totalCentavos)} em propostas · {brl(esperadoCentavos)} esperados pela chance estimada
        </span>
        <Link href="/contatos?estagio=proposta" style={{ marginLeft: "auto", fontSize: 13, color: "var(--acento)" }}>
          Ver contatos →
        </Link>
      </div>

      {linhas.length ? <BotoesDeOrdem ordem={ordem} href={hrefOrdem} /> : null}

      {linhas.length ? (
        <div style={{ overflowX: "auto" }}>
          <table className="pp-tabela" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={CABECALHO}>LEAD</th>
                <th style={CABECALHO}>VALOR</th>
                <th style={CABECALHO}>FOLLOW-UPS</th>
                <th className="pp-col-d" style={CABECALHO}>ÚLTIMA MENSAGEM ENVIADA</th>
                <th className="pp-col-d" style={CABECALHO}>PRÓXIMO TOQUE</th>
                <th className="pp-col-d" style={{ ...CABECALHO, textAlign: "right" }}>CHANCE</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id}>
                  <td style={CELULA}>
                    {l.acaoManual ? (
                      <span title={l.acaoManual} aria-label={`Ação manual: ${l.acaoManual}`} style={ALERTA}>
                        !
                      </span>
                    ) : null}
                    <Link href={`/contatos/${l.id}`} style={{ fontWeight: 600, color: "var(--acento)" }}>
                      {l.nome}
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <BotaoWhatsapp telefone={l.telefone} nome={l.nome} />
                      {l.diasDesdeProposta !== null ? (
                        <span style={{ fontSize: 11, color: "var(--texto-fraco)" }}>
                          proposta há {Math.max(0, l.diasDesdeProposta)}d
                        </span>
                      ) : null}
                    </div>
                    <div className="pp-col-m" style={{ marginTop: 4, fontSize: 11, color: "var(--texto-fraco)" }}>
                      <span
                        title={l.chance.motivos.join("\n")}
                        style={{ fontWeight: 700, color: corDaChance(l.chance.pct), marginRight: 6 }}
                      >
                        {l.chance.pct}%
                      </span>
                      {l.ultimaEnviadaEm ? `última msg ${dataHora(l.ultimaEnviadaEm)}` : "nenhuma msg enviada"}
                      {l.proximo ? ` · próximo D+${l.proximo.d} ${diaMes(l.proximo.quando)}` : ""}
                      {l.motivo ? ` · ${l.motivo}` : ""}
                      {l.ultimaResumo ? <div style={{ marginTop: 2 }}>“{l.ultimaResumo}”</div> : null}
                    </div>
                  </td>
                  <td style={{ ...CELULA, whiteSpace: "nowrap" }}>
                    {l.valorCentavos === null ? (
                      <span
                        title="Nenhuma oferta com valor foi encontrada na conversa. Para definir: tag oferta-sprint, ou o campo valor_proposta na ficha."
                        style={{ color: "var(--texto-fraco)" }}
                      >
                        —
                      </span>
                    ) : (
                      <>
                        <span title={l.valorEvidencia ?? undefined} style={{ fontWeight: 600 }}>
                          {brl(l.valorCentavos)}
                          {l.valorOrigem === "conversa" || l.valorOrigem === "agente" ? " *" : ""}
                        </span>
                        {l.valorRotulo ? (
                          <div style={{ fontSize: 11, color: "var(--texto-fraco)", marginTop: 2 }}>{l.valorRotulo}</div>
                        ) : null}
                      </>
                    )}
                  </td>
                  <td style={{ ...CELULA, whiteSpace: "nowrap" }}>
                    <Pontos feitos={Math.min(l.followups, l.totalDeToques)} total={l.totalDeToques} />{" "}
                    <span style={{ marginLeft: 6, fontWeight: 600 }}>{l.followups}</span>
                    <span style={{ color: "var(--texto-fraco)" }}>/{l.totalDeToques}</span>
                  </td>
                  <td className="pp-col-d" style={{ ...CELULA, minWidth: 230, maxWidth: 320 }}>
                    {l.ultimaEnviadaEm ? (
                      <>
                        <div style={{ whiteSpace: "nowrap" }}>
                          {dataHora(l.ultimaEnviadaEm)}{" "}
                          <span style={{ color: "var(--texto-fraco)" }}>· {haQuanto(l.ultimaEnviadaEm, agora)}</span>
                        </div>
                        {l.ultimaResumo ? (
                          <div
                            title={l.ultimaResumoCompleto ?? undefined}
                            style={{
                              marginTop: 2,
                              fontSize: 11,
                              lineHeight: 1.35,
                              color: "var(--texto-fraco)",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {l.ultimaResumo}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <span style={{ color: "var(--texto-fraco)" }}>nenhuma</span>
                    )}
                  </td>
                  <td className="pp-col-d" style={{ ...CELULA, whiteSpace: "nowrap", color: "var(--texto-fraco)" }}>
                    <Proximo l={l} />
                  </td>
                  <td style={{ ...CELULA, textAlign: "right", whiteSpace: "nowrap" }}>
                    <span
                      title={l.chance.motivos.join("\n")}
                      style={{
                        display: "inline-block",
                        minWidth: 52,
                        textAlign: "center",
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontWeight: 700,
                        color: corDaChance(l.chance.pct),
                        border: `1.5px solid ${corDaChance(l.chance.pct)}`,
                      }}
                    >
                      {l.chance.pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: "var(--texto-fraco)", fontSize: 14 }}>Nenhum lead em análise de proposta.</p>
      )}

      <p style={{ fontSize: 11, color: "var(--texto-fraco)", marginTop: 10 }}>
        Chance = estimativa por sinais da conversa (resposta recente, conversa longa, pediu o valor, silêncio, proposta vencida), partindo
        de 8% (3 vendas em 31 propostas resolvidas). Passe o mouse no número para ver os motivos. Valor: o da proposta registrada, ou da
        oferta mais recente da conversa (o convite do Sprint, R$ 3.000, vale quando veio depois da proposta). * valor achado na conversa
        ou pelo agente, não registrado. Para corrigir: tag oferta-sprint, ou o campo valor_proposta na ficha.
      </p>
    </section>
  );
}
