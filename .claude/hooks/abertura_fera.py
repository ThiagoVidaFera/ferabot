"""
Abertura FERA — hook SessionStart do Ferabot.

Sozinho, o CLAUDE.md governa COMO responder, mas não faz o Claude abrir a boca.
O cliente abre o Ferabot e encara uma tela vazia esperando ele saber o que digitar.

Este hook resolve isso: injeta o estado real do negócio (meta, conta da semana,
entregas) mais a instrução de falar primeiro, na voz FERA.

Regra de ouro deste arquivo: NUNCA quebrar e NUNCA travar. Hook que falha atrasa
a sessão do cliente. Qualquer erro sai em silêncio e a sessão segue com o
CLAUDE.md sozinho, que já é um fallback aceitável.
"""
import json
import sys
from pathlib import Path

# Sem isso o hook escreve os acentos em cp1252 e o texto chega MOJIBAKE no
# contexto do Claude ("instru��o"). Além de ilegível, português quebrado no
# contexto contamina tudo que o modelo escreve depois.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent.parent


# Arquivo ausente e arquivo corrompido pedem tratamentos OPOSTOS, e confundir os
# dois apaga o negócio do cliente: ausente = fazer o briefing, corrompido = NÃO
# fazer, porque refazer o briefing sobrescreveria a meta que ele já declarou.
CORROMPIDO = object()


def ler_json(nome):
    caminho = ROOT / nome
    if not caminho.exists():
        return None
    try:
        # encoding explícito: sem isso o Windows lê em cp1252 e o nicho do
        # cliente chega mojibake no contexto, o que contamina toda peça.
        return json.loads(caminho.read_text(encoding="utf-8"))
    except Exception:
        return CORROMPIDO


def brl(valor):
    try:
        return f"R$ {float(valor):,.0f}".replace(",", ".")
    except Exception:
        return str(valor)


def vendas(valor):
    """'1.0 venda(s)' soa a robô. O número da semana é a frase que mais se repete
    na boca do operador, então tem que sair como gente fala."""
    try:
        n = float(valor)
    except Exception:
        return str(valor)
    texto = f"{n:.0f}" if n == int(n) else f"{n:.1f}".replace(".", ",")
    return f"{texto} venda" if n == 1 else f"{texto} vendas"


def main():
    perfil = ler_json("perfil.json")
    metas = ler_json("metas.json")
    entregas = ler_json("entregas.json")

    linhas = []
    linhas.append("ABERTURA FERA (instrução de sistema, o cliente não vê este bloco)")
    linhas.append("")

    # ── Arquivo corrompido: parar, nunca refazer o briefing ───────────────
    quebrados = [
        nome
        for nome, dado in (
            ("perfil.json", perfil),
            ("metas.json", metas),
            ("entregas.json", entregas),
        )
        if dado is CORROMPIDO
    ]
    if quebrados:
        linhas.append(f"ATENÇÃO: {', '.join(quebrados)} existe mas está ilegível (JSON inválido).")
        linhas.append("")
        linhas.append("NÃO refaça o briefing e NÃO sobrescreva esse arquivo. O cliente já declarou")
        linhas.append("perfil e meta, e reescrever apagaria o negócio dele.")
        linhas.append("")
        linhas.append("Abra a conversa na voz do Thiago Vida Fera dizendo o que está quebrado, e")
        linhas.append("peça autorização pra abrir o arquivo e reparar só o que está corrompido.")
        print("\n".join(linhas))
        return

    # ── Briefing pendente: o caminho crítico ──────────────────────────────
    if not perfil or not metas:
        linhas.append("Este Ferabot ainda NÃO tem perfil e meta configurados.")
        linhas.append("")
        linhas.append("Antes de qualquer outra coisa, e sem esperar o cliente pedir:")
        linhas.append("leia HANDOFF-FERA.md e rode as fases 0 a 5 de")
        linhas.append("SkillsDoFera/fera/references/onboarding.md (tour, perfil, meta,")
        linhas.append("painel, Google Tasks, primeira peça).")
        linhas.append("")
        linhas.append("Não produza peça nenhuma antes do briefing fechado.")
        print("\n".join(linhas))
        return

    nome = (perfil.get("nome") or "").split(" ")[0]
    nicho = perfil.get("nicho") or ""
    meta_mes = metas.get("meta_faturamento_mes")
    ticket = metas.get("ticket_medio")
    vendas_semana = metas.get("vendas_por_semana")
    clientes_mes = metas.get("clientes_necessarios_mes")

    linhas.append("FALE PRIMEIRO. Não espere o cliente digitar.")
    linhas.append("")
    linhas.append("Abra com o estado real do negócio dele, na voz do Thiago Vida Fera:")
    linhas.append("mentor em primeira pessoa, seco, direto, anti-hype, que confronta o")
    linhas.append("trabalho e nunca a pessoa. Sem emoji, sem travessão, sem ponto e")
    linhas.append("vírgula. Blocos de no máximo 2 linhas: ele lê no celular.")
    linhas.append("")
    linhas.append("Diagnóstico primeiro, oferta de trabalho depois. PROIBIDO abrir com")
    linhas.append('menu de opções ou com "como posso ajudar".')
    linhas.append("")
    linhas.append("Estado atual:")
    if nome:
        linhas.append(f"- Cliente: {nome}" + (f", nicho de {nicho}" if nicho else ""))
    if perfil.get("produto"):
        linhas.append(f"- Vende: {perfil['produto']} a {perfil.get('preco') or 'preço não informado'}")
    if meta_mes:
        linhas.append(f"- Meta declarada: {brl(meta_mes)} por mês")
    if ticket and clientes_mes:
        linhas.append(f"- A conta dele: ticket {brl(ticket)} = {clientes_mes} clientes por mês")
    if vendas_semana:
        linhas.append(f"- O número que se cobra: {vendas(vendas_semana)} por semana")

    # Compromissos: a coluna que só anda se ele andar.
    comp = (metas.get("compromissos_semanais") or {})
    if isinstance(comp, dict) and comp:
        rotulos = []
        for dados in comp.values():
            if isinstance(dados, dict) and dados.get("rotulo"):
                meta_sem = dados.get("meta_semanal")
                rotulos.append(
                    f"{dados['rotulo']}" + (f" (x{meta_sem})" if meta_sem else "")
                )
        if rotulos:
            linhas.append("- Compromissos da semana (irredutíveis, são dele):")
            for r in rotulos:
                linhas.append(f"    · {r}")

    # Entregas: cobrar em cima do que existe, não no abstrato.
    itens = []
    if isinstance(entregas, dict):
        itens = entregas.get("entregas") or []
    elif isinstance(entregas, list):
        itens = entregas

    if itens:
        plural = "peça" if len(itens) == 1 else "peças"
        linhas.append(f"- Os FeraBots já entregaram {len(itens)} {plural}.")
        for item in itens[-3:]:
            if isinstance(item, dict):
                desc = item.get("descricao") or item.get("o_que") or ""
                if desc:
                    linhas.append(f"    · {desc}")
        linhas.append("  Cobre execução em cima do que já existe, não no abstrato.")
    else:
        linhas.append("- Nenhuma entrega registrada ainda. A primeira peça é a prioridade.")

    linhas.append("")
    linhas.append("Feche a abertura com UM próximo passo concreto, não com pergunta aberta.")

    print("\n".join(linhas))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Silêncio proposital: o CLAUDE.md ainda carrega a voz sem este hook.
        sys.exit(0)
