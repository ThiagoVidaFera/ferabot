"""Setup de chaves de API — BYOK: cada chave é DO UTILIZADOR do Ferabot.

Nenhuma chave é obrigatória. Sem chave, os FeraBots entregam a peça pronta e
ensinam o caminho manual. Com chave, automatizam.

Grava/atualiza o .env da raiz (gitignored). Roda quantas vezes quiser — só
mexe nas chaves que você preencher; ENTER pula e mantém o que já está lá.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "ScriptsFera"))
from lib import header, mark_checkpoint, ENV_PATH  # noqa: E402

# (env_var, rótulo, o que desbloqueia, dica de formato, guia)
CHAVES = [
    ("GEMINI_API_KEY", "Gemini (Google AI Studio)",
     "gerar imagens com IA nos anúncios e conteúdos",
     "começa com AIzaSy — grátis", "API_SETUP.md → seção 1"),
    ("NETLIFY_AUTH_TOKEN", "Netlify",
     "publicar páginas e quiz com um comando",
     "Personal Access Token — conta grátis", "API_SETUP.md → seção 2"),
    ("META_ACCESS_TOKEN", "Meta Ads — token",
     "subir campanhas direto no Gerenciador", "token de sistema/longa duração",
     "API_SETUP.md → seção 3"),
    ("META_AD_ACCOUNT_ID", "Meta Ads — conta de anúncio",
     "idem (par do token)", "formato act_123456789", "API_SETUP.md → seção 3"),
    ("YT_CLIENT_ID", "YouTube — Client ID",
     "subir vídeos direto no seu canal", "termina com .apps.googleusercontent.com",
     "API_SETUP.md → seção 4"),
    ("YT_CLIENT_SECRET", "YouTube — Client Secret",
     "idem", "começa com GOCSPX-", "API_SETUP.md → seção 4"),
    ("YT_REFRESH_TOKEN", "YouTube — Refresh Token",
     "idem", "começa com 1//", "API_SETUP.md → seção 4"),
    ("IG_USER_ID", "Instagram — user id",
     "comentário → DM automático (captação)", "número do IG Business",
     "API_SETUP.md → seção 5"),
    ("IG_ACCESS_TOKEN", "Instagram — access token",
     "idem (par do user id)", "token do app Meta", "API_SETUP.md → seção 5"),
]


def carregar_existentes() -> dict[str, str]:
    existentes: dict[str, str] = {}
    if not ENV_PATH.exists():
        return existentes
    for linha in ENV_PATH.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, _, valor = linha.partition("=")
        existentes[chave.strip()] = valor.strip()
    return existentes


def gravar(valores: dict[str, str]) -> None:
    linhas = [
        "# Chaves de API do Ferabot — TODAS são SUAS (das suas contas).",
        "# Este arquivo nunca sai da sua máquina (está no .gitignore).",
        "# Guia de obtenção de cada uma: API_SETUP.md",
        "",
    ]
    for env_var, rotulo, _, _, _ in CHAVES:
        valor = valores.get(env_var, "")
        if valor:
            linhas.append(f"{env_var}={valor}")
    # preserva chaves extras que o usuário tenha adicionado na mão
    conhecidas = {c[0] for c in CHAVES}
    for chave, valor in valores.items():
        if chave not in conhecidas and valor:
            linhas.append(f"{chave}={valor}")
    ENV_PATH.write_text("\n".join(linhas) + "\n", encoding="utf-8")


def main() -> None:
    header("FERABOT — Suas chaves de API")

    print("  Todas as chaves são SUAS: das suas contas Google, Netlify, Meta.")
    print("  Nenhuma é obrigatória — sem chave o FeraBot entrega a peça e ensina")
    print("  o caminho manual. Com chave, ele automatiza.")
    print()
    print("  ENTER pula e mantém o que já está configurado.")
    print("  Guia passo a passo de cada chave: API_SETUP.md")
    print()

    valores = carregar_existentes()
    for env_var, rotulo, desbloqueia, dica, guia in CHAVES:
        atual = valores.get(env_var, "")
        estado = "configurada" if atual else "vazia"
        print(f"  {rotulo}  [{estado}]")
        print(f"    desbloqueia: {desbloqueia}")
        print(f"    formato: {dica}  ·  como obter: {guia}")
        novo = input("    valor (ENTER pula, '-' apaga): ").strip()
        if novo == "-":
            valores[env_var] = ""
            print("    apagada.")
        elif novo:
            valores[env_var] = novo
            print("    salva.")
        print()

    gravar(valores)
    configuradas = sum(1 for c in CHAVES if valores.get(c[0]))
    mark_checkpoint("setup_chaves", "done", f"{configuradas} chave(s) configurada(s)")

    print(f"  {configuradas} de {len(CHAVES)} chaves configuradas.")
    print(f"  Arquivo: {ENV_PATH}")
    print()
    print("  Pode rodar de novo quando quiser adicionar as que faltam.")
    print()


if __name__ == "__main__":
    main()
