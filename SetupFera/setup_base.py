import subprocess
import sys
import platform
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "ScriptsFera"))
from lib import load_perfil, fera_print, header, mark_checkpoint, OUTPUT_DIR, ROOT_DIR

header("FERABOT — Verificação do Ambiente")

try:
    perfil = load_perfil()
    nome = perfil.get("nome", "fera")
except SystemExit:
    nome = "fera"

print(f"  Olá, {nome.split()[0]}! Vamos checar se tudo está instalado...\n")

erros = []
avisos = []

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
try:
    import playwright
    print("  [OK] Playwright (Python)")
except ImportError:
    erros.append((
        "Playwright não está instalado.",
        "Abra um terminal e rode os dois comandos abaixo:\n"
        "    pip install playwright\n"
        "    playwright install chromium"
    ))
    print("  [FALTA] Playwright — necessário para gerar PNGs")

# ── Git ──────────────────────────────────────────────────────────────────
try:
    r = subprocess.run(["git", "--version"], capture_output=True, text=True, timeout=5)
    if r.returncode == 0:
        print(f"  [OK] Git {r.stdout.strip()}")
    else:
        raise FileNotFoundError
except (FileNotFoundError, subprocess.TimeoutExpired):
    avisos.append("Git não encontrado (opcional, mas recomendado para salvar seu trabalho).")
    print("  [AVISO] Git — opcional")

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
    print("  Próximo passo: python SetupFera/setup_skills.py")
    print()
