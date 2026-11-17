import nodemailer, { type Transporter } from "nodemailer";
import { configMuitas } from "@/lib/config";

export type ConfigSmtp = {
  host: string;
  porta: number;
  usuario: string;
  senha: string;
  remetente: string;
  seguro: boolean;
};

export async function configSmtp(): Promise<ConfigSmtp | null> {
  const s = await configMuitas([
    "smtp_host",
    "smtp_porta",
    "smtp_usuario",
    "smtp_senha",
    "smtp_remetente",
    "smtp_seguro",
  ]);
  const host = s.smtp_host || process.env.SMTP_HOST || "";
  if (!host) return null;
  const porta = Number(s.smtp_porta || process.env.SMTP_PORTA || 587);
  return {
    host,
    porta,
    usuario: s.smtp_usuario || process.env.SMTP_USUARIO || "",
    senha: s.smtp_senha || process.env.SMTP_SENHA || "",
    remetente: s.smtp_remetente || process.env.SMTP_REMETENTE || "",
    seguro: (s.smtp_seguro || process.env.SMTP_SEGURO || "") === "1" || porta === 465,
  };
}

function transporte(c: ConfigSmtp): Transporter {
  return nodemailer.createTransport({
    host: c.host,
    port: c.porta,
    secure: c.seguro,
    auth: c.usuario ? { user: c.usuario, pass: c.senha } : undefined,
    tls: { rejectUnauthorized: false },
  });
}

export type ResultadoEmail = { ok: boolean; erro?: string };

export async function enviarEmail(
  para: string,
  assunto: string,
  html: string,
): Promise<ResultadoEmail> {
  const c = await configSmtp();
  if (!c) return { ok: false, erro: "SMTP nao configurado (tela de Configuracoes)" };
  try {
    await transporte(c).sendMail({
      from: c.remetente || c.usuario,
      to: para,
      subject: assunto,
      html,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

export async function testarSmtp(): Promise<ResultadoEmail> {
  const c = await configSmtp();
  if (!c) return { ok: false, erro: "SMTP nao configurado" };
  try {
    await transporte(c).verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}
