#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_cadre.py — injecte les deux cadres conceptuels dans cadre-frame.html.

À exécuter après CHAQUE réexport depuis Illustrator :

    python3 tools/build_cadre.py

Deux dessins, deux onglets du site :

    cadre.svg         -> onglet « Cadre conceptuel »   (repères CADRE:SVG)
    cadre-simple.svg  -> onglet « Cadre simplifié »    (repères SIMPLE:SVG)

Ce que le script fait, pour chacun :

1.  Lit le SVG tel qu'Illustrator l'a produit. Ces deux fichiers ne sont jamais
    modifiés à la main : ils restent la copie exacte des fichiers .ai.
2.  Remplace les familles de police d'Illustrator (« Inter18pt-Bold »,
    « Inter 18pt »…) par « Inter », la police que le site charge déjà depuis
    Google Fonts. Sans cela le texte se chevauche : Illustrator calcule la
    position de chaque lettre avec les métriques d'Inter, mais demande une
    police que le navigateur ne trouve pas.
3.  Retire le bandeau de titre du haut de la planche (le rectangle blanc,
    « DÉVELOPPEMENT SOCIAL ET… » et le filet) : la page a déjà son propre
    titre. Puis recadre la vue sur le dessin, pour supprimer les marges de la
    feuille 612 × 792.
4.  Repère les zones cliquables, chacune selon la logique de son fichier :
      • cadre.svg — toute forme dont le calque s'appelle « … box », d'après la
        table BOXES ;
      • cadre-simple.svg — toute forme qui contient du texte, appariée à sa
        fiche par ce texte, d'après la table SIMPLE_BOXES. Ce dessin n'a pas de
        calques nommés ; c'est possible ici parce que sa mise en page est
        régulière (une étiquette par boîte, jamais deux fois la même).
4bis. Enferme le dessin dans un <template>. C'est le point important : une
    balise <style> d'Illustrator s'applique à TOUTE la page, pas au seul SVG qui
    la contient. Illustrator renumérote ses classes à partir de zéro dans chaque
    export, donc les deux planches définissent des dizaines de « .cls-1 »,
    « .cls-2 »… portant les mêmes noms et pas les mêmes couleurs. Insérées
    ensemble, elles s'écrasent l'une l'autre et chaque forme hérite du
    remplissage de l'autre dessin. Le contenu d'un <template> est inerte : ses
    styles ne s'appliquent pas. La page ne monte donc que le dessin de l'onglet
    affiché, et démonte l'autre — un seul jeu de styles vivant à la fois. Les
    classes sont en plus préfixées par fichier, ceinture et bretelles.

5.  Ajoute trois calques par-dessus le dessin :
      • #cadre-halo — un liseré blanc épais, pour que le contour de sélection
        reste visible sur les boîtes de couleur foncée ;
      • #cadre-outline — un contour noir, invisible par défaut, qui s'allume au
        survol et reste allumé sur la zone sélectionnée ;
      • #cadre-hit — des copies transparentes des mêmes formes, qui reçoivent
        les clics et le focus clavier.
    Ces copies épousent exactement la forme dessinée, cercles et coins arrondis
    compris.
6.  Réécrit dans cadre-frame.html les blocs repérés par des commentaires
    (CADRE:SVG, SIMPLE:SVG, CADRE:MAP), puis liste les fiches encore vides.

Si vous renommez un calque, ou reformulez l'étiquette d'une boîte du cadre
simplifié, le script s'arrête et vous dit ce qu'il ne retrouve plus : corrigez
la table correspondante ci-dessous et le contenu déjà rédigé reste rattaché à
la bonne boîte.
"""

import os
import re
import sys
import json
import unicodedata
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, "cadre-frame.html")
DATA = os.path.join(ROOT, "assets", "data", "cadre.data.js")

SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)
Q = "{%s}" % SVG_NS

# Cadrage commun aux deux planches. Le bandeau de titre occupe le haut de la
# feuille jusqu'au filet à y = 40,45 ; le dessin lui-même tient dans
# x 37..575 et y 62..778 (mesuré sur les deux fichiers). On garde ~14 unités
# de marge tout autour.
VIEWBOX = "23 48 566 744"
TITLE_BOTTOM = 48.0

# ---------------------------------------------------------------------------
# Onglet « Cadre conceptuel » : identifiant du calque Illustrator -> clé de
# contenu (celle de assets/data/cadre.data.js) -> section affichée.
#
# L'ordre est l'ordre de lecture ET l'ordre d'empilement : une boîte qui en
# contient d'autres (le grand cadre « Enjeux transversaux », par exemple) doit
# être listée AVANT celles qu'elle contient, sinon elle les recouvre et vole
# leurs clics.
#
# « @NomDuGroupe » désigne un groupe sans forme « … box » : on prend alors son
# premier rectangle.
# ---------------------------------------------------------------------------
BOXES = [
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

# ---------------------------------------------------------------------------
# Onglet « Cadre simplifié » : texte de la boîte -> clé de contenu.
#
# La comparaison ignore la casse, les accents et la ponctuation : « Citoyen·ne·s »
# et « citoyen ne s » sont équivalents. Reformuler une étiquette dans Illustrator
# oblige donc à corriger la ligne correspondante ici — le script le signale.
#
# Les boîtes de ce dessin sont un sous-ensemble de celles du cadre complet, à
# une exception près : le cadre complet réunit « Conditions de vie favorables »,
# « Développement du pouvoir d'agir » et « Inclusion sociale » dans une seule
# boîte (prealable-processus-resultat), là où le cadre simplifié les sépare.
# Elles ont donc leur propre fiche.
# ---------------------------------------------------------------------------
SIMPLE_BOXES = [
    ("Rapports de pouvoir",                                 "rapports",            "Enjeux transversaux"),
    ("Transformation numérique",                            "transformation",      "Enjeux transversaux"),
    ("Changements climatiques",                             "changements",         "Enjeux transversaux"),

    ("Valeurs, croyances, culture, normes",                 "valeurs",             "Déterminants structurels"),
    ("Gouvernance",                                         "gouvernance",         "Déterminants structurels"),
    ("Lois, politiques, règlements, budgets",               "lois",                "Déterminants structurels"),
    ("Méthodes institutionnelles",                          "methodes",            "Déterminants structurels"),

    ("Financement, soutien et accompagnement",              "financement",         "Développement social (DS)"),
    ("Développement et partage de connaissances",           "connaissances",       "Développement social (DS)"),
    ("Influence et transformation des politiques publiques", "influence",          "Développement social (DS)"),
    ("Participation citoyenne et inclusion",                "ds-participation",    "Développement social (DS)"),
    ("Concertation, collaboration et mobilisation",         "ds-concertation",     "Développement social (DS)"),

    ("Conditions de vie favorables",                        "conditions-vie",      "Conditions produites par le DS"),
    ("Développement du pouvoir d'agir",                     "pouvoir-agir",        "Conditions produites par le DS"),
    ("Inclusion sociale",                                   "inclusion-sociale",   "Conditions produites par le DS"),

    ("Capital social et cohésion sociale",                  "capital",             "Développement des communautés (DC)"),
    ("Leadership et capacité organisationnelle",            "leadership",          "Développement des communautés (DC)"),
    ("Savoir et apprentissage",                             "savoir",              "Développement des communautés (DC)"),
    ("Ressources et maillage",                              "ressources",          "Développement des communautés (DC)"),

    ("Institutions",                                        "institutions",        "Parties prenantes"),
    ("Privé",                                               "prive",               "Parties prenantes"),
    ("Communautaire",                                       "communautaire",       "Parties prenantes"),
    ("Citoyen·ne·s",                                        "citoyens",            "Parties prenantes"),

    ("Gouvernance collaborative",                           "gouvernance-collaborative", "Coconstruction"),
    ("Concertation",                                        "concertation",        "Coconstruction"),
    ("Participation citoyenne",                             "participation",       "Coconstruction"),

    ("Vision commune",                                      "vision",              "Coconstruction"),
    ("Action collective",                                   "action-collective",   "Coconstruction"),

    ("Impact collectif sur les priorités locales",          "impact",              "Action intersectorielle"),
    ("L'équité en santé",                                   "equite",              "Finalité"),
    ("Recherche et évaluation",                             "recherche",           "Recherche et évaluation"),
]

# Familles de police écrites par Illustrator -> (famille web, graisse, style).
FONTS = [
    ("Inter18pt-ExtraBold, 'Inter 18pt'", "Inter, system-ui, sans-serif", "800", None),
    ("Inter18pt-Bold, 'Inter 18pt'",      "Inter, system-ui, sans-serif", "700", None),
    ("Inter18pt-SemiBold, 'Inter 18pt'",  "Inter, system-ui, sans-serif", "600", None),
    ("Inter18pt-Medium, 'Inter 18pt'",    "Inter, system-ui, sans-serif", "500", None),
    ("Inter18pt-Regular, 'Inter 18pt'",   "Inter, system-ui, sans-serif", "400", None),
    ("Inter18pt-Italic, 'Inter 18pt'",    "Inter, system-ui, sans-serif", None, "italic"),
]

def isolate_classes(svg_text, prefix):
    """Renomme les classes CSS du fichier pour qu'il puisse cohabiter avec l'autre.

    Illustrator numérote ses classes à partir de zéro dans chaque export :
    « .cls-1 », « .cls-2 »… Les deux planches en définissent donc des dizaines
    portant le même nom mais pas les mêmes couleurs. Or les deux SVG sont
    insérés dans la même page : leurs balises <style> sont globales, la seconde
    écrase la première, et chaque forme hérite du remplissage de l'autre dessin.
    On préfixe donc les classes de chaque fichier avant l'insertion.
    """
    svg_text = re.sub(r"\.cls-([\w-]+)", lambda m: ".%scls-%s" % (prefix, m.group(1)), svg_text)

    def fix_attr(m):
        names = " ".join(prefix + n if n.startswith("cls-") else n
                         for n in m.group(1).split())
        return 'class="%s"' % names

    return re.sub(r'class="([^"]*)"', fix_attr, svg_text)


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


def norm(s):
    """Texte comparable : sans accents, sans ponctuation, sans casse."""
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def fix_fonts(svg_text):
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
        fail("police(s) inconnue(s) : %s — ajoutez-les à FONTS." % ", ".join(leftovers))
    return svg_text


def span_y(el):
    """(haut, bas) d'un élément simple, ou None si on ne sait pas les lire."""
    tag = el.tag.split("}")[-1]
    if tag in ("rect", "image"):
        y = float(el.get("y", 0))
        return (y, y + float(el.get("height", 0)))
    if tag == "line":
        y1, y2 = float(el.get("y1", 0)), float(el.get("y2", 0))
        return (min(y1, y2), max(y1, y2))
    if tag == "text":
        m = re.search(r"translate\(\s*[-\d.]+[ ,]+([-\d.]+)", el.get("transform", ""))
        return (float(m.group(1)), float(m.group(1))) if m else None
    return None


def strip_title(root):
    """Retire le bandeau de titre du haut de la planche.

    Le titre est un groupe nommé « Title » dans cadre.svg, et un simple
    empilement de deux textes et d'un filet dans cadre-simple.svg. Plutôt que de
    coder les deux cas, on enlève ce qui se trouve ENTIÈREMENT au-dessus de la
    ligne de recadrage.

    « Entièrement », et pas seulement « qui commence au-dessus » : le rectangle
    de fond de la planche commence lui aussi à y = 0, mais descend jusqu'en bas.
    Le supprimer laisserait le dessin sans fond."""
    removed = 0
    for parent in list(root.iter()):
        for el in list(parent):
            if el.get("id") == "Title":
                parent.remove(el)
                removed += 1
                continue
            span = span_y(el) if len(el) == 0 else None
            if span and span[1] <= TITLE_BOTTOM:
                parent.remove(el)
                removed += 1
    return removed


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


def texts_in(el):
    return [re.sub(r"\s+", " ", "".join(t.itertext())).strip() for t in el.iter(Q + "text")]


def boxes_by_layer(root):
    """cadre.svg : les calques nommés « … box », dans l'ordre de BOXES."""
    parents = {c: p for p in root.iter() for c in p}
    by_id = {}
    for el in root.iter():
        if el.get("id"):
            by_id.setdefault(el.get("id"), el)

    found, missing = [], []
    for layer_id, key, section in BOXES:
        if layer_id.startswith("@"):
            grp = by_id.get(layer_id[1:])
            el = next((e for e in grp.iter() if e.tag == Q + "rect"), None) if grp is not None else None
        else:
            el = by_id.get(layer_id)
        if el is None:
            missing.append(layer_id)
            continue
        if el.tag.split("}")[-1] not in GEOM:
            fail("« %s » n'est pas une forme utilisable comme zone cliquable." % layer_id)
        found.append((key, section, el, " ".join(texts_in(parents.get(el, el)))))
    if missing:
        fail("calque(s) introuvable(s) dans cadre.svg : %s\n"
             "        Renommez-les dans Illustrator, ou mettez la table BOXES à jour."
             % ", ".join(missing))
    return found


def boxes_by_label(root):
    """cadre-simple.svg : chaque forme contenant du texte, appariée par ce texte.

    Les formes du dessin sont des frères des textes, pas leurs parents : on
    apparie donc par la géométrie — un texte appartient à la boîte dont le
    rectangle englobant le contient. Le petit chevron entre « Vision commune »
    et « Action collective » ne contient aucun texte : il est ignoré, et n'est
    donc pas cliquable."""
    try:
        from svgelements import Path
    except ImportError:
        fail("le module svgelements est requis pour le cadre simplifié :\n"
             "        pip3 install svgelements")

    shapes = []
    for el in root.iter():
        tag = el.tag.split("}")[-1]
        if tag == "rect":
            x, y = float(el.get("x", 0)), float(el.get("y", 0))
            w, h = float(el.get("width", 0)), float(el.get("height", 0))
            if w > 600:            # le rectangle de fond de la planche
                continue
            shapes.append((el, (x, y, x + w, y + h)))
        elif tag == "path":
            try:
                bb = Path(el.get("d")).bbox()
            except Exception:
                bb = None
            if bb:
                shapes.append((el, bb))

    labels = []
    for tx in root.iter(Q + "text"):
        m = re.search(r"translate\(\s*([-\d.]+)[ ,]+([-\d.]+)", tx.get("transform", ""))
        if m:
            labels.append((float(m.group(1)), float(m.group(2)),
                           re.sub(r"\s+", " ", "".join(tx.itertext())).strip()))

    by_label = {}
    for el, (x0, y0, x1, y1) in shapes:
        inside = [t for (tx, ty, t) in labels if x0 - 2 <= tx <= x1 and y0 - 3 <= ty <= y1 + 3]
        if not inside:
            continue                       # flèche, filet : pas une zone cliquable
        by_label[norm(" ".join(inside))] = (el, " ".join(inside))

    found, missing = [], []
    for label, key, section in SIMPLE_BOXES:
        hit = by_label.pop(norm(label), None)
        if hit is None:
            missing.append(label)
            continue
        found.append((key, section, hit[0], hit[1]))
    if missing:
        fail("étiquette(s) introuvable(s) dans cadre-simple.svg :\n          %s\n"
             "        Le texte a probablement été reformulé : corrigez SIMPLE_BOXES."
             % "\n          ".join(missing))
    if by_label:
        sys.stderr.write("build_cadre.py — note : boîtes du cadre simplifié laissées "
                         "non cliquables (absentes de SIMPLE_BOXES) : %s\n"
                         % ", ".join(v[1] for v in by_label.values()))
    return found


def build(svg_path, finder, svg_id, prefix):
    if not os.path.exists(svg_path):
        fail("fichier manquant : %s" % svg_path)
    raw = fix_fonts(open(svg_path, encoding="utf-8").read())
    raw = isolate_classes(raw, prefix)
    root = ET.fromstring(raw)
    strip_title(root)
    boxes = finder(root)

    # Les identifiants aussi doivent rester distincts d'une planche à l'autre :
    # deux éléments portant le même id dans une page, c'est le premier qui gagne.
    halo = ET.SubElement(root, Q + "g"); halo.set("id", svg_id + "-halo"); halo.set("aria-hidden", "true")
    outline = ET.SubElement(root, Q + "g"); outline.set("id", svg_id + "-outline"); outline.set("aria-hidden", "true")
    hits = ET.SubElement(root, Q + "g"); hits.set("id", svg_id + "-hit")

    for key, section, el, label in boxes:
        # Les attributs de présentation ci-dessous doublent la feuille de style
        # de la page : sans eux, un SVG ouvert seul — ou une page dont le CSS
        # n'est pas encore appliqué — afficherait ces copies en noir plein, le
        # remplissage par défaut d'une forme SVG étant le noir.
        halo.append(clone(el, "cadre-halo", key,
                          {"fill": "none", "stroke": "#FFFFFF", "stroke-width": "4.5", "opacity": "0"}))
        outline.append(clone(el, "cadre-outline", key,
                             {"fill": "none", "stroke": "#000000", "stroke-width": "2", "opacity": "0"}))
        hit = clone(el, "cadre-hit", key,
                    {"fill": "#000000", "fill-opacity": "0", "stroke": "none",
                     "pointer-events": "all", "role": "button", "tabindex": "0"})
        ET.SubElement(hit, Q + "title").text = label or key
        hits.append(hit)

    root.set("id", svg_id)
    root.set("viewBox", VIEWBOX)
    root.set("role", "img")
    root.attrib.pop("data-name", None)
    root.attrib.pop("width", None)
    root.attrib.pop("height", None)

    body = ET.tostring(root, encoding="unicode").replace(' xmlns:ns0="%s"' % SVG_NS, "")
    return body, [(k, s) for k, s, _, _ in boxes]


def replace_block(page, name, body):
    start, end = "<!-- %s:START -->" % name, "<!-- %s:END -->" % name
    if start not in page or end not in page:
        fail("les repères %s / %s sont absents de cadre-frame.html." % (start, end))
    head, rest = page.split(start, 1)
    _, tail = rest.split(end, 1)
    return head + start + "\n" + body + "\n" + end + tail


def report(keys):
    if not os.path.exists(DATA):
        print("  (assets/data/cadre.data.js absent — fiches non vérifiées)")
        return
    js = open(DATA, encoding="utf-8").read()
    m = re.search(r"window\.CADRE_DATA\s*=\s*(\{.*?\});\s*$", js, re.S)
    if not m:
        print("  (cadre.data.js illisible — fiches non vérifiées)")
        return
    data = json.loads(m.group(1))
    empty = [k for k in keys if not (data.get(k) or {}).get("definition", "").strip()]
    missing = [k for k in keys if k not in data]
    unknown = [k for k in data if k not in keys]
    print("  %d concepts au total, %d fiches rédigées." % (len(keys), len(keys) - len(empty)))
    if empty:
        print("  Fiches encore vides (%d) : %s" % (len(empty), ", ".join(empty)))
    if missing:
        print("  ATTENTION — clés absentes de cadre.data.js : %s" % ", ".join(missing))
    if unknown:
        print("  Fiches de cadre.data.js rattachées à aucune boîte : %s" % ", ".join(unknown))


def main():
    full_body, full_keys = build(os.path.join(ROOT, "cadre.svg"), boxes_by_layer, "cadre-svg", "k-")
    simple_body, simple_keys = build(os.path.join(ROOT, "cadre-simple.svg"), boxes_by_label, "simple-svg", "s-")

    # Garde-fou : c'est exactement ce qui avait cassé l'affichage. Les deux
    # planches partagent la page, donc leurs styles et leurs identifiants.
    def names(body):
        return (set(re.findall(r"\.([\w-]*cls-[\w-]+)", body)),
                set(re.findall(r'\sid="([^"]+)"', body)))
    (ca, ia), (cb, ib) = names(full_body), names(simple_body)
    if ca & cb or ia & ib:
        fail("les deux dessins partagent des noms : classes %s, identifiants %s.\n"
             "        Ils s'écraseraient l'un l'autre dans la page."
             % (sorted(ca & cb) or "aucune", sorted(ia & ib) or "aucun"))

    # Une même clé peut être cliquable dans les deux dessins : la section et
    # l'ordre de lecture viennent du cadre complet, plus détaillé, et le cadre
    # simplifié ne fait qu'ajouter ce qu'il détaille en plus.
    cadre_map, order = {}, []
    for key, section in full_keys + simple_keys:
        if key not in cadre_map:
            cadre_map[key] = {"section": section}
            order.append(key)

    map_block = (
        "<script>\n"
        "/* Écrit par tools/build_cadre.py — ne pas modifier à la main.\n"
        "   Section de chaque concept (pour la recherche) et ordre de lecture. */\n"
        "window.CADRE_MAP = %s;\n"
        "window.CADRE_ORDER = %s;\n"
        "</script>"
    ) % (json.dumps(cadre_map, ensure_ascii=False, indent=2),
         json.dumps(order, ensure_ascii=False))

    page = open(PAGE, encoding="utf-8").read()
    page = replace_block(page, "CADRE:SVG", '<template id="tpl-cadre">%s</template>' % full_body)
    page = replace_block(page, "SIMPLE:SVG", '<template id="tpl-simple">%s</template>' % simple_body)
    page = replace_block(page, "CADRE:MAP", map_block)
    open(PAGE, "w", encoding="utf-8").write(page)

    print("cadre-frame.html mis à jour.")
    print("  Cadre conceptuel : %d zones cliquables." % len(full_keys))
    print("  Cadre simplifié  : %d zones cliquables." % len(simple_keys))
    report(order)


if __name__ == "__main__":
    main()
