# -*- coding: utf-8 -*-
"""Tables de quartier : feuille « Membres » -> assets/data/tables-quartier.members.js.

Colonnes attendues (repérées par leur EN-TÊTE, l'ordre est libre) :
    table-de-quartier | organisme | category | lien (ou link)

Les anciennes colonnes ID-table / ID-org sont ignorées si elles sont présentes.

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
    header = [c.strip().lower() for c in (rows[0] if rows else [])]

    def col(*names):
        for n in names:
            if n in header:
                return header.index(n)
        return -1

    i_tbl, i_org = col("table-de-quartier"), col("organisme")
    i_cat, i_lnk = col("category", "categorie"), col("lien", "link")
    if i_tbl < 0 or i_org < 0:
        raise RuntimeError(
            "Onglet Membres : en-têtes « table-de-quartier » et « organisme » requis.")

    def cell(row, i):
        return row[i].strip() if 0 <= i < len(row) else ""

    tbl = OrderedDict()
    missing = set()
    for row in rows[1:]:
        tname, org = cell(row, i_tbl), cell(row, i_org)
        cat, link = cell(row, i_cat), cell(row, i_lnk)
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
