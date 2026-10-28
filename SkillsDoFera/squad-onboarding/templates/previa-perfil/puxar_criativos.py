"""Baixa os criativos ATIVOS da sua conta de anúncios para servirem de modelo (fase 6, opcional).

Chaves (BYOK): META_ACCESS_TOKEN e META_AD_ACCOUNT_ID, do ambiente ou do `.env` da raiz do FERABOT.
Sem elas o script avisa e sai sem erro: o passo é opcional — dá pra decupar o molde à mão na
Biblioteca de Anúncios da Meta (facebook.com/ads/library) olhando os anúncios ativos.

Uso: python -I puxar_criativos.py <pasta_de_saida>
"""
import json
import pathlib
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from ferabot_env import chave  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
DEST = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()

tok = chave("META_ACCESS_TOKEN", DEST)
CONTA = chave("META_AD_ACCOUNT_ID", DEST)
if not tok or not CONTA:
    print("META_ACCESS_TOKEN / META_AD_ACCOUNT_ID não configurados no .env do FERABOT.\n"
          "Este passo é OPCIONAL: ele só decupa os anúncios ativos da sua conta pra servir de molde.\n"
          "Sem as chaves, abra a Biblioteca de Anúncios da Meta (facebook.com/ads/library), veja os\n"
          "anúncios ativos que funcionam no seu nicho e anote título, corpo, CTA e destino de cada um.\n"
          "Para configurar depois: veja API_SETUP.md na raiz do FERABOT.")
    sys.exit(0)
if not CONTA.startswith("act_"):
    CONTA = f"act_{CONTA}"
DEST.mkdir(parents=True, exist_ok=True)

def api(path, **kw):
    kw["access_token"] = tok
    u = f"https://graph.facebook.com/v21.0/{path}?" + urllib.parse.urlencode(kw)
    with urllib.request.urlopen(u, timeout=90) as r:
        return json.loads(r.read())


campos = ("name,effective_status,creative{object_story_spec,asset_feed_spec,image_url,"
          "thumbnail_url,title,body,object_type}")
d = api(f"{CONTA}/ads", fields=campos, effective_status='["ACTIVE"]', limit=100)

saida = []
for a in d.get("data", []):
    cr = a.get("creative") or {}
    spec = cr.get("object_story_spec") or {}
    ld = spec.get("link_data") or spec.get("video_data") or {}
    cta = (ld.get("call_to_action") or {})
    link = ld.get("link") or (cta.get("value") or {}).get("link", "")
    afs = cr.get("asset_feed_spec") or {}
    if not link and afs.get("link_urls"):
        link = afs["link_urls"][0].get("website_url", "")
    titulos = [t.get("text") for t in afs.get("titles", [])] or ([ld.get("name")] if ld.get("name") else [])
    corpos = [b.get("text") for b in afs.get("bodies", [])] or ([ld.get("message")] if ld.get("message") else [])
    descr = [x.get("text") for x in afs.get("descriptions", [])] or ([ld.get("description")] if ld.get("description") else [])
    saida.append({
        "ad": a.get("name"),
        "destino": link.split("?")[0],
        "cta": cta.get("type") or (afs.get("call_to_action_types") or [None])[0],
        "titulos": [t for t in titulos if t],
        "corpos": [c for c in corpos if c],
        "descricoes": [x for x in descr if x],
        "imagem": cr.get("image_url") or cr.get("thumbnail_url") or ld.get("picture") or "",
        "tipo": cr.get("object_type"),
    })

(DEST / "criativos_ativos.json").write_text(json.dumps(saida, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"{len(saida)} criativos ativos salvos")

# Baixa as imagens para a análise visual do padrão.
imgs = DEST / "imgs"
imgs.mkdir(exist_ok=True)
for i, c in enumerate(saida):
    if not c["imagem"]:
        continue
    nome = f"{i:02d}-{(c['ad'] or 'ad')[:34].replace('/', '-')}.jpg"
    try:
        with urllib.request.urlopen(c["imagem"], timeout=60) as r:
            (imgs / nome).write_bytes(r.read())
    except Exception as e:
        print("  falhou", nome, str(e)[:60])
print("imagens em", imgs)

por_destino = {}
for c in saida:
    por_destino.setdefault(c["destino"], []).append(c)
for k, v in sorted(por_destino.items(), key=lambda x: -len(x[1])):
    print(f"\n### {len(v)}x {k}")
    for c in v[:3]:
        print("  -", c["ad"])
        for t in c["titulos"][:2]:
            print("     titulo:", t[:95])
        for b in c["corpos"][:1]:
            print("     corpo :", b.replace("\n", " | ")[:200])
        if c["cta"]:
            print("     cta   :", c["cta"])
