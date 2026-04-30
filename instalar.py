"""
Ferabot — Instalador Completo
Execute uma vez: python instalar.py
"""
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent

def linha(char="─", n=56):
    print("  " + char * n)

def titulo(texto):
    print()
    linha("═")
    print(f"  ║  {texto.center(52)}  ║")
    linha("═")
    print()

def passo(num, total, texto):
    print(f"\n  [{num}/{total}] {texto}")
    linha()

def ok(msg):
    print(f"  ✓ {msg}")

def erro(msg, dica=""):
    print(f"\n  ✗ ERRO: {msg}")
    if dica:
        print(f"    → {dica}")

def rodar(script, descricao):
    print(f"  Rodando {descricao}...")
    result = subprocess.run([sys.executable, str(ROOT / script)], text=True)
    return result.returncode == 0


titulo("FERABOT — INSTALAÇÃO COMPLETA")

print("  Olá, fera! Vamos configurar tudo em 3 passos.")
print("  Isso leva cerca de 2 minutos.")
print()
input("  Pressione ENTER para começar → ")


# ─── Passo 1: Verificar ambiente ───────────────────────────────────────────
passo(1, 3, "Verificando se tudo está instalado no seu computador...")

ok_env = rodar("SetupFera/setup_base.py", "verificação de ambiente")
if not ok_env:
    erro(
        "A verificação de ambiente encontrou problemas.",
        "Leia as mensagens acima e instale o que está faltando, depois rode instalar.py novamente."
    )
    input("\n  Pressione ENTER para fechar.")
    sys.exit(1)

ok("Ambiente verificado!")


# ─── Passo 2: Configurar perfil ────────────────────────────────────────────
passo(2, 3, "Configurando o seu perfil no Ferabot...")

print()
print("  Vou abrir um formulário no seu navegador.")
print("  Preencha seus dados e clique em Salvar.")
print()
input("  Pressione ENTER para abrir o formulário → ")

ok_perfil = rodar("SetupFera/setup_form.py", "formulário de perfil")
if not ok_perfil:
    print()
    print("  Não consegui abrir o formulário no browser.")
    print("  Vou usar o modo texto mesmo. Responda as perguntas abaixo:")
    print()
    ok_perfil = rodar("SetupFera/setup_perfil.py", "configuração de perfil (modo texto)")

if not ok_perfil:
    erro(
        "Não foi possível configurar o perfil.",
        "Tente rodar manualmente: python SetupFera/setup_perfil.py"
    )
    input("\n  Pressione ENTER para fechar.")
    sys.exit(1)

ok("Perfil configurado!")


# ─── Passo 3: Instalar skills ──────────────────────────────────────────────
passo(3, 3, "Instalando as skills no Claude Code...")

ok_skills = rodar("SetupFera/setup_skills.py", "instalação de skills")
if not ok_skills:
    erro(
        "Não foi possível instalar as skills.",
        "Tente rodar manualmente: python SetupFera/setup_skills.py"
    )
    input("\n  Pressione ENTER para fechar.")
    sys.exit(1)

ok("Skills instaladas!")


# ─── Conclusão ─────────────────────────────────────────────────────────────
print()
linha("═")
print("  ║" + " " * 54 + "║")
print("  ║   FERABOT INSTALADO COM SUCESSO!".ljust(55) + "  ║")
print("  ║" + " " * 54 + "║")
linha("═")
print()
print("  Próximos passos:")
print()
print("  1. Feche esta janela")
print("  2. Dê duplo-clique no arquivo  ABRIR_FERABOT.bat")
print("  3. Leia o arquivo  PRIMEIRO_DIA.md  para começar")
print()
print("  Ou abra o dashboard:")
import webbrowser
dashboard = ROOT / "DashboardFera" / "index.html"
try:
    webbrowser.open(str(dashboard))
    print("  ✓ Dashboard aberto no navegador!")
except Exception:
    print(f"  Abra manualmente: {dashboard}")
print()
input("  Pressione ENTER para fechar. Boa sorte, fera! 🔥 → ")
