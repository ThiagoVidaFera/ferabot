/**
 * Semeia um banco DESCARTAVEL com um usuario de teste e leads parados, pra
 * conferir a tela da fila no navegador/curl. Uso:
 *   npx tsx scripts/testes/semear-fila-local.ts <caminho-do-arquivo.db>
 * Cria o arquivo se nao existir (aplica as migrations). Recusa o banco real.
 */
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const HORA_MS = 3_600_000;

function aplicarMigrations(arquivo: string): void {
  const conn = new Database(arquivo);
  try {
    const dir = path.join(__dirname, "..", "..", "prisma", "migrations");
    for (const nome of fs.readdirSync(dir).sort()) {
      const sql = path.join(dir, nome, "migration.sql");
      if (fs.existsSync(sql)) conn.exec(fs.readFileSync(sql, "utf8"));
    }
  } finally {
    conn.close();
  }
}

function main(): void {
  const alvo = process.argv[2];
  if (!alvo) throw new Error("informe o caminho do .db de teste");
  const absoluto = path.resolve(alvo);
  if (absoluto.endsWith(path.join("data", "crm.db"))) throw new Error("recusado: esse e o banco do app");
  if (!fs.existsSync(absoluto)) aplicarMigrations(absoluto);

  const conn = new Database(absoluto);
  try {
    const agora = Date.now();
    const iso = (h: number) => new Date(agora - h * HORA_MS).toISOString();
    const hash = bcrypt.hashSync("teste", 8);
    conn.prepare("INSERT OR IGNORE INTO User (id,name,email,passwordHash,sessionEpoch,createdAt) VALUES (?,?,?,?,?,?)")
      .run("u1", "Teste", "teste@local.test", hash, iso(1000), iso(1000));

    const leads: Array<[string, string, string, number, string]> = [
      ["c1", "Marina Quente", "funil:mentoria", 21, "Quanto custa? Quero começar essa semana"],
      ["c2", "Paulo Frio", "base", 120, "oi"],
      ["c3", "Joana Obrigada", "anuncio", 2, "obrigada!"],
    ];
    const ins = conn.prepare(
      "INSERT OR IGNORE INTO Contact (id,name,phone,lifecycleStage,origem,tags,customFields,createdAt,updatedAt) VALUES (?,?,?,?,?,'[]','{}',?,?)",
    );
    const msg = conn.prepare(
      "INSERT OR IGNORE INTO WhatsappMessage (id,contactId,fromNumber,toNumber,body,type,direction,status,metadata,timestamp) VALUES (?,?,?,?,?,'text','inbound','sent','{}',?)",
    );
    leads.forEach(([id, nome, origem, horas, texto], i) => {
      ins.run(id, nome, `55119990000${i}${i}`, "conversando", origem, iso(500), iso(500));
      msg.run(`m-${id}`, id, "lead", "crm", texto, iso(horas));
    });
  } finally {
    conn.close();
  }
}

main();
