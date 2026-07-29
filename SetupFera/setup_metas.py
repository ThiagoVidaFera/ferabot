"""Setup das metas do operador.

Segunda etapa do onboarding, logo depois do perfil. Grava metas.json, que e lido
pelo /fera em toda conversa e alimenta o Painel do Operador.

A tela faz a conta na frente do cliente de proposito: transformar "10 mil por mes"
(abstrato, adiavel) em "1 venda por semana" (concreto, cobravel).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "ScriptsFera"))
from lib import header, mark_checkpoint, ROOT_DIR  # noqa: E402

METAS_PATH = ROOT_DIR / "metas.json"

META_PADRAO = 10000
SEMANAS_NO_MES = 4

COMPROMISSOS_PADRAO = [
    ("videos_gravados", "Vídeos gravados por semana", 3),
    ("conteudos_publicados", "Conteúdos publicados por semana", 5),
    ("calls_realizadas", "Calls de venda por semana", 2),
]


def ask(label: str, exemplo: str = "", obrigatorio: bool = True) -> str:
    dica = f" (ex: {exemplo})" if exemplo else ""
    while True:
        val = input(f"  {label}{dica}: ").strip()
        if val or not obrigatorio:
            return val
        print("  Campo obrigatório. Tenta de novo.")


def ask_dinheiro(label: str, padrao: int) -> int:
    """Aceita '10000', '10.000', 'R$ 10.000', '10k'. Vazio usa o padrao."""
    while True:
        bruto = input(f"  {label} [R$ {padrao:,}]: ".replace(",", ".")).strip()
        if not bruto:
            return padrao
        limpo = bruto.lower().replace("r$", "").replace(".", "").replace(" ", "")
        multiplicador = 1
        if limpo.endswith("k"):
            multiplicador, limpo = 1000, limpo[:-1]
        limpo = limpo.replace(",", ".")
        try:
            valor = int(float(limpo) * multiplicador)
        except ValueError:
            print("  Não entendi esse valor. Escreve só o número, tipo 10000.")
            continue
        if valor <= 0:
            print("  Tem que ser maior que zero.")
            continue
        return valor


def ask_int(label: str, padrao: int) -> int:
    while True:
        bruto = input(f"  {label} [{padrao}]: ").strip()
        if not bruto:
            return padrao
        try:
            valor = int(bruto)
        except ValueError:
            print("  Escreve só o número.")
            continue
        if valor < 0:
            print("  Não pode ser negativo.")
            continue
        return valor


def ask_sim_nao(label: str, padrao: bool = True) -> bool:
    sufixo = "[S/n]" if padrao else "[s/N]"
    while True:
        bruto = input(f"  {label} {sufixo}: ").strip().lower()
        if not bruto:
            return padrao
        if bruto in ("s", "sim", "y", "yes"):
            return True
        if bruto in ("n", "nao", "não", "no"):
            return False
        print("  Responde s ou n.")


def ask_o_que_vende() -> list[str]:
    opcoes = ["mentoria", "consultoria", "implementação", "curso", "outro"]
    print("  O que você vende? (pode marcar mais de um, separado por vírgula)")
    for i, opcao in enumerate(opcoes, 1):
        print(f"    {i}. {opcao}")
    while True:
        bruto = input("  Números [1,2,3]: ").strip() or "1,2,3"
        try:
            indices = [int(p.strip()) for p in bruto.split(",") if p.strip()]
        except ValueError:
            print("  Escreve os números separados por vírgula, tipo 1,2.")
            continue
        if not indices or any(i < 1 or i > len(opcoes) for i in indices):
            print(f"  Só de 1 a {len(opcoes)}.")
            continue
        return [opcoes[i - 1] for i in indices]


header("FERABOT — Sua meta")

print("  Sem meta declarada eu não tenho como te cobrar.")
print("  São 5 perguntas. Responde direto.")
print()

meta_mes = ask_dinheiro("Quanto você quer faturar por mês", META_PADRAO)
o_que_vende = ask_o_que_vende()
ticket = ask_dinheiro("Preço médio do que você vende", 2500)
prazo_meses = ask_int("Em quantos meses você quer estar nessa meta", 3)

# ── A conta, na frente dele ────────────────────────────────────────────────
clientes_mes = max(1, -(-meta_mes // ticket))  # teto da divisão
vendas_semana = clientes_mes / SEMANAS_NO_MES

print()
print("  " + "─" * 54)
print()
print(f"  R$ {meta_mes:,}".replace(",", ".") + f" ÷ ticket de R$ {ticket:,}".replace(",", ".")
      + f" = {clientes_mes} clientes por mês")
print(f"  {clientes_mes} clientes ÷ 4 semanas = {vendas_semana:.1f} venda(s) por semana")
print()
print("  É esse o número que a gente persegue. Não os 10 mil.")
print("  Pra fechar 1 venda por semana você precisa de lead entrando toda semana.")
print("  É isso que os FeraBots vão construir.")
print()
print("  " + "─" * 54)
print()

# ── Compromissos semanais (a coluna direita do painel) ─────────────────────
print("  Agora o que só anda se você andar.")
print("  Os FeraBots constroem as peças. Isso aqui é irredutível seu.")
print()

compromissos: dict[str, dict] = {}
for chave, rotulo, padrao in COMPROMISSOS_PADRAO:
    compromissos[chave] = {"rotulo": rotulo, "meta_semanal": ask_int(rotulo, padrao)}

compromissos["leads_respondidos_24h"] = {
    "rotulo": "Responder lead novo em até 24h",
    "booleano": True,
    "ativo": ask_sim_nao("Você se compromete a responder lead novo em até 24h", True),
}
compromissos["verba_ads_ativa"] = {
    "rotulo": "Manter verba de anúncio ativa",
    "booleano": True,
    "ativo": ask_sim_nao("Você vai manter verba de anúncio rodando", True),
}

print()
metas_extras = []
while ask_sim_nao("Quer adicionar outra meta sua", False):
    texto = ask("  Qual", "publicar 1 vídeo longo por semana")
    if texto:
        metas_extras.append(texto)

metas = {
    "meta_faturamento_mes": meta_mes,
    "o_que_vende": o_que_vende,
    "ticket_medio": ticket,
    "clientes_necessarios_mes": clientes_mes,
    "vendas_por_semana": round(vendas_semana, 1),
    "prazo_meses": prazo_meses,
    "compromissos_semanais": compromissos,
    "metas_extras": metas_extras,
}

METAS_PATH.write_text(
    json.dumps(metas, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
mark_checkpoint("setup_metas", "done", f"meta R$ {meta_mes} por mes")

print()
print("  Meta salva.")
print()
print(f"  Arquivo: {METAS_PATH}")
print()
print(f"  Seu número da semana: {vendas_semana:.1f} venda(s).")
print()
print("  Próximo passo: python SetupFera/setup_skills.py")
print()
