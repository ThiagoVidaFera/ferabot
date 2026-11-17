import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { promptPadrao } from "../src/lib/prompt-recepcao";
import { negocio } from "../src/lib/negocio";

/**
 * Semente da primeira subida (docker-entrypoint.sh roda uma vez, com o banco novo).
 *
 * - Usuário: SEED_EMAIL / SEED_SENHA / SEED_NOME (o `python ScriptsFera/crm.py env` gera os três).
 *   Sem eles a semente para: nunca existe login padrão adivinhável.
 * - Pipeline comercial, recepção em modo `sugere` e as configurações básicas.
 * - Número de WhatsApp padrão a partir de WAHA_URL / WAHA_APIKEY / WAHA_SESSION (o docker-compose
 *   aponta para o WAHA da mesma rede). Sem esse registro nenhum agente responde.
 */

const SLUG_RECEPCAO = "recepcao";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./data/crm.db",
});
const db = new PrismaClient({ adapter });

function obrigatoria(chave: string): string {
  const v = (process.env[chave] ?? "").trim();
  if (!v) throw new Error(`${chave} não definida: rode python ScriptsFera/crm.py env antes de subir o CRM`);
  return v;
}

const ESTAGIOS_PIPELINE = ["Novo", "Conversando", "Call marcada", "Proposta", "Cliente", "Perdido"];

async function semearUsuario() {
  const email = obrigatoria("SEED_EMAIL").toLowerCase();
  const senha = obrigatoria("SEED_SENHA");
  const nome = (process.env.SEED_NOME ?? "").trim() || negocio().dono.nome;
  const passwordHash = await bcrypt.hash(senha, 10);
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { name: nome, email, passwordHash },
  });
  console.log("usuario:", user.email);
}

async function semearPipeline() {
  if (await db.pipeline.findFirst()) return;
  const pipeline = await db.pipeline.create({ data: { name: "Comercial" } });
  for (const [i, name] of ESTAGIOS_PIPELINE.entries()) {
    await db.pipelineStage.create({ data: { pipelineId: pipeline.id, name, ordem: i } });
  }
  console.log("pipeline: Comercial com", ESTAGIOS_PIPELINE.length, "estagios");
}

/** Recepção: quem chega sem funil (anúncio, link direto). Nasce em `sugere`: nada sai sem aprovação. */
async function semearRecepcao() {
  if (await db.agent.findUnique({ where: { slug: SLUG_RECEPCAO } })) return;
  const criado = await db.agent.create({
    data: {
      name: "Recepção",
      slug: SLUG_RECEPCAO,
      canal: "whatsapp",
      prompt: promptPadrao(),
      model: "gemini-2.5-flash",
      modo: "sugere",
      ativo: true,
    },
  });
  const versao = await db.agentPromptVersion.create({
    data: { agentId: criado.id, versao: 1, prompt: promptPadrao(), autor: "seed" },
  });
  await db.agent.update({ where: { id: criado.id }, data: { activeVersionId: versao.id } });
  console.log("agente:", criado.slug, "(modo sugere: você aprova cada resposta na Inbox)");
}

async function semearNumero() {
  const url = (process.env.WAHA_URL ?? "").trim();
  if (!url || (await db.whatsappInstance.count()) > 0) return;
  const sessao = (process.env.WAHA_SESSION ?? "").trim() || "principal";
  await db.whatsappInstance.create({
    data: {
      name: "Principal",
      provider: "waha",
      evolutionApiUrl: url.replace(/\/+$/, ""),
      evolutionApiKey: (process.env.WAHA_APIKEY ?? "").trim(),
      instanceName: sessao,
      isDefault: true,
    },
  });
  console.log("whatsapp: numero padrao (sessao", sessao + ") — conecte pelo QR em Configurações");
}

async function semearConfiguracoes() {
  const settings: Array<[string, string]> = [
    ["negocio_nome", negocio().nome],
    ["marca_acento", "#FF4F00"],
    ["ia_provider", "gemini"],
    ["ia_model", "gemini-2.5-flash"],
  ];
  for (const [key, value] of settings) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("settings:", settings.length);
}

async function main() {
  await semearUsuario();
  await semearPipeline();
  await semearRecepcao();
  await semearNumero();
  await semearConfiguracoes();
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
