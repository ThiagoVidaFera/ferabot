"""Publica uma Prévia do Perfil no Netlify (padrão do step-22 desde 2026-10-25).

Encapsula as armadilhas conhecidas do Netlify:

- O CLI sobe a árvore de diretórios e usa o primeiro `.netlify` que achar acima da pasta — que pode
  apontar pra outro site seu. Por isso: site criado pela API, `state.json` gravado na pasta do run, e
  `--site` sempre explícito. Nunca `--create-site`.
- `NETLIFY_AUTH_TOKEN` só como env var trava o CLI sem erro em shell não-interativo: `--auth`
  explícito no comando.
- O site é procurado pelo domínio (`/sites/<nome>.netlify.app`), nunca listando: em conta com
  muitos sites, a listagem sem paginação não acha os antigos.
- Badge e HUD do Netlify nascem ligados e cobrem o canto da página.
- "Deploy is live" não é prova de nada: a verificação final é por HTTP na URL pública.

Token (BYOK): NETLIFY_AUTH_TOKEN do ambiente ou do `.env` da raiz do FERABOT; se não houver, o
token do `netlify login` (config do CLI). Sem nenhum dos dois, o caminho manual é arrastar a pasta
`_publicar/` em app.netlify.com/drop. Precisa do Netlify CLI instalado (`npm i -g netlify-cli`).

Publica SÓ a prévia. Os .md do run (oferta, mensagem de entrega, README) carregam análise interna
e nunca vão pro ar — a pasta `_publicar/` é montada do zero a cada execução.

Uso:
    python -I publicar.py <pasta-do-run> <slug-do-site> ["Nome do Cliente"]

Exemplo:
    python -I publicar.py <FERABOT>/output/onboarding/maria-silva-2026-11-03 maria-silva-perfil "Maria Silva"
"""
import json
import pathlib
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from ferabot_env import chave  # noqa: E402

# O console do Windows nasce em cp1252 e quebra em acento/símbolo — não depender de PYTHONUTF8.
for _fluxo in (sys.stdout, sys.stderr):
    try:
        _fluxo.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

API = "https://api.netlify.com/api/v1"
CONFIG_CLI = pathlib.Path.home() / "AppData/Roaming/netlify/Config/config.json"
ARQUIVOS_PREVIA = ("index.html", "app.js", "plan.js", "styles.css",
                   "criativos.js", "criativos.css", "kit.js")
# Páginas satélites da prévia (agendamento, grupo, slides do vídeo): vão junto quando existirem.
ARQUIVOS_AGENDA = ("agendar.html", "agendar.js", "grupo.html", "grupo.js",
                   "slides.html", "slides.js", "proposta.html", "proposta.js",
                   "paginas.css", "slides.css", "proposta.css")


def token(run=None):
    """NETLIFY_AUTH_TOKEN (ambiente ou .env do FERABOT) primeiro; depois o token do `netlify login`."""
    t = chave("NETLIFY_AUTH_TOKEN", run)
    if t:
        return t
    if CONFIG_CLI.exists():
        cfg = json.loads(CONFIG_CLI.read_text(encoding="utf-8"))
        for user in cfg.get("users", {}).values():
            t = (user.get("auth") or {}).get("token")
            if t:
                return t
    raise SystemExit(
        "Token do Netlify não encontrado.\n"
        "  1. coloque NETLIFY_AUTH_TOKEN=... no .env do FERABOT (app.netlify.com > User settings >\n"
        "     Applications > Personal access tokens), ou rode `netlify login`; e rode de novo;\n"
        "  2. ou publique à mão: arraste a pasta `_publicar/` do run em app.netlify.com/drop.")


def api(caminho, tok, metodo="GET", corpo=None):
    req = urllib.request.Request(
        f"{API}{caminho}", method=metodo,
        data=json.dumps(corpo).encode() if corpo else None,
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or "{}")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise SystemExit(f"Netlify {metodo} {caminho} → HTTP {e.code}: {e.read()[:300].decode()}")


def obter_site(slug, tok):
    """Busca pelo domínio (1 chamada). Listar não serve: a conta tem centenas de sites."""
    site = api(f"/sites/{slug}.netlify.app", tok)
    if site:
        print(f"site existente: {site['name']} ({site['id']})")
        return site
    site = api("/sites", tok, "POST", {"name": slug})
    if site.get("name") != slug:  # createSite às vezes ignora o name
        site = api(f"/sites/{site['id']}", tok, "PATCH", {"name": slug}) or site
    print(f"site criado: {site['name']} ({site['id']})")
    return site


def montar_publicacao(run: pathlib.Path):
    """Pasta limpa só com a prévia. Nenhum .md do run vai pro ar."""
    pub = run / "_publicar"
    shutil.rmtree(pub, ignore_errors=True)
    (pub / "assets").mkdir(parents=True)
    for nome in ARQUIVOS_PREVIA:
        origem = run / nome
        if not origem.exists():
            raise SystemExit(f"Falta {nome} em {run}")
        shutil.copy2(origem, pub / nome)
    for nome in ARQUIVOS_AGENDA:
        if (run / nome).exists():
            shutil.copy2(run / nome, pub / nome)
    for arq in (run / "assets").iterdir():
        if arq.suffix.lower() in (".js", ".jpg", ".jpeg", ".png", ".webp", ".mp4", ".svg"):
            shutil.copy2(arq, pub / "assets" / arq.name)
    # As artes do Kit de Feed Inicial: o protótipo do feed aponta direto pra elas.
    kit = run / "kit-feed-inicial"
    if kit.is_dir():
        artes = [a for a in kit.rglob("*") if a.suffix.lower() in (".png", ".jpg", ".pdf") and "_qa" not in a.parts]
        for arte in artes:
            destino = pub / "kit-feed-inicial" / arte.relative_to(kit)
            destino.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(arte, destino)
        if artes:
            print(f"artes do kit: {len(artes)} PNGs")

    # Prévia de cliente não se indexa.
    (pub / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    (pub / "_headers").write_text("/*\n  X-Robots-Tag: noindex\n", encoding="utf-8")
    vazados = [p.name for p in pub.rglob("*.md")]
    if vazados:
        raise SystemExit(f"Documento interno na pasta de publicação: {vazados}")
    print(f"publicação montada: {len(list(pub.rglob('*')))} arquivos, 0 .md")
    return pub


def ajustar_titulo(pub: pathlib.Path, cliente: str):
    """O <title> do template é genérico e aparece antes do JS rodar, na aba e no preview do link."""
    import re
    for arquivo, sufixo in (("index.html", "proposta de perfil"), ("agendar.html", "Agendar"),
                            ("grupo.html", "Grupo no WhatsApp"), ("slides.html", "Slides do vídeo"),
                            ("proposta.html", "Proposta")):
        alvo = pub / arquivo
        if not alvo.exists():
            continue
        html = alvo.read_text(encoding="utf-8")
        novo = re.sub(r"<title>.*?</title>", f"<title>{cliente} — {sufixo}</title>",
                      html, count=1, flags=re.S)
        if novo != html:
            alvo.write_text(novo, encoding="utf-8")
            print(f"título {arquivo}: {cliente} — {sufixo}")


def verificar(slug, run: pathlib.Path):
    """'Deploy is live' não prova nada. A prova é HTTP na URL pública."""
    base = f"https://{slug}.netlify.app"
    cb = f"?cb={int(time.time())}"
    falhas = []

    def http(caminho):
        try:
            with urllib.request.urlopen(f"{base}{caminho}", timeout=30) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, b""
        except Exception as e:
            return 0, str(e).encode()

    status, corpo = http("/" + cb)
    if status != 200:
        falhas.append(f"index HTTP {status}")
    else:
        html = corpo.decode("utf-8", "replace")
        import re
        t = re.search(r"<title>(.*?)</title>", html, re.S)
        print(f"  título no ar: {t.group(1) if t else '(sem title)'}")
        if t and ("{{" in t.group(1) or "[A PREENCHER" in t.group(1)):
            falhas.append("título ainda é o do template (passe o nome do cliente)")

    for rel in ("assets/content.js", "plan.js", "styles.css"):
        s, _ = http("/" + rel + cb)
        if s != 200:
            falhas.append(f"{rel} HTTP {s}")

    for doc in (p.name for p in run.glob("*.md")):
        s, _ = http("/" + doc)
        if s != 404:
            falhas.append(f"VAZOU documento interno {doc} (HTTP {s})")

    print("  verificação:", "OK" if not falhas else "FALHOU")
    for f in falhas:
        print("   -", f)
    return not falhas


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    run = pathlib.Path(sys.argv[1]).resolve()
    slug = sys.argv[2]
    cliente = sys.argv[3] if len(sys.argv) > 3 else ""
    if not run.is_dir():
        raise SystemExit(f"Pasta do run não existe: {run}")

    tok = token(run)
    site = obter_site(slug, tok)
    sid = site["id"]

    # state.json LOCAL antes do deploy: sem ele o CLI usa o .netlify de uma pasta acima.
    (run / ".netlify").mkdir(exist_ok=True)
    (run / ".netlify/state.json").write_text(json.dumps({"siteId": sid}), encoding="utf-8")

    api(f"/sites/{sid}", tok, "PATCH",
        {"built_with_badge_enabled": False, "hud_enabled": False})

    if api(f"/sites/{sid}/functions", tok):
        raise SystemExit("O site tem functions e a publicação não as inclui — o deploy as apagaria.")

    pub = montar_publicacao(run)
    if cliente:
        ajustar_titulo(pub, cliente)

    print("publicando...")
    # encoding explícito: a saída colorida do CLI quebra o cp1252 padrão do Windows.
    r = subprocess.run(
        ["netlify", "deploy", "--prod", "--dir", str(pub), "--site", sid, "--auth", tok],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        cwd=str(run), shell=True,
    )
    saida = (r.stdout or "") + (r.stderr or "")
    if "Deploy is live" not in saida:
        print(saida[-2000:])
        raise SystemExit("Deploy falhou.")

    time.sleep(3)
    ok = verificar(slug, run)
    print(f"\n[{'OK' if ok else 'FALHOU'}] https://{slug}.netlify.app")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
