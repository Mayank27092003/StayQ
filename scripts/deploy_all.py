#!/usr/bin/env python3
import sys
from pathlib import Path

root_deploy = Path(__file__).resolve().parent.parent / "deploy.py"
if root_deploy.exists():
    import importlib.util
    spec = importlib.util.spec_from_file_location("deploy", root_deploy)
    deploy_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(deploy_mod)
    deploy_mod.main()
else:
    print("deploy.py not found in root.")
