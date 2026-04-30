import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "ScriptsFera"))
from lib import load_perfil, fera_print, header, mark_checkpoint, OUTPUT_DIR, ROOT_DIR

header("FERABOT — Verificação do Ambiente")

perfil = load_perfil()
nome = perfil["nome"]
print(f"  Fera {nome}, vamos checar se tudo está instalado...\n")

errors = []

# Python
import platform
py_ver = platform.python_version()
print(f"  [OK] Python {py_ver}")

# Node.js
r = subprocess.run(["node", "--version"], capture_output=True, text=True)
if r.returncode == 0:
    print(f"  [OK] Node.js {r.stdout.strip()}")
else:
    errors.append("Node.js não encontrado. Instale em https://nodejs.org")
    print("  [FALTA] Node.js — necessário para renderizar artes")

# Playwright Python
try:
    import playwright
    print("  [OK] Playwright (Python)")
except ImportError:
    errors.append("Playwright não instalado. Rode: pip install playwright && playwright install chromium")
    print("  [FALTA] Playwright — necessário para gerar PNGs")

# Git
r = subprocess.run(["git", "--version"], capture_output=True, text=True)
if r.returncode == 0:
    print(f"  [OK] Git {r.stdout.strip()}")
else:
    print("  [AVISO] Git não encontrado (opcional, mas recomendado)")

print()

# Criar estrutura de output
etapas = [
    "carrossel", "stories", "caixinha", "landing-pages",
    "iscas", "meta-ads", "slides", "zernio"
]
for etapa in etapas:
    (OUTPUT_DIR / etapa).mkdir(parents=True, exist_ok=True)

print("  [OK] Estrutura de pastas output/ criada")

# Criar .gitignore na raiz pra não commitar chaves
gitignore_path = ROOT_DIR / ".gitignore"
gitignore_lines = ["perfil.json", ".env", "output/", "__pycache__/", "*.pyc", "node_modules/"]
existing = gitignore_path.read_text(encoding="utf-8").splitlines() if gitignore_path.exists() else []
to_add = [l for l in gitignore_lines if l not in existing]
if to_add:
    with open(gitignore_path, "a", encoding="utf-8") as f:
        f.write("\n".join(to_add) + "\n")
    print("  [OK] .gitignore atualizado (perfil.json e chaves protegidos)")

mark_checkpoint("setup_base", "done", "ambiente verificado, pastas criadas")

if errors:
    print()
    print("  ⚠  Ação necessária antes de continuar:")
    for e in errors:
        print(f"     → {e}")
    print()
else:
    print()
    fera_print("Ambiente 100%, fera! Tudo pronto.")
    print("  Próximo passo: python SetupFera/setup_skills.py")
    print()
