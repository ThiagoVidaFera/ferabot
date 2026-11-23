#!/usr/bin/env python3
"""Ligação do FERABOT (computador do dono) com o painel dele na internet.

O painel é a casa das chaves, dos leads e da Jornada. Este script:
  - conecta o FERABOT ao painel (endereço + código de ligação, que o painel mostra no passo 1);
  - puxa as chaves salvas no painel para o .env local, de onde todo script já lê;
  - avisa o painel de cada marco da Jornada e de cada entrega;
  - conta em que passo da Jornada o dono está.

Uso:
  python ScriptsFera/painel.py conectar <endereco> <codigo>
  python ScriptsFera/painel.py sincronizar
  python ScriptsFera/painel.py estado
  python ScriptsFera/painel.py marco <narrativa|pagina|canal_youtube|video_youtube|criativos|posts|campanha> [--link URL] [--resumo TEXTO]
  python ScriptsFera/painel.py puxar                  (traz do painel: redes, big idea, mecanismo, headlines, roteiros, posts)
  python ScriptsFera/painel.py numero <id> "<título>" "<valor>" [--detalhe TEXTO] [--estimado] [--remover]
  python ScriptsFera/painel.py plano <arquivo.json>   (big idea, mecanismo, headlines, roteiros do YouTube, posts)
  python ScriptsFera/painel.py entrega <bot> <o que foi> [--link URL]
  python ScriptsFera/painel.py whatsapp-estado
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent
PAINEL_PATH = ROOT_DIR / "painel.json"
ENV_PATH = ROOT_DIR / ".env"
PERFIL_PATH = ROOT_DIR / "perfil.json"

MARCOS = ("narrativa", "pagina", "canal_youtube", "video_youtube", "criativos", "posts", "campanha")
CAMPOS_DO_PLANO = ("bigIdea", "mecanismo", "headlines", "roteirosYoutube", "postsInstagram")
TEMPO_LIMITE_S = 15
INTERVALO_SINCRONIA = timedelta(minutes=10)
CAMPOS_DO_PERFIL = ("nome", "nicho", "oferta", "instagram", "meta_mensal", "ticket")
NOME_DE_CHAVE = re.compile(r"^[A-Z][A-Z0-9_]{2,60}$")
HOSTS_LOCAIS = frozenset({"localhost", "127.0.0.1"})


class ErroPainel(Exception):
    """Falha ao falar com o painel, já com a mensagem que o dono pode ler."""


# ── arquivo de ligação ──────────────────────────────────────────────────────
def ler_ligacao(caminho: Path | None = None) -> dict[str, str]:
    caminho = caminho or PAINEL_PATH
    if not caminho.exists():
        return {}
    try:
        dado = json.loads(caminho.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as erro:
        raise ErroPainel(f"painel.json ilegível ({erro}). Conecte de novo pelo passo 1 da Jornada.") from erro
    return dado if isinstance(dado, dict) else {}


def gravar_ligacao(dado: dict[str, str], caminho: Path | None = None) -> None:
    caminho = caminho or PAINEL_PATH
    temporario = caminho.with_suffix(".tmp")
    temporario.write_text(json.dumps(dado, ensure_ascii=False, indent=2), encoding="utf-8")
    temporario.replace(caminho)


def conectado(caminho: Path | None = None) -> bool:
    ligacao = ler_ligacao(caminho)
    return bool(ligacao.get("url") and ligacao.get("token"))


def normalizar_endereco(endereco: str) -> str:
    limpo = endereco.strip().rstrip("/")
    partes = urllib.parse.urlsplit(limpo)
    if not partes.hostname or partes.username or partes.password:
        raise ErroPainel("Endereço do painel inválido. Copie de novo o prompt do passo 1.")
    # http só para o painel rodando nesta máquina; comparação exata do nome, não do começo
    local = partes.scheme == "http" and partes.hostname in HOSTS_LOCAIS
    if partes.scheme != "https" and not local:
        raise ErroPainel("O endereço do painel precisa começar com https://")
    return limpo


class _SemRedirecionamento(urllib.request.HTTPRedirectHandler):
    """O código de ligação nunca segue para outro endereço: redirecionamento vira erro."""

    def redirect_request(self, *_: Any, **__: Any) -> None:
        return None


_ABRIDOR = urllib.request.build_opener(_SemRedirecionamento)


def chave_aceitavel(nome: str, valor: str) -> bool:
    """Só entra no .env nome de variável bem formado com valor de uma linha, imprimível."""
    return bool(NOME_DE_CHAVE.match(nome)) and bool(valor) and valor.isprintable() and valor == valor.strip()


# ── conversa com o painel ───────────────────────────────────────────────────
def chamar(ligacao: dict[str, str], caminho: str, corpo: dict[str, Any] | None = None) -> dict[str, Any]:
    if not ligacao.get("url") or not ligacao.get("token"):
        raise ErroPainel("FERABOT ainda não conectado ao painel. Copie o prompt do passo 1 da Jornada.")
    pedido = urllib.request.Request(
        f"{normalizar_endereco(ligacao['url'])}{caminho}",
        data=json.dumps(corpo).encode("utf-8") if corpo is not None else None,
        headers={"x-ferabot-token": ligacao["token"], "Content-Type": "application/json"},
        method="POST" if corpo is not None else "GET",
    )
    try:
        with _ABRIDOR.open(pedido, timeout=TEMPO_LIMITE_S) as resposta:
            return json.loads(resposta.read().decode("utf-8"))
    except urllib.error.HTTPError as erro:
        if erro.code == 401:
            raise ErroPainel("O painel recusou o código de ligação. Copie de novo o prompt do passo 1.") from erro
        raise ErroPainel(_motivo_do_painel(erro)) from erro
    except (urllib.error.URLError, OSError, json.JSONDecodeError) as erro:
        # OSError cobre conexão derrubada no meio do envio (ConnectionAbortedError/ResetError)
        raise ErroPainel(f"Não consegui falar com o painel ({erro}). Confira a internet e o endereço.") from erro


def _motivo_do_painel(erro: urllib.error.HTTPError) -> str:
    """O painel explica a recusa no corpo (msg/erro). Sem explicação, fica o código."""
    try:
        corpo = json.loads(erro.read().decode("utf-8") or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError, OSError):
        corpo = {}
    motivo = corpo.get("msg") or corpo.get("erro") if isinstance(corpo, dict) else ""
    return str(motivo)[:300] if motivo else f"O painel respondeu erro {erro.code}."


# ── chaves: painel → .env ───────────────────────────────────────────────────
def mesclar_env(texto_atual: str, chaves: dict[str, str]) -> str:
    """Devolve o texto novo do .env: o valor do painel vence, o resto fica como estava."""
    faltam = dict(chaves)
    linhas: list[str] = []
    for linha in texto_atual.splitlines():
        nome = linha.split("=", 1)[0].strip() if "=" in linha and not linha.strip().startswith("#") else ""
        if nome in faltam:
            linhas.append(f"{nome}={faltam.pop(nome)}")
        else:
            linhas.append(linha)
    linhas.extend(f"{nome}={valor}" for nome, valor in faltam.items())
    return "\n".join(linhas) + ("\n" if linhas else "")


def sincronizar(caminho_ligacao: Path | None = None, caminho_env: Path | None = None) -> list[str]:
    """Puxa as chaves do painel para o .env. Devolve os NOMES (nunca os valores)."""
    caminho_ligacao = caminho_ligacao or PAINEL_PATH
    caminho_env = caminho_env or ENV_PATH
    ligacao = ler_ligacao(caminho_ligacao)
    resposta = chamar(ligacao, "/api/ferabot/chaves")
    recebidas = {str(k): str(v) for k, v in (resposta.get("chaves") or {}).items()}
    chaves = {nome: valor for nome, valor in recebidas.items() if chave_aceitavel(nome, valor)}
    atual = caminho_env.read_text(encoding="utf-8") if caminho_env.exists() else ""
    novo = mesclar_env(atual, chaves)
    if novo != atual:
        caminho_env.write_text(novo, encoding="utf-8")
    gravar_ligacao({**ligacao, "sincronizado_em": datetime.now().isoformat(timespec="seconds")}, caminho_ligacao)
    return sorted(chaves)


def sincronia_vencida(ligacao: dict[str, str], agora: datetime) -> bool:
    ultima = ligacao.get("sincronizado_em", "")
    if not ultima:
        return True
    try:
        return agora - datetime.fromisoformat(ultima) >= INTERVALO_SINCRONIA
    except ValueError:
        return True


def sincronizar_se_vencido() -> None:
    """Chamado por todo script antes de ler o .env. Sem painel conectado, não faz nada.

    Falha de rede não derruba o script (ele segue com o .env que já tem), mas é avisada.
    """
    try:
        ligacao = ler_ligacao()
        if not ligacao.get("url") or not sincronia_vencida(ligacao, datetime.now()):
            return
        sincronizar()
    except ErroPainel as erro:
        print(f"[painel] chaves não atualizadas agora: {erro}", file=sys.stderr)


# ── avisos: FERABOT → painel ────────────────────────────────────────────────
def perfil_para_o_painel(caminho: Path | None = None) -> dict[str, str]:
    caminho = caminho or PERFIL_PATH
    if not caminho.exists():
        return {}
    try:
        perfil = json.loads(caminho.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return {campo: str(perfil[campo]) for campo in CAMPOS_DO_PERFIL if perfil.get(campo)}


def avisar_marco(passo: str, link: str = "", resumo: str = "") -> dict[str, Any]:
    if passo not in MARCOS:
        raise ErroPainel(f"Marco desconhecido: {passo}. Use um de: {', '.join(MARCOS)}.")
    corpo = {"marco": {"passo": passo, "link": link, "resumo": resumo}}
    return chamar(ler_ligacao(), "/api/ferabot/estado", corpo)


def avisar_entrega(bot: str, oque: str, link: str = "") -> dict[str, Any]:
    # caminho de arquivo local não serve de link no painel: só endereço da internet vai
    link_publico = link if link.startswith(("http://", "https://")) else ""
    return chamar(ler_ligacao(), "/api/ferabot/estado", {"entrega": {"bot": bot, "oque": oque, "link": link_publico}})


def enviar_plano(caminho: Path) -> dict[str, Any]:
    """Manda o plano do dono para a tela Seu perfil. Campo que não vier fica como está no painel."""
    try:
        plano = json.loads(Path(caminho).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as erro:
        raise ErroPainel(f"Não consegui ler o plano em {caminho}: {erro}") from erro
    if not isinstance(plano, dict):
        raise ErroPainel("O plano precisa ser um objeto JSON.")
    corpo = {c: plano[c] for c in CAMPOS_DO_PLANO if c in plano}
    if not corpo:
        raise ErroPainel(f"O plano precisa de ao menos um destes campos: {', '.join(CAMPOS_DO_PLANO)}.")
    return chamar(ler_ligacao(), "/api/ferabot/plano", corpo)


PLANO_LOCAL = Path("output") / "fera" / "plano.json"


def perfil_com_plano(perfil: dict[str, Any], plano: dict[str, Any]) -> dict[str, Any]:
    """O painel é a fonte do posicionamento: redes, big idea, mecanismo e headlines vão para o perfil.json.
    O que o painel não tem fica como estava no perfil."""
    redes = plano.get("redes") or {}
    mecanismo = plano.get("mecanismo") or {}
    do_painel = {
        "handle_instagram": redes.get("instagram", ""),
        "youtube": redes.get("youtube", ""),
        "landing_page": redes.get("site", ""),
        "whatsapp": redes.get("whatsapp", ""),
        "tiktok": redes.get("tiktok", ""),
        "bandeira": plano.get("bigIdea", ""),
        "big_idea": plano.get("bigIdea", ""),
        "mecanismo": mecanismo.get("nome", ""),
        "mecanismo_explicacao": mecanismo.get("explicacao", ""),
        "headlines": plano.get("headlines") or [],
    }
    return {**perfil, **{k: v for k, v in do_painel.items() if v}}


def puxar_plano(caminho_perfil: Path | None = None, raiz: Path | None = None) -> dict[str, Any]:
    """Traz o plano do painel: grava output/fera/plano.json e completa o perfil.json com ele."""
    resposta = chamar(ler_ligacao(), "/api/ferabot/plano")
    plano = resposta.get("plano") or {}
    briefing = resposta.get("briefing") or {}
    base = raiz or ROOT_DIR
    destino = base / PLANO_LOCAL
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(plano, ensure_ascii=False, indent=2), encoding="utf-8")
    # o briefing do negócio, com as palavras do dono: base da página de captura e dos posts
    (destino.parent / "briefing.json").write_text(json.dumps(briefing, ensure_ascii=False, indent=2), encoding="utf-8")
    arquivo_perfil = caminho_perfil or PERFIL_PATH
    perfil = json.loads(arquivo_perfil.read_text(encoding="utf-8")) if arquivo_perfil.exists() else {}
    arquivo_perfil.write_text(json.dumps(perfil_com_plano(perfil, plano), ensure_ascii=False, indent=2), encoding="utf-8")
    return plano


def resumo_do_plano(plano: dict[str, Any]) -> list[str]:
    redes = plano.get("redes") or {}
    linhas = [
        f"Big idea: {plano.get('bigIdea') or '(vazia)'}",
        f"Mecanismo: {(plano.get('mecanismo') or {}).get('nome') or '(vazio)'}",
        f"Headlines: {len(plano.get('headlines') or [])} · Roteiros de YouTube: {len(plano.get('roteirosYoutube') or [])} · Posts: {len(plano.get('postsInstagram') or [])}",
        "Redes: " + (", ".join(f"{k} {v}" for k, v in redes.items()) or "nenhuma no painel (perguntar ao dono)"),
        f"Aprovado pelo dono: {'sim' if plano.get('aprovadoEm') else 'ainda não'}",
        "Briefing do negócio: em output/fera/briefing.json (respondido na tela Briefing do painel)",
    ]
    return linhas


def enviar_numero(id_: str, titulo: str = "", valor: str = "", detalhe: str = "", estimado: bool = False, remover: bool = False) -> dict[str, Any]:
    """Um cartão de "Meus números" no painel (o dono personaliza a tela pedindo ao FERABOT)."""
    if not re.fullmatch(r"[a-z0-9-]{2,40}", id_):
        raise ErroPainel("O id do número usa só letras minúsculas, números e hífen (ex.: posts-mes).")
    if remover:
        cartao: dict[str, Any] = {"id": id_, "remover": True}
    else:
        if not titulo or not valor:
            raise ErroPainel("Falta o título ou o valor do número.")
        cartao = {"id": id_, "titulo": titulo, "valor": valor, "detalhe": detalhe, "tipo": "estimado" if estimado else "medido"}
    return chamar(ler_ligacao(), "/api/ferabot/estado", {"indicadores": cartao})


def ligar_whatsapp(url: str, chave: str, sessao: str = "principal") -> dict[str, Any]:
    """Liga o servidor de WhatsApp do dono ao painel. A chave vai só para o painel, por HTTPS."""
    return chamar(ler_ligacao(), "/api/ferabot/whatsapp", {"url": url, "apiKey": chave, "sessao": sessao})


def estado_whatsapp() -> dict[str, Any]:
    return chamar(ler_ligacao(), "/api/ferabot/whatsapp")


def conectar(endereco: str, token: str) -> dict[str, Any]:
    ligacao = {"url": normalizar_endereco(endereco), "token": token.strip()}
    perfil = perfil_para_o_painel()
    resposta = chamar(ligacao, "/api/ferabot/estado", {"perfil": perfil} if perfil else {})
    gravar_ligacao(ligacao)
    sincronizar()
    try:
        puxar_plano()
    except ErroPainel:
        pass  # painel sem plano ainda: o briefing acontece na conversa
    return resposta


# ── linha de comando ────────────────────────────────────────────────────────
def imprimir_jornada(resposta: dict[str, Any]) -> None:
    jornada = resposta.get("jornada") or {}
    print(f"Jornada: {jornada.get('feitos', 0)} de {jornada.get('total', 7)} passos feitos.")
    for passo in jornada.get("passos", []):
        print(f"  [{'x' if passo.get('feito') else ' '}] {passo.get('numero')}. {passo.get('titulo')}")
        for item in passo.get("itens", []):
            if not passo.get("feito"):
                print(f"        {'ok   ' if item.get('feito') else 'falta'} {item.get('texto')}")
    trilhas = jornada.get("trilhas") or {}
    if trilhas:
        print(f"Passo da vez · conteúdo: {trilhas.get('conteudo')} · técnica: {trilhas.get('tecnica')}")
        return
    atual = jornada.get("atual")
    print(f"Passo atual: {atual['numero']}. {atual['titulo']}" if atual else "Todos os passos estão feitos.")


def main() -> None:
    for fluxo in (sys.stdout, sys.stderr):
        try:
            fluxo.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

    parser = argparse.ArgumentParser(description="Liga o FERABOT ao painel do dono.")
    sub = parser.add_subparsers(dest="comando", required=True)
    p_conectar = sub.add_parser("conectar")
    p_conectar.add_argument("endereco")
    p_conectar.add_argument("codigo")
    sub.add_parser("sincronizar")
    sub.add_parser("estado")
    p_marco = sub.add_parser("marco")
    p_marco.add_argument("passo", choices=MARCOS)
    p_marco.add_argument("--link", default="")
    p_marco.add_argument("--resumo", default="")
    p_entrega = sub.add_parser("entrega")
    p_entrega.add_argument("bot")
    p_entrega.add_argument("oque")
    p_entrega.add_argument("--link", default="")
    sub.add_parser("whatsapp-estado")
    sub.add_parser("puxar")
    p_numero = sub.add_parser("numero")
    p_numero.add_argument("id")
    p_numero.add_argument("titulo", nargs="?", default="")
    p_numero.add_argument("valor", nargs="?", default="")
    p_numero.add_argument("--detalhe", default="")
    p_numero.add_argument("--estimado", action="store_true")
    p_numero.add_argument("--remover", action="store_true")
    p_plano = sub.add_parser("plano")
    p_plano.add_argument("arquivo")
    args = parser.parse_args()

    try:
        if args.comando == "conectar":
            resposta = conectar(args.endereco, args.codigo)
            print("FERABOT conectado ao painel. Chaves e plano trazidos do painel.")
            plano_local = ROOT_DIR / PLANO_LOCAL
            if plano_local.exists():
                print(chr(10).join(resumo_do_plano(json.loads(plano_local.read_text(encoding="utf-8")))))
            imprimir_jornada(resposta)
        elif args.comando == "numero":
            enviar_numero(args.id, args.titulo, args.valor, args.detalhe, args.estimado, args.remover)
            print("Número " + ("removido do" if args.remover else "atualizado no") + " painel (Meus números, na tela inicial).")
        elif args.comando == "puxar":
            plano = puxar_plano()
            print("Plano trazido do painel para output/fera/plano.json e perfil.json:")
            print(chr(10).join(resumo_do_plano(plano)))
        elif args.comando == "sincronizar":
            nomes = sincronizar()
            print(f"Chaves vindas do painel: {', '.join(nomes) if nomes else 'nenhuma salva ainda'}.")
        elif args.comando == "estado":
            imprimir_jornada(chamar(ler_ligacao(), "/api/ferabot/estado"))
        elif args.comando == "marco":
            imprimir_jornada(avisar_marco(args.passo, args.link, args.resumo))
        elif args.comando == "whatsapp-estado":
            estado = estado_whatsapp()
            telefone = f" ({estado['telefone']})" if estado.get("telefone") else ""
            print(f"WhatsApp no painel: {estado.get('status', 'desconhecido')}{telefone}")
        elif args.comando == "plano":
            contagem = enviar_plano(Path(args.arquivo)).get("plano", {})
            print(f"Plano atualizado no painel (tela Seu perfil): {contagem}")
        elif args.comando == "entrega":
            avisar_entrega(args.bot, args.oque, args.link)
            print("Entrega registrada no painel.")
    except ErroPainel as erro:
        print(f"[ERRO] {erro}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
