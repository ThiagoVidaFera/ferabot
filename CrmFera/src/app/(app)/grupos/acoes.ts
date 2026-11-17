"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { conexaoPadrao, listarGrupos } from "@/lib/whatsapp";
import { processarBroadcast } from "@/lib/broadcast";
import { sincronizarWagm } from "@/lib/wagm";

async function exigirSessao() {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");
  return s;
}

export type ResultadoSync = { ok: boolean; novos?: number; total?: number; erro?: string };

export async function sincronizarGrupos(): Promise<ResultadoSync> {
  const s = await exigirSessao();
  const conexao = await conexaoPadrao();
  if (!conexao) return { ok: false, erro: "WhatsApp nao conectado (tela de Configurações)" };

  try {
    const remotos = await listarGrupos(conexao);
    let novos = 0;
    for (const g of remotos) {
      const ja = await db.group.findUnique({ where: { externalId: g.externalId } });
      if (ja) {
        if (ja.name !== g.name) {
          await db.group.update({ where: { id: ja.id }, data: { name: g.name } });
        }
        continue;
      }
      await db.group.create({ data: { externalId: g.externalId, name: g.name } });
      novos++;
    }
    await auditar(s.email, "grupos_sincronizados", `${novos} novos de ${remotos.length}`);
    revalidatePath("/grupos");
    return { ok: true, novos, total: remotos.length };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

export async function alternarGrupo(id: string) {
  const s = await exigirSessao();
  const g = await db.group.findUnique({ where: { id } });
  if (!g) return;
  await db.group.update({ where: { id }, data: { ativo: !g.ativo } });
  await auditar(s.email, "grupo_alternado", `${g.name}: ${!g.ativo}`);
  revalidatePath("/grupos");
}

export async function dispararParaGrupos(form: FormData) {
  const s = await exigirSessao();
  const conteudo = String(form.get("conteudo") ?? "").trim();
  const ids = form.getAll("groupIds").map(String).filter(Boolean);
  if (!conteudo) throw new Error("conteudo obrigatorio");
  if (!ids.length) throw new Error("escolha ao menos um grupo");

  const b = await db.broadcast.create({
    data: {
      titulo: `Grupos — ${new Date().toLocaleString("pt-BR")}`,
      canal: "whatsapp_grupo",
      conteudo,
      groupIds: ids as never,
      status: "rascunho",
    },
  });

  await auditar(s.email, "disparo_grupo_criado", `${ids.length} grupo(s)`);
  void processarBroadcast(b.id).catch(() => {});

  revalidatePath("/grupos");
  revalidatePath("/disparos");
}


/** Espelha o WAGM (grupos, campanhas, entregas) pro CRM. */
export async function syncWagm() {
  const s = await exigirSessao();
  const r = await sincronizarWagm(s.email);
  revalidatePath("/grupos");
  return r;
}
