import Link from "next/link";
import type { DadosFicha } from "./ficha-dados";
import BotaoReligarAgente from "./BotaoReligarAgente";

/**
 * Ficha do lead: de onde ele veio, o que respondeu e o resumo do
 * relacionamento. Sem isso, responder no inbox é responder no escuro — você
 * não sabe se está falando com quem baixou um livro ou com quem já pagou.
 *
 * Duas variantes do MESMO conteúdo, alimentadas por uma consulta só
 * (`carregarFicha`):
 *
 *   coluna  — a terceira coluna do desktop, sempre aberta.
 *   mobile  — painel dobrável no topo da conversa. Existe desde 28/08/2026:
 *             no celular a coluna era `display:none`, então quem abria o
 *             aviso de lead quente pelo WhatsApp caía numa tela só de balões,
 *             sem score, sem tag, sem origem e sem o resumo do agente.
 *
 * O resumo do agente vem PRIMEIRO na variante mobile de propósito: é a única
 * linha que já responde "quem é essa pessoa" sem rolar nada.
 */

/** Campos que a gente sabe nomear; o resto entra como veio. */
const ROTULOS: Record<string, string> = {
  campanha: "Campanha",
  adset: "Conjunto",
  anuncio: "Anúncio",
  form_id: "Formulário",
  funil: "Funil",
  instagram: "Instagram",
  profissao: "Profissão",
  faturamento: "Faturamento",
  ticket: "Ticket",
  ticket_atual: "Ticket atual",
  investir_ads: "Verba pra anúncio",
  seguidores: "Seguidores",
  perfil: "Perfil",
  compromisso: "Compromisso",
  score: "Score",
  objetivo: "Objetivo / faixa",
  utm_source: "Origem UTM",
  utm_campaign: "Campanha UTM",
  utm_medium: "Mídia",
  abertura_ia: "Abertura da IA",
};

function bonito(chave: string): string {
  return ROTULOS[chave] ?? chave.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function brl(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function data(d: Date | null) {
  return d
    ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "—";
}

function linkInstagram(v: string): string {
  const u = v
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/$/, "");
  return `https://instagram.com/${u}`;
}

/** (61) 99999-9999 — número cru na tela é ilegível no celular. */
export function telefoneBonito(numero: string | null): string {
  if (!numero) return "sem número";
  const d = numero.replace(/\D/g, "");
  if (d.length === 13) return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return numero;
}

/**
 * O nome do lead que veio por WhatsApp é o próprio número — o agente conversa
 * mas ninguém batiza. Mostrar "5515900000465" como nome não informa nada.
 */
export function nomeExibido(nome: string, phone: string | null): string {
  const so = (s: string) => s.replace(/\D/g, "");
  if (phone && so(nome) === so(phone)) return telefoneBonito(phone);
  return nome;
}

export default function FichaLead({
  dados,
  variante = "coluna",
}: {
  dados: DadosFicha;
  variante?: "coluna" | "mobile";
}) {
  if (!dados) return null;
  const mobile = variante === "mobile";

  const instagram = dados.qualificacao.find(([k]) => k === "instagram")?.[1];
  const campanha = dados.qualificacao.find(([k]) =>
    ["campanha", "utm_campaign"].includes(k),
  )?.[1];
  const soltos = dados.qualificacao.filter(([k]) => k !== "instagram");
  const nome = nomeExibido(dados.nome, dados.phone);

  const corpo = (
    <>
      {/* Resumo do agente: no celular é a primeira coisa; no desktop fica
          depois do cabeçalho, onde a coluna já tem contexto. */}
      {dados.resumoAgente && !mobile ? (
        <div
          style={{
            background: "var(--acento)11",
            border: "1px solid var(--acento)44",
            borderRadius: 10,
            padding: mobile ? 12 : 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: "var(--acento)",
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Resumo do agente · {data(dados.resumoEm)}
          </div>
          <p style={{ fontSize: mobile ? 14 : 13, lineHeight: 1.45 }}>{dados.resumoAgente}</p>
        </div>
      ) : null}

      {dados.respostas.length ? (
        <Bloco titulo="O que ele respondeu" mobile={mobile}>
          {dados.respostas.map((r, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: "var(--texto-fraco)" }}>{r.pergunta}</div>
              <div style={{ fontSize: mobile ? 14 : 13, wordBreak: "break-word" }}>{r.resposta}</div>
            </div>
          ))}
        </Bloco>
      ) : null}

      {/* Anuncio que trouxe o clique (CTWA). Ver a PECA vale mais que ler o
          nome dela — e o que diz "ah, foi esse criativo" sem abrir o Ads. */}
      {dados.ctwa ? (
        <Bloco titulo={dados.ctwa.tipo === "post" ? "Post que trouxe" : "Anúncio que trouxe"} mobile={mobile}>
          {dados.ctwa.imagem ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL assinada da CDN da Meta, expira
            <img
              src={dados.ctwa.imagem}
              alt={`Criativo de ${dados.ctwa.nome ?? "anúncio"}`}
              style={{
                display: "block",
                width: "100%",
                maxHeight: mobile ? 200 : 150,
                objectFit: "contain",
                borderRadius: 8,
                border: "1px solid var(--linha)",
                marginBottom: 8,
                background: "var(--fundo)",
              }}
            />
          ) : null}
          {dados.ctwa.nome ? <Item rotulo="Anúncio" valor={dados.ctwa.nome} mobile={mobile} /> : null}
          {dados.ctwa.campanha ? (
            <Item rotulo="Campanha" valor={dados.ctwa.campanha} mobile={mobile} />
          ) : null}
          {dados.ctwa.adset ? <Item rotulo="Conjunto" valor={dados.ctwa.adset} mobile={mobile} /> : null}
          {/* Sem nome resolvido, `anuncio` cai pra propria chamada — mostrar as
              duas linhas iguais faz a ficha parecer quebrada. */}
          {dados.ctwa.headline && dados.ctwa.headline !== dados.ctwa.nome ? (
            <Item rotulo="Chamada" valor={dados.ctwa.headline} mobile={mobile} />
          ) : null}
          {dados.ctwa.url ? (
            <Item rotulo="Ver a peça" valor={dados.ctwa.url} href={dados.ctwa.url} mobile={mobile} />
          ) : null}
          {/* Enquanto a Graph nao resolve, o ID e a unica coisa ACIONAVEL —
              da pra colar no Ads Manager e achar a peca na mao. */}
          {!dados.ctwa.campanha && dados.ctwa.adId ? (
            <>
              <Item rotulo="ID do anúncio" valor={dados.ctwa.adId} mobile={mobile} />
              <p style={{ fontSize: 11, color: "var(--texto-fraco)", marginTop: 4 }}>
                Campanha e conjunto não resolvidos — o token do Meta Ads não tem acesso de
                leitura. Cole o ID no Ads Manager pra achar a peça.
              </p>
            </>
          ) : null}
        </Bloco>
      ) : null}

      <Bloco titulo="De onde veio" mobile={mobile}>
        <Item rotulo="Origem" valor={dados.origem} mobile={mobile} />
        {campanha ? <Item rotulo="Campanha" valor={campanha} mobile={mobile} /> : null}
        {dados.identities.map((i) => (
          <Item key={i.id} rotulo={i.fonte} valor={i.externalId} mobile={mobile} />
        ))}
        <Item rotulo="Entrou em" valor={data(dados.createdAt)} mobile={mobile} />
        {dados.primeiraEm ? (
          <Item rotulo="1º registro" valor={data(dados.primeiraEm)} mobile={mobile} />
        ) : null}
      </Bloco>

      <Bloco titulo="Contato" mobile={mobile}>
        {dados.phone ? (
          <Item
            rotulo="WhatsApp"
            valor={telefoneBonito(dados.phone)}
            href={`https://wa.me/${dados.phone}`}
            mobile={mobile}
          />
        ) : null}
        {dados.email ? <Item rotulo="E-mail" valor={dados.email} mobile={mobile} /> : null}
        {instagram ? (
          <Item
            rotulo="Instagram"
            valor={"@" + instagram.replace(/^@/, "")}
            href={linkInstagram(instagram)}
            mobile={mobile}
          />
        ) : null}
        {dados.company ? <Item rotulo="Empresa" valor={dados.company} mobile={mobile} /> : null}
      </Bloco>

      {soltos.length ? (
        <Bloco titulo="Qualificação" mobile={mobile}>
          {soltos.map(([k, v]) => (
            <Item key={k} rotulo={bonito(k)} valor={v} mobile={mobile} />
          ))}
        </Bloco>
      ) : null}

      {dados.tags.includes("humano") ? <BotaoReligarAgente contactId={dados.id} /> : null}

      {dados.tags.length ? (
        <Bloco titulo="Tags" mobile={mobile}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {dados.tags.map((t) => (
              <span
                key={t}
                className="etiqueta"
                style={{ background: "#26262955", color: "var(--texto-fraco)" }}
              >
                {t}
              </span>
            ))}
          </div>
        </Bloco>
      ) : null}

      <Bloco titulo="Relacionamento" mobile={mobile}>
        <Item rotulo="Mensagens" valor={String(dados.totais.mensagens)} mobile={mobile} />
        <Item rotulo="Eventos" valor={String(dados.totais.eventos)} mobile={mobile} />
        {dados.purchaseCount > 0 ? (
          <>
            <Item rotulo="Receita" valor={brl(dados.totalRevenue)} mobile={mobile} />
            <Item
              rotulo="Compras"
              valor={`${dados.purchaseCount}× · última ${data(dados.lastPurchaseAt)}`}
              mobile={mobile}
            />
          </>
        ) : (
          <Item rotulo="Compras" valor="nenhuma" mobile={mobile} />
        )}
      </Bloco>

      {dados.purchases.length ? (
        <Bloco titulo="Comprou" mobile={mobile}>
          {dados.purchases.map((p) => (
            <Item
              key={p.id}
              rotulo={data(p.createdAt)}
              valor={`${p.product} · ${brl(p.valueCents)}`}
              mobile={mobile}
            />
          ))}
        </Bloco>
      ) : null}

      <Link
        href={`/contatos/${dados.id}`}
        className="btn btn-sec"
        style={{ width: "100%", marginTop: 6, minHeight: mobile ? 48 : undefined }}
      >
        Ver ficha completa
      </Link>
    </>
  );

  /* ── Variante mobile ────────────────────────────────────────────────────
     Barra sempre visível com o que decide a resposta (quem é, quão quente,
     em que estágio) + as duas ações de um toque. O resto abre no <details>,
     pra conversa continuar sendo o que ocupa a tela. */
  if (mobile) {
    return (
      <div style={{ borderBottom: "1px solid var(--linha)", padding: "10px 14px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 16, minWidth: 0, wordBreak: "break-word" }}>{nome}</strong>
          <span
            className="etiqueta"
            style={{ background: dados.estagio.cor + "22", color: dados.estagio.cor }}
          >
            {dados.estagio.label}
          </span>
          <ChipCalor pontos={dados.pontos} />
        </div>

        {dados.motivos.length ? (
          <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 4 }}>
            {dados.motivos.join(" · ")}
          </p>
        ) : null}

        {dados.tags.length ? (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
            {dados.tags.map((t) => (
              <span
                key={t}
                className="etiqueta"
                style={{ background: "#26262955", color: "var(--texto-fraco)" }}
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        {/* Alvos de toque grandes: essa tela é lida no celular, em pé. */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {dados.phone ? (
            <a
              href={`https://wa.me/${dados.phone}`}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderRadius: 10,
                background: "#25D36622",
                color: "#25D366",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              💬 WhatsApp
            </a>
          ) : null}
          {instagram ? (
            <a
              href={linkInstagram(instagram)}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderRadius: 10,
                background: "#DD2A7B22",
                color: "#DD2A7B",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              📷 Instagram
            </a>
          ) : null}
        </div>

        {dados.resumoAgente ? (
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.45,
              marginTop: 10,
              color: "var(--texto-fraco)",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {dados.resumoAgente}
          </p>
        ) : null}

        <details style={{ marginTop: 10 }}>
          <summary
            style={{
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--acento)",
              minHeight: 32,
              display: "flex",
              alignItems: "center",
            }}
          >
            Ver todos os dados do lead
          </summary>
          <div style={{ marginTop: 12 }}>{corpo}</div>
        </details>
      </div>
    );
  }

  return (
    <div style={{ borderLeft: "1px solid var(--linha)", overflowY: "auto", padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 15 }}>{nome}</strong>
        <span
          className="etiqueta"
          style={{ background: dados.estagio.cor + "22", color: dados.estagio.cor }}
        >
          {dados.estagio.label}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          margin: "10px 0 14px",
          flexWrap: "wrap",
        }}
      >
        <ChipCalor pontos={dados.pontos} />
        {dados.motivos.length ? (
          <span style={{ fontSize: 11, color: "var(--texto-fraco)" }}>
            {dados.motivos.join(" · ")}
          </span>
        ) : null}
      </div>

      {corpo}
    </div>
  );
}

function ChipCalor({ pontos }: { pontos: number }) {
  return (
    <span
      className="etiqueta"
      data-calor={pontos}
      style={{
        background: pontos >= 55 ? "#EF444422" : pontos >= 30 ? "#F59E0B22" : "#6B728022",
        color: pontos >= 55 ? "#EF4444" : pontos >= 30 ? "#F59E0B" : "#6B7280",
      }}
    >
      {pontos >= 55 ? "🔥" : pontos >= 30 ? "🟡" : "❄️"} {pontos}/100
    </span>
  );
}

function Bloco({
  titulo,
  children,
  mobile,
}: {
  titulo: string;
  children: React.ReactNode;
  mobile?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: "var(--texto-fraco)",
          marginBottom: 6,
          fontWeight: 700,
        }}
      >
        {titulo}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 6 : 4 }}>{children}</div>
    </div>
  );
}

function Item({
  rotulo,
  valor,
  href,
  mobile,
}: {
  rotulo: string;
  valor: string;
  href?: string;
  mobile?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        // No celular a coluna de rótulo fixa de 92px espremia o valor em 3
        // linhas. Empilhar lê melhor num aparelho de 375px.
        flexDirection: mobile ? "column" : "row",
        gap: mobile ? 1 : 8,
        fontSize: mobile ? 14 : 13,
        alignItems: mobile ? "stretch" : "baseline",
      }}
    >
      <span
        style={{
          color: "var(--texto-fraco)",
          flexShrink: 0,
          minWidth: mobile ? undefined : 92,
          fontSize: mobile ? 12 : undefined,
        }}
      >
        {rotulo}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--acento)", wordBreak: "break-word" }}
        >
          {valor}
        </a>
      ) : (
        <span style={{ wordBreak: "break-word" }}>{valor}</span>
      )}
    </div>
  );
}
