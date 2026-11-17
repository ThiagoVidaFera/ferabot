import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import Database from "better-sqlite3";
import { db } from "@/lib/db";
import { auditar } from "@/lib/audit";

/**
 * Espelho do WhatsApp Group Manager (WAGM).
 *
 * O WAGM continua sendo o DONO do disparo em grupo: é ele que tem as regras
 * anti-ban (jitter de 1-5 min, cap diário, rotação de variantes) e o motor
 * whatsapp-web.js. Mexer nisso pelo CRM seria reescrever o que já funciona e
 * arriscar o número principal.
 *
 * O que o CRM faz é ESPELHAR: catálogo de grupos, campanhas agendadas, o que
 * foi entregue e o que falhou — pra você ver tudo num lugar só, sem SSH.
 *
 * Leitura é sempre sobre uma CÓPIA do banco. O app.db do WAGM roda em modo WAL
 * e é escrito pelo scheduler; abrir o arquivo vivo de outro processo pediria
 * escrita no -shm e poderia atrapalhar quem está disparando.
 */

const ORIGEM_PADRAO = "/mnt/wagm/app.db";

export type ResultadoSync = {
  ok: boolean;
  grupos: number;
  campanhas: number;
  entregas: number;
  dias: number;
  erro?: string;
};

function caminhoWagm(): string {
  return process.env.WAGM_DB ?? ORIGEM_PADRAO;
}

export function wagmDisponivel(): boolean {
  try {
    return fs.existsSync(caminhoWagm());
  } catch {
    return false;
  }
}

/** Copia o trio (db, -wal, -shm) pra um temporário e abre a cópia em leitura. */
function abrirCopia(): { conn: Database.Database; limpar: () => void } {
  const origem = caminhoWagm();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wagm-"));
  const destino = path.join(dir, "app.db");

  fs.copyFileSync(origem, destino);
  for (const sufixo of ["-wal", "-shm"]) {
    const extra = origem + sufixo;
    if (fs.existsSync(extra)) fs.copyFileSync(extra, destino + sufixo);
  }

  const conn = new Database(destino, { readonly: true });
  return {
    conn,
    limpar: () => {
      try {
        conn.close();
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        /* temporário some no restart do container de qualquer forma */
      }
    },
  };
}

type LinhaGrupo = {
  jid: string;
  subject: string | null;
  is_admin: number | null;
  picture_url: string | null;
  size: number | null;
  synced_at: string | null;
  active: number | null;
};

type LinhaJob = {
  id: number;
  kind: string | null;
  target_mode: string | null;
  target_jids: string | null;
  payload: string | null;
  send_at: string | null;
  status: string | null;
  attempts: number | null;
  last_error: string | null;
  created_at: string | null;
  campaign_name: string | null;
};

type LinhaEntrega = {
  id: number;
  job_id: number;
  jid: string;
  status: string | null;
  detail: string | null;
  done_at: string | null;
};

function comoData(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** O texto do disparo vive dentro do payload JSON do job. */
function textoDoPayload(payload: string | null): string {
  if (!payload) return "";
  try {
    const j = JSON.parse(payload) as { text?: string; caption?: string };
    return j.text ?? j.caption ?? "";
  } catch {
    return payload.slice(0, 500);
  }
}

export async function sincronizarWagm(ator = "sistema"): Promise<ResultadoSync> {
  if (!wagmDisponivel()) {
    return {
      ok: false,
      grupos: 0,
      campanhas: 0,
      entregas: 0,
      dias: 0,
      erro: `banco do WAGM não encontrado em ${caminhoWagm()}`,
    };
  }

  const { conn, limpar } = abrirCopia();
  try {
    // ---- grupos
    const grupos = conn
      .prepare("SELECT jid, subject, is_admin, picture_url, size, synced_at, active FROM group_catalog")
      .all() as LinhaGrupo[];

    for (const g of grupos) {
      const dados = {
        name: g.subject?.trim() || g.jid,
        ativo: g.active === 1,
        fonte: "wagm",
        tamanho: g.size ?? 0,
        ehAdmin: g.is_admin === 1,
        fotoUrl: g.picture_url,
        syncAt: comoData(g.synced_at),
      };
      await db.group.upsert({
        where: { externalId: g.jid },
        update: dados,
        create: { externalId: g.jid, ...dados },
      });
    }

    // ---- campanhas (jobs)
    const jobs = conn
      .prepare("SELECT * FROM scheduled_jobs ORDER BY id DESC LIMIT 400")
      .all() as LinhaJob[];

    for (const j of jobs) {
      const dados = {
        campanha: j.campaign_name,
        tipo: j.kind ?? "send_text",
        alvo: j.target_mode ?? "all",
        texto: textoDoPayload(j.payload),
        agendadoPara: comoData(j.send_at),
        status: j.status ?? "pending",
        tentativas: j.attempts ?? 0,
        ultimoErro: j.last_error?.slice(0, 500) ?? null,
        criadoEm: comoData(j.created_at) ?? new Date(),
        syncAt: new Date(),
      };
      await db.campanhaGrupo.upsert({
        where: { jobId: j.id },
        update: dados,
        create: { jobId: j.id, ...dados },
      });
    }

    // ---- entregas (só as dos jobs que espelhamos, e só as novas)
    const idsJobs = jobs.map((j) => j.id);
    const mapaCampanha = new Map(
      (
        await db.campanhaGrupo.findMany({
          where: { jobId: { in: idsJobs } },
          select: { id: true, jobId: true },
        })
      ).map((c) => [c.jobId, c.id]),
    );
    const mapaGrupo = new Map(
      (await db.group.findMany({ select: { id: true, externalId: true } })).map((g) => [
        g.externalId,
        g.id,
      ]),
    );

    const ultima = await db.entregaGrupo.findFirst({ orderBy: { externoId: "desc" } });
    const desde = ultima?.externoId ?? 0;

    const entregas = conn
      .prepare(
        `SELECT id, job_id, jid, status, detail, done_at FROM job_group_result
         WHERE id > ? AND job_id IN (${idsJobs.map(() => "?").join(",") || "0"})
         ORDER BY id ASC LIMIT 5000`,
      )
      .all(desde, ...idsJobs) as LinhaEntrega[];

    let gravadas = 0;
    for (const e of entregas) {
      const campanhaId = mapaCampanha.get(e.job_id);
      if (!campanhaId) continue;
      try {
        await db.entregaGrupo.create({
          data: {
            externoId: e.id,
            campanhaId,
            groupId: mapaGrupo.get(e.jid) ?? null,
            jid: e.jid,
            status: e.status ?? "?",
            detalhe: e.detail?.slice(0, 400) ?? null,
            concluidoEm: comoData(e.done_at),
          },
        });
        gravadas++;
      } catch {
        // @@unique(externoId) — já espelhada
      }
    }

    // ---- volume diário
    const dias = conn.prepare("SELECT day, sent FROM daily_send_count").all() as Array<{
      day: string;
      sent: number;
    }>;
    for (const d of dias) {
      await db.envioDiario.upsert({
        where: { dia: d.day },
        update: { enviados: d.sent },
        create: { dia: d.day, enviados: d.sent },
      });
    }

    await auditar(
      ator,
      "wagm_sincronizado",
      `${grupos.length} grupos · ${jobs.length} campanhas · ${gravadas} entregas novas`,
    );

    return {
      ok: true,
      grupos: grupos.length,
      campanhas: jobs.length,
      entregas: gravadas,
      dias: dias.length,
    };
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    await auditar(ator, "wagm_sync_erro", erro);
    return { ok: false, grupos: 0, campanhas: 0, entregas: 0, dias: 0, erro };
  } finally {
    limpar();
  }
}
