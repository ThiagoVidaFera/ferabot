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

def rodar(script, descricao, *args):
    print(f"  Rodando {descricao}...")
    comando = [sys.executable, str(ROOT / script), *args]
    result = subprocess.run(comando, text=True)
    return result.returncode == 0


# Sem terminal interativo (instalação via Claude Code / pipe), input() receberia
# EOF e o briefing morreria em silêncio. Nesse modo o instalador só prepara o
# ambiente e instala as skills — o briefing (perfil + metas) acontece NA CONVERSA,
# conduzido pelo /fera logo depois.
#
# Detecção em duas camadas (no Windows, NUL se apresenta como tty — isatty() mente):
#   1. CLAUDECODE=1 no ambiente = rodando pelo Claude Code → assistido.
#   2. Qualquer EOF num input() vira o modo pra assistido na hora, sem quebrar.
import os
INTERATIVO = sys.stdin.isatty() and os.environ.get("CLAUDECODE") != "1"


def pausa(msg):
    global INTERATIVO
    if not INTERATIVO:
        return
    try:
        input(msg)
    except EOFError:
        INTERATIVO = False
        print()
        print("  (sem terminal interativo — mudando pro modo assistido:")
        print("   o briefing de perfil e meta acontece na conversa, logo em seguida)")
        print()


titulo("FERABOT — INSTALAÇÃO COMPLETA")

if INTERATIVO:
    print("  Vamos configurar tudo em 4 passos.")
    print("  Leva cerca de 3 minutos.")
    print()
    pausa("  Pressione ENTER para começar → ")
else:
    print("  Modo assistido detectado (rodando pelo Claude Code).")
    print("  Vou preparar o ambiente e instalar as skills.")
    print("  O briefing (seu perfil + sua meta) acontece na conversa, logo em seguida.")
    print()


# ─── Passo 1: Verificar ambiente ───────────────────────────────────────────
passo(1, 4, "Verificando se tudo está instalado no seu computador...")

ok_env = rodar("SetupFera/setup_base.py", "verificação de ambiente")
if not ok_env:
    erro(
        "A verificação de ambiente encontrou problemas.",
        "Leia as mensagens acima e instale o que está faltando, depois rode instalar.py novamente."
    )
    pausa("\n  Pressione ENTER para fechar.")
    sys.exit(1)

ok("Ambiente verificado!")


# ─── Passo 2: Configurar perfil ────────────────────────────────────────────
passo(2, 4, "Configurando o seu perfil no Ferabot...")

if not INTERATIVO:
    print("  Pulado por aqui — o perfil é preenchido na conversa com o /fera.")
    ok_perfil = True
else:
    print()
    print("  Vou abrir um formulário no seu navegador.")
    print("  Preencha seus dados e clique em Salvar.")
    print()
    pausa("  Pressione ENTER para abrir o formulário → ")

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
        pausa("\n  Pressione ENTER para fechar.")
        sys.exit(1)

    ok("Perfil configurado!")


# ─── Passo 3: Declarar a meta ──────────────────────────────────────────────
passo(3, 4, "Definindo a sua meta...")

if not INTERATIVO:
    print("  Pulado por aqui — a meta é definida na conversa com o /fera.")
else:
    print()
    print("  Sem meta declarada eu não tenho como te cobrar.")
    print("  São 5 perguntas.")
    print()

    ok_metas = rodar("SetupFera/setup_metas.py", "configuração de metas")
    if not ok_metas:
        erro(
            "Não foi possível configurar a meta.",
            "Tente rodar manualmente: python SetupFera/setup_metas.py"
        )
        pausa("\n  Pressione ENTER para fechar.")
        sys.exit(1)

    ok("Meta definida!")


# ─── Passo 4: Instalar skills ──────────────────────────────────────────────
passo(4, 4, "Instalando os FeraBots no Claude Code...")

ok_skills = rodar("SetupFera/setup_skills.py", "instalação de skills")
if not ok_skills:
    erro(
        "Não foi possível instalar as skills.",
        "Tente rodar manualmente: python SetupFera/setup_skills.py"
    )
    pausa("\n  Pressione ENTER para fechar.")
    sys.exit(1)

ok("FeraBots instalados!")

# Gera o painel já com o estado inicial honesto (coluna direita preenchida).
# Em modo assistido ainda não existe metas.json — o painel sai depois do briefing.
if (ROOT / "metas.json").exists():
    rodar("ScriptsFera/metas-api.py", "geração do painel", "painel")


# ─── Conclusão ─────────────────────────────────────────────────────────────
print()
linha("═")
print("  ║" + " " * 54 + "║")
print("  ║   FERABOT INSTALADO COM SUCESSO!".ljust(55) + "  ║")
print("  ║" + " " * 54 + "║")
linha("═")
print()

if not INTERATIVO:
    # Instrução dirigida ao Claude que está conduzindo a instalação.
    print("  [BRIEFING PENDENTE]")
    print("  Perfil e meta ainda não foram configurados.")
    print("  Claude: siga AGORA o roteiro de SkillsDoFera/fera/references/onboarding.md,")
    print("  na ordem: (0) TOUR — explicar em 1 mensagem o que é o Ferabot com exemplos")
    print("  de uso (Instagram, YouTube, disparo de WhatsApp, slides, Direct automático,")
    print("  páginas, CRM, propostas); (1-2) briefing de perfil + meta na conversa,")
    print("  gravando perfil.json e metas.json; (3) gerar o painel; (4) oferecer o")
    print("  Google Tasks; (5) propor a primeira peça.")
    print()
    print("  Não declare a instalação concluída sem o tour e o briefing feitos.")
else:
    print("  O que o Ferabot faz por você (exemplos de como pedir no chat):")
    print()
    print("  · Instagram  — \"monta um carrossel sobre os 3 erros do meu nicho\"")
    print("  · YouTube    — \"cria um vídeo de 1 minuto sobre X pro meu canal\"")
    print("  · WhatsApp   — \"dispara um convite pra minha lista de leads\"")
    print("  · Slides     — \"monta os slides da minha aula de quinta\"")
    print("  · Direct     — \"quem comentar EU QUERO recebe o link do material\"")
    print("  · Páginas    — \"cria uma página de captura pra minha mentoria\"")
    print("  · CRM        — \"como estão meus leads dessa semana?\"")
    print("  · Propostas  — \"monta a proposta pro cliente que pediu orçamento\"")
    print()
    print("  Próximos passos:")
    print()
    print("  1. Feche esta janela")
    print("  2. Dê duplo-clique no arquivo  ABRIR_FERABOT.bat")
    print("  3. Digite  /fera  no chat — ele conhece sua meta e começa por ela")
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
    pausa("  Pressione ENTER para fechar. Boa sorte, fera! 🔥 → ")
