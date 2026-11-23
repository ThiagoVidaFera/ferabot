import FormPrimeiroAcesso from "./FormPrimeiroAcesso";

export const dynamic = "force-dynamic";

/** Primeiro acesso: o painel só abre depois que o dono troca a senha de entrada por uma dele. */
export default function PrimeiroAcesso() {
  return (
    <div style={{ maxWidth: 460, display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Bem-vindo ao seu painel</h1>
      <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0 }}>
        Antes de tudo, troque a senha de entrada por uma só sua. É aqui que vão ficar os seus leads e as chaves das
        suas contas.
      </p>
      <FormPrimeiroAcesso />
    </div>
  );
}
