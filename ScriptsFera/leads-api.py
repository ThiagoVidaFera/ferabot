#!/usr/bin/env python3
"""CRM local do FERABOT — leads.json, escrita atomica, zero chave de API.

Comandos:
  add "<nome>" [--tel 5561999998888] [--origem instagram] [--nota "..."]
  list [--status novo|conversando|proposta|fechado|perdido]
  status <id> <novo|conversando|proposta|fechado|perdido>
  sem-resposta                        # leads em 'novo' — o numero que cobra
  import <arquivo.csv>                # colunas: nome,telefone[,origem,nota]
  lote [--status novo] [--ids l0001,l0002] --msg variantes.txt --out lote.json
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any

for _stream in (sys.stdout, sys.stderr):
    if _stream and getattr(_stream, "encoding", "").lower() != "utf-8":
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

ROOT_DIR = Path(__file__).parent.parent
LEADS_PATH = ROOT_DIR / "leads.json"
STATUS_VALIDOS = ("novo", "conversando", "proposta", "fechado", "perdido")


def carregar() -> dict[str, Any]:
    if not LEADS_PATH.exists():
        return {"leads": []}
    try:
        return json.loads(LEADS_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as erro:
        print(f"[ERRO] leads.json ilegível: {erro}", file=sys.stderr)
        sys.exit(1)


def salvar(dados: dict[str, Any]) -> None:
    fd, tmp = tempfile.mkstemp(dir=str(LEADS_PATH.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as arquivo:
            json.dump(dados, arquivo, ensure_ascii=False, indent=2)
            arquivo.write("\n")
        os.replace(tmp, LEADS_PATH)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


def normalizar_telefone(bruto: str) -> str:
    """Deixa só dígitos. Aceita com ou sem +55, formata pro padrão wa (DDI+DDD+numero)."""
    digitos = "".join(c for c in bruto if c.isdigit())
    if digitos and not digitos.startswith("55") and len(digitos) in (10, 11):
        digitos = "55" + digitos
    return digitos


def novo_id(dados: dict[str, Any]) -> str:
    return f"l{len(dados['leads']) + 1:04d}"


def achar(dados: dict[str, Any], lead_id: str) -> dict[str, Any]:
    for lead in dados["leads"]:
        if lead["id"] == lead_id:
            return lead
    print(f"[ERRO] Lead '{lead_id}' não existe. Vê os ids com: leads-api.py list", file=sys.stderr)
    sys.exit(1)


def cmd_add(args: argparse.Namespace) -> None:
    dados = carregar()
    tel = normalizar_telefone(args.tel or "")
    lead = {
        "id": novo_id(dados),
        "nome": args.nome,
        "telefone": tel,
        "origem": args.origem or "",
        "nota": args.nota or "",
        "status": "novo",
        "criado": datetime.now().isoformat(timespec="seconds"),
        "atualizado": datetime.now().isoformat(timespec="seconds"),
    }
    dados["leads"].append(lead)
    salvar(dados)
    print(f"[+] {lead['id']} — {args.nome}" + (f" ({tel})" if tel else ""))


def cmd_list(args: argparse.Namespace) -> None:
    leads = carregar()["leads"]
    if args.status:
        leads = [l for l in leads if l["status"] == args.status]
    if not leads:
        print("Nenhum lead" + (f" com status '{args.status}'" if args.status else "") + ".")
        return
    for lead in leads:
        tel = f"  {lead['telefone']}" if lead.get("telefone") else ""
        origem = f"  [{lead['origem']}]" if lead.get("origem") else ""
        print(f"  {lead['id']}  {lead['status']:<12} {lead['nome']}{tel}{origem}")
    print(f"\n  Total: {len(leads)}")


def cmd_status(args: argparse.Namespace) -> None:
    dados = carregar()
    lead = achar(dados, args.id)
    lead["status"] = args.novo_status
    lead["atualizado"] = datetime.now().isoformat(timespec="seconds")
    salvar(dados)
    print(f"[ok] {lead['nome']} → {args.novo_status}")
    if args.novo_status == "fechado":
        print("     Fechou = vendeu. Registra o valor:")
        print("     python ScriptsFera/metas-api.py faturamento add <valor> --nota \"" + lead["nome"] + "\"")


def cmd_sem_resposta(_: argparse.Namespace) -> None:
    parados = [l for l in carregar()["leads"] if l["status"] == "novo"]
    if not parados:
        print("0 leads sem resposta. Em dia.")
        return
    for lead in parados:
        desde = lead.get("criado", "")[:10]
        print(f"  {lead['id']}  {lead['nome']}  (desde {desde})")
    print(f"\n  {len(parados)} lead(s) sem resposta. Lead que chegou hoje se responde hoje.")


def cmd_import(args: argparse.Namespace) -> None:
    origem = Path(args.arquivo)
    if not origem.exists():
        print(f"[ERRO] Arquivo não existe: {origem}", file=sys.stderr)
        sys.exit(1)
    dados = carregar()
    existentes = {l["telefone"] for l in dados["leads"] if l.get("telefone")}
    novos, pulados = 0, 0
    with origem.open(encoding="utf-8-sig", newline="") as arquivo:
        for linha in csv.reader(arquivo):
            if not linha or not linha[0].strip():
                continue
            nome = linha[0].strip()
            if nome.lower() in ("nome", "name"):
                continue  # cabeçalho
            tel = normalizar_telefone(linha[1]) if len(linha) > 1 else ""
            if tel and tel in existentes:
                pulados += 1
                continue
            dados["leads"].append({
                "id": novo_id(dados),
                "nome": nome,
                "telefone": tel,
                "origem": linha[2].strip() if len(linha) > 2 else "import",
                "nota": linha[3].strip() if len(linha) > 3 else "",
                "status": "novo",
                "criado": datetime.now().isoformat(timespec="seconds"),
                "atualizado": datetime.now().isoformat(timespec="seconds"),
            })
            if tel:
                existentes.add(tel)
            novos += 1
    salvar(dados)
    print(f"[ok] {novos} importado(s), {pulados} duplicado(s) pulado(s).")


def cmd_lote(args: argparse.Namespace) -> None:
    """Monta lote.json pro disparador: contatos + variantes rotacionadas."""
    variantes_path = Path(args.msg)
    if not variantes_path.exists():
        print(f"[ERRO] Arquivo de variantes não existe: {variantes_path}", file=sys.stderr)
        sys.exit(1)
    # variantes separadas por linha em branco (ou uma por linha se não houver blocos)
    bruto = variantes_path.read_text(encoding="utf-8").strip()
    variantes = [b.strip() for b in bruto.split("\n\n") if b.strip()]
    if len(variantes) < 2:
        variantes = [l.strip() for l in bruto.splitlines() if l.strip()]
    if len(variantes) < 2:
        print("[ERRO] Preciso de pelo menos 2 variantes (anti-ban: nunca texto idêntico em massa).",
              file=sys.stderr)
        sys.exit(1)

    leads = carregar()["leads"]
    if args.ids:
        pedidos = {i.strip() for i in args.ids.split(",")}
        leads = [l for l in leads if l["id"] in pedidos]
    else:
        leads = [l for l in leads if l["status"] == args.status]
    leads = [l for l in leads if l.get("telefone")]
    if not leads:
        print("[ERRO] Nenhum lead com telefone nesse filtro.", file=sys.stderr)
        sys.exit(1)

    itens = []
    for i, lead in enumerate(leads):
        texto = variantes[i % len(variantes)].replace("{nome}", lead["nome"].split()[0])
        itens.append({"id": lead["id"], "nome": lead["nome"],
                      "telefone": lead["telefone"], "mensagem": texto})

    destino = Path(args.out)
    destino.write_text(json.dumps({"itens": itens}, ensure_ascii=False, indent=2) + "\n",
                       encoding="utf-8")
    print(f"[ok] {destino.resolve()} — {len(itens)} contato(s), {len(variantes)} variante(s).")
    print("     Dry-run: node ScriptsFera/wpp/disparar.js " + str(destino))
    print("     Enviar:  node ScriptsFera/wpp/disparar.js " + str(destino) + " --enviar")


def main() -> None:
    parser = argparse.ArgumentParser(prog="leads-api", description="CRM local do FERABOT")
    sub = parser.add_subparsers(dest="cmd", required=True)

    add = sub.add_parser("add")
    add.add_argument("nome")
    add.add_argument("--tel", default="")
    add.add_argument("--origem", default="")
    add.add_argument("--nota", default="")
    add.set_defaults(func=cmd_add)

    lista = sub.add_parser("list")
    lista.add_argument("--status", choices=STATUS_VALIDOS)
    lista.set_defaults(func=cmd_list)

    status = sub.add_parser("status")
    status.add_argument("id")
    status.add_argument("novo_status", choices=STATUS_VALIDOS)
    status.set_defaults(func=cmd_status)

    sub.add_parser("sem-resposta").set_defaults(func=cmd_sem_resposta)

    importar = sub.add_parser("import")
    importar.add_argument("arquivo")
    importar.set_defaults(func=cmd_import)

    lote = sub.add_parser("lote")
    lote.add_argument("--status", default="novo", choices=STATUS_VALIDOS)
    lote.add_argument("--ids", default="")
    lote.add_argument("--msg", required=True)
    lote.add_argument("--out", default="lote.json")
    lote.set_defaults(func=cmd_lote)

    argumentos = parser.parse_args()
    argumentos.func(argumentos)


if __name__ == "__main__":
    main()
