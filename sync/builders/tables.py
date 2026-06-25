# -*- coding: utf-8 -*-
"""Tables de quartier : feuille « Membres » -> assets/data/tables-quartier.members.js.

Colonnes attendues (mêmes que l'ancien tables_de_quartier.csv) :
    ID-table | table-de-quartier | ID-org | organisme | category | link

- Les lignes sont regroupées par table puis par catégorie, dans l'ordre de la feuille.
- Le lien Google Maps est facultatif : s'il est vide, il est généré à partir du
  nom de l'organisme (« Organisme, Montréal, QC, Canada »).
- La géométrie de la carte (tables-quartier.data.js) n'est PAS touchée : elle est
  un artefact cartographique régénéré hors ligne, pas une donnée éditable.

Bibliothèque standard seulement.
"""
import csv
import io
import json
import re
import urllib.parse
from collections import OrderedDict


def name_to_slug(data_js_text):
    """Lit la table nom -> slug depuis TDQ_TABLES dans tables-quartier.data.js."""
    i = data_js_text.find("TDQ_TABLES")
    seg = data_js_text[i: data_js_text.find("};", i) + 1]
    m = {}
    for mo in re.finditer(
            r'"([a-z0-9\-]+)"\s*:\s*\{\s*"name"\s*:\s*"([^"]+)"', seg):
        m[mo.group(2)] = mo.group(1)
    return m


def maps_link(org):
    q = urllib.parse.quote(f"{org}, Montréal, QC, Canada", safe="")
    return f"https://www.google.com/maps/search/?api=1&query={q}"


def build(rows, slug_map):
    """rows : liste de listes (avec en-tête). Retourne (dict TDQ_MEMBERS, manquants)."""
    data = rows[1:] if rows else []
    tbl = OrderedDict()
    missing = set()
    for row in data:
        row = (row + ["", "", "", "", "", ""])[:6]
        tid, tname, oid, org, cat, link = (c.strip() for c in row)
        if not tname:
            continue
        slug = slug_map.get(tname)
        if not slug:
            missing.add(tname)
            continue
        cats = tbl.setdefault(slug, OrderedDict())
        if cat == "" and org == "":
            continue
        items = cats.setdefault(cat, [])
        if org == "":
            continue
        items.append({"n": org, "l": link or maps_link(org)})
    out = {slug: [{"c": c, "items": it} for c, it in cats.items()]
           for slug, cats in tbl.items()}
    return out, missing


def render_js(members):
    return ("/* Membres des tables de quartier — GÉNÉRÉ AUTOMATIQUEMENT depuis la "
            "feuille Google « Tables de quartier » par sync/sync_all.py. "
            "Ne pas éditer à la main. */\n"
            "const TDQ_MEMBERS = " + json.dumps(members, ensure_ascii=False) + ";\n")


def run(cfg, fetch, repo_root):
    data_js = (repo_root / "assets/data/tables-quartier.data.js").read_text(
        encoding="utf-8")
    slug_map = name_to_slug(data_js)
    text = fetch(cfg["sheet_id"], cfg["tab"])
    rows = list(csv.reader(io.StringIO(text)))
    members, missing = build(rows, slug_map)
    (repo_root / cfg["output"]).write_text(render_js(members), encoding="utf-8")
    msg = f"{cfg['output']} — {len(members)} tables"
    if missing:
        msg += f" ; NON RECONNUES (ignorées) : {sorted(missing)}"
    return msg
