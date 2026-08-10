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

# Blocos: (id, título, o que o bloco desbloqueia, essencial?)
# Bloco essencial é sempre perguntado. Os outros só se o utilizador quiser.
BLOCOS = [
    ("base", "O básico", "imagem com IA + publicar página", True),
    ("ads", "Anúncios no Meta", "subir campanha no Gerenciador (nasce pausada)", False),
    ("youtube", "YouTube", "subir vídeo direto no seu canal", False),
    ("instagram", "Instagram", "comentário → DM automático (captação)", False),
    ("publicar", "Publicação automática", "feed, carrossel, story e TikTok num comando", False),
    ("midia", "Mídia premium", "vídeo, voz e imagem sem limite de free tier", False),
    ("whatsapp", "WhatsApp em escala", "disparo multi-conta via servidor (avançado)", False),
    ("email", "E-mail", "disparo e relatório automático por e-mail", False),
    ("pesquisa", "Pesquisa e espionagem", "ver o anúncio do concorrente e achar nicho por dado", False),
    ("analytics", "Métrica de página", "quantas visitas a sua página recebeu", False),
]

# (env_var, rótulo, o que desbloqueia, dica de formato, guia, bloco)
CHAVES = [
    ("GEMINI_API_KEY", "Gemini (Google AI Studio)",
     "gerar imagens com IA nos anúncios e conteúdos",
     "começa com AIzaSy — grátis", "API_SETUP.md → seção 1", "base"),
    ("NETLIFY_AUTH_TOKEN", "Netlify",
     "publicar páginas e quiz com um comando",
     "Personal Access Token — conta grátis", "API_SETUP.md → seção 2", "base"),
    ("META_ACCESS_TOKEN", "Meta Ads — token",
     "subir campanhas direto no Gerenciador", "token de sistema/longa duração",
     "API_SETUP.md → seção 3", "ads"),
    ("META_AD_ACCOUNT_ID", "Meta Ads — conta de anúncio",
     "idem (par do token)", "formato act_123456789", "API_SETUP.md → seção 3", "ads"),
    ("YT_CLIENT_ID", "YouTube — Client ID",
     "subir vídeos direto no seu canal", "termina com .apps.googleusercontent.com",
     "API_SETUP.md → seção 4", "youtube"),
    ("YT_CLIENT_SECRET", "YouTube — Client Secret",
     "idem", "começa com GOCSPX-", "API_SETUP.md → seção 4", "youtube"),
    ("YT_REFRESH_TOKEN", "YouTube — Refresh Token",
     "idem", "começa com 1//", "API_SETUP.md → seção 4", "youtube"),
    ("IG_USER_ID", "Instagram — user id",
     "comentário → DM automático (captação)", "número do IG Business",
     "API_SETUP.md → seção 5", "instagram"),
    ("IG_ACCESS_TOKEN", "Instagram — access token",
     "idem (par do user id)", "token do app Meta", "API_SETUP.md → seção 5", "instagram"),
    ("POSTFORME_API_KEY", "Post for Me",
     "publicar feed, carrossel, story e TikTok sem abrir o app",
     "painel postforme.dev — plano pago barato", "API_SETUP.md → seção 6", "publicar"),
    ("GATHOS_API_KEY", "Gathos — imagem",
     "imagem sem limite de free tier", "começa com img_live_",
     "API_SETUP.md → seção 7", "midia"),
    ("GATHOS_TTS_API_KEY", "Gathos — voz",
     "narração ilimitada (melhor que a voz grátis)", "começa com tts_live_",
     "API_SETUP.md → seção 7", "midia"),
    ("GATHOS_VIDEO_API_KEY", "Gathos — vídeo",
     "clipes de vídeo por IA, ilimitados", "começa com vid_live_",
     "API_SETUP.md → seção 7", "midia"),
    ("ELEVENLABS_API_KEY", "ElevenLabs",
     "voz premium em português (narração que não parece robô)",
     "começa com sk_ — CUIDADO: o hex do painel é o ID, não a chave",
     "API_SETUP.md → seção 8", "midia"),
    ("FAL_KEY", "fal.ai",
     "imagem e vídeo em modelos que o Gemini não tem", "formato id:segredo",
     "API_SETUP.md → seção 9", "midia"),
    ("WAHA_BASE_URL", "WAHA — endereço",
     "disparo de WhatsApp multi-conta pelo seu servidor",
     "ex: http://localhost:3000 — precisa de servidor próprio",
     "API_SETUP.md → seção 10", "whatsapp"),
    ("WAHA_API_KEY", "WAHA — chave",
     "idem (par do endereço)", "VOCÊ inventa esta senha — não existe painel",
     "API_SETUP.md → seção 10", "whatsapp"),
    ("RESEND_API_KEY", "Resend",
     "enviar e-mail e receber relatório automático", "começa com re_ — free tier generoso",
     "API_SETUP.md → seção 11", "email"),
    ("APIDIRECT_API_KEY", "apidirect",
     "puxar dados de perfil e post de qualquer rede social",
     "painel apidirect", "API_SETUP.md → seção 12", "pesquisa"),
    ("SCRAPECREATORS_API_KEY", "ScrapeCreators",
     "ver os anúncios que o seu concorrente está rodando",
     "painel scrapecreators.com — consome crédito por busca",
     "API_SETUP.md → seção 13", "pesquisa"),
    ("NICHEFINDER_API_KEY", "NicheFinder",
     "achar nicho de YouTube por dado (65 mil canais)", "começa com nf_",
     "API_SETUP.md → seção 14", "pesquisa"),
    ("APIFY_TOKEN", "Apify",
     "raspagem pronta de sites (catálogo de robôs)", "painel console.apify.com",
     "API_SETUP.md → seção 15", "pesquisa"),
    ("CLOUDFLARE_ANALYTICS_TOKEN", "Cloudflare Web Analytics",
     "saber quantas visitas a sua página recebeu, sem cookie",
     "painel dash.cloudflare.com — grátis", "API_SETUP.md → seção 16", "analytics"),
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
    for env_var, *_ in CHAVES:
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

    for bloco_id, titulo, desbloqueia_bloco, essencial in BLOCOS:
        chaves_do_bloco = [c for c in CHAVES if c[5] == bloco_id]
        if not chaves_do_bloco:
            continue

        ja_tem = sum(1 for c in chaves_do_bloco if valores.get(c[0]))
        print(f"  ── {titulo}: {desbloqueia_bloco}")
        if ja_tem:
            print(f"     ({ja_tem} de {len(chaves_do_bloco)} já configurada(s))")

        if not essencial:
            resposta = input("     configurar agora? (s/N): ").strip().lower()
            if resposta not in ("s", "sim", "y"):
                print("     pulado — dá pra voltar aqui quando quiser.")
                print()
                continue
        print()

        for env_var, rotulo, desbloqueia, dica, guia, _ in chaves_do_bloco:
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
