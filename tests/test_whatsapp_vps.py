"""Regras puras do ScriptsFera/whatsapp_vps.py (nenhuma VPS é tocada)."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ScriptsFera"))
import whatsapp_vps as wv  # noqa: E402
from whatsapp_vps import ErroWhatsapp  # noqa: E402


def test_ip_publico_passa():
    assert wv.validar_ip(" 8.8.8.8 ") == "8.8.8.8"


@pytest.mark.parametrize("ip", ["10.0.0.5", "192.168.1.10", "127.0.0.1", "172.16.0.1", "100.65.238.105", "abc", "1.2.3", "1.2.3.4; rm -rf /"])
def test_ip_interno_ou_invalido_e_recusado(ip: str):
    with pytest.raises(ErroWhatsapp):
        wv.validar_ip(ip)


def test_dominio_bom_passa_e_vira_minusculo():
    assert wv.validar_dominio("WhatsApp.AnaSouza.com.br.") == "whatsapp.anasouza.com.br"


@pytest.mark.parametrize("dominio", ["semponto", "a b.com", "x.com; reboot", "https://x.com", "-x.com", "x.c"])
def test_dominio_invalido_e_recusado(dominio: str):
    with pytest.raises(ErroWhatsapp):
        wv.validar_dominio(dominio)


def test_sem_dominio_proprio_usa_nome_que_aponta_para_o_ip():
    assert wv.dominio_padrao("8.8.8.8") == "8-8-8-8.sslip.io"


def test_so_a_api_do_whatsapp_fica_exposta():
    caddy = wv.caddyfile("whatsapp.ana.com.br")

    assert caddy.startswith("whatsapp.ana.com.br {")
    assert "@api path /api/* /ping" in caddy
    assert "reverse_proxy waha:3000" in caddy
    assert "respond 404" in caddy  # painel e swagger do WAHA não saem para a internet


def test_compose_usa_motor_noweb_com_chave_e_sem_porta_do_waha_aberta():
    texto = wv.compose("chave123")

    assert 'WHATSAPP_API_KEY: "chave123"' in texto
    assert "WHATSAPP_DEFAULT_ENGINE: NOWEB" in texto
    assert '"443:443"' in texto
    assert "3000:3000" not in texto  # o WAHA só é alcançado pelo Caddy


def test_script_remoto_e_idempotente_e_nao_executa_o_conteudo_dos_arquivos():
    script = wv.script_remoto("whatsapp.ana.com.br", "chave123")

    assert "command -v docker" in script
    assert "<<'FERABOT_CADDY'" in script and "<<'FERABOT_COMPOSE'" in script  # heredoc entre aspas: sem expansão
    assert "docker compose up -d" in script
    assert script.startswith("set -euo pipefail")


def test_reinstalar_mantem_a_chave_que_o_painel_ja_conhece():
    assert wv.chave_do_servidor({"chave": "antiga"}) == "antiga"
    nova = wv.chave_do_servidor({})
    assert len(nova) == 48 and nova != wv.chave_do_servidor({})


def test_estado_local_vai_e_volta(tmp_path: Path):
    arquivo = tmp_path / "whatsapp.json"

    wv.gravar_estado({"url": "https://x.sslip.io", "chave": "k"}, arquivo)

    assert wv.ler_estado(arquivo) == {"url": "https://x.sslip.io", "chave": "k"}
    assert wv.ler_estado(tmp_path / "nao-existe.json") == {}
