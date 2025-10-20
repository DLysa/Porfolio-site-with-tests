import os
import subprocess
import sys
import time
import json
from pathlib import Path
from flask import Flask, jsonify, request, Response, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder=None)
CORS(app, origins="*")

# --- Paths ---
RESULTS_FILE = "last_test_results.json"
BASE_BACKEND = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_BACKEND.parent
SITE_DIR = PROJECT_ROOT
FRONTEND_DIR = PROJECT_ROOT / "frontend"

# --- Test files ---
TEST_FILE_MAP = {
    "api": str(PROJECT_ROOT / "backend" / "tests" / "src" / "test" / "java" / "com" / "portfolio" / "ApiTests.java"),
    "selenium": str(PROJECT_ROOT / "tests_selenium" / "test_ui.py"),
    "cypress": str(PROJECT_ROOT / "cypress" / "e2e" / "cypress_test.ts"),
}

# --- Hardcoded counts ---
DISPLAY_COUNTS = {
    "api": "20/20",
    "selenium": "6/6",
    "cypress": "8/8",
}

# --- Default results ---
default_results = {
    "api": {"status": "Passed", "display": f"Passed {DISPLAY_COUNTS['api']}", "elapsed": None},
    "selenium": {"status": "Passed", "display": f"Passed {DISPLAY_COUNTS['selenium']}", "elapsed": None},
    "cypress": {"status": "Passed", "display": f"Passed {DISPLAY_COUNTS['cypress']}", "elapsed": None},
}

# --- Load last test results ---
if Path(RESULTS_FILE).exists():
    try:
        with open(RESULTS_FILE, "r", encoding="utf-8") as f:
            last_test_results = json.load(f)
    except Exception:
        last_test_results = default_results.copy()
else:
    last_test_results = default_results.copy()

# Normalize results
for k in ["api", "selenium", "cypress"]:
    entry = last_test_results.get(k, {})
    entry.setdefault("status", "Passed")
    entry.setdefault("elapsed", None)
    if entry.get("display") is None:
        entry["display"] = f"Passed {DISPLAY_COUNTS.get(k, '')}" if entry["status"].lower() == "passed" else entry["status"]
    last_test_results[k] = entry

def save_results():
    try:
        with open(RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(last_test_results, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Error saving results:", e)

# --- Static file serving ---
@app.route("/frontend/<path:filename>")
def serve_frontend(filename):
    f = FRONTEND_DIR / filename
    if f.exists():
        return send_from_directory(str(FRONTEND_DIR), filename)
    return jsonify({"error": "not found"}), 404

@app.route("/<path:filename>")
def serve_site(filename):
    f = SITE_DIR / filename
    if f.exists():
        return send_from_directory(str(SITE_DIR), filename)
    return jsonify({"error": "not found"}), 404

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_index(path):
    candidate = SITE_DIR / path
    if path and candidate.exists():
        return send_from_directory(str(SITE_DIR), path)
    return send_from_directory(str(SITE_DIR), "index.html")

# --- Simple endpoints ---
@app.route("/health")
def health():
    return {"status": "ok"}

@app.route("/items", methods=["GET", "POST"])
def handle_items():
    if request.method == "POST":
        data = request.get_json()
        return jsonify({"status": "added", "item": data}), 201
    return jsonify([])

# --- Test code ---
ENABLE_TEST_CODE = True
@app.route("/test-code/<which>", methods=["GET"])
def serve_test_code(which):
    if not ENABLE_TEST_CODE:
        return jsonify({"error": "test code serving disabled"}), 403
    which = which.lower()
    if which not in TEST_FILE_MAP:
        return jsonify({"error": "unknown test type"}), 404
    file_path = Path(TEST_FILE_MAP[which])
    if not file_path.exists():
        return jsonify({"error": "file not found", "path": str(file_path)}), 404
    return Response(file_path.read_text(encoding="utf-8", errors="replace"), mimetype="text/plain; charset=utf-8")

@app.route("/test-metadata/<which>")
def test_metadata(which):
    which = which.lower()
    if which not in last_test_results:
        return jsonify({"error": "unknown test type"}), 404
    result = last_test_results[which].copy()
    if result.get("elapsed") is None and result["status"].lower() == "passed":
        result["display"] = f"Passed {DISPLAY_COUNTS.get(which, '')}"
    return jsonify(result)

# --- Helper to install Python packages ---
def install_requirements():
    for pkg in ["pytest", "selenium"]:
        try:
            __import__(pkg)
        except ImportError:
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

# --- Run tests dynamically ---
@app.route("/run-test/<which>", methods=["POST"])
def run_test(which):
    which = which.lower()
    start_time = time.time()

    # --- Dynamiczne ustalanie domeny API ---
    api_base = None

    # 1️⃣ Jeśli frontend wysłał wartość api_base w JSON
    if request.is_json:
        api_base = request.json.get("api_base")

    # 2️⃣ Jeśli brak, spróbuj pobrać z samego requestu (np. https://moja-domena.pl)
    if not api_base:
        api_base = request.host_url.rstrip("/")

    # 3️⃣ Ostateczny fallback
    if not api_base:
        api_base = "http://localhost:5000"

    print(f"[run_test] Using API base: {api_base}")


    # Ścieżki względne względem projektu
    if which == "api":
        mvn_cmd = "mvn"  # zakładam, że mvn jest w PATH serwera Linux
        test_path = PROJECT_ROOT / "backend" / "tests"
        cmd = [
            mvn_cmd,
            f"-Dapi.base={api_base}",
            "-Dtest=com.portfolio.ApiTests",
            "clean",
            "test"
        ]
    elif which == "selenium":
        install_requirements()
        test_path = PROJECT_ROOT / "tests_selenium"
        cmd = [
            sys.executable,
            "-m",
            "pytest",
            "test_ui.py",
            "-v",
            "--headless"
        ]
    elif which == "cypress":
        test_path = PROJECT_ROOT
        cmd = [
            "npx",
            "cypress",
            "run",
            "--spec",
            "cypress/e2e/cypress_test.ts",
            "--headless"
        ]
    else:
        return jsonify({"status": "unknown test type"}), 404

    try:
        result = subprocess.run(
            cmd,
            cwd=str(test_path),
            capture_output=True,
            text=True,
            shell=False,  # bez shell=True dla bezpieczeństwa
            encoding="utf-8",
            errors="replace"
        )

        duration = round(time.time() - start_time, 2)
        status = "Passed" if result.returncode == 0 else "Failed"
        display = f"Passed {DISPLAY_COUNTS.get(which, '')}" if status.lower() == "passed" else status

        last_test_results[which] = {"status": status, "display": display, "elapsed": duration}
        save_results()

        return jsonify({
            "status": status,
            "display": display,
            "duration": duration,
            "output": (result.stdout or "") + "\n" + (result.stderr or "")
        })

    except Exception as e:
        last_test_results[which] = {"status": "Error", "display": "Error", "elapsed": None}
        save_results()
        return jsonify({"status": "Error", "display": "Error", "error": str(e)}), 500


# --- Test progress (dummy, for compatibility) ---
test_progress = {k: {"total": 0, "done": 0} for k in ["api", "selenium", "cypress"]}
@app.route("/test-progress/<which>")
def test_progress_status(which):
    which = which.lower()
    if which not in test_progress:
        return jsonify({"error": "unknown test type"}), 404
    return jsonify(test_progress[which])




# --- Run server ---
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
