import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "ScriptsFera"))
from lib import load_perfil, fera_print, header, mark_checkpoint, ROOT_DIR

header("FERABOT — Instalação das Skills")

perfil = load_perfil()
nome = perfil["nome"]
print(f"  Instalando as 9 skills do Ferabot para {nome}...\n")

skills_src = ROOT_DIR / "SkillsDoFera"
skills_dst = Path.home() / ".claude" / "skills"

if not skills_src.exists():
    print("[ERRO] Pasta SkillsDoFera não encontrada. Verifique a instalação do Ferabot.")
    sys.exit(1)

skills_dst.mkdir(parents=True, exist_ok=True)

installed = []
skipped = []

for skill_dir in sorted(skills_src.iterdir()):
    if not skill_dir.is_dir():
        continue
    dst = skills_dst / skill_dir.name
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(skill_dir, dst)
    installed.append(skill_dir.name)
    print(f"  [OK] /{skill_dir.name}")

print()

# Criar/atualizar .claude/CLAUDE.md global apontando pro Ferabot
ferabot_claude = ROOT_DIR / "CLAUDE.md"
global_claude = Path.home() / ".claude" / "CLAUDE.md"

# Não sobrescrever CLAUDE.md global existente, mas adicionar import
ferabot_ref = f"\n## Ferabot\nVer instruções completas em: {ferabot_claude}\n"
if global_claude.exists():
    content = global_claude.read_text(encoding="utf-8")
    if "Ferabot" not in content:
        global_claude.write_text(content + ferabot_ref, encoding="utf-8")
        print("  [OK] ~/.claude/CLAUDE.md atualizado com referência ao Ferabot")
else:
    global_claude.write_text(ferabot_ref, encoding="utf-8")
    print("  [OK] ~/.claude/CLAUDE.md criado com referência ao Ferabot")

mark_checkpoint("setup_skills", "done", f"{len(installed)} skills instaladas")

print()
print("  ╔══════════════════════════════════════════════════════╗")
print("  ║                                                      ║")
print(f"  ║  {len(installed)} skills instaladas! Fera demais, {nome.split()[0]}!".ljust(55) + "║")
print("  ║                                                      ║")
print("  ╚══════════════════════════════════════════════════════╝")
print()
print("  Skills disponíveis no Claude Code:")
for s in installed:
    print(f"    → /{s}")
print()
print("  Abra o Claude Code e invoque qualquer skill pra começar.")
print("  Sugestão: comece com /squad-carrossel-fera")
print()
