#!/usr/bin/env python3
"""
===================================================================
 STAY Q — UNIFIED 1-CLICK PRODUCTION DEPLOYMENT SCRIPT
===================================================================
Usage:
    python deploy.py                 # Deploy both Website & Admin/Backend
    python deploy.py --website       # Deploy only Customer Website to Firebase
    python deploy.py --admin         # Deploy only Admin Panel + Backend API to Cloud Run
    python deploy.py --backend       # Alias for --admin
===================================================================
"""

import sys
import os
import subprocess
import json
import hashlib
import time
import argparse
import urllib.request
import urllib.parse
from pathlib import Path

# Fix Windows console UTF-8 output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
WEBSITE_DIR = ROOT_DIR / "website"
ADMIN_DIR = ROOT_DIR / "admin-panel"
BACKEND_DIR = ROOT_DIR / "backend"

PROJECT_ID = "stay-q"
REGION = "asia-south1"
SERVICE_NAME = "stayq-api"
IMAGE_TAG = f"gcr.io/{PROJECT_ID}/{SERVICE_NAME}:latest"
CLOUDSQL_INSTANCE = f"{PROJECT_ID}:{REGION}:stayq-db"

def load_env_vars():
    env_file = BACKEND_DIR / ".env"
    env_map = {}
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env_map[k.strip()] = v.strip().strip('"\'')
    target_keys = [
        "GROQ_API_KEY", "DATABASE_URL", "MSG91_AUTH_KEY", "MSG91_TEMPLATE_ID",
        "CASHFREE_APP_ID", "CASHFREE_CLIENT_ID", "CASHFREE_SECRET_KEY",
        "CASHFREE_CLIENT_SECRET", "CASHFREE_ENV", "CASHFREE_BASE_URL", "CASHFREE_PG_BASE_URL"
    ]
    parts = []
    for k in target_keys:
        if k in env_map:
            val = env_map[k]
            if k == "DATABASE_URL":
                val = f"postgresql://postgres:stayq_dev_2026@localhost/stayq_db?host=/cloudsql/{CLOUDSQL_INSTANCE}"
            parts.append(f"{k}={val}")
    return ",".join(parts)


def log(badge, msg):
    print(f"\n[{badge}] {msg}")


def log_success(msg):
    print(f"[OK] {msg}")


def log_error(msg):
    print(f"[ERROR] {msg}")


def run_cmd(cmd, cwd=None, check=True):
    print(f"   $ {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if check and res.returncode != 0:
        log_error(f"Command failed with exit code {res.returncode}: {cmd}")
        sys.exit(res.returncode)
    return res.returncode


def get_gcloud_token():
    try:
        token = subprocess.check_output("gcloud auth print-access-token", shell=True, text=True).strip()
        return token
    except Exception as e:
        log_error(f"Failed to get gcloud access token: {e}")
        sys.exit(1)


def deploy_website_to_firebase():
    log("WEBSITE", "Step 1: Building Stay Q Customer Website...")
    run_cmd("npm run build", cwd=WEBSITE_DIR)

    log("FIREBASE", "Step 2: Deploying Website to Firebase Hosting (stayq.space)...")
    token = get_gcloud_token()
    dist_dir = WEBSITE_DIR / "dist"

    if not dist_dir.exists():
        log_error("website/dist does not exist after build.")
        sys.exit(1)

    # 1. Scan files & compute hashes
    files_to_upload = {}
    manifest = {}

    for root, _, files in os.walk(dist_dir):
        for f in files:
            full_path = Path(root) / f
            rel_path = "/" + str(full_path.relative_to(dist_dir)).replace("\\", "/")
            with open(full_path, "rb") as fp:
                content = fp.read()
                file_hash = hashlib.sha256(content).hexdigest()
                manifest[rel_path] = file_hash
                files_to_upload[file_hash] = full_path

    print(f"   Scanned {len(manifest)} files for upload.")

    # 2. Create version
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(
        f"https://firebasehosting.googleapis.com/v1beta1/sites/{PROJECT_ID}/versions",
        headers=headers,
        data=json.dumps({"config": {}}).encode("utf-8"),
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        v_data = json.loads(resp.read().decode("utf-8"))
        version_name = v_data["name"]
        print(f"   Version created: {version_name}")

    # 3. Populate files
    pop_req = urllib.request.Request(
        f"https://firebasehosting.googleapis.com/v1beta1/{version_name}:populateFiles",
        headers=headers,
        data=json.dumps({"files": manifest}).encode("utf-8"),
        method="POST",
    )
    with urllib.request.urlopen(pop_req) as resp:
        pop_data = json.loads(resp.read().decode("utf-8"))
        upload_url = pop_data.get("uploadUrl")
        required_hashes = pop_data.get("uploadRequiredHashes", [])

    print(f"   Uploading {len(required_hashes)} changed files...")

    # 4. Upload required hashes
    for idx, h in enumerate(required_hashes, 1):
        file_path = files_to_upload[h]
        with open(file_path, "rb") as fp:
            file_bytes = fp.read()
        up_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/octet-stream",
        }
        up_req = urllib.request.Request(f"{upload_url}/{h}", headers=up_headers, data=file_bytes, method="POST")
        with urllib.request.urlopen(up_req) as up_resp:
            if up_resp.status != 200:
                log_error(f"Failed to upload {file_path.name}")

    # 5. Finalize version
    patch_req = urllib.request.Request(
        f"https://firebasehosting.googleapis.com/v1beta1/{version_name}?update_mask=status",
        headers=headers,
        data=json.dumps({"status": "FINALIZED"}).encode("utf-8"),
        method="PATCH",
    )
    with urllib.request.urlopen(patch_req):
        pass

    # 6. Release version
    rel_req = urllib.request.Request(
        f"https://firebasehosting.googleapis.com/v1beta1/sites/{PROJECT_ID}/releases?versionName={urllib.parse.quote(version_name, safe='')}",
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(rel_req):
        pass

    log_success("Customer Website is 100% Live on: https://stayq.space")


def deploy_admin_and_backend():
    log("ADMIN", "Step 1: Building Admin Panel (Next.js Static Export)...")
    run_cmd("npm run build", cwd=ADMIN_DIR)

    log("SYNC", "Step 2: Syncing Admin Panel to backend/public...")
    admin_dist = ADMIN_DIR / "dist"
    backend_public = BACKEND_DIR / "public"

    if os.name == "nt":
        run_cmd(f'robocopy "{admin_dist}" "{backend_public}" /E /NFL /NDL /NJH /NJS /nc /ns /np', check=False)
    else:
        run_cmd(f'cp -r "{admin_dist}"/* "{backend_public}"/')

    log("CLOUD RUN", "Step 3: Building Container & Deploying to Google Cloud Run...")
    run_cmd(f'gcloud builds submit --tag "{IMAGE_TAG}" --project "{PROJECT_ID}"', cwd=BACKEND_DIR)
    run_cmd(
        f'gcloud run deploy {SERVICE_NAME} '
        f'--image "{IMAGE_TAG}" '
        f'--platform managed '
        f'--region {REGION} '
        f'--allow-unauthenticated '
        f'--add-cloudsql-instances="{CLOUDSQL_INSTANCE}" '
        f'--update-env-vars="{load_env_vars()}" '
        f'--project "{PROJECT_ID}"',
        cwd=BACKEND_DIR,
    )

    log_success("Admin Panel & Backend API are 100% Live on: https://stayq-api-608570851336.asia-south1.run.app")


def main():
    parser = argparse.ArgumentParser(description="Stay Q Unified 1-Click Deployment Script")
    parser.add_argument("--website", action="store_true", help="Deploy customer website to Firebase Hosting")
    parser.add_argument("--admin", action="store_true", help="Deploy admin panel & backend to Cloud Run")
    parser.add_argument("--backend", action="store_true", help="Alias for --admin")
    args = parser.parse_args()

    start_time = time.time()
    print("\n" + "=" * 65)
    print("   STAY Q — AUTOMATED PRODUCTION DEPLOYMENT")
    print("=" * 65)

    deploy_all = not (args.website or args.admin or args.backend)

    if deploy_all or args.website:
        deploy_website_to_firebase()

    if deploy_all or args.admin or args.backend:
        deploy_admin_and_backend()

    elapsed = round(time.time() - start_time, 1)
    print("\n" + "=" * 65)
    log_success(f"ALL DEPLOYMENTS COMPLETED SUCCESSFULLY in {elapsed}s!")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
