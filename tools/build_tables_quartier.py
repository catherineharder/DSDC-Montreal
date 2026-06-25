# -*- coding: utf-8 -*-
"""Génère assets/data/tables-quartier.data.js (carte des 32 tables de quartier).

Objectif : la carte « Tables de quartier » doit avoir EXACTEMENT le même contour
d'île que « Santé Québec » et « Ville de Montréal » (mêmes pixels) — seule la
couleur/le découpage change. On réutilise donc le contour canonique déjà présent
dans le site (identique entre Ville et Santé) comme :
  (1) frontière de découpe des tables, et
  (2) silhouette dessinée (TDQ_SILHOUETTE).

Les 32 territoires (WGS84) sont projetés dans le viewBox 1000x875 avec la même
projection que le site — équirectangulaire à correction cosinus de latitude
(lat0 ≈ 45.55), ajustée en préservant le ratio, centrée, marge 2 px — puis
découpés et étendus pour combler le liseré côtier (un seul trait de côte).

Entrées :
  - --silhouette  montreal-silhouette.geojson  (sert à calibrer la projection)
  - --tables      tables_de_quartier_32_2024.geojson  (32 territoires, WGS84)
  - --site-outline ville-montreal.data.js  (contour canonique du site, espace SVG)

Dépendance : shapely.
"""
import json, re, argparse, unicodedata, math
from shapely.geometry import shape, Polygon
from shapely.ops import unary_union
from shapely.validation import make_valid

W, H, PAD = 1000, 875, 2.0


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()


def _poly_parts(geom):
    if geom.is_empty:
        return []
    t = geom.geom_type
    if t == "Polygon":
        return [geom]
    if t == "MultiPolygon":
        return list(geom.geoms)
    if t == "GeometryCollection":
        out = []
        for g in geom.geoms:
            out += _poly_parts(g)
        return out
    return []


def polyize(g):
    return unary_union(_poly_parts(make_valid(g)))


# ---- projection géo -> SVG (équirectangulaire, correction cos(lat0), fit ratio) ----
def make_projector(bounds, lat0):
    minlon, minlat, maxlon, maxlat = bounds
    k = math.cos(math.radians(lat0))
    x0, x1 = minlon * k, maxlon * k
    cw, ch = (x1 - x0), (maxlat - minlat)
    aw, ah = W - 2 * PAD, H - 2 * PAD
    scale = min(aw / cw, ah / ch)
    ox = PAD + (aw - scale * cw) / 2
    oy = PAD + (ah - scale * ch) / 2

    def project(lon, lat):
        return (ox + (lon * k - x0) * scale, oy + (maxlat - lat) * scale)
    return project


def project_geom(geom, project):
    out = []
    for p in _poly_parts(geom):
        ext = [project(x, y) for x, y in p.exterior.coords]
        ints = [[project(x, y) for x, y in r.coords] for r in p.interiors]
        out.append(make_valid(Polygon(ext, ints)).buffer(0))
    return unary_union(out)


# ---- contour canonique du site (déjà en espace SVG) ----
def load_site_outline(jsfile):
    s = open(jsfile, encoding="utf-8").read()
    polys = []
    for d in re.findall(r'"(M[0-9][^"]+)"', s):
        for sub in re.findall(r'M[^MZ]*Z?', d):
            pts = re.findall(r'(-?\d+\.?\d*)[ ,](-?\d+\.?\d*)', sub)
            if len(pts) >= 3:
                polys.append(make_valid(Polygon([(float(x), float(y)) for x, y in pts])).buffer(0))
    return unary_union(polys)


# ---- paths SVG ----
def ring_to_path(ring):
    out, prev = [], None
    for x, y in ring:
        p = (round(x, 1), round(y, 1))
        if p != prev:
            out.append(p); prev = p
    if len(out) < 2:
        return ""
    return "M" + " ".join("%g,%g" % (x, y) for x, y in out) + " Z"


def geom_to_path(geom):
    parts = []
    for poly in _poly_parts(geom):
        parts.append(ring_to_path(poly.exterior.coords))
        for hole in poly.interiors:
            parts.append(ring_to_path(hole.coords))
    return " ".join(p for p in parts if p)


def _lines(geom):
    if geom.is_empty:
        return []
    t = geom.geom_type
    if t == "LineString":
        return [geom]
    if t in ("MultiLineString", "GeometryCollection"):
        out = []
        for g in geom.geoms:
            out += _lines(g)
        return out
    return []


def lines_to_path(geom):
    """Trace ouvert (pas de Z) pour des LineString — utilisé pour les coutures
    internes entre tables (la côte est dessinée séparément par la silhouette)."""
    parts = []
    for ln in _lines(geom):
        out, prev = [], None
        for x, y in ln.coords:
            p = (round(x, 1), round(y, 1))
            if p != prev:
                out.append(p); prev = p
        if len(out) >= 2:
            parts.append("M" + " ".join("%g,%g" % (x, y) for x, y in out))
    return " ".join(parts)


def snap_slivers(tables, outline, halfwidth=8.0):
    """Absorbe dans la table voisine les parcelles vides FINES (liseré côtier +
    craquelures de précision, largeur < 2*halfwidth) pour que chaque table atteigne
    la côte lissée -> trait de côte unique. Les parcelles LARGES (vraies zones sans
    table : port, canal, grands parcs, Île-des-Sœurs) sont conservées. Les divisions
    internes du geojson ne sont pas modifiées."""
    gap = outline.difference(unary_union(list(tables.values())))
    thin = [p for p in _poly_parts(gap) if p.buffer(-halfwidth).is_empty]
    if thin:
        tables = _absorb(tables, unary_union(thin))
    for s in list(tables):
        tables[s] = polyize(tables[s].intersection(outline))
    return tables


def absorb_specks(tables, outline, min_area=150.0, max_dist=4.0):
    """Micro-parcelles côtières résiduelles : pincements de la côte et jonctions en T
    (coin d'une table ≠ nœud de la silhouette à ~1-2 px près). On rattache à la table
    ADJACENTE (distance < max_dist) celles de faible aire, avec un pont, pour supprimer
    le point vert résiduel. Les vrais îlots (petits mais ENTOURÉS d'eau, loin de toute
    table) sont conservés en « sans table ». Pur nettoyage cosmétique."""
    slugs = list(tables)
    gap = outline.difference(unary_union(list(tables.values())))
    for piece in _poly_parts(gap):
        if piece.area >= min_area:
            continue
        best = min(slugs, key=lambda s: tables[s].distance(piece))
        d = tables[best].distance(piece)
        if d > max_dist:        # îlot isolé dans l'eau -> garder en « sans table »
            continue
        merged = tables[best].union(piece.buffer(d + 1.5)).intersection(outline)
        tables[best] = polyize(merged)
    return tables


def _absorb(tables, ribbons):
    """Rattache chaque parcelle de `ribbons` à la table voisine (frontière partagée la
    plus longue). Toutes les tables ayant la même couleur, l'attribution exacte d'un
    liseré côtier est sans effet visuel ; seul compte le fait qu'il n'y ait plus de
    bande « sans table » ni de bordure parallèle le long de la côte."""
    slugs = list(tables)
    for piece in _poly_parts(ribbons):
        best, best_len = None, -1.0
        for s in slugs:
            b = tables[s].boundary
            shared = b.intersection(piece).length if b is not None else 0.0
            if shared > best_len:
                best, best_len = s, shared
        if best is not None and best_len > 0:
            tables[best] = polyize(tables[best].union(piece))
    return tables


# ---- résorber le liseré côtier (artefact : la côte des tables, d'une autre source,
#      est en retrait de la côte lissée du contour) tout en conservant les VRAIES
#      zones sans table (port, parcs, Île-des-Sœurs…). Méthode : ouverture
#      morphologique — les parts FINES (rubans) sont absorbées, les parts LARGES
#      (vraies zones) sont gardées. `protect` est toujours gardé en « sans table ». --
def resolve_gaps(tables, outline, protect=None, delta=11.0):
    gap = outline.difference(unary_union(list(tables.values())))
    core = polyize(gap.buffer(-delta).buffer(delta))   # ne garde que les parts larges
    if protect is not None and not protect.is_empty:
        core = polyize(core.union(protect.intersection(gap)))
    ribbons = polyize(gap.difference(core))            # rubans fins (artefact)
    tables = _absorb(tables, ribbons)
    for s in list(tables):
        tables[s] = polyize(tables[s].intersection(outline))
    return tables


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--silhouette", required=True)
    ap.add_argument("--tables", required=True)
    ap.add_argument("--site-outline", required=True,
                    help="fichier .data.js du site dont on réutilise le contour canonique")
    ap.add_argument("--out", required=True)
    ap.add_argument("--name-field", default="nom")
    ap.add_argument("--lat0", type=float, default=45.55)
    ap.add_argument("--delta", type=float, default=11.0,
                    help="demi-largeur max (px) des rubans côtiers résorbés")
    ap.add_argument("--sliver", type=float, default=8.0,
                    help="demi-largeur max (px) des liserés côtiers résorbés")
    # Île-des-Sœurs : à exclure des tables (zone sans table de quartier)
    ap.add_argument("--nuns-lon", type=float, default=-73.549)
    ap.add_argument("--nuns-lat", type=float, default=45.4575)
    ap.add_argument("--no-nuns", action="store_true",
                    help="ne pas exclure Île-des-Sœurs des tables")
    a = ap.parse_args()

    silh = json.load(open(a.silhouette, encoding="utf-8"))
    tq = json.load(open(a.tables, encoding="utf-8"))

    sil_geom = unary_union([make_valid(shape(f["geometry"])) for f in silh["features"]])
    project = make_projector(sil_geom.bounds, a.lat0)

    # contour canonique (identique à Ville / Santé) : découpe + silhouette dessinée
    outline = load_site_outline(a.site_outline)
    sil_path = geom_to_path(outline)

    geoms, records = {}, {}
    for f in tq["features"]:
        nom = f["properties"][a.name_field]
        slug = slugify(nom)
        while slug in geoms:
            slug += "-2"
        g = project_geom(make_valid(shape(f["geometry"])), project)
        g = polyize(g.intersection(outline))
        if g.is_empty:
            print("WARN: vide après découpe:", nom); continue
        geoms[slug] = g
        records[slug] = {"name": nom}

    # Île-des-Sœurs : sous-polygone insulaire du contour -> exclu des tables (sans table)
    nuns = None
    if not a.no_nuns:
        from shapely.geometry import Point
        pt = Point(project(a.nuns_lon, a.nuns_lat))
        cands = [p for p in _poly_parts(outline) if p.contains(pt) and p.area < 50000]
        if cands:
            nuns = min(cands, key=lambda p: p.area)
            for s in list(geoms):
                geoms[s] = polyize(geoms[s].difference(nuns))
            print("  Île-des-Sœurs exclue des tables (aire %.0f px²)" % nuns.area)
        else:
            print("  WARN: Île-des-Sœurs introuvable au point fourni")

    # résorber le liseré côtier (artefact) : chaque table atteint la côte -> trait unique.
    # Divisions internes du geojson inchangées ; vraies zones sans table conservées.
    geoms = snap_slivers(geoms, outline, halfwidth=a.sliver)

    # zone « sans table » = île moins toutes les tables (vraies zones sans concertation)
    notable = polyize(outline.difference(unary_union(list(geoms.values()))))
    notable_path = geom_to_path(notable)
    cov = 100 * unary_union(list(geoms.values())).area / outline.area
    print("  couverture par les tables : %.2f%%  (reste sans table : %.2f%%)" % (cov, 100 - cov))

    tables = {slug: geom_to_path(g) for slug, g in geoms.items()}
    order = sorted(tables, key=lambda s: records[s]["name"].lower())
    geom = {"silhouette": sil_path, "notable": notable_path,
            "tables": {s: tables[s] for s in order}}
    tdq = {s: records[s] for s in order}

    header = (
        "/* Tables de quartier de Montréal (2024) — DONNÉES de la carte.\n"
        "   32 territoires des tables de quartier, découpés sur le contour de l'île.\n"
        "   Le contour (TDQ_SILHOUETTE) est IDENTIQUE à celui des cartes Ville de Montréal\n"
        "   et Santé Québec (mêmes pixels) : seule la couleur/le découpage change.\n"
        "   Source des territoires : ArcGIS « Tables_de_Quartier_32_MTL_2024 »\n"
        "   (services5.arcgis.com/pBN1lh7yaF4K7Tod), carte « Tables de quartier de Montréal, 2024 ».\n"
        "   Régénérer avec tools/build_tables_quartier.py. */\n\n")
    out = header
    out += "const TDQ_VIEWBOX = { w: 1000, h: 875 };\n\n"
    out += "// contour de l'île — identique aux autres cartes (trait de côte unique)\n"
    out += "const TDQ_SILHOUETTE = " + json.dumps(sil_path, ensure_ascii=False) + ";\n\n"
    out += "// zone « sans table de quartier » (faible opacité) — île moins les 32 tables\n"
    out += "const TDQ_NOTABLE = " + json.dumps(notable_path, ensure_ascii=False) + ";\n\n"
    out += "// slug -> path SVG (un <path d> par table de quartier, vraies divisions du geojson)\n"
    out += "const TDQ_GEOMETRY = " + json.dumps(geom, ensure_ascii=False) + ";\n\n"
    out += "// slug -> { name }\n"
    out += "const TDQ_TABLES = " + json.dumps(tdq, ensure_ascii=False) + ";\n"

    open(a.out, "w", encoding="utf-8").write(out)
    print("écrit:", a.out, "—", len(tables), "tables ; lat0 =", a.lat0)


if __name__ == "__main__":
    main()
