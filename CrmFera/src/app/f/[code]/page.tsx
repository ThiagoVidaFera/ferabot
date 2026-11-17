import { db } from "@/lib/db";
import { criativoDoAnuncio } from "@/lib/meta-ads";
import {
  apenasDigitos,
  coletarRespostas,
  handleInstagram,
  origemDoLead,
  type DadosLead,
} from "@/lib/ficha";

export const dynamic = "force-dynamic";

// Ficha de lead nao entra em indice de busca. O titulo leva o nome do lead: o
// Quem atende costuma ter varias abas abertas e precisa achar a certa pela aba.
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ficha = await db.ficha.findUnique({ where: { code: code.replace(/[^a-z0-9]/gi, "") } });
  const dados = (ficha?.dados ?? {}) as DadosLead;
  const nome = String(dados.nome ?? "").trim();
  return {
    title: nome ? `${nome} — ficha do lead` : "Ficha do lead",
    robots: { index: false, follow: false },
  };
}

const FUSO = "America/Sao_Paulo";

function quando(iso: unknown): string {
  const bruto = String(iso ?? "");
  if (!bruto) return "";
  const d = new Date(bruto);
  if (Number.isNaN(d.getTime())) return "";
  const data = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  const h = (Date.now() - d.getTime()) / 3600000;
  const rel = h < 1 ? "agora há pouco" : h < 24 ? `há ${Math.round(h)}h` : `há ${Math.round(h / 24)} dias`;
  return `${data} · ${rel}`;
}

function Recado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-10">
      <div className="rounded-2xl border border-linha bg-painel p-5">
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        <p className="mt-2 text-[15px] text-texto-fraco">{texto}</p>
      </div>
    </main>
  );
}

export default async function FichaDoLead({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const limpo = code.replace(/[^a-z0-9]/gi, "");
  const ficha = limpo ? await db.ficha.findUnique({ where: { code: limpo } }) : null;

  if (!ficha) {
    return <Recado titulo="Link não encontrado" texto="Essa ficha não existe ou já foi removida." />;
  }
  if (ficha.expiraEm.getTime() < Date.now()) {
    return (
      <Recado
        titulo="Link expirado"
        texto="Fichas valem 30 dias. Abra o lead direto no CRM."
      />
    );
  }

  // contador de aberturas: mostra se o aviso virou leitura de verdade.
  // Nunca pode derrubar a pagina — quem atende esta com o lead esperando.
  try {
    await db.ficha.update({ where: { code: limpo }, data: { aberturas: { increment: 1 } } });
  } catch {
    /* ignora */
  }

  const dados = (ficha.dados ?? {}) as DadosLead;
  const contato = ficha.contactId
    ? await db.contact.findUnique({ where: { id: ficha.contactId } })
    : null;

  // O snapshot manda; o contato do CRM completa o que faltar (ele pode ter sido
  // enriquecido depois — Instagram achado na mão, e-mail de uma compra).
  const campos = (contato?.customFields ?? {}) as Record<string, unknown>;
  const nome = String(dados.nome ?? contato?.name ?? "Sem nome").trim();
  const primeiro = nome.split(" ")[0];
  const telefone = apenasDigitos(dados.telefone ?? dados.whatsapp ?? contato?.phone);
  const ig = handleInstagram(dados.instagram ?? campos.instagram);
  const origem = origemDoLead(dados);
  const respostas = coletarRespostas(dados);
  const dias = Math.max(1, Math.ceil((ficha.expiraEm.getTime() - Date.now()) / 86400000));
  // A peça que ele clicou vale mais que o nome dela. Se a Graph não responder,
  // o bloco degrada pro nome — nunca some e nunca derruba a página.
  const anuncio = await criativoDoAnuncio(dados.ad);

  const marcas: string[] = [];
  const temp = String(dados.temp_label ?? dados.faixa ?? "");
  if (temp) marcas.push(temp);
  if (dados.score != null && dados.score !== "") marcas.push(`Score ${dados.score}/100`);
  const chips = Array.isArray(dados.chips) ? (dados.chips as unknown[]) : [];
  chips.forEach((c) => marcas.push(String(c)));
  const email = String(dados.email ?? contato?.email ?? "");
  if (email) marcas.push(email);

  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-5 pb-14">
      {/* Cabecalho: quem e, quando chegou, e as duas acoes. Elas ficam ACIMA de
          tudo porque o aviso existe pra virar conversa, nao pra virar leitura. */}
      <section className="rounded-2xl border border-linha bg-painel p-5">
        <span className="inline-block rounded-full bg-acento px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.09em] text-white">
          Lead novo
        </span>
        <h1 className="mt-3 text-[clamp(23px,6.5vw,30px)] font-bold leading-tight tracking-tight">
          {nome}
        </h1>
        <p className="mt-1 text-sm text-texto-fraco">
          {quando(dados._ingested_at ?? dados.created_time ?? ficha.criadaEm.toISOString())}
        </p>

        <div className="mt-4 grid gap-2.5">
          {telefone ? (
            <a
              href={`https://wa.me/${telefone}`}
              className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-[#25D366] px-4 py-3 font-bold text-[#04270f]"
            >
              <span className="text-xl leading-none">💬</span>
              <span>
                Abrir conversa no WhatsApp
                <small className="block text-[12.5px] font-medium opacity-80">+{telefone}</small>
              </span>
            </a>
          ) : null}
          {ig ? (
            <a
              href={`https://instagram.com/${ig}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-[linear-gradient(90deg,#F58529,#DD2A7B_55%,#8134AF)] px-4 py-3 font-bold text-white"
            >
              <span className="text-xl leading-none">📷</span>
              <span>
                Ver o Instagram
                <small className="block text-[12.5px] font-medium opacity-85">@{ig}</small>
              </span>
            </a>
          ) : null}
          {!telefone && !ig ? (
            <p className="text-[15px] text-texto-fraco">Sem telefone e sem Instagram no cadastro.</p>
          ) : null}
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-linha bg-painel p-5">
        <h2 className="text-[12px] font-extrabold uppercase tracking-[0.09em] text-acento">
          De onde ele veio
        </h2>
        <p className="mt-2.5 text-[17px] font-semibold">{origem.titulo}</p>
        {origem.frase ? <p className="mt-1 text-[15px] text-texto-fraco">{origem.frase}</p> : null}
        {marcas.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {marcas.map((m, i) => (
              <span key={i} className="rounded-full bg-linha px-2.5 py-1 text-[12.5px] text-texto-fraco">
                {m}
              </span>
            ))}
          </div>
        ) : null}

        {anuncio ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-linha">
            {anuncio.imagem ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL assinada da CDN da Meta, expira: otimizar não faz sentido
              <img
                src={anuncio.imagem}
                alt={`Criativo do anúncio ${anuncio.nome}`}
                className="block max-h-[280px] w-full bg-fundo object-contain"
              />
            ) : null}
            <div className="p-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.09em] text-texto-fraco">
                Anúncio que ele clicou
              </p>
              <p className="mt-1 break-words text-[14.5px] font-semibold">{anuncio.nome}</p>
              {anuncio.destino ? (
                <a
                  href={anuncio.destino}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-[13px] text-acento underline"
                >
                  {anuncio.destino}
                </a>
              ) : null}
              {anuncio.permalink ? (
                <a
                  href={anuncio.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-[13px] text-texto-fraco underline"
                >
                  ver o anúncio no Facebook
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-3 rounded-2xl border border-linha bg-painel p-5">
        <h2 className="text-[12px] font-extrabold uppercase tracking-[0.09em] text-acento">
          O que {primeiro} respondeu
        </h2>
        {respostas.length ? (
          <div className="mt-1">
            {respostas.map((r, i) => (
              <div key={i} className="border-t border-linha py-3 first:border-t-0 last:pb-0">
                <p className="text-[13px] text-texto-fraco">{r.pergunta}</p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-[16px] font-semibold">
                  {r.resposta}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[15px] text-texto-fraco">
            Esse funil não guardou respostas — o que existe dele está aqui em cima.
          </p>
        )}
      </section>

      <p className="mt-4 text-center text-[12.5px] text-texto-fraco">
        Ficha de uso interno · o link expira em {dias} {dias === 1 ? "dia" : "dias"}
      </p>
    </main>
  );
}
