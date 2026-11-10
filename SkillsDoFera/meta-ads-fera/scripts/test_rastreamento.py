"""Testes do pré-voo de rastreamento. Rodar: python -m pytest .claude/skills/meta-ads-rastreamento/scripts -q"""
from rastreamento import (
    URL_TAGS,
    analisar_fonte,
    evento_do_pixel,
    validar_url_tags,
    veredito,
)

PAGINA_COMPLETA = """
<script>!function(f,b,e,v,n,t,s){}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '111111111111111');
fbq('track', 'PageView');
</script>
<script>
function fbc(){ var c = cookie('_fbc'); if (c) return c;
  var id = new URLSearchParams(location.search).get('fbclid');
  return id ? 'fb.1.' + Date.now() + '.' + id : ''; }
var corpo = { fbp: cookie('_fbp'), fbc: fbc() };
corpo.event_id = 'lead-' + Date.now();
fetch('/.netlify/functions/lead', {method:'POST', body: JSON.stringify(corpo)});
fbq('track', 'Lead', {content_name: 'x'}, { eventID: corpo.event_id });
</script>
"""


def test_url_tags_padrao_passa_na_propria_validacao():
    assert validar_url_tags(URL_TAGS) == []


def test_url_tags_sem_utm_content_e_reprovada():
    problemas = validar_url_tags("utm_source=meta&utm_medium=cpc&utm_campaign={{campaign.name}}")
    assert any("utm_content" in p for p in problemas)


def test_url_tags_com_source_fora_do_padrao_e_reprovada():
    tags = URL_TAGS.replace("utm_source=meta", "utm_source=facebook")
    assert any("utm_source" in p for p in validar_url_tags(tags))


def test_analisa_pagina_completa():
    a = analisar_fonte(PAGINA_COMPLETA)
    assert a["pixels"] == {"111111111111111"}
    assert a["pageview"] is True
    assert "Lead" in a["eventos"]
    assert a["event_id"] is True
    assert a["fbclid"] is True
    assert a["fbp_fbc"] is True


def test_pagina_sem_pixel_reprova():
    resultado = veredito(analisar_fonte("<html><body>oi</body></html>"), "111111111111111", "LEAD")
    assert any(nivel == "FALHA" and "pixel" in msg.lower() for nivel, msg in resultado)


def test_pixel_diferente_do_conjunto_reprova():
    resultado = veredito(analisar_fonte(PAGINA_COMPLETA), "222222222222222", "LEAD")
    assert any(nivel == "FALHA" and "222222222222222" in msg for nivel, msg in resultado)


def test_evento_de_otimizacao_ausente_na_pagina_reprova():
    resultado = veredito(analisar_fonte(PAGINA_COMPLETA), "111111111111111", "PURCHASE")
    assert any(nivel == "FALHA" and "Purchase" in msg for nivel, msg in resultado)


def test_pagina_completa_nao_tem_falha():
    resultado = veredito(analisar_fonte(PAGINA_COMPLETA), "111111111111111", "LEAD")
    assert [r for r in resultado if r[0] == "FALHA"] == []


def test_evento_sem_event_id_vira_alerta_de_deduplicacao():
    fonte = "fbq('init','1'); fbq('track','PageView'); fbq('track','Lead');"
    resultado = veredito(analisar_fonte(fonte), "1", "LEAD")
    assert any(nivel == "ALERTA" and "eventID" in msg for nivel, msg in resultado)


def test_mapa_de_evento_cobre_o_erro_conhecido_de_checkout():
    assert evento_do_pixel("INITIATED_CHECKOUT") == "InitiateCheckout"
    assert evento_do_pixel("lead") == "Lead"


def test_pagina_sem_rastreio_js_padrao_gera_alerta():
    resultado = veredito(analisar_fonte(PAGINA_COMPLETA), "111111111111111", "LEAD")
    assert any(nivel == "ALERTA" and "rastreio.js" in msg for nivel, msg in resultado)


def test_pagina_com_rastreio_js_nao_alerta_sobre_ele():
    fonte = PAGINA_COMPLETA + "<script>window.FeraRastreio = {};</script>"
    resultado = veredito(analisar_fonte(fonte), "111111111111111", "LEAD")
    assert not any("rastreio.js" in msg and nivel != "OK" for nivel, msg in resultado)


def test_detecta_evento_disparado_por_funcao_auxiliar():
    fonte = "fbq('init','1');fbq('track','PageView');function fb(a,b,c,d){fbq(a,b,c,d);} fb(\"track\",\"Lead\",{});"
    assert "Lead" in analisar_fonte(fonte)["eventos"]
