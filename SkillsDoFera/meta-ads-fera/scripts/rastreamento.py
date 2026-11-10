"""Pré-voo de rastreamento Meta Ads — roda ANTES de criar campanha/anúncio.

Duas coisas num lugar só:
  1. URL_TAGS: a UTM padrão que todo anúncio leva (importar nos scripts de subir campanha).
  2. Checagem da página de destino: pixel certo, PageView, evento de otimização com eventID
     (deduplica com a CAPI), captura de fbclid/_fbc/_fbp pro servidor.

Uso:
  python rastreamento.py --url https://exemplo.com/pagina --pixel 123456789012345 --evento LEAD
Sai com código 1 se houver FALHA (o script de subir campanha deve parar).
"""
from __future__ import annotations

import argparse
import re
import sys
from urllib.parse import parse_qsl, urljoin, urlparse

# Seu CRM ou planilha conta lead pago por utm_source=meta — não trocar por "facebook"/"fb".
# utm_content = nome do anúncio: em páginas com "utm_content é contrato", o NOME do anúncio
# tem que ser exatamente a chave que a página espera.
URL_TAGS = (
    "utm_source=meta&utm_medium=cpc"
    "&utm_campaign={{campaign.name}}"
    "&utm_term={{adset.name}}"
    "&utm_content={{ad.name}}"
    "&utm_id={{campaign.id}}"
    "&ad_id={{ad.id}}"
    "&placement={{placement}}"
)

UTM_OBRIGATORIAS = ("utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content")

# custom_event_type do conjunto -> nome do evento no fbq
EVENTOS = {
    "LEAD": "Lead",
    "PURCHASE": "Purchase",
    "INITIATED_CHECKOUT": "InitiateCheckout",
    "COMPLETE_REGISTRATION": "CompleteRegistration",
    "CONTACT": "Contact",
    "SCHEDULE": "Schedule",
    "ADD_TO_CART": "AddToCart",
    "SUBMIT_APPLICATION": "SubmitApplication",
    "ADD_PAYMENT_INFO": "AddPaymentInfo",
    "SUBSCRIBE": "Subscribe",
    "START_TRIAL": "StartTrial",
}

_RE_INIT = re.compile(r"""fbq\(\s*['"]init['"]\s*,\s*['"](\d{6,20})['"]""")
# Qualquer função: páginas embrulham o fbq (ex.: fb("track","Lead",…)) pra engolir bloqueador.
_RE_TRACK = re.compile(r"""\w+\(\s*['"]track(?:Custom)?['"]\s*,\s*['"]([A-Za-z_]+)['"]""")
_RE_SCRIPT_SRC = re.compile(r"""<script[^>]+src=['"]([^'"]+)['"]""", re.I)
TIMEOUT_S = 15


def evento_do_pixel(custom_event_type: str) -> str:
    chave = custom_event_type.strip().upper()
    return EVENTOS.get(chave, custom_event_type)


def validar_url_tags(url_tags: str) -> list[str]:
    params = dict(parse_qsl(url_tags, keep_blank_values=True))
    problemas = [f"falta {k} no url_tags" for k in UTM_OBRIGATORIAS if not params.get(k)]
    if params.get("utm_source") and params["utm_source"] != "meta":
        problemas.append("utm_source tem que ser 'meta' (é o que o seu CRM ou planilha usa pra marcar lead pago)")
    return problemas


def analisar_fonte(fonte: str) -> dict:
    eventos = set(_RE_TRACK.findall(fonte))
    return {
        "pixels": set(_RE_INIT.findall(fonte)),
        "pageview": "PageView" in eventos,
        "eventos": eventos,
        "event_id": "eventID" in fonte,
        "fbclid": "fbclid" in fonte,
        "fbp_fbc": "_fbp" in fonte and "_fbc" in fonte,
        "rastreio_js": "FeraRastreio" in fonte,
    }


def veredito(analise: dict, pixel_esperado: str, custom_event_type: str) -> list[tuple[str, str]]:
    """Lista de (nível, mensagem). Nível: FALHA | ALERTA | OK."""
    evento = evento_do_pixel(custom_event_type)
    r: list[tuple[str, str]] = []

    if not analise["pixels"]:
        r.append(("FALHA", "nenhum pixel (fbq init) encontrado na página nem nos .js dela"))
    elif pixel_esperado not in analise["pixels"]:
        achados = ", ".join(sorted(analise["pixels"]))
        r.append(("FALHA", f"página usa pixel {achados}, conjunto otimiza pelo {pixel_esperado}"))
    else:
        r.append(("OK", f"pixel {pixel_esperado} instalado"))

    r.append(("OK", "PageView disparado") if analise["pageview"]
             else ("FALHA", "PageView não é disparado"))

    if evento in analise["eventos"]:
        r.append(("OK", f"evento de otimização {evento} existe na página"))
    else:
        r.append(("FALHA", f"evento {evento} (otimização do conjunto) não aparece na página — "
                           "Meta vai otimizar no escuro"))

    r.append(("OK", "eventID no fbq (deduplica com CAPI)") if analise["event_id"]
             else ("ALERTA", "fbq sem eventID: sem ele a CAPI duplica ou fica sem par"))
    r.append(("OK", "captura fbclid -> _fbc no primeiro clique") if analise["fbclid"]
             else ("ALERTA", "página não lê fbclid: primeiro clique chega à CAPI sem _fbc"))
    r.append(("OK", "_fbp/_fbc enviados ao servidor") if analise["fbp_fbc"]
             else ("ALERTA", "_fbp/_fbc não vão pro backend: CAPI perde a ligação com o clique"))
    r.append(("OK", "usa o rastreio.js padrão (origem 90 dias, checkout, correspondência avançada)")
             if analise.get("rastreio_js")
             else ("ALERTA", "página não carrega o rastreio.js padrão — ver meta-ads-fera/references/rastreamento.md §3"))
    return r


def _baixar(url: str) -> str:
    import requests

    resp = requests.get(url, timeout=TIMEOUT_S, headers={"User-Agent": "preflight-rastreamento"})
    resp.raise_for_status()
    return resp.text


def coletar_fonte(url: str) -> tuple[str, list[str]]:
    """HTML + scripts do mesmo domínio (pixel às vezes mora num .js externo)."""
    html = _baixar(url)
    partes, avisos = [html], []
    host = urlparse(url).netloc
    for src in _RE_SCRIPT_SRC.findall(html):
        alvo = urljoin(url, src)
        if urlparse(alvo).netloc != host:
            continue
        try:
            partes.append(_baixar(alvo))
        except Exception as e:  # noqa: BLE001 — script quebrado vira aviso, não derruba o pré-voo
            avisos.append(f"não consegui ler {alvo}: {e}")
    return "\n".join(partes), avisos


def checar_destino_com_utm(url: str) -> list[tuple[str, str]]:
    """Confere que a UTM sobrevive a redirect (redirect que come query mata a atribuição)."""
    import requests

    sep = "&" if urlparse(url).query else "?"
    teste = f"{url}{sep}utm_source=meta&utm_content=preflight&fbclid=PREFLIGHT"
    try:
        resp = requests.get(teste, timeout=TIMEOUT_S, allow_redirects=True)
    except Exception as e:  # noqa: BLE001
        return [("FALHA", f"destino não abre: {e}")]
    if resp.status_code >= 400:
        return [("FALHA", f"destino responde {resp.status_code}")]
    if "utm_content=preflight" not in resp.url:
        return [("FALHA", f"redirect descarta a UTM (chegou em {resp.url})")]
    return [("OK", "destino abre e preserva UTM/fbclid após redirect")]


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", required=True, help="página de destino do anúncio")
    ap.add_argument("--pixel", required=True, help="pixel do promoted_object do conjunto")
    ap.add_argument("--evento", default="LEAD", help="custom_event_type do conjunto (LEAD, PURCHASE...)")
    ap.add_argument("--url-tags", default=URL_TAGS, help="url_tags que vai no anúncio")
    ap.add_argument("--tambem", action="append", default=[],
                    help="outra página do funil onde o evento dispara (ex.: página de obrigado); repetível")
    a = ap.parse_args(argv)

    resultado = [("FALHA", p) for p in validar_url_tags(a.url_tags)]
    resultado += checar_destino_com_utm(a.url)
    try:
        fonte, avisos = coletar_fonte(a.url)
        for extra in a.tambem:
            f2, av2 = coletar_fonte(extra)
            fonte, avisos = fonte + "\n" + f2, avisos + av2
        resultado += [("ALERTA", av) for av in avisos]
        resultado += veredito(analisar_fonte(fonte), a.pixel, a.evento)
    except Exception as e:  # noqa: BLE001
        resultado.append(("FALHA", f"não consegui baixar a página: {e}"))

    for nivel, msg in resultado:
        print(f"[{nivel}] {msg}")
    falhas = sum(1 for n, _ in resultado if n == "FALHA")
    print(f"\n{'REPROVADO' if falhas else 'APROVADO'} — {falhas} falha(s)")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
