#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_cadre.py — injecte cadre.svg (export Illustrator) dans cadre-frame.html.

À exécuter après CHAQUE réexport du cadre conceptuel depuis Illustrator :

    python3 tools/build_cadre.py

Ce que le script fait :

1.  Lit cadre.svg tel qu'Illustrator l'a produit. Ce fichier n'est jamais
    modifié à la main : il reste la copie exacte du fichier .ai.
2.  Remplace les familles de police d'Illustrator (« Inter18pt-Bold »,
    « Inter 18pt »…) par « Inter », la police que le site charge déjà depuis
    Google Fonts. Sans cela, le texte se chevauche : Illustrator calcule la
    position de chaque lettre avec les métriques d'Inter, mais demande une
    police que le navigateur ne trouve pas.
3.  Repère les zones cliquables. Dans Illustrator, toute forme dont le calque
    s'appelle « … box » devient une zone cliquable. La table BOXES ci-dessous
    fait le lien entre le nom du calque et la clé utilisée dans
    assets/data/cadre.data.js.
4.  Ajoute trois calques par-dessus le dessin :
      • #cadre-halo — un liseré blanc épais, pour que le contour de sélection
        reste visible sur les boîtes de couleur foncée (Équité en santé,
        Rôles de la santé publique, Valeurs, Mobilisation des actifs…) ;
      • #cadre-outline — un contour noir, invisible par défaut, qui s'allume
        au survol et reste allumé sur la zone sélectionnée ;
      • #cadre-hit — des copies transparentes des mêmes formes qui reçoivent
        les clics et le focus clavier.
    Les deux sont des copies de la forme d'origine, donc la zone cliquable
    épouse exactement la boîte dessinée, y compris les cercles et les coins
    arrondis.
5.  Réécrit dans cadre-frame.html les deux blocs repérés par des commentaires :
      • CADRE:SVG   — le dessin lui-même ;
      • CADRE:MAP   — la liste des zones et leur section, utilisée par la
                      recherche et par l'ordre de lecture.
6.  Affiche la liste des zones dont la fiche est encore vide.

Si vous renommez un calque dans Illustrator, ajoutez la nouvelle
correspondance dans BOXES : le script s'arrête et vous le dit si un nom de
calque attendu a disparu.
"""

import os
import re
import sys
import json
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG_IN = os.path.join(ROOT, "cadre.svg")
PAGE = os.path.join(ROOT, "cadre-frame.html")
DATA = os.path.join(ROOT, "assets", "data", "cadre.data.js")

SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)
Q = "{%s}" % SVG_NS

SVG_START = "<!-- CADRE:SVG:START -->"
SVG_END = "<!-- CADRE:SVG:END -->"
MAP_START = "<!-- CADRE:MAP:START -->"
MAP_END = "<!-- CADRE:MAP:END -->"

# ---------------------------------------------------------------------------
# Zones cliquables : identifiant du calque Illustrator -> clé de contenu.
#
# La clé de droite est celle qu'il faut utiliser dans cadre.data.js. Elle ne
# change pas quand vous renommez un calque : mettez simplement le nouveau nom
# de calque à gauche et le contenu déjà écrit reste rattaché à la bonne boîte.
#
# L'ordre de cette table est l'ordre de lecture du cadre (haut vers le bas).
# ---------------------------------------------------------------------------
BOXES = [
    # (id du calque dans cadre.svg, clé de contenu, section affichée)
    ("enjeux_box",           "enjeux",              "Enjeux transversaux"),
    ("rapports_box",         "rapports",            "Enjeux transversaux"),
    ("transformation_box",   "transformation",      "Enjeux transversaux"),
    ("changements_box",      "changements",         "Enjeux transversaux"),

    ("déterminants_box",     "determinants",        "Déterminants structurels"),
    ("@Valeurs_group",       "valeurs",             "Déterminants structurels"),
    ("gouvernance_box",      "gouvernance",         "Déterminants structurels"),
    ("lois_box",             "lois",                "Déterminants structurels"),
    ("Méthodes_box",         "methodes",            "Déterminants structurels"),

    ("DS_box",               "ds",                  "Développement social (DS)"),
    ("rôles_box",            "roles",               "Développement social (DS)"),
    ("financement_box",      "financement",         "Développement social (DS)"),
    ("Développement_box",    "connaissances",       "Développement social (DS)"),
    ("influence_box",        "influence",           "Développement social (DS)"),
    ("participation_box-2",  "ds-participation",    "Développement social (DS)"),
    ("concertation_box-2",   "ds-concertation",     "Développement social (DS)"),

    ("Action_box",           "action-intersectorielle", "Action intersectorielle"),
    ("sont_box",             "prealable-processus-resultat", "Action intersectorielle"),
    ("institutions_box",     "institutions",        "Parties prenantes"),
    ("prové_box",            "prive",               "Parties prenantes"),
    ("communautaire_box",    "communautaire",       "Parties prenantes"),
    ("Citoyens_box",         "citoyens",            "Parties prenantes"),
    ("Gouvernance_box",      "gouvernance-collaborative", "Coconstruction"),
    ("concertation_box",     "concertation",        "Coconstruction"),
    ("participation_box",    "participation",       "Coconstruction"),
    ("vision_box",           "vision",              "Coconstruction"),
    ("action_box",           "action-collective",   "Coconstruction"),
    ("imapct_box",           "impact",              "Action intersectorielle"),
    ("_équité_box",          "equite",              "Finalité"),

    ("DC_box",               "dc",                  "Développement des communautés (DC)"),
    ("mobilisation_box",     "mobilisation",        "Développement des communautés (DC)"),
    ("capital_box",          "capital",             "Développement des communautés (DC)"),
    ("savoir_box",           "savoir",              "Développement des communautés (DC)"),
    ("leadership_box-2",     "leadership",          "Développement des communautés (DC)"),
    ("leadership_box",       "ressources",          "Développement des communautés (DC)"),

    ("recherche_box",        "recherche",           "Recherche et évaluation"),
]

# Familles de police écrites par Illustrator -> (famille web, graisse, style).
FONTS = [
    ("Inter18pt-ExtraBold, 'Inter 18pt'", "Inter, system-ui, sans-serif", "800", None),
    ("Inter18pt-Bold, 'Inter 18pt'",      "Inter, system-ui, sans-serif", "700", None),
    ("Inter18pt-Medium, 'Inter 18pt'",    "Inter, system-ui, sans-serif", "500", None),
    ("Inter18pt-Italic, 'Inter 18pt'",    "Inter, system-ui, sans-serif", None, "italic"),
    ("Inter18pt-Regular, 'Inter 18pt'",   "Inter, system-ui, sans-serif", "400", None),
]

GEOM = {
    "rect": ("x", "y", "width", "height", "rx", "ry"),
    "circle": ("cx", "cy", "r"),
    "ellipse": ("cx", "cy", "rx", "ry"),
    "path": ("d",),
    "polygon": ("points",),
    "polyline": ("points",),
}


def fail(msg):
    sys.stderr.write("build_cadre.py — ERREUR : %s\n" % msg)
    sys.exit(1)


def fix_fonts(svg_text):
    """Rend le texte lisible dans le navigateur (voir point 2 de l'en-tête)."""
    for ai_family, web_family, weight, style in FONTS:
        if ai_family not in svg_text:
            continue
        repl = "font-family: %s;" % web_family
        if weight:
            repl += " font-weight: %s;" % weight
        if style:
            repl += " font-style: %s;" % style
        svg_text = svg_text.replace("font-family: %s;" % ai_family, repl)
    if "Inter18pt" in svg_text:
        leftovers = sorted(set(re.findall(r"Inter18pt-[A-Za-z]+", svg_text)))
        fail("police(s) inconnue(s) dans cadre.svg : %s — ajoutez-les à FONTS."
             % ", ".join(leftovers))
    return svg_text


def find_boxes(root):
    """Retourne [(clé, section, élément)] dans l'ordre de BOXES."""
    parents = {c: p for p in root.iter() for c in p}
    by_id = {}
    for el in root.iter():
        i = el.get("id")
        if i:
            by_id.setdefault(i, el)

    found, missing = [], []
    for layer_id, key, section in BOXES:
        if layer_id.startswith("@"):
            # Calque sans forme « … box » : on prend le premier rectangle du groupe.
            grp = by_id.get(layer_id[1:])
            el = None
            if grp is not None:
                el = next((e for e in grp.iter() if e.tag == Q + "rect"), None)
        else:
            el = by_id.get(layer_id)
        if el is None:
            missing.append(layer_id)
            continue
        tag = el.tag.split("}")[-1]
        if tag not in GEOM:
            fail("« %s » est un <%s>, forme non gérée pour une zone cliquable." % (layer_id, tag))
        found.append((key, section, el, parents.get(el)))
    if missing:
        fail("calque(s) introuvable(s) dans cadre.svg : %s\n"
             "        Renommez-les dans Illustrator ou mettez la table BOXES à jour."
             % ", ".join(missing))
    return found


def label_of(parent):
    """Le texte contenu dans le groupe de la boîte, pour l'infobulle."""
    if parent is None:
        return ""
    bits = []
    for t in parent.iter(Q + "text"):
        bits.append(re.sub(r"\s+", " ", "".join(t.itertext())).strip())
    return " ".join(b for b in bits if b).strip()


def clone(el, cls, key, extra=None):
    tag = el.tag.split("}")[-1]
    out = ET.Element(Q + tag)
    for a in GEOM[tag]:
        v = el.get(a)
        if v is not None:
            out.set(a, v)
    out.set("class", cls)
    out.set("data-key", key)
    for k, v in (extra or {}).items():
        out.set(k, v)
    return out


def build_svg():
    raw = open(SVG_IN, encoding="utf-8").read()
    raw = fix_fonts(raw)
    root = ET.fromstring(raw)
    boxes = find_boxes(root)

    halo = ET.SubElement(root, Q + "g")
    halo.set("id", "cadre-halo")
    halo.set("aria-hidden", "true")
    outline = ET.SubElement(root, Q + "g")
    outline.set("id", "cadre-outline")
    outline.set("aria-hidden", "true")
    hits = ET.SubElement(root, Q + "g")
    hits.set("id", "cadre-hit")

    titles = {}
    for key, section, el, parent in boxes:
        lab = label_of(parent)
        titles[key] = lab
        # Les attributs de présentation ci-dessous (fill, opacity…) doublent la
        # feuille de style de la page. Sans eux, un SVG ouvert seul — ou une
        # page dont le CSS n'a pas encore été appliqué — afficherait les copies
        # en noir plein, puisque le remplissage par défaut d'une forme SVG est
        # le noir. Les règles CSS de cadre-frame.html restent prioritaires :
        # elles seules gèrent le survol et la sélection.
        halo.append(clone(el, "cadre-halo", key, {
            "fill": "none", "stroke": "#FFFFFF", "stroke-width": "4.5", "opacity": "0",
        }))
        outline.append(clone(el, "cadre-outline", key, {
            "fill": "none", "stroke": "#000000", "stroke-width": "2", "opacity": "0",
        }))
        hit = clone(el, "cadre-hit", key, {
            "fill": "#000000",
            "fill-opacity": "0",
            "stroke": "none",
            "pointer-events": "all",
            "role": "button",
            "tabindex": "0",
        })
        t = ET.SubElement(hit, Q + "title")
        t.text = lab or key
        hits.append(hit)

    root.set("id", "cadre-svg")
    root.set("role", "img")
    root.set("aria-label", "Cadre conceptuel du développement social et du développement des communautés")
    root.attrib.pop("data-name", None)

    body = ET.tostring(root, encoding="unicode")
    body = body.replace(' xmlns:ns0="http://www.w3.org/2000/svg"', "")
    return body, [(k, s) for k, s, _, _ in boxes], titles


def report_empty(keys):
    if not os.path.exists(DATA):
        print("  (assets/data/cadre.data.js absent — aucune fiche à vérifier)")
        return
    js = open(DATA, encoding="utf-8").read()
    m = re.search(r"window\.CADRE_DATA\s*=\s*(\{.*?\});\s*$", js, re.S)
    if not m:
        print("  (impossible de relire cadre.data.js — vérification des fiches sautée)")
        return
    data = json.loads(m.group(1))
    empty = [k for k, _ in keys
             if not (data.get(k) or {}).get("definition", "").strip()]
    unknown = [k for k in data if k not in {k for k, _ in keys}]
    print("  %d zones cliquables, %d fiches rédigées." % (len(keys), len(keys) - len(empty)))
    if empty:
        print("  Fiches encore vides (%d) : %s" % (len(empty), ", ".join(empty)))
    if unknown:
        print("  Clés de cadre.data.js qui ne correspondent à aucune boîte : %s" % ", ".join(unknown))


def replace_block(page, start, end, body):
    if start not in page or end not in page:
        fail("les repères %s / %s sont absents de cadre-frame.html." % (start, end))
    head, rest = page.split(start, 1)
    _, tail = rest.split(end, 1)
    return head + start + "\n" + body + "\n" + end + tail


def main():
    for p in (SVG_IN, PAGE):
        if not os.path.exists(p):
            fail("fichier manquant : %s" % p)

    body, keys, titles = build_svg()

    cadre_map = {k: {"section": s} for k, s in keys}
    order = [k for k, _ in keys]
    map_block = (
        "<script>\n"
        "/* Écrit par tools/build_cadre.py — ne pas modifier à la main.\n"
        "   Section de chaque zone (utilisée par la recherche) et ordre de lecture. */\n"
        "window.CADRE_MAP = %s;\n"
        "window.CADRE_ORDER = %s;\n"
        "</script>"
    ) % (json.dumps(cadre_map, ensure_ascii=False, indent=2),
         json.dumps(order, ensure_ascii=False))

    page = open(PAGE, encoding="utf-8").read()
    page = replace_block(page, SVG_START, SVG_END, body)
    page = replace_block(page, MAP_START, MAP_END, map_block)
    open(PAGE, "w", encoding="utf-8").write(page)

    print("cadre-frame.html mis à jour depuis cadre.svg.")
    report_empty(keys)


if __name__ == "__main__":
    main()
