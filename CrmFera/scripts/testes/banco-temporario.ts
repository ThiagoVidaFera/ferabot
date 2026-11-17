import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Banco SQLite DESCARTAVEL para teste: aplica as migrations do Prisma, em
 * ordem, num arquivo novo na pasta temporaria do sistema. Nunca toca em
 * `data/crm.db` nem em producao. Chamar ANTES de importar `@/lib/db`
 * (o db le DATABASE_URL na primeira importacao).
 */
export function criarBancoTemporario(): { url: string; arquivo: string; apagar: () => void } {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "crm-teste-"));
  const arquivo = path.join(pasta, "teste.db");
  const migrations = path.join(__dirname, "..", "..", "prisma", "migrations");
  const conn = new Database(arquivo);
  try {
    for (const nome of fs.readdirSync(migrations).sort()) {
      const sql = path.join(migrations, nome, "migration.sql");
      if (fs.existsSync(sql)) conn.exec(fs.readFileSync(sql, "utf8"));
    }
  } finally {
    conn.close();
  }
  const url = `file:${arquivo.split(path.sep).join("/")}`;
  process.env.DATABASE_URL = url;
  return { url, arquivo, apagar: () => fs.rmSync(pasta, { recursive: true, force: true }) };
}
