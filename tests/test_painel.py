"""Testes do ScriptsFera/painel.py contra um painel de mentira rodando em localhost."""
from __future__ import annotations

import json
import sys
import threading
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ScriptsFera"))
import painel  # noqa: E402
from painel import ErroPainel  # noqa: E402

TOKEN = "codigo-de-teste"
CHAVES = {"GEMINI_API_KEY": "AIzaSy-do-painel", "NETLIFY_AUTH_TOKEN": "nfp_do_painel"}


class PainelDeMentira(BaseHTTPRequestHandler):
    recebidos: list[dict] = []

    def _responder(self, status: int, corpo: dict) -> None:
        dado = json.dumps(corpo).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(dado)))
        self.end_headers()
        self.wfile.write(dado)

    def _autorizado(self) -> bool:
        if self.headers.get("x-ferabot-token") == TOKEN:
            return True
        # lê o corpo antes de recusar, como um servidor de verdade: senão a conexão cai no meio do envio
        self.rfile.read(int(self.headers.get("Content-Length") or 0))
        self._responder(401, {"ok": False})
        return False

    def do_GET(self) -> None:  # noqa: N802
        if not self._autorizado():
            return
        if self.path == "/api/ferabot/chaves":
            self._responder(200, {"ok": True, "chaves": CHAVES})
        else:
            self._responder(200, {"ok": True, "jornada": {"feitos": 1, "total": 5, "passos": [], "atual": None}})

    def do_POST(self) -> None:  # noqa: N802
        if not self._autorizado():
            return
        corpo = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        type(self).recebidos.append(corpo)
        self._responder(200, {"ok": True, "jornada": {"feitos": 2, "total": 5, "passos": [], "atual": None}})

    def log_message(self, *_: object) -> None:
        pass


@pytest.fixture()
def servidor():
    PainelDeMentira.recebidos = []
    http = HTTPServer(("127.0.0.1", 0), PainelDeMentira)
    threading.Thread(target=http.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{http.server_port}"
    http.shutdown()


@pytest.fixture()
def pasta(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    monkeypatch.setattr(painel, "PAINEL_PATH", tmp_path / "painel.json")
    monkeypatch.setattr(painel, "ENV_PATH", tmp_path / ".env")
    monkeypatch.setattr(painel, "PERFIL_PATH", tmp_path / "perfil.json")
    return tmp_path


def ligar(pasta: Path, url: str, token: str = TOKEN) -> None:
    painel.gravar_ligacao({"url": url, "token": token}, pasta / "painel.json")


# ── .env ────────────────────────────────────────────────────────────────────
def test_chave_do_painel_vence_e_o_resto_do_env_fica_como_estava():
    atual = "# minhas chaves\nGEMINI_API_KEY=velha\nOUTRA=fica\n"

    novo = painel.mesclar_env(atual, {"GEMINI_API_KEY": "nova", "FAL_KEY": "id:seg"})

    assert novo == "# minhas chaves\nGEMINI_API_KEY=nova\nOUTRA=fica\nFAL_KEY=id:seg\n"


def test_env_vazio_recebe_as_chaves_do_painel():
    assert painel.mesclar_env("", {"A": "1"}) == "A=1\n"
    assert painel.mesclar_env("", {}) == ""


def test_sincronizar_grava_o_env_e_devolve_so_os_nomes(pasta: Path, servidor: str):
    ligar(pasta, servidor)
    (pasta / ".env").write_text("OUTRA=fica\n", encoding="utf-8")

    nomes = painel.sincronizar(pasta / "painel.json", pasta / ".env")

    env = (pasta / ".env").read_text(encoding="utf-8")
    assert nomes == ["GEMINI_API_KEY", "NETLIFY_AUTH_TOKEN"]
    assert "OUTRA=fica" in env and "GEMINI_API_KEY=AIzaSy-do-painel" in env
    assert painel.ler_ligacao(pasta / "painel.json")["sincronizado_em"]


# ── ligação ─────────────────────────────────────────────────────────────────
def test_conectar_grava_a_ligacao_manda_o_perfil_e_puxa_as_chaves(pasta: Path, servidor: str):
    (pasta / "perfil.json").write_text(json.dumps({"nome": "Ana", "nicho": "nutricionista", "senha": "x"}), encoding="utf-8")

    painel.conectar(servidor + "/", TOKEN)

    assert painel.conectado(pasta / "painel.json")
    assert PainelDeMentira.recebidos[0] == {"perfil": {"nome": "Ana", "nicho": "nutricionista"}}
    assert "NETLIFY_AUTH_TOKEN=nfp_do_painel" in (pasta / ".env").read_text(encoding="utf-8")


def test_codigo_errado_nao_grava_ligacao(pasta: Path, servidor: str):
    with pytest.raises(ErroPainel, match="recusou o código"):
        painel.conectar(servidor, "codigo-errado")

    assert not (pasta / "painel.json").exists()


def test_endereco_sem_https_e_recusado():
    with pytest.raises(ErroPainel, match="https"):
        painel.normalizar_endereco("http://painel.exemplo.com")

    assert painel.normalizar_endereco("https://ana.painel.exemplo.com/") == "https://ana.painel.exemplo.com"


@pytest.mark.parametrize(
    "endereco",
    [
        "http://localhost.atacante.com",
        "http://127.0.0.1.evil.com",
        "http://localhost@evil.com",
        "https://user:senha@painel.com",
        "ftp://painel.com",
        "painel.com",
    ],
)
def test_endereco_que_imita_localhost_ou_leva_usuario_e_recusado(endereco: str):
    with pytest.raises(ErroPainel):
        painel.normalizar_endereco(endereco)


@pytest.mark.parametrize(
    ("nome", "valor"),
    [
        ("GEMINI_API_KEY", "a\rNODE_OPTIONS=--require x"),
        ("GEMINI_API_KEY", "a\u2028B=c"),
        ("GEMINI_API_KEY", "a\nB=c"),
        ("PATH=x\nFOO", "valor"),
        ("minuscula", "valor"),
        ("GEMINI_API_KEY", " com-espaco-na-ponta"),
        ("GEMINI_API_KEY", ""),
    ],
)
def test_chave_que_tentaria_injetar_linha_no_env_e_descartada(nome: str, valor: str):
    assert not painel.chave_aceitavel(nome, valor)


def test_chave_normal_e_aceita():
    assert painel.chave_aceitavel("GEMINI_API_KEY", "AIzaSy-abc_123")
    assert painel.chave_aceitavel("FAL_KEY", "id:segredo")


def test_sem_ligacao_o_erro_manda_para_o_passo_1(pasta: Path):
    with pytest.raises(ErroPainel, match="passo 1"):
        painel.sincronizar(pasta / "painel.json", pasta / ".env")


def test_painel_fora_do_ar_vira_erro_legivel(pasta: Path):
    ligar(pasta, "http://127.0.0.1:9")

    with pytest.raises(ErroPainel, match="Não consegui falar"):
        painel.sincronizar(pasta / "painel.json", pasta / ".env")


# ── avisos ──────────────────────────────────────────────────────────────────
def test_marco_e_entrega_chegam_no_painel(pasta: Path, servidor: str):
    ligar(pasta, servidor)

    painel.avisar_marco("pagina", link="https://ana.com/captura", resumo="Página de captura")
    painel.avisar_entrega("paginas-e-quiz", "Página no ar", link="C:/ferabot/output/pagina")

    assert PainelDeMentira.recebidos[0]["marco"]["passo"] == "pagina"
    assert PainelDeMentira.recebidos[1]["entrega"] == {"bot": "paginas-e-quiz", "oque": "Página no ar", "link": ""}


def test_marco_inventado_e_recusado_antes_de_sair_da_maquina(pasta: Path, servidor: str):
    ligar(pasta, servidor)

    with pytest.raises(ErroPainel, match="Marco desconhecido"):
        painel.avisar_marco("faturamento")

    assert PainelDeMentira.recebidos == []


# ── ritmo da sincronia ──────────────────────────────────────────────────────
def test_sincronia_so_repete_depois_do_intervalo():
    agora = datetime(2026, 11, 22, 12, 0)

    assert painel.sincronia_vencida({}, agora)
    assert painel.sincronia_vencida({"sincronizado_em": "lixo"}, agora)
    assert not painel.sincronia_vencida({"sincronizado_em": (agora - timedelta(minutes=3)).isoformat()}, agora)
    assert painel.sincronia_vencida({"sincronizado_em": (agora - timedelta(minutes=11)).isoformat()}, agora)


def test_sem_painel_conectado_a_sincronia_automatica_nao_faz_nada(pasta: Path, capsys: pytest.CaptureFixture[str]):
    painel.sincronizar_se_vencido()

    assert capsys.readouterr().err == ""
    assert not (pasta / ".env").exists()


def test_falha_de_rede_na_sincronia_automatica_avisa_e_nao_derruba(pasta: Path, capsys: pytest.CaptureFixture[str]):
    ligar(pasta, "http://127.0.0.1:9")

    painel.sincronizar_se_vencido()

    assert "chaves não atualizadas" in capsys.readouterr().err


# ── recusa explicada pelo painel ────────────────────────────────────────────
def test_recusa_do_painel_chega_com_o_motivo_e_nao_so_o_codigo():
    import io
    import urllib.error

    com_msg = urllib.error.HTTPError("u", 422, "x", {}, io.BytesIO(b'{"ok":false,"msg":"O servidor recusou a chave."}'))
    sem_corpo = urllib.error.HTTPError("u", 500, "x", {}, io.BytesIO(b""))

    assert painel._motivo_do_painel(com_msg) == "O servidor recusou a chave."
    assert painel._motivo_do_painel(sem_corpo) == "O painel respondeu erro 500."


def test_ligar_whatsapp_manda_endereco_chave_e_sessao_ao_painel(pasta: Path, servidor: str):
    ligar(pasta, servidor)

    painel.ligar_whatsapp("https://203-0-113-10.sslip.io", "chave-x")

    assert PainelDeMentira.recebidos[0] == {"url": "https://203-0-113-10.sslip.io", "apiKey": "chave-x", "sessao": "principal"}


def test_plano_do_painel_completa_o_perfil_sem_apagar_o_que_o_painel_nao_tem():
    perfil = {"nome": "Ana", "handle_instagram": "@antigo", "oferta": "mentoria"}
    plano = {
        "bigIdea": "Big",
        "mecanismo": {"nome": "Método X", "explicacao": "3 etapas"},
        "headlines": ["H1"],
        "redes": {"instagram": "@ana", "site": "https://ana.com"},
    }

    novo = painel.perfil_com_plano(perfil, plano)

    assert novo["nome"] == "Ana" and novo["oferta"] == "mentoria"
    assert novo["handle_instagram"] == "@ana"
    assert novo["landing_page"] == "https://ana.com"
    assert novo["bandeira"] == "Big" and novo["mecanismo"] == "Método X"
    assert novo["headlines"] == ["H1"]
    assert painel.perfil_com_plano({"handle_instagram": "@fica"}, {})["handle_instagram"] == "@fica"


def test_puxar_grava_o_plano_e_o_perfil(tmp_path, monkeypatch):
    plano = {"bigIdea": "Big", "redes": {"site": "https://ana.com"}}
    monkeypatch.setattr(painel, "ler_ligacao", lambda *a, **k: {"url": "https://x.painel.vidafera.com", "token": "t"})
    monkeypatch.setattr(painel, "chamar", lambda lig, caminho, corpo=None: {"ok": True, "plano": plano})
    perfil = tmp_path / "perfil.json"

    painel.puxar_plano(caminho_perfil=perfil, raiz=tmp_path)

    assert json.loads((tmp_path / "output" / "fera" / "plano.json").read_text(encoding="utf-8"))["bigIdea"] == "Big"
    assert json.loads(perfil.read_text(encoding="utf-8"))["landing_page"] == "https://ana.com"


def test_numero_monta_o_cartao_e_recusa_id_ruim(monkeypatch):
    enviado = {}
    monkeypatch.setattr(painel, "ler_ligacao", lambda *a, **k: {"url": "https://x.painel.vidafera.com", "token": "t"})
    monkeypatch.setattr(painel, "chamar", lambda lig, caminho, corpo=None: enviado.update(caminho=caminho, corpo=corpo) or {"ok": True})

    painel.enviar_numero("custo-ia", "Custo de IA no mês", "R$ 12", detalhe="Gemini", estimado=True)

    assert enviado["caminho"] == "/api/ferabot/estado"
    assert enviado["corpo"]["indicadores"]["tipo"] == "estimado"
    with pytest.raises(painel.ErroPainel):
        painel.enviar_numero("Custo IA", "x", "1")
