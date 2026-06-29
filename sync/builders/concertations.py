# -*- coding: utf-8 -*-
"""Concertations : feuille Google à 4 onglets <-> assets/data/concertations.data.js.

Onglets attendus (voir GUIDE-SUPERVISEUR.md) :
  Partenaires   : ID-par | acronym | partenaire | famille | parent
  Comites       : ID-com | acronym | comite | groupe | parent | niveau |
                  DRSP-coord | nouveau | mandat
  Composition   : ID-com | comite | ID-mem | membre | categorie
  Definitions   : terme | acronym | definition

`build(tabs)` : {onglet: csv} -> objet window.CONC (dict).
`export(D)`   : window.CONC -> {onglet: csv}  (pré-remplissage + tests).

Bibliothèque standard seulement.
"""
import csv
import io
import json
import unicodedata

# --- familles de partenaires : libellé -> clé de couleur (voir concertations.css)
#     La clé sert aussi de classe CSS (.fdot.<clé>, .t-<clé>). Les libellés sont
#     ceux affichés ; ajoutez une entrée ici pour colorer une nouvelle famille.
FAMILY_KEY = {
    "Ministères": "min",
    "Réseau de la santé (RSSS)": "rss",
    "Métropolitain et municipal": "gov",
    "Instituts, observatoires et chaires": "rec1",
    "Universités et centres de recherche": "rec2",
    "Philanthropie": "fond",
    "Communautaire": "comm",
    "Autres partenaires": "cit",
}
FAMILY_FALLBACK = "cit"  # couleur par défaut pour une famille non listée

INT_LABEL = {"dir": "Direction", "eusp": "EUSP", "jeun": "Jeunesse",
             "pcmi": "PCMI", "ecos": "ÉCoS"}

NIVEAU_CODE = {"strat": "strat", "tact": "tact", "oper": "oper"}


# ---------------------------------------------------------------------------
# Petits utilitaires
# ---------------------------------------------------------------------------
def _strip(s):
    return (s or "").strip()


def truthy(s):
    return _strip(s).lower() in ("x", "1", "true", "vrai", "oui", "yes", "lead")


def _norm(s):
    s = unicodedata.normalize("NFKD", (s or "").lower())
    return "".join(c for c in s if not unicodedata.combining(c))


def niveau_code(s):
    n = _norm(s)
    if n.startswith("strat"):
        return "strat"
    if n.startswith("tact"):
        return "tact"
    if n.startswith("oper"):
        return "oper"
    return NIVEAU_CODE.get(_strip(s), "tact")


def cat_rank(cat):
    """porteur en tête, puis DRSP, puis le reste — pour l'ordre d'affichage."""
    n = _norm(cat)
    if n.startswith("porteur"):
        return 0
    if n == "drsp":
        return 1
    return 2


def csv_to_dicts(text):
    return list(csv.DictReader(io.StringIO(text)))


def rows_to_csv(header, rows):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(header)
    w.writerows(rows)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# BUILD : {onglet: csv} -> window.CONC
# ---------------------------------------------------------------------------
def build(tabs):
    part = csv_to_dicts(tabs["Partenaires"])
    com = csv_to_dicts(tabs["Comites"])
    comp = csv_to_dicts(tabs["Composition"])
    defs = csv_to_dicts(tabs["Definitions"])

    # --- Familles de partenaires (déduites de la colonne « famille »), ordre d'apparition
    famsP, fam_index, boxes_by_fam = [], {}, {}
    for r in part:
        fam_label = _strip(r.get("famille")) or "Autres partenaires"
        if fam_label not in fam_index:
            key = FAMILY_KEY.get(fam_label, FAMILY_FALLBACK)
            fam_index[fam_label] = key
            famsP.append({"key": key, "label": fam_label, "dot": key, "boxes": []})
            boxes_by_fam[fam_label] = famsP[-1]["boxes"]
        box = {"id": _strip(r.get("ID-par")), "ac": _strip(r.get("acronym"))}
        full = _strip(r.get("partenaire"))
        if full:
            box["full"] = full
        parent = _strip(r.get("parent"))
        if parent:
            box["rel"] = parent
        box["coms"] = []  # rempli plus bas via la composition
        boxes_by_fam[fam_label].append(box)

    box_by_id = {b["id"]: b for f in famsP for b in f["boxes"] if b["id"]}

    # --- Familles de comités (déduites de « groupe »), ordre d'apparition
    famsC, group_key = [], {}
    for r in com:
        g = _strip(r.get("groupe")) or "Autres"
        if g not in group_key:
            key = "g" + str(len(group_key) + 1)
            group_key[g] = key
            famsC.append({"key": key, "label": g})

    # --- Composition : regroupée par comité, ordonnée porteur -> DRSP -> autres
    comp_by_com = {}
    for r in comp:
        cid = _strip(r.get("ID-com"))
        if not cid:
            continue
        comp_by_com.setdefault(cid, []).append({
            "m": _strip(r.get("membre")),
            "cat": _strip(r.get("categorie")),
            "mem": _strip(r.get("ID-mem")),
        })
    for cid, items in comp_by_com.items():
        items.sort(key=lambda it: cat_rank(it["cat"]))  # tri stable
        # Lien partenaire <-> comité : un membre dont ID-mem = ID-par d'un partenaire
        for it in items:
            b = box_by_id.get(it["mem"])
            if b and cid not in b["coms"]:
                b["coms"].append(cid)

    # --- Comités
    committees = []
    for r in com:
        cid = _strip(r.get("ID-com"))
        c = {"id": cid, "fam": group_key.get(_strip(r.get("groupe")) or "Autres", ""),
             "name": _strip(r.get("acronym")), "full": _strip(r.get("comite")),
             "niv": niveau_code(r.get("niveau")),
             "drsp": "lead" if truthy(r.get("DRSP-coord")) else "",
             "man": _strip(r.get("mandat"))}
        if truthy(r.get("nouveau")):
            c["neu"] = True
        parent = _strip(r.get("parent"))
        if parent:
            c["under"] = parent
        c["comp"] = [{"m": it["m"], "cat": it["cat"]} for it in comp_by_com.get(cid, [])]
        committees.append(c)

    defs_out = [{"t": _strip(d.get("terme")), "ac": _strip(d.get("acronym")),
                 "d": _strip(d.get("definition"))} for d in defs if _strip(d.get("terme"))]

    return {"famsP": famsP, "famsC": famsC,
            "committees": committees, "defs": defs_out}


# ---------------------------------------------------------------------------
# EXPORT : window.CONC (ancien modèle) -> CSV des 4 onglets (migration + tests)
# ---------------------------------------------------------------------------
def export(D):
    """Migre l'ancien window.CONC (6 sections) vers les 4 nouveaux onglets.

    - La description des partenaires est ABANDONNÉE (choix produit).
    - « Porté par » devient une ligne de composition catégorie « porteur ».
    - « Présence interne » (équipes DRSP) devient des lignes catégorie « DRSP ».
    - ID-mem est pré-rempli au mieux par correspondance de nom avec un partenaire.
    """
    # libellé de famille par clé (pour réécrire la colonne « famille »)
    fam_label = {f["key"]: f["label"] for f in D["famsP"]}
    famc_label = {f["key"]: f["label"] for f in D["famsC"]}
    NIV_FR = {"strat": "stratégique", "tact": "tactique", "oper": "opérationnel"}

    # index partenaires pour deviner ID-mem
    partners = []
    prows = []
    for f in D["famsP"]:
        for b in f["boxes"]:
            prows.append([b["id"], b.get("ac", ""), b.get("full", ""),
                          f["label"], b.get("rel", "")])
            partners.append((b["id"], b.get("ac", ""), b.get("full", "")))

    def guess_mem(text):
        t = _norm(text)
        for pid, ac, full in partners:
            if ac and _norm(ac) and _norm(ac) in t.split():
                return pid
        for pid, ac, full in partners:
            if ac and len(ac) >= 3 and _norm(ac) in t:
                return pid
        return ""

    comp_rows = []
    crows = []
    for c in D["committees"]:
        cid, cfull = c["id"], c.get("full", c.get("name", ""))
        crows.append([cid, c.get("name", ""), cfull,
                      famc_label.get(c.get("fam", ""), ""), c.get("under", ""),
                      NIV_FR.get(c.get("niv", ""), c.get("niv", "")),
                      "x" if c.get("drsp") == "lead" else "",
                      "x" if c.get("neu") else "", c.get("man", "")])
        # porteur depuis pp
        if _strip(c.get("pp")):
            m = _strip(c["pp"]).rstrip(".")
            comp_rows.append([cid, cfull, guess_mem(m), m, "porteur"])
        # équipes DRSP depuis int
        for code in c.get("int", []):
            comp_rows.append([cid, cfull, "", INT_LABEL.get(code, code), "DRSP"])
        # membres existants
        for it in c.get("comp", []):
            m = it.get("m", "")
            cat = "DRSP" if it.get("s") == "drsp" else ""
            comp_rows.append([cid, cfull, guess_mem(m), m, cat])

    drows = [[d.get("t", ""), d.get("ac", ""), d.get("d", "")] for d in D["defs"]]

    return {
        "Partenaires": rows_to_csv(
            ["ID-par", "acronym", "partenaire", "famille", "parent"], prows),
        "Comites": rows_to_csv(
            ["ID-com", "acronym", "comite", "groupe", "parent", "niveau",
             "DRSP-coord", "nouveau", "mandat"], crows),
        "Composition": rows_to_csv(
            ["ID-com", "comite", "ID-mem", "membre", "categorie"], comp_rows),
        "Definitions": rows_to_csv(["terme", "acronym", "definition"], drows),
    }


# ---------------------------------------------------------------------------
# Écriture de assets/data/concertations.data.js
# ---------------------------------------------------------------------------
HEADER = ("/* Données de la section Concertations.\n"
          "   GÉNÉRÉ AUTOMATIQUEMENT depuis la feuille Google « Concertations »\n"
          "   par sync/sync_all.py. NE PAS ÉDITER À LA MAIN : modifiez la feuille,\n"
          "   le site se met à jour à la prochaine synchronisation. */\n")


def render_js(conc):
    return HEADER + "window.CONC = " + json.dumps(
        conc, ensure_ascii=False, indent=2) + ";\n"


TABS = ["Partenaires", "Comites", "Composition", "Definitions"]


def run(cfg, fetch, repo_root):
    # Les 4 onglets sont fixés par le schéma ; on ignore tout « tabs » du config.
    tabs = {t: fetch(cfg["sheet_id"], t) for t in TABS}
    conc = build(tabs)
    (repo_root / cfg["output"]).write_text(render_js(conc), encoding="utf-8")
    return (f"{cfg['output']} — {len(conc['committees'])} comités, "
            f"{sum(len(f['boxes']) for f in conc['famsP'])} partenaires, "
            f"{len(conc['defs'])} définitions")
