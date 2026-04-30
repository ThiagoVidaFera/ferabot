"""
Abre um formulário no browser para configurar o perfil do Ferabot.
Sem dependências externas — usa só a biblioteca padrão do Python.
"""
import json
import sys
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote_plus

ROOT = Path(__file__).parent.parent
PERFIL_PATH = ROOT / "perfil.json"
FORM_PATH = Path(__file__).parent / "form.html"
PORT = 8765

PERFIL_EXISTENTE = {}
if PERFIL_PATH.exists():
    try:
        PERFIL_EXISTENTE = json.loads(PERFIL_PATH.read_text(encoding="utf-8"))
    except Exception:
        pass


class Handler(BaseHTTPRequestHandler):

    def log_message(self, *args):
        pass  # silencia logs do servidor

    def do_GET(self):
        html = FORM_PATH.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(html)))
        self.end_headers()
        self.wfile.write(html)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode("utf-8")
        campos = {k: unquote_plus(v[0]) for k, v in parse_qs(raw).items()}

        perfil = {
            "nome":              campos.get("nome", ""),
            "nicho":             campos.get("nicho", ""),
            "produto":           campos.get("produto", ""),
            "preco":             campos.get("preco", ""),
            "handle_instagram":  campos.get("handle_instagram", ""),
            "cor_primaria":      campos.get("cor_primaria", "#FF4F00"),
            "cor_secundaria":    campos.get("cor_secundaria", "#FFFFFF"),
            "landing_page":      campos.get("landing_page", ""),
            "api_gemini":        campos.get("api_gemini", ""),
            "api_openai":        campos.get("api_openai", ""),
        }

        PERFIL_PATH.write_text(
            json.dumps(perfil, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        # Gera também o JS pro dashboard
        js_path = ROOT / "DashboardFera" / "perfil.js"
        js_path.write_text(
            f"window.PERFIL = {json.dumps(perfil, ensure_ascii=False, indent=2)};\n",
            encoding="utf-8"
        )

        sucesso = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{{font-family:sans-serif;background:#0A0A0F;color:#fff;
       display:flex;flex-direction:column;align-items:center;
       justify-content:center;height:100vh;gap:16px;margin:0}}
  h1{{color:#FF4F00;font-size:2rem}}
  p{{color:#aaa;font-size:1.1rem}}
  a{{color:#FF4F00}}
</style></head><body>
<h1>🔥 Perfil salvo!</h1>
<p>Pode fechar esta janela e voltar para o instalador.</p>
<p>Se preferir, <a href="http://localhost:{PORT}">editar novamente</a>.</p>
</body></html>""".encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(sucesso)))
        self.end_headers()
        self.wfile.write(sucesso)

        # Para o servidor após salvar
        self.server._done = True


def main():
    if not FORM_PATH.exists():
        print("  [ERRO] form.html não encontrado. Usando modo texto.")
        sys.exit(1)

    server = HTTPServer(("localhost", PORT), Handler)
    server._done = False

    webbrowser.open(f"http://localhost:{PORT}")
    print(f"  Formulário aberto em http://localhost:{PORT}")
    print("  Preencha e clique em Salvar...")

    while not server._done:
        server.handle_request()

    print("  [OK] Perfil salvo com sucesso!")


if __name__ == "__main__":
    main()
