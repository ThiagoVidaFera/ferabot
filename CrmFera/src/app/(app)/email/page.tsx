import { db } from "@/lib/db";
import { configSmtp } from "@/lib/email";
import { salvarTemplate, enviarTemplateParaLista, enviarTeste } from "./acoes";
import EditorTemplate from "./EditorTemplate";

export default async function Email() {
  const [templates, listas, smtp, enviados] = await Promise.all([
    db.emailTemplate.findMany({ orderBy: { createdAt: "desc" } }),
    db.contactList.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    }),
    configSmtp(),
    db.emailSend.count(),
  ]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>E-mail</h1>
        <span
          className="etiqueta"
          style={{
            background: smtp ? "#10B98122" : "#EF444422",
            color: smtp ? "#10B981" : "#EF4444",
          }}
        >
          {smtp ? `SMTP: ${smtp.host}:${smtp.porta}` : "SMTP não configurado"}
        </span>
        <span style={{ color: "var(--texto-fraco)", fontSize: 13 }}>{enviados} enviado(s)</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
        <form action={salvarTemplate} className="card" style={{ padding: 18 }}>
          <h2 style={h2}>Novo template</h2>
          <Campo rotulo="Nome">
            <input name="name" required placeholder="Convite pra call" />
          </Campo>
          <Campo rotulo="Assunto">
            <input name="subject" required placeholder="{{nome}}, separei um horário pra você" />
          </Campo>
          <Campo rotulo="HTML — use {{nome}}">
            <textarea
              name="html"
              rows={8}
              placeholder="<p>Oi {{nome}}, tudo certo?</p>"
              defaultValue=""
            />
          </Campo>
          <button className="btn" type="submit">
            Salvar template
          </button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <form action={enviarTemplateParaLista} className="card" style={{ padding: 18 }}>
            <h2 style={h2}>Disparar por lista</h2>
            <Campo rotulo="Template">
              <select name="templateId" required defaultValue="">
                <option value="">— escolha —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Lista">
              <select name="listId" required defaultValue="">
                <option value="">— escolha —</option>
                {listas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l._count.members})
                  </option>
                ))}
              </select>
            </Campo>
            <button className="btn" type="submit" disabled={!smtp}>
              Disparar agora
            </button>
            {!smtp ? (
              <p style={{ fontSize: 12, color: "var(--texto-fraco)", marginTop: 8 }}>
                Configure o SMTP em Configurações antes de disparar.
              </p>
            ) : null}
          </form>

          <form action={enviarTeste} className="card" style={{ padding: 18 }}>
            <h2 style={h2}>Enviar e-mail de teste</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <input name="para" type="email" placeholder="voce@exemplo.com" required />
              <button className="btn btn-sec" type="submit">
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20, padding: 18 }}>
        <h2 style={h2}>Templates</h2>
        {templates.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {templates.map((t) => (
              <EditorTemplate
                key={t.id}
                template={{ id: t.id, name: t.name, subject: t.subject, html: t.html }}
              />
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--texto-fraco)", fontSize: 14 }}>Nenhum template ainda.</p>
        )}
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
