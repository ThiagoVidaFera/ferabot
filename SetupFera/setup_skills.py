import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "ScriptsFera"))
from lib import load_perfil, fera_print, header, mark_checkpoint, ROOT_DIR

header("FERABOT — Instalação das Skills")

try:
    perfil = load_perfil()
    nome = perfil.get("nome", "fera")
except SystemExit:
    print("  [ERRO] Configure o perfil primeiro: python SetupFera/setup_form.py")
    sys.exit(1)

print(f"  Instalando as skills do Ferabot para {nome.split()[0]}...\n")

skills_src = ROOT_DIR / "SkillsDoFera"
skills_dst = Path.home() / ".claude" / "skills"

# ── Verificações de segurança ─────────────────────────────────────────────
if not skills_src.exists():
    print("  [ERRO] A pasta SkillsDoFera não foi encontrada.")
    print()
    print("  Isso significa que o Ferabot não está completo.")
    print("  Certifique-se de ter clonado o repositório inteiro,")
    print("  não apenas alguns arquivos.")
    sys.exit(1)

skills_list = [d for d in skills_src.iterdir() if d.is_dir()]
if not skills_list:
    print("  [ERRO] Nenhuma skill encontrada em SkillsDoFera/.")
    print("  Verifique se o download do Ferabot foi completo.")
    sys.exit(1)

# ── Criar pasta ~/.claude/skills se não existir ───────────────────────────
try:
    skills_dst.mkdir(parents=True, exist_ok=True)
except Exception as e:
    print(f"  [ERRO] Não foi possível criar a pasta de skills do Claude Code.")
    print(f"  Detalhe técnico: {e}")
    print()
    print("  Isso pode acontecer se o Claude Code não estiver instalado.")
    print("  Baixe em: https://claude.ai/code")
    sys.exit(1)

# ── Instalar cada skill ───────────────────────────────────────────────────
instaladas = []
falhas = []

for skill_dir in sorted(skills_list):
    dst = skills_dst / skill_dir.name
    try:
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(skill_dir, dst)
        instaladas.append(skill_dir.name)
        print(f"  [OK] /{skill_dir.name}")
    except Exception as e:
        falhas.append((skill_dir.name, str(e)))
        print(f"  [FALHA] /{skill_dir.name} — {e}")

print()

# ── Gerar perfil.js para o dashboard ─────────────────────────────────────
import json
try:
    js_path = ROOT_DIR / "DashboardFera" / "perfil.js"
    js_path.write_text(
        f"window.PERFIL = {json.dumps(perfil, ensure_ascii=False, indent=2)};\n",
        encoding="utf-8"
    )
    print("  [OK] Dashboard atualizado com seus dados")
except Exception as e:
    print(f"  [AVISO] Não foi possível atualizar o dashboard: {e}")

# ── Resultado ─────────────────────────────────────────────────────────────
if falhas:
    print()
    print(f"  ⚠  {len(falhas)} skill(s) não instalada(s):")
    for nome_skill, err in falhas:
        print(f"     → {nome_skill}: {err}")
    print()
    print("  Tente rodar novamente. Se o problema persistir,")
    print("  verifique se o Claude Code está instalado corretamente.")

mark_checkpoint("setup_skills", "done", f"{len(instaladas)} skills instaladas")

print()
print("  ╔══════════════════════════════════════════════════════╗")
print(f"  ║  {len(instaladas)} skills instaladas! Tá fera, {nome.split()[0]}!".ljust(55) + "║")
print("  ╚══════════════════════════════════════════════════════╝")
print()
print("  O que fazer agora:")
print()
print("  1. Feche este terminal")
print("  2. Dê duplo-clique em  ABRIR_FERABOT.bat")
print("  3. No Claude Code, digite:  /squad-carrossel-fera")
print()
