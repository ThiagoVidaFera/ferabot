import Link from "next/link";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { negocio } from "@/lib/negocio";
import { nivelDoPainel, whatsappDoSuporte } from "@/lib/hospedado";
import { contarProgresso, lerPlano, lerProgresso } from "@/lib/plano-cliente-banco";
import { temConteudo } from "@/lib/plano-cliente";
import { ferabotVistoEm, tokenDoFerabot } from "@/lib/jornada-estado";
import { promptCompleto } from "@/lib/prompts-jornada";
import { enderecoDoPainel } from "../jornada/ligacao";
import { CaixaDePrompt } from "../jornada/Passos";

export const dynamic = "force-dynamic";

const VERDE = "#16a34a";

type Etapa = {
  titulo: string;
  feito: boolean;
  passos: string[];
  acao?: { href: string; rotulo: string };
  nota?: string;
  prompt?: string;
};

function Cartao({ numero, etapa }: { numero: number; etapa: Etapa }) {
  return (
    <section className="card" style={{ padding: 18, borderColor: etapa.feito ? VERDE : undefined }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span
          aria-hidden
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 17,
            background: etapa.feito ? VERDE : "var(--acento)",
            color: "#fff",
          }}
        >
          {etapa.feito ? "✓" : numero}
        </span>
        <h2 style={{ fontSize: 17, margin: 0, minWidth: 0 }}>
          {etapa.titulo}
          {etapa.feito ? <span style={{ display: "block", fontSize: 12, color: VERDE, fontWeight: 600 }}>Feito</span> : null}
        </h2>
      </div>
      <ol style={{ margin: "12px 0 0", paddingLeft: 22, fontSize: 15, lineHeight: 1.6 }}>
        {etapa.passos.map((p) => (
          <li key={p} style={{ marginBottom: 4 }}>
            {p}
          </li>
        ))}
      </ol>
      {etapa.prompt && !etapa.feito ? <CaixaDePrompt prompt={etapa.prompt} /> : null}
      {etapa.nota ? <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--texto-fraco)" }}>{etapa.nota}</p> : null}
      {etapa.acao ? (
        <Link href={etapa.acao.href} className="btn" style={{ marginTop: 12, display: "inline-block", textDecoration: "none" }}>
          {etapa.acao.rotulo}
        </Link>
      ) : null}
    </section>
  );
}

/**
 * "Comece aqui": o manual do painel em passos de uma linha, para o cliente usar sozinho.
 * Cada etapa marca Feito pelo estado real (plano aprovado, vídeo publicado, post publicado).
 */
export default async function Comece() {
  const [plano, progresso, nome, leads] = await Promise.all([
    lerPlano(),
    lerProgresso(),
    config("negocio_nome"),
    db.contact.count(),
  ]);
  const equipe = nivelDoPainel() === "equipe";
  const conta = contarProgresso(plano, progresso);
  const suporte = whatsappDoSuporte();
  const primeiroNome = (nome || negocio().dono.nome || "").split(" ")[0];

  const instalacao: Etapa[] = equipe
    ? []
    : [
        {
          titulo: "Instale o FERABOT no seu computador",
          feito: Boolean(await ferabotVistoEm()),
          passos: [
            "Assine o Claude em claude.ai (plano Pro ou maior). É lá que o FERABOT trabalha.",
            "Baixe e abra o aplicativo do Claude no computador (claude.ai/download) e entre na parte Code (Claude Code).",
            "Escolha a pasta Documentos para trabalhar.",
            "Copie o prompt abaixo, cole no Claude Code e aperte Enter. Ele instala tudo, liga ao seu painel e te guia nas duas chaves grátis.",
            "Nas próximas vezes: abra o Claude Code na pasta Documentos/ferabot e digite /fera.",
          ],
          prompt: promptCompleto("chaves", await enderecoDoPainel(), await tokenDoFerabot()),
          acao: { href: "/chaves", rotulo: "Abrir Chaves" },
        },
      ];

  const etapas: Etapa[] = [
    ...instalacao,
    {
      titulo: "Leia o seu plano e aprove",
      feito: Boolean(plano.aprovadoEm),
      passos: [
        "Aperte o botão abaixo.",
        "Leia a sua ideia central, o seu método e as frases para repetir.",
        "Está do jeito que você fala? Aperte \"Aprovei a minha narrativa\".",
        equipe
          ? "Quer mudar alguma palavra? Mande a frase no WhatsApp antes de aprovar."
          : "Quer mudar alguma palavra? Peça ao FERABOT com o prompt do passo 2 da Jornada e aprove depois.",
      ],
      acao: temConteudo(plano) ? { href: "/configuracoes#plano", rotulo: "Abrir meu plano" } : undefined,
      nota: temConteudo(plano) ? undefined : "O seu plano ainda está sendo montado. Ele aparece aqui assim que ficar pronto.",
    },
    {
      titulo: `Grave os vídeos do YouTube (${conta.publicados} de ${conta.roteiros} publicados)`,
      feito: conta.roteiros > 0 && conta.publicados === conta.roteiros,
      passos: [
        "Abra o roteiro 1 e leia duas vezes em voz alta.",
        "Grave com o celular deitado, de frente para uma janela, num lugar quieto.",
        "Não precisa decorar nem ler palavra por palavra. Fale do seu jeito, olhando para a câmera.",
        "Errou? Respire e continue. Pausa pode ser cortada depois.",
        "Terminou? Volte no roteiro e aperte \"Gravei\".",
        "Publique no YouTube com o título do roteiro (copie e cole). Depois cole o link do vídeo e aperte \"Publiquei\".",
        "Um vídeo por semana já faz o motor andar. Depois do 1, vem o 2.",
      ],
      acao: conta.roteiros ? { href: "/configuracoes#youtube", rotulo: "Abrir meus roteiros" } : undefined,
    },
    {
      titulo: `Publique os posts do Instagram (${conta.postsPublicados} de ${plano.postsInstagram.length})`,
      feito: plano.postsInstagram.length > 0 && conta.postsPublicados === plano.postsInstagram.length,
      passos: [
        "Toque no título de um post para abrir.",
        "Aperte \"Copiar\".",
        "No Instagram, crie o post e cole o texto.",
        "Publicou? Volte aqui e aperte \"Publiquei este post\".",
        "Dois ou três posts por semana é um bom ritmo.",
      ],
      acao: plano.postsInstagram.length ? { href: "/configuracoes#posts", rotulo: "Abrir meus posts" } : undefined,
    },
    {
      titulo: `Veja quem chegou (${leads} até agora)`,
      feito: false,
      passos: [
        "Toda pessoa que deixa nome e WhatsApp aparece em Leads.",
        "Abra uma vez por dia. Leva dois minutos.",
        "Responda no mesmo dia: quem espera esfria.",
        "Quando a pessoa quiser conversar com você, marque a reunião e apareça. Essa parte é sua.",
      ],
      acao: { href: "/leads", rotulo: "Abrir Leads" },
    },
  ];

  return (
    <div style={{ maxWidth: 680, display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>
          {primeiroNome ? `${primeiroNome}, comece por aqui` : "Comece por aqui"}
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
          Este painel é a casa do seu negócio na internet: o seu plano, os seus vídeos, os seus posts e as pessoas que
          chegam até você. Faça um passo de cada vez, de cima para baixo. Cada um fica verde sozinho quando você termina.
        </p>
      </div>

      {equipe ? (
        <section className="card" style={{ padding: 18, background: "var(--azul-claro)" }}>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>O que a equipe faz por você</h2>
          <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>
            A página, o WhatsApp, os anúncios e o seu canal do YouTube arrumado ficam com a equipe do Thiago. Você não
            precisa mexer em nada técnico. A sua parte é aparecer: gravar os vídeos, publicar os posts e conversar com
            quem chega.
          </p>
        </section>
      ) : null}

      {etapas.map((etapa, i) => (
        <Cartao key={etapa.titulo} numero={i + 1} etapa={etapa} />
      ))}

      <section className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>A sua semana, simples</h2>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.7 }}>
          <li>Segunda: gravar 1 vídeo do plano.</li>
          <li>Terça e quinta: publicar 1 post.</li>
          <li>Todo dia, 2 minutos: abrir Leads e responder quem chegou.</li>
        </ul>
        <p style={{ fontSize: 13, color: "var(--texto-fraco)", margin: "10px 0 0" }}>
          Quer ver o caminho inteiro? Abra a{" "}
          <Link href="/jornada" style={{ color: "var(--acento)", fontWeight: 600 }}>
            Jornada
          </Link>
          .
        </p>
      </section>

      <section className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Guia de prompts: tudo o que dá para pedir ao FERABOT</h2>
        <p style={{ fontSize: 14, lineHeight: 1.55, margin: "0 0 10px" }}>
          Prompts prontos para página, carrossel, anúncio, story, webinar e isca, o que colar quando travar e o passo a
          passo de cada chave.
        </p>
        <Link href="/prompts" className="btn" style={{ display: "inline-block", textDecoration: "none" }}>
          Abrir o Guia de prompts
        </Link>
      </section>

      {suporte ? (
        <section className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Travou em algum passo?</h2>
          <p style={{ fontSize: 14, margin: "0 0 10px" }}>
            Mande uma mensagem dizendo o número do passo e o que aconteceu. Um print da tela ajuda muito.
          </p>
          <a
            className="btn btn-sec"
            href={`https://wa.me/${suporte}?text=${encodeURIComponent("Oi, Thiago. Travei no painel, no passo ")}`}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Pedir ajuda no WhatsApp
          </a>
        </section>
      ) : null}
    </div>
  );
}
