"""Testes do ScriptsFera/publicar.py com a API do Post for Me mockada (nenhuma chamada de rede)."""
from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ScriptsFera"))
import publicar  # noqa: E402
from publicar import ErroPublicar  # noqa: E402

AGORA = datetime(2026, 11, 16, 12, 0, tzinfo=timezone.utc)


def criar(pasta: Path, *nomes: str) -> Path:
    pasta.mkdir(parents=True, exist_ok=True)
    for nome in nomes:
        (pasta / nome).write_bytes(b"x")
    return pasta


# ── horário ───────────────────────────────────────────────────────────────

def test_converte_brasilia_para_utc():
    resultado = publicar.converter_quando("2026-11-20 18:30", AGORA)
    assert publicar.iso_utc(resultado) == "2026-11-20T21:30:00Z"


def test_converte_virada_de_dia():
    resultado = publicar.converter_quando("2026-11-20 22:15", AGORA)
    assert publicar.iso_utc(resultado) == "2026-11-21T01:15:00Z"


def test_recusa_horario_passado():
    with pytest.raises(ErroPublicar, match="já passou"):
        publicar.converter_quando("2026-11-16 08:00", AGORA)


def test_recusa_formato_errado():
    with pytest.raises(ErroPublicar, match="AAAA-MM-DD HH:MM"):
        publicar.converter_quando("20/11/2026 18h", AGORA)


def test_fallback_de_fuso_sem_tzdata(monkeypatch):
    monkeypatch.setattr(publicar, "fuso_brasilia", lambda: publicar.FUSO_FALLBACK)
    resultado = publicar.converter_quando("2026-11-20 09:00", AGORA)
    assert publicar.iso_utc(resultado) == "2026-11-20T12:00:00Z"


# ── ordem e coleta de mídia ───────────────────────────────────────────────

def test_ordem_numerica_dos_slides(tmp_path):
    pasta = criar(tmp_path / "carrossel", "slide-10.png", "slide-02.png", "slide-1.png",
                  "slide-03.png", "slide-01.html", "capa-extra.png", "legenda.txt")
    nomes = [p.name for p in publicar.coletar_midias([str(pasta)])]
    assert nomes == ["slide-1.png", "slide-02.png", "slide-03.png", "slide-10.png"]


def test_pasta_sem_slides_pega_toda_midia(tmp_path):
    pasta = criar(tmp_path / "stories", "story-2.png", "story-1.png", "notas.md")
    nomes = [p.name for p in publicar.coletar_midias([str(pasta)])]
    assert nomes == ["story-1.png", "story-2.png"]


def test_arquivos_soltos_mantem_ordem_passada(tmp_path):
    pasta = criar(tmp_path, "b.png", "a.png")
    nomes = [p.name for p in publicar.coletar_midias([str(pasta / "b.png"), str(pasta / "a.png")])]
    assert nomes == ["b.png", "a.png"]


def test_recusa_arquivo_que_nao_e_midia(tmp_path):
    pasta = criar(tmp_path, "slide.html")
    with pytest.raises(ErroPublicar, match="não é imagem"):
        publicar.coletar_midias([str(pasta / "slide.html")])


# ── validação de formato ─────────────────────────────────────────────────

def test_feed_aceita_um_arquivo_so(tmp_path):
    pasta = criar(tmp_path, "slide-01.png", "slide-02.png", "legenda.txt")
    with pytest.raises(ErroPublicar, match="Feed é 1 arquivo"):
        publicar.montar_plano([str(pasta)], "feed", "2026-11-20 18:30", None, AGORA)


def test_carrossel_acima_de_dez(tmp_path):
    nomes = [f"slide-{i:02d}.png" for i in range(1, 12)]
    pasta = criar(tmp_path, *nomes, "legenda.txt")
    with pytest.raises(ErroPublicar, match="até 10"):
        publicar.montar_plano([str(pasta)], "carrossel", "2026-11-20 18:30", None, AGORA)


def test_reel_exige_video(tmp_path):
    pasta = criar(tmp_path, "capa.png", "legenda.txt")
    with pytest.raises(ErroPublicar, match="Reel é 1 vídeo"):
        publicar.montar_plano([str(pasta)], "reel", "2026-11-20 18:30", None, AGORA)


def test_legenda_obrigatoria_fora_do_story(tmp_path):
    pasta = criar(tmp_path, "slide-01.png", "slide-02.png")
    with pytest.raises(ErroPublicar, match="Faltou a legenda"):
        publicar.montar_plano([str(pasta)], "carrossel", "2026-11-20 18:30", None, AGORA)


# ── plano e payload ──────────────────────────────────────────────────────

def test_plano_carrossel_com_legenda_da_pasta(tmp_path):
    pasta = criar(tmp_path, "slide-02.png", "slide-01.png")
    (pasta / "legenda.txt").write_text("Linha 1\nLinha 2", encoding="utf-8")
    plano = publicar.montar_plano([str(pasta)], "carrossel", "2026-11-20 18:30", None, AGORA)
    assert plano.placement == "timeline"
    assert [m.name for m in plano.midias] == ["slide-01.png", "slide-02.png"]
    assert plano.legenda == "Linha 1\nLinha 2"
    texto = publicar.texto_plano(plano, enviar=False)
    assert "DRY-RUN" in texto and "2026-11-20T21:30:00Z" in texto and "01. slide-01.png" in texto


def test_payload_story_sem_legenda(tmp_path):
    pasta = criar(tmp_path, "story-01.png", "story-02.png")
    plano = publicar.montar_plano([str(pasta)], "story", "2026-11-20 18:30", None, AGORA)
    payload = publicar.montar_payload(plano, ["https://m/1.png", "https://m/2.png"], ["spc_1"])
    assert payload["caption"] == " "
    assert payload["scheduled_at"] == "2026-11-20T21:30:00Z"
    assert payload["social_accounts"] == ["spc_1"]
    assert payload["media"] == [{"url": "https://m/1.png", "index": 0}, {"url": "https://m/2.png", "index": 1}]
    assert payload["platform_configurations"]["instagram"] == {"placement": "stories"}
    assert payload["platform_configurations"]["facebook"] == {"placement": "stories"}


def test_payload_reel(tmp_path):
    pasta = criar(tmp_path, "reel.mp4")
    legenda = tmp_path / "leg.txt"
    legenda.write_text("Legenda do reel", encoding="utf-8")
    plano = publicar.montar_plano([str(pasta)], "reel", "2026-11-20 18:30", str(legenda), AGORA)
    payload = publicar.montar_payload(plano, ["https://m/r.mp4"], ["spc_1"])
    assert payload["caption"] == "Legenda do reel"
    assert payload["platform_configurations"]["instagram"]["placement"] == "reels"


def test_payload_reel_com_capa(tmp_path):
    pasta = criar(tmp_path, "reel.mp4", "capa.png", "legenda.txt")
    plano = publicar.montar_plano([str(pasta / "reel.mp4")], "reel", "2026-11-20 18:30", None, AGORA,
                                  capa=str(pasta / "capa.png"))
    payload = publicar.montar_payload(plano, ["https://m/r.mp4"], ["spc_1"], "https://m/capa.png")
    assert payload["media"] == [{"url": "https://m/r.mp4", "index": 0, "thumbnail_url": "https://m/capa.png"}]


def test_capa_fora_do_reel(tmp_path):
    pasta = criar(tmp_path, "slide-01.png", "capa.png", "legenda.txt")
    with pytest.raises(ErroPublicar, match="só vale para reel"):
        publicar.montar_plano([str(pasta / "slide-01.png")], "feed", "2026-11-20 18:30", None, AGORA,
                              capa=str(pasta / "capa.png"))


# ── contas e envio com API mockada ───────────────────────────────────────

CONTAS = [
    {"id": "spc_ig", "platform": "instagram", "username": "fera", "status": "connected"},
    {"id": "spc_tt", "platform": "tiktok", "username": "fera", "status": "connected"},
    {"id": "spc_off", "platform": "instagram", "username": "velha", "status": "disconnected"},
]


@pytest.fixture
def api_falsa(monkeypatch):
    chamadas = []

    def falsa(metodo, caminho, chave, **kwargs):
        chamadas.append((metodo, caminho, kwargs))
        if caminho == "/social-accounts":
            return {"data": CONTAS}
        if caminho == "/media/create-upload-url":
            n = sum(1 for c in chamadas if c[1] == "/media/create-upload-url")
            return {"upload_url": f"https://up/{n}", "media_url": f"https://m/{n}.png"}
        if caminho == "/social-posts" and metodo == "POST":
            return {"id": "sp_1", "status": "scheduled", "scheduled_at": kwargs["json"]["scheduled_at"]}
        if caminho.startswith("/social-posts/") and metodo == "DELETE":
            return {"success": True}
        raise AssertionError(f"chamada inesperada {metodo} {caminho}")

    monkeypatch.setattr(publicar, "api", falsa)
    monkeypatch.setattr(publicar, "chave_api", lambda: "chave-teste")
    monkeypatch.setattr(publicar, "_env_tem_chave", lambda: True)
    return chamadas


def test_resolve_unica_conta_instagram_conectada(api_falsa):
    assert [c["id"] for c in publicar.resolver_contas("k", None)] == ["spc_ig"]


def test_recusa_conta_desconectada(api_falsa):
    with pytest.raises(ErroPublicar, match="desconectada"):
        publicar.resolver_contas("k", "spc_off")


def test_dry_run_nao_sobe_nada(api_falsa, tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(publicar, "converter_quando", lambda texto, agora=None: datetime(2026, 11, 20, 21, 30, tzinfo=timezone.utc))
    pasta = criar(tmp_path, "slide-01.png", "slide-02.png")
    (pasta / "legenda.txt").write_text("oi", encoding="utf-8")
    codigo = publicar.main(["agendar", str(pasta), "--formato", "carrossel", "--quando", "2026-11-20 18:30"])
    assert codigo == 0
    assert [c[1] for c in api_falsa] == ["/social-accounts"]
    assert "DRY-RUN" in capsys.readouterr().out


def test_enviar_sobe_na_ordem_e_cria_post(api_falsa, tmp_path, monkeypatch):
    monkeypatch.setattr(publicar, "converter_quando", lambda texto, agora=None: datetime(2026, 11, 20, 21, 30, tzinfo=timezone.utc))
    subidos = []

    def subir(chave, arquivo):
        subidos.append(arquivo.name)
        return f"https://m/{arquivo.name}"

    monkeypatch.setattr(publicar, "subir_midia", subir)
    pasta = criar(tmp_path, "slide-10.png", "slide-2.png", "slide-1.png")
    (pasta / "legenda.txt").write_text("oi", encoding="utf-8")
    codigo = publicar.main(["agendar", str(pasta), "--formato", "carrossel",
                            "--quando", "2026-11-20 18:30", "--enviar"])
    assert codigo == 0
    assert subidos == ["slide-1.png", "slide-2.png", "slide-10.png"]
    post = [c for c in api_falsa if c[1] == "/social-posts"][0][2]["json"]
    assert [m["url"] for m in post["media"]] == ["https://m/slide-1.png", "https://m/slide-2.png", "https://m/slide-10.png"]
    assert post["social_accounts"] == ["spc_ig"] and post["scheduled_at"] == "2026-11-20T21:30:00Z"


def test_cancelar(api_falsa, capsys):
    assert publicar.main(["cancelar", "sp_1"]) == 0
    assert ("DELETE", "/social-posts/sp_1", {}) in api_falsa
    assert "cancelado" in capsys.readouterr().out


def test_erro_vira_mensagem_e_codigo_1(tmp_path, capsys):
    codigo = publicar.main(["agendar", str(tmp_path / "nao-existe"), "--formato", "feed", "--quando", "2030-01-01 10:00"])
    assert codigo == 1
    assert "[ERRO]" in capsys.readouterr().err
