import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "ScriptsFera"))
from lib import save_perfil, fera_print, header, mark_checkpoint, PERFIL_PATH, ROOT_DIR

# Sem stdin interativo (rodado pelo Claude/pipe vazio), input() recebe EOF.
_input_original = input


def input(msg=""):  # noqa: A001 — shadow proposital
    try:
        return _input_original(msg)
    except EOFError:
        print()
        print("[ERRO] Sem terminal interativo pra fazer as perguntas.")
        print("       Faça o briefing pela conversa: digite /fera no Claude Code")
        print("       (ele pergunta perfil e meta no chat e grava os arquivos).")
        sys.exit(2)


header("FERABOT — Configuração do Perfil")

print("  Fera, vamos configurar o seu sistema!")
print("  Responda as perguntas abaixo. Pode ser direto, sem enrolação.")
print()

def ask(label, example="", required=True):
    hint = f" (ex: {example})" if example else ""
    while True:
        val = input(f"  {label}{hint}: ").strip()
        if val or not required:
            return val
        print("  ⚠  Campo obrigatório. Tenta de novo, fera.")

nome           = ask("Seu nome (como quer ser chamado nos textos)", "Ana Lima")
nicho          = ask("Seu nicho de atuação", "Nutrição esportiva para mulheres 40+")
produto        = ask("Nome do seu produto/mentoria principal", "Método Transformação 90 dias")
preco          = ask("Preço do produto", "R$ 3.500")
handle_ig      = ask("Seu @ no Instagram (com o @)", "@ananutri")
cor_primaria   = ask("Cor primária da marca (hex)", "#FF4F00")
cor_secundaria = ask("Cor secundária da marca (hex)", "#FFFFFF")
landing_page   = ask("Link da sua landing page principal", "https://seusite.com/mentoria")
api_gemini     = ask("Chave da API Gemini (Google AI Studio)", "AIza...", required=False)
api_openai     = ask("Chave da API OpenAI (se usar)", "sk-...", required=False)

print()

perfil = {
    "nome": nome,
    "nicho": nicho,
    "produto": produto,
    "preco": preco,
    "handle_instagram": handle_ig,
    "cor_primaria": cor_primaria,
    "cor_secundaria": cor_secundaria,
    "landing_page": landing_page,
    "api_gemini": api_gemini,
    "api_openai": api_openai,
}

save_perfil(perfil)
mark_checkpoint("setup_perfil", "done", f"perfil de {nome} configurado")

print("  ╔══════════════════════════════════════════════════════╗")
print("  ║                                                      ║")
print(f"  ║  Perfil salvo com sucesso, fera!                     ║")
print("  ║                                                      ║")
print("  ╚══════════════════════════════════════════════════════╝")
print()
print(f"  Arquivo: {PERFIL_PATH}")
print()
print("  Próximo passo: python SetupFera/setup_skills.py")
print()
