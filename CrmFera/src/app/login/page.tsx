import { redirect } from "next/navigation";
import { sessaoAtual } from "@/lib/auth";

// GOTCHA 5 do megaprompt: no Next 16, searchParams e Promise.
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  if (await sessaoAtual()) redirect("/");

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <form
        method="post"
        action="/api/login"
        className="card"
        style={{ width: "100%", maxWidth: 380, padding: 28 }}
      >
        <div style={{ fontSize: 13, letterSpacing: 2, color: "var(--acento)", fontWeight: 700 }}>
          O CÉREBRO
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "6px 0 22px" }}>CRM FERA</h1>

        <label style={{ fontSize: 13, color: "var(--texto-fraco)" }}>E-mail</label>
        <input name="email" type="email" required autoFocus style={{ margin: "6px 0 14px" }} />

        <label style={{ fontSize: 13, color: "var(--texto-fraco)" }}>Senha</label>
        <input name="senha" type="password" required style={{ margin: "6px 0 18px" }} />

        {erro ? (
          <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 14 }}>
            E-mail ou senha incorretos.
          </p>
        ) : null}

        <button className="btn" style={{ width: "100%" }} type="submit">
          Entrar
        </button>
      </form>
    </main>
  );
}
