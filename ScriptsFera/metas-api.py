#!/usr/bin/env python3
"""API do coach — entregas, execucao semanal, faturamento e indice.

Grava tudo em entregas.json (escrita atomica). Le metas.json pra saber o alvo.

Comandos:
  entrega add "<bot>" "<descricao>" [--link "<caminho>"]
  entrega list [--limite N]

  compromisso set <chave> <numero>        # ex: videos_gravados 2
  compromisso ok <chave>                  # marca compromisso booleano como feito
  compromisso off <chave>                 # desmarca booleano
  compromisso list

  faturamento add <valor> [--nota "..."]
  faturamento list

  status [--json]                         # indice de execucao + progresso da meta
  painel                                  # regenera DashboardFera/painel.js

Regra de linguagem do indice: numero nunca aparece sozinho. Toda saida humana
traz o gargalo e a acao. Ver SkillsDoFera/fera/references/coach.md.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from datetime import date, datetime
from pathlib import Path
from typing import Any

# Windows: forca UTF-8 na saida, senao acento vira erro
for _stream in (sys.stdout, sys.stderr):
    if _stream and getattr(_stream, "encoding", "").lower() != "utf-8":
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

ROOT_DIR = Path(__file__).parent.parent
METAS_PATH = ROOT_DIR / "metas.json"
ENTREGAS_PATH = ROOT_DIR / "entregas.json"
PAINEL_JS_PATH = ROOT_DIR / "DashboardFera" / "painel.js"

FAIXA_SAUDAVEL = 80
SEMANAS_NO_MES = 4

ESTADO_VAZIO: dict[str, Any] = {"entregas": [], "execucao": {}, "faturamento": []}


# ── Persistencia ───────────────────────────────────────────────────────────
def _ler_json(caminho: Path, padrao: dict[str, Any]) -> dict[str, Any]:
    if not caminho.exists():
        return json.loads(json.dumps(padrao))
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as erro:
        print(f"[ERRO] {caminho.name} ilegível: {erro}", file=sys.stderr)
        sys.exit(1)


def _gravar_atomico(caminho: Path, dados: dict[str, Any]) -> None:
    """Escreve num temporario no mesmo diretorio e troca. Nunca corrompe o original."""
    caminho.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(caminho.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as arquivo:
            json.dump(dados, arquivo, ensure_ascii=False, indent=2)
            arquivo.write("\n")
        os.replace(tmp, caminho)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


def carregar_metas() -> dict[str, Any]:
    if not METAS_PATH.exists():
        print("[ERRO] metas.json não existe. Roda: python SetupFera/setup_metas.py", file=sys.stderr)
        sys.exit(1)
    return _ler_json(METAS_PATH, {})


def carregar_estado() -> dict[str, Any]:
    estado = _ler_json(ENTREGAS_PATH, ESTADO_VAZIO)
    for chave, vazio in ESTADO_VAZIO.items():
        estado.setdefault(chave, json.loads(json.dumps(vazio)))
    return estado


def salvar_estado(estado: dict[str, Any]) -> None:
    _gravar_atomico(ENTREGAS_PATH, estado)


# ── Tempo ──────────────────────────────────────────────────────────────────
def semana_atual() -> str:
    ano, semana, _ = date.today().isocalendar()
    return f"{ano}-W{semana:02d}"


def mes_atual() -> str:
    return date.today().strftime("%Y-%m")


def dias_restantes_no_mes() -> int:
    hoje = date.today()
    if hoje.month == 12:
        primeiro_do_proximo = date(hoje.year + 1, 1, 1)
    else:
        primeiro_do_proximo = date(hoje.year, hoje.month + 1, 1)
    return (primeiro_do_proximo - hoje).days


# ── Indice de execucao ─────────────────────────────────────────────────────
def calcular_indice(metas: dict[str, Any], estado: dict[str, Any]) -> dict[str, Any]:
    """Devolve indice 0-100 mais a lista de itens, ordenada por gargalo primeiro.

    Numerico: proporcao feito/meta, teto em 1.
    Booleano: 1 se feito, 0 se nao.
    """
    compromissos: dict[str, Any] = metas.get("compromissos_semanais", {})
    feito_na_semana: dict[str, Any] = estado.get("execucao", {}).get(semana_atual(), {})

    itens: list[dict[str, Any]] = []
    for chave, config in compromissos.items():
        rotulo = config.get("rotulo", chave)
        if config.get("booleano"):
            if not config.get("ativo", True):
                continue  # compromisso que ele nao assumiu nao entra na conta
            feito = bool(feito_na_semana.get(chave, False))
            itens.append({
                "chave": chave, "rotulo": rotulo, "tipo": "booleano",
                "feito": feito, "proporcao": 1.0 if feito else 0.0,
                "texto": "feito" if feito else "pendente",
            })
            continue

        meta_semanal = config.get("meta_semanal", 0)
        if meta_semanal <= 0:
            continue
        feito = int(feito_na_semana.get(chave, 0))
        itens.append({
            "chave": chave, "rotulo": rotulo, "tipo": "numero",
            "feito": feito, "meta": meta_semanal,
            "proporcao": min(1.0, feito / meta_semanal),
            "texto": f"{feito}/{meta_semanal}",
        })

    indice = round(100 * sum(i["proporcao"] for i in itens) / len(itens)) if itens else 0
    itens.sort(key=lambda i: i["proporcao"])
    gargalos = [i for i in itens if i["proporcao"] < 1.0]

    return {
        "indice": indice,
        "saudavel": indice >= FAIXA_SAUDAVEL,
        "faixa": "executando" if indice >= FAIXA_SAUDAVEL else ("oscilando" if indice >= 50 else "parado"),
        "itens": itens,
        "gargalo": gargalos[0] if gargalos else None,
        "semana": semana_atual(),
    }


def calcular_faturamento(metas: dict[str, Any], estado: dict[str, Any]) -> dict[str, Any]:
    alvo = metas.get("meta_faturamento_mes", 0)
    mes = mes_atual()
    entrou = sum(
        r.get("valor", 0) for r in estado.get("faturamento", [])
        if str(r.get("data", "")).startswith(mes)
    )
    ticket = metas.get("ticket_medio", 0) or 0
    falta = max(0, alvo - entrou)
    return {
        "alvo": alvo,
        "entrou": entrou,
        "falta": falta,
        "percentual": round(100 * entrou / alvo) if alvo else 0,
        "dias_restantes": dias_restantes_no_mes(),
        "vendas_faltando": -(-falta // ticket) if ticket and falta else 0,
    }


# ── Formatacao ─────────────────────────────────────────────────────────────
def brl(valor: float) -> str:
    return f"R$ {valor:,.0f}".replace(",", ".")


# ── Comandos ───────────────────────────────────────────────────────────────
def cmd_entrega_add(args: argparse.Namespace) -> None:
    estado = carregar_estado()
    entrega = {
        "id": f"e{len(estado['entregas']) + 1:04d}",
        "bot": args.bot,
        "descricao": args.descricao,
        "link": args.link or "",
        "data": datetime.now().isoformat(timespec="seconds"),
    }
    estado["entregas"].append(entrega)
    salvar_estado(estado)
    print(f"[+] {entrega['id']} — {args.bot}: {args.descricao}")


def cmd_entrega_list(args: argparse.Namespace) -> None:
    entregas = carregar_estado()["entregas"]
    if not entregas:
        print("Nenhuma entrega registrada ainda.")
        return
    for entrega in entregas[-args.limite:]:
        quando = entrega["data"][:16].replace("T", " ")
        print(f"  {quando}  [{entrega['bot']}] {entrega['descricao']}")


def _compromisso_valido(chave: str, metas: dict[str, Any]) -> dict[str, Any]:
    compromissos = metas.get("compromissos_semanais", {})
    if chave not in compromissos:
        disponiveis = ", ".join(compromissos) or "nenhum"
        print(f"[ERRO] Compromisso '{chave}' não existe. Disponíveis: {disponiveis}", file=sys.stderr)
        sys.exit(1)
    return compromissos[chave]


def _registrar_execucao(chave: str, valor: Any) -> None:
    estado = carregar_estado()
    estado["execucao"].setdefault(semana_atual(), {})[chave] = valor
    salvar_estado(estado)


def cmd_compromisso_set(args: argparse.Namespace) -> None:
    config = _compromisso_valido(args.chave, carregar_metas())
    if config.get("booleano"):
        print(f"[ERRO] '{args.chave}' é sim ou não. Usa 'compromisso ok' ou 'off'.", file=sys.stderr)
        sys.exit(1)
    _registrar_execucao(args.chave, args.numero)
    print(f"[ok] {config.get('rotulo', args.chave)}: {args.numero}/{config.get('meta_semanal')}")


def cmd_compromisso_flag(args: argparse.Namespace, feito: bool) -> None:
    config = _compromisso_valido(args.chave, carregar_metas())
    if not config.get("booleano"):
        print(f"[ERRO] '{args.chave}' é numérico. Usa 'compromisso set {args.chave} <n>'.", file=sys.stderr)
        sys.exit(1)
    _registrar_execucao(args.chave, feito)
    print(f"[ok] {config.get('rotulo', args.chave)}: {'feito' if feito else 'pendente'}")


def cmd_compromisso_list(_: argparse.Namespace) -> None:
    for item in calcular_indice(carregar_metas(), carregar_estado())["itens"]:
        marca = "x" if item["proporcao"] >= 1.0 else " "
        print(f"  [{marca}] {item['rotulo']:<40} {item['texto']}  ({item['chave']})")


def cmd_faturamento_add(args: argparse.Namespace) -> None:
    estado = carregar_estado()
    estado["faturamento"].append({
        "valor": args.valor,
        "data": date.today().isoformat(),
        "nota": args.nota or "",
    })
    salvar_estado(estado)
    resumo = calcular_faturamento(carregar_metas(), estado)
    print(f"[+] {brl(args.valor)} registrado. No mês: {brl(resumo['entrou'])} de {brl(resumo['alvo'])}.")


def cmd_faturamento_list(_: argparse.Namespace) -> None:
    registros = carregar_estado()["faturamento"]
    if not registros:
        print("Nenhuma venda registrada ainda.")
        return
    for registro in registros:
        nota = f" — {registro['nota']}" if registro.get("nota") else ""
        print(f"  {registro['data']}  {brl(registro['valor'])}{nota}")


def cmd_status(args: argparse.Namespace) -> None:
    metas, estado = carregar_metas(), carregar_estado()
    execucao = calcular_indice(metas, estado)
    dinheiro = calcular_faturamento(metas, estado)

    if args.json:
        print(json.dumps({"execucao": execucao, "faturamento": dinheiro}, ensure_ascii=False, indent=2))
        return

    print()
    print(f"  Meta do mês: {brl(dinheiro['alvo'])}")
    print(f"  Entrou: {brl(dinheiro['entrou'])}  ({dinheiro['percentual']}%)")
    if dinheiro["falta"]:
        print(f"  Faltam {brl(dinheiro['falta'])} e restam {dinheiro['dias_restantes']} dias.")
        if dinheiro["vendas_faltando"]:
            print(f"  São {dinheiro['vendas_faltando']} venda(s).")
    else:
        print("  Meta do mês batida.")
    print()

    # Regra 2 do coach: numero nunca aparece sozinho.
    print(f"  Índice de execução da semana: {execucao['indice']}  ({execucao['faixa']})")
    gargalo = execucao["gargalo"]
    if gargalo:
        print(f"  O que puxou pra baixo: {gargalo['rotulo']} — {gargalo['texto']}.")
        print(f"  A ação que levanta: fechar {gargalo['rotulo'].lower()} ainda essa semana.")
    else:
        print("  Todos os compromissos da semana estão em dia.")
    if not execucao["saudavel"]:
        print(f"  A faixa saudável começa em {FAIXA_SAUDAVEL}. Não precisa ser 100.")
    print()


def cmd_painel(_: argparse.Namespace) -> None:
    metas, estado = carregar_metas(), carregar_estado()
    perfil = _ler_json(ROOT_DIR / "perfil.json", {})
    dados = {
        "perfil": {
            "nome": perfil.get("nome", ""),
            "cor_primaria": perfil.get("cor_primaria", "#FF4F00"),
            "produto": perfil.get("produto", ""),
        },
        "metas": metas,
        "faturamento": calcular_faturamento(metas, estado),
        "execucao": calcular_indice(metas, estado),
        "entregas": list(reversed(estado["entregas"]))[:30],
        "gerado_em": datetime.now().isoformat(timespec="seconds"),
    }
    PAINEL_JS_PATH.parent.mkdir(parents=True, exist_ok=True)
    PAINEL_JS_PATH.write_text(
        "window.PAINEL = " + json.dumps(dados, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"[ok] Painel atualizado: {PAINEL_JS_PATH}")


# ── CLI ────────────────────────────────────────────────────────────────────
def construir_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="metas-api", description="Coach do FERABOT")
    sub = parser.add_subparsers(dest="grupo", required=True)

    entrega = sub.add_parser("entrega").add_subparsers(dest="acao", required=True)
    add = entrega.add_parser("add")
    add.add_argument("bot")
    add.add_argument("descricao")
    add.add_argument("--link", default="")
    add.set_defaults(func=cmd_entrega_add)
    lista = entrega.add_parser("list")
    lista.add_argument("--limite", type=int, default=20)
    lista.set_defaults(func=cmd_entrega_list)

    compromisso = sub.add_parser("compromisso").add_subparsers(dest="acao", required=True)
    definir = compromisso.add_parser("set")
    definir.add_argument("chave")
    definir.add_argument("numero", type=int)
    definir.set_defaults(func=cmd_compromisso_set)
    ok = compromisso.add_parser("ok")
    ok.add_argument("chave")
    ok.set_defaults(func=lambda a: cmd_compromisso_flag(a, True))
    off = compromisso.add_parser("off")
    off.add_argument("chave")
    off.set_defaults(func=lambda a: cmd_compromisso_flag(a, False))
    compromisso.add_parser("list").set_defaults(func=cmd_compromisso_list)

    faturamento = sub.add_parser("faturamento").add_subparsers(dest="acao", required=True)
    venda = faturamento.add_parser("add")
    venda.add_argument("valor", type=int)
    venda.add_argument("--nota", default="")
    venda.set_defaults(func=cmd_faturamento_add)
    faturamento.add_parser("list").set_defaults(func=cmd_faturamento_list)

    status = sub.add_parser("status")
    status.add_argument("--json", action="store_true")
    status.set_defaults(func=cmd_status)

    sub.add_parser("painel").set_defaults(func=cmd_painel)
    return parser


if __name__ == "__main__":
    argumentos = construir_parser().parse_args()
    argumentos.func(argumentos)
