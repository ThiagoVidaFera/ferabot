"""Acha a raiz do FERABOT e lê as chaves do `.env` dela (BYOK).

Ordem de busca da raiz (a primeira que existir vence):
  1. variável de ambiente FERABOT_DIR;
  2. o ancestral mais próximo da pasta do run (ou da pasta atual) que tenha `ScriptsFera/lib.py`;
  3. `~/ferabot`.

Nenhuma chave é obrigatória: quem chama decide o que fazer quando ela falta (em geral, avisar e
mostrar o caminho manual). Os motores importam este arquivo assim:

    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))   # ou .parent.parent
    from ferabot_env import chave
"""
import os
import pathlib


def raiz_ferabot(inicio=None):
    """Devolve a pasta raiz do FERABOT (ou None se não achar nenhuma)."""
    env = os.environ.get("FERABOT_DIR")
    if env and pathlib.Path(env).expanduser().is_dir():
        return pathlib.Path(env).expanduser().resolve()
    partida = pathlib.Path(inicio or os.getcwd()).resolve()
    for pasta in [partida, *partida.parents]:
        if (pasta / "ScriptsFera" / "lib.py").is_file():
            return pasta
    padrao = pathlib.Path.home() / "ferabot"
    return padrao if padrao.is_dir() else None


def ler_env(inicio=None):
    """Lê `<raiz>/.env` como dict (sem sobrescrever nada em os.environ)."""
    raiz = raiz_ferabot(inicio)
    if not raiz or not (raiz / ".env").is_file():
        return {}
    dados = {}
    for linha in (raiz / ".env").read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        k, v = linha.split("=", 1)
        dados[k.strip()] = v.strip().strip('"').strip("'")
    return dados


def chave(nome, inicio=None):
    """Valor da chave: primeiro a variável de ambiente, depois o `.env` do FERABOT. '' se faltar."""
    return os.environ.get(nome) or ler_env(inicio).get(nome, "")
