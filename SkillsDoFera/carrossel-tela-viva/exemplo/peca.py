# -*- coding: utf-8 -*-
"""Peça de exemplo (dados fictícios). Copie peca.py e cenas.py para a pasta da sua peça e troque a copy e as telas.

O perfil (nome, @, cores) vem do perfil.json, o build.py cuida disso.
Regra de prova: tela de exemplo demonstra como funciona, nunca prova que funcionou.
Se copiar cenas.py para outra pasta, troque o sys.path de cenas.py para apontar para a pasta motor/ da skill.
"""
import json
import os

from cenas import CENAS

PERFIL = json.loads(os.environ.get("FERABOT_PERFIL_JSON", "{}"))
PRODUTO = PERFIL.get("produto", "o meu acompanhamento")

# Segundo da timeline em que o vídeo começa. O quadro 0 é a capa: a tela já nasce montada.
INICIO = {"triagem": 3.0, "cardapio": 2.6, "whats": 2.8, "folha": 2.2}

SLIDES = [
    dict(texto=[("", "Se eu atendesse como nutricionista e começasse hoje, esses são os 4 agentes de IA que eu montaria com o Claude"),
                ("t", "1. Agente da triagem: recebe a ficha da paciente e deixa tudo organizado antes da primeira consulta")],
         cena="triagem", cred="Dados de exemplo"),
    dict(texto=[("t", "2. Agente do cardápio: pega a ficha e monta um rascunho de cada refeição para você revisar"),
                ("", "Quem decide é você. O agente só poupa o tempo de começar do zero.")],
         cena="cardapio", cred="Cardápio de exemplo"),
    dict(texto=[("t", "3. Agente do WhatsApp: responde a dúvida com o contexto do plano e chama você quando a pergunta é sua"),
                ("", "Ele lê o plano da paciente e não recomeça a conversa do zero.")],
         cena="whats", cred="Conversa de exemplo"),
    dict(texto=[("t", "4. Agente da preparação: antes da consulta, entrega uma folha com o que a paciente já respondeu"),
                ("", "A consulta deixa de repetir perguntas e trata do que muda de um caso para outro.")],
         cena="folha", cred="Dados de exemplo"),
]

FINAL = [("", "Qual desses você colocaria primeiro no seu atendimento?"),
         ("", f'Comenta <b>"PLANO"</b> que eu te mando como funciona {PRODUTO}, onde eu monto esses agentes com você, passo a passo. Você não precisa programar nem contratar ninguém.'),
         ("", "E salva esse post para não perder.")]

LEGENDA = f"""Comenta "PLANO" que eu te mando como funciona {PRODUTO}, onde eu monto esses agentes com você.

As telas do post são exemplos com dados fictícios, para mostrar como a ideia funciona.

Comenta PLANO.
"""
