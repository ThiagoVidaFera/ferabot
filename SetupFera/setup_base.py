import subprocess
import sys
import platform
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "ScriptsFera"))
from lib import load_perfil, fera_print, header, mark_checkpoint, OUTPUT_DIR, ROOT_DIR, PERFIL_PATH

header("FERABOT — Verificação do Ambiente")

if PERFIL_PATH.exists():
    perfil = load_perfil()
    nome = perfil.get("nome", "fera")
else:
    nome = "fera"

print(f"  Olá, {nome.split()[0]}! Vamos checar se tudo está instalado...\n")

erros = []
avisos = []


def instalar_automatico(pacote_pip, descricao):
    resposta = input(f"\n  Posso instalar {descricao} automaticamente agora? (s/n): ").strip().lower()
    if resposta in ("s", "sim", "y", "yes"):
        print(f"  Instalando {descricao}...")
        r = subprocess.run([sys.executable, "-m", "pip", "install", pacote_pip],
                           capture_output=True, text=True)
        if r.returncode == 0:
            print(f"  [OK] {descricao} instalado!")
            return True
        else:
            print(f"  [ERRO] Não foi possível instalar automaticamente.")
            print(f"  Tente manualmente: pip install {pacote_pip}")
            return False
    return False


# ── Python ──────────────────────────────────────────────────────────────
py_ver = platform.python_version()
major, minor = int(py_ver.split('.')[0]), int(py_ver.split('.')[1])
if major < 3 or (major == 3 and minor < 10):
    erros.append((
        f"Python {py_ver} encontrado, mas precisa ser 3.10 ou mais novo.",
        "Baixe a versão mais recente em: https://python.org/downloads\n"
        "    Na instalação, marque a opção 'Add Python to PATH'."
    ))
else:
    print(f"  [OK] Python {py_ver}")


# ── Node.js ──────────────────────────────────────────────────────────────
try:
    r = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=5)
    if r.returncode == 0:
        print(f"  [OK] Node.js {r.stdout.strip()}")
    else:
        raise FileNotFoundError
except (FileNotFoundError, subprocess.TimeoutExpired):
    erros.append((
        "Node.js não encontrado.",
        "Baixe e instale em: https://nodejs.org\n"
        "    Escolha a versão 'LTS'. Reinicie o computador após instalar."
    ))
    print("  [FALTA] Node.js — necessário para renderizar artes")


# ── Playwright ───────────────────────────────────────────────────────────
playwright_ok = False
try:
    import playwright
    playwright_ok = True
    print("  [OK] Playwright (Python)")
except ImportError:
    print("  [FALTA] Playwright — necessário para gerar PNGs")
    instalado = instalar_automatico("playwright", "Playwright")
    if instalado:
        playwright_ok = True
    else:
        erros.append((
            "Playwright não está instalado.",
            "Abra um terminal e rode:\n"
            "    pip install playwright\n"
            "    playwright install chromium"
        ))

# ── Playwright Chromium ───────────────────────────────────────────────────
if playwright_ok:
    try:
        r = subprocess.run(
            [sys.executable, "-m", "playwright", "install", "chromium", "--dry-run"],
            capture_output=True, text=True, timeout=10
        )
        # dry-run retorna erro se não instalado
        r2 = subprocess.run(
            [sys.executable, "-c",
             "from playwright.sync_api import sync_playwright; p=sync_playwright().start(); p.chromium; p.stop()"],
            capture_output=True, text=True, timeout=10
        )
        if r2.returncode == 0:
            print("  [OK] Playwright Chromium")
        else:
            raise Exception("chromium não disponível")
    except Exception:
        print("  [FALTA] Playwright Chromium — o navegador interno")
        resp = input("\n  Posso instalar o Chromium automaticamente agora? (s/n): ").strip().lower()
        if resp in ("s", "sim", "y", "yes"):
            print("  Instalando Chromium (pode demorar 1-2 minutos)...")
            r = subprocess.run(
                [sys.executable, "-m", "playwright", "install", "chromium"],
                timeout=300
            )
            if r.returncode == 0:
                print("  [OK] Chromium instalado!")
            else:
                erros.append((
                    "Chromium não pôde ser instalado automaticamente.",
                    "Tente manualmente: playwright install chromium"
                ))
        else:
            erros.append((
                "Chromium do Playwright não instalado.",
                "Rode manualmente: playwright install chromium"
            ))


# ── Requests ─────────────────────────────────────────────────────────────
try:
    import requests
    print("  [OK] requests (Python)")
except ImportError:
    print("  [FALTA] requests — necessário para Meta Ads e Zernio")
    instalar_automatico("requests", "requests")


# ── Facebook Business SDK ─────────────────────────────────────────────────
try:
    import facebook_business
    print("  [OK] facebook-business SDK")
except ImportError:
    print("  [INFO] facebook-business SDK não instalado (só necessário para Meta Ads)")
    resp = input("  Quer instalar agora? (s/n): ").strip().lower()
    if resp in ("s", "sim", "y", "yes"):
        subprocess.run([sys.executable, "-m", "pip", "install", "facebook-business"],
                       capture_output=True)
        print("  [OK] facebook-business instalado!")


# ── Git ──────────────────────────────────────────────────────────────────
try:
    r = subprocess.run(["git", "--version"], capture_output=True, text=True, timeout=5)
    if r.returncode == 0:
        print(f"  [OK] Git {r.stdout.strip()}")
    else:
        raise FileNotFoundError
except (FileNotFoundError, subprocess.TimeoutExpired):
    avisos.append(
        "Git não encontrado — necessário para receber atualizações do Ferabot.\n"
        "    Instale em: https://git-scm.com/download/win"
    )
    print("  [AVISO] Git não encontrado")

print()


# ── Criar estrutura de output ────────────────────────────────────────────
etapas = ["carrossel", "stories", "caixinha", "landing-pages",
          "iscas", "meta-ads", "slides", "zernio"]
try:
    for etapa in etapas:
        (OUTPUT_DIR / etapa).mkdir(parents=True, exist_ok=True)
    print("  [OK] Pastas de saída criadas (output/)")
except Exception as e:
    avisos.append(f"Não foi possível criar algumas pastas de saída: {e}")


# ── .gitignore ───────────────────────────────────────────────────────────
gitignore_path = ROOT_DIR / ".gitignore"
gitignore_lines = ["perfil.json", ".env", "output/", "__pycache__/", "*.pyc", "node_modules/"]
try:
    existing = gitignore_path.read_text(encoding="utf-8").splitlines() if gitignore_path.exists() else []
    to_add = [l for l in gitignore_lines if l not in existing]
    if to_add:
        with open(gitignore_path, "a", encoding="utf-8") as f:
            f.write("\n".join(to_add) + "\n")
    print("  [OK] Arquivos sensíveis protegidos (.gitignore)")
except Exception:
    pass


# ── Resultado ────────────────────────────────────────────────────────────
print()

if avisos:
    for a in avisos:
        print(f"  ⚠  {a}")
    print()

if erros:
    print("  ╔══════════════════════════════════════════════════════╗")
    print("  ║   ATENÇÃO: instale o que está faltando abaixo        ║")
    print("  ╚══════════════════════════════════════════════════════╝")
    print()
    for i, (msg, dica) in enumerate(erros, 1):
        print(f"  {i}. FALTA: {msg}")
        print(f"     Como resolver: {dica}")
        print()
    print("  Depois de instalar tudo, rode o instalar.py novamente.")
    sys.exit(1)
else:
    mark_checkpoint("setup_base", "done", "ambiente ok")
    fera_print(f"Ambiente perfeito, {nome.split()[0]}! Tudo instalado.")
    print("  Próximo passo: configurar seu perfil.")
    print()
