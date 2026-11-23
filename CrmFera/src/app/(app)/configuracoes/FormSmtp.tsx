import { salvarSmtp } from "./acoes";
import { Campo, h2 } from "./campos";

interface FormSmtpProps {
  cfg: Record<string, string>;
  /** sem moldura de card, para caber dentro de um <details> */
  embutido?: boolean;
}

export default function FormSmtp({ cfg, embutido }: FormSmtpProps) {
  return (
    <form action={salvarSmtp} className={embutido ? undefined : "card"} style={{ padding: embutido ? "12px 0 0" : 18 }}>
      {embutido ? null : <h2 style={h2}>SMTP (e-mail)</h2>}
      <Campo rotulo="Host">
        <input name="host" defaultValue={cfg.smtp_host} placeholder="smtp.gmail.com" />
      </Campo>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 120px" }}>
          <Campo rotulo="Porta">
            <input name="porta" defaultValue={cfg.smtp_porta || "587"} />
          </Campo>
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <Campo rotulo="SSL/TLS">
            <select name="seguro" defaultValue={cfg.smtp_seguro || "0"}>
              <option value="0">STARTTLS / nenhum</option>
              <option value="1">SSL direto (465)</option>
            </select>
          </Campo>
        </div>
      </div>
      <Campo rotulo="Usuário">
        <input name="usuario" defaultValue={cfg.smtp_usuario} />
      </Campo>
      <Campo rotulo="Senha (em branco mantém a atual)">
        <input name="senha" type="password" placeholder={cfg.smtp_senha ? "•••" : ""} />
      </Campo>
      <Campo rotulo="Remetente">
        <input name="remetente" defaultValue={cfg.smtp_remetente} placeholder="contato@seudominio.com.br" />
      </Campo>
      <button className="btn btn-sec" type="submit">
        Salvar e-mail
      </button>
    </form>
  );
}
