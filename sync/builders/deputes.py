# -*- coding: utf-8 -*-
"""Députés : feuille Google (Circonscription | député | parti | coordonnées)
-> assets/data/deputes-overrides.data.js (window.DEPUTES_OVERRIDES).

Surcharge LÉGÈRE. Ne régénère pas la géométrie ni la liste complète des
circonscriptions (cela reste le rôle de tools/build_deputes.py). Le fichier
produit ne contient que les champs à jour (député, parti, coordonnées) ; il est
appliqué au chargement par assets/js/deputes.js, qui rapproche chaque ligne par
NOM DE CIRCONSCRIPTION (accents et casse ignorés).

Onglet attendu : « Deputes » avec les colonnes
    Circonscription | Député | Parti | Coordonnées
(l'ordre et la casse des en-têtes importent peu ; les accents sont ignorés.)

Bibliothèque standard seulement.
"""
import csv
import io
import json
import unicodedata

# Libellés de parti fréquents -> code court (doit exister dans PARTY_COLORS,
# voir assets/data/deputes.data.js : PLQ, QS, CAQ, PQ, IND).
PARTY_SHORT = {
    "parti liberal du quebec": "PLQ", "plq": "PLQ", "liberal": "PLQ",
    "quebec solidaire": "QS", "qs": "QS", "solidaire": "QS",
    "coalition avenir quebec": "CAQ", "caq": "CAQ",
    "parti quebecois": "PQ", "pq": "PQ", "quebecois": "PQ",
    "independant": "IND", "independante": "IND", "ind": "IND", "independant·e": "IND",
}


def _norm(s):
    s = unicodedata.normalize("NFKD", (s or "").strip().lower())
    return "".join(c for c in s if not unicodedata.combining(c))


def _short(parti):
    return PARTY_SHORT.get(_norm(parti), "")


def _col(row, *names):
    want = {_norm(n) for n in names}
    for k in row:
        if _norm(k) in want:
            return (row[k] or "").strip()
    return ""


def build(csv_text):
    rows = list(csv.DictReader(io.StringIO(csv_text)))
    ov = {}
    for r in rows:
        circ = _col(r, "circonscription", "circ", "name", "nom")
        if not circ:
            continue
        entry = {}
        dep = _col(r, "depute", "depute·e", "depute-e", "deputee", "elu", "elu·e")
        if dep:
            entry["depute"] = dep
        parti = _col(r, "parti", "party")
        if parti:
            entry["party"] = parti
            sh = _short(parti)
            if sh:
                entry["partyShort"] = sh
        coord = _col(r, "coordonnees", "coordonnee", "contact", "courriel", "email")
        if coord:
            entry["coord"] = coord
        if entry:
            ov[circ] = entry
    return ov


HEADER = ("/* Surcharge des députés — GÉNÉRÉ AUTOMATIQUEMENT depuis la feuille\n"
          "   Google « Députés » par sync/sync_all.py. NE PAS ÉDITER À LA MAIN :\n"
          "   modifiez la feuille, le site se met à jour à la prochaine synchro. */\n")


def render_js(ov):
    return HEADER + "window.DEPUTES_OVERRIDES = " + json.dumps(
        ov, ensure_ascii=False, indent=2) + ";\n"


def run(cfg, fetch, repo_root):
    tab = cfg.get("tab", "Deputes")
    csv_text = fetch(cfg["sheet_id"], tab)
    ov = build(csv_text)
    (repo_root / cfg["output"]).write_text(render_js(ov), encoding="utf-8")
    return f"{cfg['output']} — {len(ov)} circonscription(s) surchargée(s)"
