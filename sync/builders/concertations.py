# -*- coding: utf-8 -*-
"""Concertations : conversion feuille <-> assets/data/concertations.data.js.

`build(tabs)`  : dict {nom_onglet: texte_csv}  ->  objet window.CONC (dict).
`export(D)`    : objet window.CONC (dict)       ->  dict {nom_onglet: texte_csv}
                 (sert à pré-remplir la feuille Google et au test aller-retour).

Aucune dépendance externe (bibliothèque standard seulement).
Les listes sont jointes par ' ; ' dans une cellule ; les booléens valent 'x'.
"""
import csv
import io

SEP = " ; "


def join_list(xs):
    return SEP.join(xs or [])


def split_list(s):
    s = (s or "").strip()
    return [p.strip() for p in s.split(";") if p.strip()] if s else []


def b(v):
    return "x" if v else ""


def truthy(s):
    return (s or "").strip().lower() in ("x", "1", "true", "oui", "yes")


def rows_to_csv(header, rows):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(header)
    w.writerows(rows)
    return buf.getvalue()


def csv_to_dicts(text):
    return list(csv.DictReader(io.StringIO(text)))


# ---------------------------------------------------------------------------
# EXPORT : window.CONC -> {onglet: csv}
# ---------------------------------------------------------------------------
def export(D):
    tabs = {}

    rows = [[f["key"], f["label"], f.get("dot", "")] for f in D["famsP"]]
    tabs["Familles_partenaires"] = rows_to_csv(["key", "label", "dot"], rows)

    rows = []
    for f in D["famsP"]:
        for x in f["boxes"]:
            rows.append([
                f["key"], x["id"], x.get("ac", ""), x.get("full", ""),
                x.get("desc", ""), x.get("rel", ""), b(x.get("sub")),
                join_list(x.get("match")),
            ])
    tabs["Partenaires"] = rows_to_csv(
        ["famille_key", "id", "ac", "full", "desc", "rel", "sub", "match"], rows)

    rows = [[f["key"], f["label"]] for f in D["famsC"]]
    tabs["Familles_comites"] = rows_to_csv(["key", "label"], rows)

    rows = []
    for c in D["committees"]:
        rows.append([
            c["id"], c.get("fam", ""), c.get("niv", ""), c.get("pal", ""),
            c.get("name", ""), c.get("full", ""), c.get("drsp", ""),
            b(c.get("neu")), c.get("under", ""), b(c.get("ina")),
            c.get("pp", ""), c.get("man", ""),
            join_list(c.get("int")), join_list(c.get("par")),
        ])
    tabs["Comites"] = rows_to_csv(
        ["id", "fam", "niv", "pal", "name", "full", "drsp", "neu",
         "under", "ina", "pp", "man", "presence_interne", "partenaires_lies"],
        rows)

    rows = []
    for c in D["committees"]:
        for it in c.get("comp", []):
            rows.append([c["id"], it.get("s", ""), it.get("m", "")])
    tabs["Composition"] = rows_to_csv(["comite_id", "secteur", "membre"], rows)

    rows = [[d.get("t", ""), d.get("ac", ""), d.get("d", "")] for d in D["defs"]]
    tabs["Definitions"] = rows_to_csv(["terme", "acronyme", "definition"], rows)

    return tabs


# ---------------------------------------------------------------------------
# BUILD : {onglet: csv} -> window.CONC
# ---------------------------------------------------------------------------
def build(tabs):
    fp = csv_to_dicts(tabs["Familles_partenaires"])
    part = csv_to_dicts(tabs["Partenaires"])
    fc = csv_to_dicts(tabs["Familles_comites"])
    com = csv_to_dicts(tabs["Comites"])
    comp = csv_to_dicts(tabs["Composition"])
    defs = csv_to_dicts(tabs["Definitions"])

    boxes_by_fam = {}
    for r in part:
        # Toujours présents : id, ac, desc, match.
        box = {"id": r["id"], "ac": r["ac"], "desc": r["desc"],
               "match": split_list(r["match"])}
        # Optionnels : présents seulement si renseignés.
        if (r.get("full") or "").strip():
            box["full"] = r["full"]
        if (r.get("rel") or "").strip():
            box["rel"] = r["rel"]
        if truthy(r.get("sub")):
            box["sub"] = True
        boxes_by_fam.setdefault(r["famille_key"], []).append(box)
    famsP = [{"key": f["key"], "label": f["label"], "dot": f["dot"],
              "boxes": boxes_by_fam.get(f["key"], [])} for f in fp]

    famsC = [{"key": f["key"], "label": f["label"]} for f in fc]

    comp_by_id = {}
    for r in comp:
        comp_by_id.setdefault(r["comite_id"], []).append(
            {"m": r["membre"], "s": r["secteur"]})

    committees = []
    for r in com:
        # Toujours présents (même vides) : id, fam, name, full, niv, pal,
        # drsp, pp, man, comp.
        c = {"id": r["id"], "fam": r["fam"], "name": r["name"],
             "full": r.get("full", ""), "niv": r["niv"], "pal": r["pal"],
             "drsp": r["drsp"], "pp": r.get("pp", ""), "man": r.get("man", "")}
        # Optionnels : présents seulement si renseignés.
        if split_list(r.get("presence_interne")):
            c["int"] = split_list(r["presence_interne"])
        if split_list(r.get("partenaires_lies")):
            c["par"] = split_list(r["partenaires_lies"])
        if truthy(r.get("neu")):
            c["neu"] = True
        if (r.get("under") or "").strip():
            c["under"] = r["under"]
        if truthy(r.get("ina")):
            c["ina"] = True
        c["comp"] = comp_by_id.get(r["id"], [])
        committees.append(c)

    defs_out = [{"t": d["terme"], "ac": d["acronyme"], "d": d["definition"]}
                for d in defs]

    return {"famsP": famsP, "famsC": famsC,
            "committees": committees, "defs": defs_out}


# ---------------------------------------------------------------------------
# Écriture du fichier assets/data/concertations.data.js
# ---------------------------------------------------------------------------
import json  # noqa: E402

HEADER = ("/* Données de la section Concertations.\n"
          "   GÉNÉRÉ AUTOMATIQUEMENT depuis la feuille Google « Concertations »\n"
          "   par sync/sync_all.py. NE PAS ÉDITER À LA MAIN : modifiez plutôt la\n"
          "   feuille Google, le site se met à jour à la prochaine synchronisation. */\n")


def render_js(conc):
    return HEADER + "window.CONC = " + json.dumps(
        conc, ensure_ascii=False, indent=2) + ";\n"


def run(cfg, fetch, repo_root):
    tabs = {t: fetch(cfg["sheet_id"], t) for t in cfg["tabs"]}
    conc = build(tabs)
    out = repo_root / cfg["output"]
    out.write_text(render_js(conc), encoding="utf-8")
    return (f"{cfg['output']} — {len(conc['committees'])} comités, "
            f"{sum(len(f['boxes']) for f in conc['famsP'])} partenaires, "
            f"{len(conc['defs'])} définitions")
