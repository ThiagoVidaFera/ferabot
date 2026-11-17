"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sincronizarGrupos, alternarGrupo, syncWagm } from "./acoes";

export function BotaoSincronizar() {
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {msg ? <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>{msg}</span> : null}
      <button
        className="btn"
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true);
          setMsg(null);
          try {
            const r = await sincronizarGrupos();
            setMsg(r.ok ? `${r.novos} novo(s) de ${r.total}` : (r.erro ?? "falhou"));
            router.refresh();
          } finally {
            setOcupado(false);
          }
        }}
      >
        {ocupado ? "Sincronizando…" : "Sincronizar grupos"}
      </button>
    </div>
  );
}

export function BotaoAlternar({ id, ativo }: { id: string; ativo: boolean }) {
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  return (
    <button
      className="btn btn-sec"
      disabled={ocupado}
      style={{ padding: "5px 10px", fontSize: 12 }}
      onClick={async () => {
        setOcupado(true);
        try {
          await alternarGrupo(id);
          router.refresh();
        } finally {
          setOcupado(false);
        }
      }}
    >
      {ativo ? "Desativar" : "Ativar"}
    </button>
  );
}


export function BotaoSyncWagm({ disponivel }: { disponivel: boolean }) {
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {msg ? <span style={{ fontSize: 12, color: "var(--texto-fraco)" }}>{msg}</span> : null}
      <button
        className="btn"
        disabled={ocupado || !disponivel}
        title={disponivel ? "Espelhar grupos e campanhas do WAGM" : "banco do WAGM não montado"}
        onClick={async () => {
          setOcupado(true);
          setMsg(null);
          try {
            const r = await syncWagm();
            setMsg(
              r.ok
                ? `${r.grupos} grupos · ${r.campanhas} campanhas · ${r.entregas} entregas novas`
                : (r.erro ?? "falhou"),
            );
            router.refresh();
          } finally {
            setOcupado(false);
          }
        }}
      >
        {ocupado ? "Sincronizando…" : "Sincronizar WAGM"}
      </button>
    </div>
  );
}
