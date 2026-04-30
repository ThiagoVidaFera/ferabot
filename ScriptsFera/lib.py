import json
import sys
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
PERFIL_PATH = ROOT_DIR / "perfil.json"
CHECKPOINT_PATH = ROOT_DIR / "ScriptsFera" / "checkpoints.json"
OUTPUT_DIR = ROOT_DIR / "output"


def now_iso():
    return datetime.now().isoformat()


def load_perfil():
    if not PERFIL_PATH.exists():
        print("[ERRO] perfil.json não encontrado. Rode primeiro: python SetupFera/setup_perfil.py")
        sys.exit(1)
    with open(PERFIL_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_perfil(data):
    with open(PERFIL_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_checkpoints():
    if not CHECKPOINT_PATH.exists():
        return {}
    with open(CHECKPOINT_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_checkpoints(data):
    CHECKPOINT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CHECKPOINT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def mark_checkpoint(key, status, note=""):
    data = load_checkpoints()
    data[key] = {"status": status, "note": note, "updated_at": now_iso()}
    save_checkpoints(data)


def get_checkpoint(key):
    return load_checkpoints().get(key, {})


def ensure_output_dir(etapa):
    today = datetime.now().strftime("%Y-%m-%d")
    path = OUTPUT_DIR / etapa / today
    path.mkdir(parents=True, exist_ok=True)
    return path


def fera_print(msg):
    print(f"\n  🔥 {msg}\n")


def header(title):
    width = 60
    print()
    print("  " + "═" * width)
    print(f"  ║  {title.center(width - 4)}  ║")
    print("  " + "═" * width)
    print()
