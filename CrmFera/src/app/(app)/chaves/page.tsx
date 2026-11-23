import Link from "next/link";
import { CATALOGO, GRUPOS, type ChaveDoCatalogo } from "@/lib/chaves-catalogo";
import { chavesNaTela, type ChaveNaTela } from "@/lib/chaves";
import { apagarChaveAcao, retestarChaveAcao, salvarChaveAcao } from "./acoes";

export const dynamic = "force-dynamic";

const COR = { ok: "#16a34a", erro: "#dc2626", neutro: "#64748b", falta: "#94a3b8" };

function selo(chave: ChaveNaTela): { texto: string; cor: string } {
  if (!chave.salva) return { texto: "Falta", cor: COR.falta };
  if (chave.status?.ok === true) return { texto: "Funcionando", cor: COR.ok };
  if (chave.status?.ok === false) return { texto: "Recusada", cor: COR.erro };
  return { texto: "Salva", cor: COR.neutro };
}

function CartaoChave({ item, chave }: { item: ChaveDoCatalogo; chave: ChaveNaTela }) {
  const estado = selo(chave);
  return (
    <div className="card" style={{ padding: 18 }} id={item.env}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 15 }}>{item.nome}</strong>
        <span className="etiqueta" style={{ background: estado.cor, color: "#fff" }}>
          {estado.texto}
        </span>
        {chave.salva ? <span style={{ fontSize: 12, color: "var(--texto-fraco)" }}>{chave.fim}</span> : null}
      </div>
      <p style={{ margin: "8px 0 4px", fontSize: 14 }}>{item.libera}</p>
      <p style={{ margin: 0, fontSize: 13, color: "var(--texto-fraco)" }}>{item.dica}</p>

      {chave.status ? (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: chave.status.ok === false ? COR.erro : "var(--texto-fraco)" }}>
          {chave.status.msg}
        </p>
      ) : null}

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Como pegar</summary>
        <ol style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
          {item.passos.map((passo) => (
            <li key={passo}>{passo}</li>
          ))}
        </ol>
        {item.onde ? (
          <a href={item.onde} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--acento)", fontWeight: 600 }}>
            Abrir a página certa
          </a>
        ) : null}
      </details>

      <form action={salvarChaveAcao} style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <input type="hidden" name="env" value={item.env} />
        <input
          name="valor"
          type="password"
          autoComplete="off"
          required
          aria-label={`Valor de ${item.nome}`}
          placeholder={chave.salva ? "Colar uma chave nova para trocar" : "Cole a chave aqui"}
          style={{ flex: "1 1 220px", minWidth: 0 }}
        />
        <button className="btn" type="submit">
          Salvar e testar
        </button>
      </form>

      {chave.salva ? (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <form action={retestarChaveAcao}>
            <input type="hidden" name="env" value={item.env} />
            <button className="btn btn-sec" type="submit" style={{ padding: "6px 12px", fontSize: 13 }}>
              Testar de novo
            </button>
          </form>
          <form action={apagarChaveAcao}>
            <input type="hidden" name="env" value={item.env} />
            <button className="btn btn-sec" type="submit" style={{ padding: "6px 12px", fontSize: 13 }}>
              Apagar
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default async function Chaves() {
  const naTela = new Map((await chavesNaTela()).map((c) => [c.env, c]));
  const funcionando = [...naTela.values()].filter((c) => c.status?.ok === true).length;

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontSize: 22, margin: "0 0 6px" }}>Chaves</h1>
      <p style={{ margin: "0 0 6px", color: "var(--texto-fraco)", fontSize: 14 }}>
        As chaves são suas e ficam guardadas cifradas. O FERABOT do seu computador busca daqui, então você cola uma vez só.
      </p>
      <p style={{ margin: "0 0 22px", fontSize: 14 }}>
        <strong>{funcionando}</strong> funcionando. Não precisa de todas: siga a ordem da{" "}
        <Link href="/jornada" style={{ color: "var(--acento)", fontWeight: 600 }}>
          Jornada
        </Link>
        .
      </p>

      {GRUPOS.map((grupo) => {
        const itens = CATALOGO.filter((c) => c.grupo === grupo.id);
        return (
          <section key={grupo.id} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, margin: "0 0 2px" }}>{grupo.titulo}</h2>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--texto-fraco)" }}>{grupo.quando}</p>
            <div style={{ display: "grid", gap: 12 }}>
      <section className="card" style={{ padding: 16, marginBottom: 22, background: "var(--azul-claro)" }}>
        <h2 style={{ fontSize: 15, margin: "0 0 6px" }}>Deixe o FERABOT fazer os cliques por você</h2>
        <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>
          Pegar chave dá muitos cliques em sites diferentes, principalmente as do Google e do YouTube e o token da Meta.
          Instale a extensão do Claude no Chrome (procure Claude na Chrome Web Store e entre com a sua conta do Claude) e
          peça no chat: <em>/fera pega a minha chave do [serviço] usando a extensão do Claude no Chrome</em>. Ele assume a
          tela e faz os cliques. Você só entra nas suas contas e confirma. A chave você mesmo cola aqui.
        </p>
      </section>
              {itens.map((item) => {
                const chave = naTela.get(item.env);
                return chave ? <CartaoChave key={item.env} item={item} chave={chave} /> : null;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
