# -*- coding: utf-8 -*-
"""Concertations : feuille Google à 4 onglets <-> assets/data/concertations.data.js.

Onglets attendus (voir GUIDE-SUPERVISEUR.md) :
  Partenaires   : acronym | partenaire | famille | parent
  Comites       : acronym | comite | groupe | parent | niveau |
                  DRSP-coord | nouveau | mandat
  Composition   : comite | membre | partenaire | categorie
  Definitions   : terme | acronym | definition
  Postures      : ordre | posture | description | exemple   (optionnel)

Il n'y a PAS de colonnes d'identifiants : l'« acronym » sert de clé.
  - Chaque acronym doit être UNIQUE dans son onglet (sinon la synchronisation
    échoue avec un message explicite).
  - Dans `Composition`, la colonne `comite` désigne un comité par son acronym
    (ou son nom complet), et la colonne `partenaire` — facultative — relie le
    membre à un partenaire par son acronym. La correspondance ignore la casse
    et les accents.
  - Les anciennes colonnes ID-par / ID-com / ID-mem sont encore acceptées si
    elles sont présentes (transition), mais elles sont superflues.

`build(tabs)` : {onglet: csv} -> objet window.CONC (dict).

Bibliothèque standard seulement.
"""
import csv
import io
import json
import re
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

NIVEAU_CODE = {"strat": "strat", "tact": "tact", "oper": "oper"}


# ---------------------------------------------------------------------------
# Petits utilitaires
# ---------------------------------------------------------------------------
def _strip(s):
    return (s or "").strip()


def truthy(s):
    return _strip(s).lower() in ("x", "1", "true", "vrai", "oui", "yes", "lead")


def _norm(s):
    s = unicodedata.normalize("NFKD", (s or "").strip().lower())
    return "".join(c for c in s if not unicodedata.combining(c))


def slug(s):
    """Clé interne dérivée de l'acronym : minuscules, sans accent, tirets."""
    return re.sub(r"[^a-z0-9]+", "-", _norm(s)).strip("-")


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


def _check_unique(kind, pairs):
    """pairs : liste (slug, acronym). Échec bruyant si deux acronymes se
    confondent (même clé une fois casse/accents ignorés)."""
    seen = {}
    dups = []
    for key, ac in pairs:
        if key in seen and seen[key] != ac:
            dups.append(f"« {seen[key]} » / « {ac} »")
        elif key in seen:
            dups.append(f"« {ac} » (en double)")
        seen.setdefault(key, ac)
    if dups:
        raise RuntimeError(
            f"Onglet {kind} : acronymes en conflit — {' ; '.join(sorted(set(dups)))}. "
            "Chaque acronym doit être unique (casse et accents ignorés).")


class _Resolver:
    """Résout une référence (acronym, nom complet ou ancien ID) vers une clé."""

    def __init__(self):
        self.by_ref = {}

    def add(self, key, *refs):
        for r in refs:
            n = _norm(r)
            if n:
                self.by_ref.setdefault(n, key)

    def get(self, ref):
        return self.by_ref.get(_norm(ref), "")


# ---------------------------------------------------------------------------
# BUILD : {onglet: csv} -> window.CONC
# ---------------------------------------------------------------------------
def build(tabs):
    part = csv_to_dicts(tabs["Partenaires"])
    com = csv_to_dicts(tabs["Comites"])
    comp = csv_to_dicts(tabs["Composition"])
    defs = csv_to_dicts(tabs["Definitions"])
    warnings = []

    # --- Partenaires : clé = slug(acronym) ; familles dans l'ordre d'apparition
    _check_unique("Partenaires",
                  [(slug(r.get("acronym")), _strip(r.get("acronym")))
                   for r in part if _strip(r.get("acronym"))])
    famsP, fam_index, boxes_by_fam = [], {}, {}
    p_resolver = _Resolver()
    for r in part:
        ac = _strip(r.get("acronym"))
        if not ac:
            continue
        fam_label = _strip(r.get("famille")) or "Autres partenaires"
        if fam_label not in fam_index:
            key = FAMILY_KEY.get(fam_label, FAMILY_FALLBACK)
            fam_index[fam_label] = key
            famsP.append({"key": key, "label": fam_label, "dot": key, "boxes": []})
            boxes_by_fam[fam_label] = famsP[-1]["boxes"]
        pid = slug(ac)
        box = {"id": pid, "ac": ac}
        full = _strip(r.get("partenaire"))
        if full:
            box["full"] = full
        parent = _strip(r.get("parent"))
        if parent:
            box["rel"] = parent
        box["coms"] = []  # rempli plus bas via la composition
        boxes_by_fam[fam_label].append(box)
        # référence acceptée : acronym, nom complet, ancien ID-par (transition)
        p_resolver.add(pid, ac, full, r.get("ID-par"))

    box_by_id = {b["id"]: b for f in famsP for b in f["boxes"]}

    # --- Comités : clé = slug(acronym) ; groupes dans l'ordre d'apparition
    _check_unique("Comites",
                  [(slug(r.get("acronym")), _strip(r.get("acronym")))
                   for r in com if _strip(r.get("acronym"))])
    famsC, group_key = [], {}
    c_resolver = _Resolver()
    for r in com:
        ac = _strip(r.get("acronym"))
        if not ac:
            continue
        g = _strip(r.get("groupe")) or "Autres"
        if g not in group_key:
            key = "g" + str(len(group_key) + 1)
            group_key[g] = key
            famsC.append({"key": key, "label": g})
        c_resolver.add(slug(ac), ac, r.get("comite"), r.get("ID-com"))

    # --- Composition : regroupée par comité, ordonnée porteur -> DRSP -> autres
    comp_by_com = {}
    for r in comp:
        ref = _strip(r.get("comite")) or _strip(r.get("ID-com"))
        if not ref:
            continue
        cid = c_resolver.get(ref) or c_resolver.get(r.get("ID-com"))
        if not cid:
            warnings.append(f"Composition : comité inconnu « {ref} »")
            continue
        comp_by_com.setdefault(cid, []).append({
            "m": _strip(r.get("membre")),
            "cat": _strip(r.get("categorie")),
            "part": _strip(r.get("partenaire")) or _strip(r.get("ID-mem")),
        })
    for cid, items in comp_by_com.items():
        items.sort(key=lambda it: cat_rank(it["cat"]))  # tri stable
        # Lien partenaire <-> comité via la colonne « partenaire » (acronym)
        for it in items:
            if not it["part"]:
                continue
            pid = p_resolver.get(it["part"])
            if not pid:
                warnings.append(f"Composition : partenaire inconnu « {it['part']} »")
                continue
            b = box_by_id[pid]
            if cid not in b["coms"]:
                b["coms"].append(cid)

    # --- Comités (fiches)
    committees = []
    for r in com:
        ac = _strip(r.get("acronym"))
        if not ac:
            continue
        cid = slug(ac)
        c = {"id": cid, "fam": group_key.get(_strip(r.get("groupe")) or "Autres", ""),
             "name": ac, "full": _strip(r.get("comite")),
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

    # --- Postures de la DRSP (onglet optionnel)
    post = csv_to_dicts(tabs.get("Postures") or "")
    postures = [{"n": _strip(p.get("ordre")), "t": _strip(p.get("posture")),
                 "d": _strip(p.get("description")), "ex": _strip(p.get("exemple"))}
                for p in post if _strip(p.get("posture"))]
    postures.sort(key=lambda p: (p["n"].zfill(3), p["t"]))

    conc = {"famsP": famsP, "famsC": famsC,
            "committees": committees, "defs": defs_out, "postures": postures}
    return conc, warnings


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
OPTIONAL_TABS = ["Postures"]


def run(cfg, fetch, repo_root):
    # Les onglets sont fixés par le schéma ; on ignore tout « tabs » du config.
    tabs = {t: fetch(cfg["sheet_id"], t) for t in TABS}
    for t in OPTIONAL_TABS:
        try:
            tabs[t] = fetch(cfg["sheet_id"], t)
        except Exception:  # noqa: BLE001 — onglet absent : section omise
            print(f"[note] onglet optionnel « {t} » absent ou inaccessible ; "
                  "section omise.")
    conc, warnings = build(tabs)
    for w in sorted(set(warnings)):
        print(f"[attention] {w}")
    (repo_root / cfg["output"]).write_text(render_js(conc), encoding="utf-8")
    msg = (f"{cfg['output']} — {len(conc['committees'])} comités, "
           f"{sum(len(f['boxes']) for f in conc['famsP'])} partenaires, "
           f"{len(conc['defs'])} définitions, "
           f"{len(conc['postures'])} postures")
    if warnings:
        msg += f" ; {len(set(warnings))} référence(s) NON RECONNUE(S), voir [attention]"
    return msg
