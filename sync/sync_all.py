#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Synchronisation unifiée du site « Ressources EUSP ».

Régénère, à partir de trois feuilles Google partagées en lecture par lien :

    glossaire      -> acronymes.html
    concertations  -> assets/data/concertations.data.js
    tables         -> assets/data/tables-quartier.members.js

Lancé chaque nuit par .github/workflows/sync.yml (et à la demande).
Configuration des feuilles : sync/config.json.
Aucune dépendance externe (bibliothèque standard seulement).

Usage :
    python3 sync/sync_all.py            # toutes les sources configurées
    python3 sync/sync_all.py glossaire  # une seule source
"""
import json
import sys
import traceback
from pathlib import Path

SYNC_DIR = Path(__file__).resolve().parent
REPO = SYNC_DIR.parent
sys.path.insert(0, str(SYNC_DIR / "builders"))

import common          # noqa: E402
import glossaire       # noqa: E402
import concertations   # noqa: E402
import tables          # noqa: E402

RUNNERS = {
    "glossaire": glossaire.run,
    "concertations": concertations.run,
    "tables": tables.run,
}


def configured(cfg):
    sid = (cfg or {}).get("sheet_id", "")
    return bool(sid) and not sid.upper().startswith("TODO")


def main(argv):
    config = json.loads((SYNC_DIR / "config.json").read_text(encoding="utf-8"))
    wanted = argv or list(RUNNERS)
    failures = 0
    for name in wanted:
        if name not in RUNNERS:
            print(f"[skip] source inconnue : {name}")
            continue
        cfg = config.get(name)
        if not configured(cfg):
            print(f"[skip] {name} : sheet_id non configuré dans sync/config.json")
            continue
        try:
            msg = RUNNERS[name](cfg, common.fetch_tab, REPO)
            print(f"[ok]   {msg}")
        except Exception as e:  # noqa: BLE001
            failures += 1
            print(f"[ERREUR] {name} : {e}")
            traceback.print_exc()
    if failures:
        sys.exit(f"{failures} source(s) en échec.")


if __name__ == "__main__":
    main(sys.argv[1:])
