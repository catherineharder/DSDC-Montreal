# -*- coding: utf-8 -*-
"""Génère assets/data/deputes.data.js — carte des 27 circonscriptions
provinciales de l'île de Montréal (carte électorale 2017, 43e législature).

Même contour d'île que les autres cartes du site : la projection est calibrée
en ajustant (moindre différence symétrique) l'union des circonscriptions au
contour canonique du site (ville-montreal.data.js), puis chaque circonscription
est découpée sur ce contour et les liserés côtiers sont résorbés.

Géométrie : Represent API (Open North), simple_shape, WGS84.
"""
import json, math, re, sys, unicodedata
from pathlib import Path
from shapely.geometry import shape, Polygon
from shapely.ops import unary_union
from shapely.validation import make_valid
from shapely import affinity
from scipy.optimize import minimize

# Sources brutes (Represent API) : 27 geojson simple_shape + reps.json.
# Pour rafraîchir après une élection : re-télécharger depuis
#   https://represent.opennorth.ca/representatives/quebec-assemblee-nationale/
#   https://represent.opennorth.ca/boundaries/quebec-electoral-districts-2017/<slug>/simple_shape
GEO = Path(__file__).parent / "deputes-geo"
W, H, PAD = 1000, 875, 2.0

# ---- helpers (repris de tools/build_tables_quartier.py) --------------------
def _poly_parts(g):
    if g.is_empty: return []
    t = g.geom_type
    if t == "Polygon": return [g]
    if t == "MultiPolygon": return list(g.geoms)
    if t == "GeometryCollection":
        out = []
        for x in g.geoms: out += _poly_parts(x)
        return out
    return []

def polyize(g): return unary_union(_poly_parts(make_valid(g)))

def load_site_outline(jsfile):
    s = open(jsfile, encoding="utf-8").read()
    polys = []
    for d in re.findall(r'"(M[0-9][^"]+)"', s):
        for sub in re.findall(r'M[^MZ]*Z?', d):
            pts = re.findall(r'(-?\d+\.?\d*)[ ,](-?\d+\.?\d*)', sub)
            if len(pts) >= 3:
                polys.append(make_valid(Polygon([(float(x), float(y)) for x, y in pts])).buffer(0))
    return unary_union(polys)

def ring_to_path(ring):
    out, prev = [], None
    for x, y in ring:
        p = (round(x, 1), round(y, 1))
        if p != prev: out.append(p); prev = p
    if len(out) < 2: return ""
    return "M" + " ".join("%g,%g" % (x, y) for x, y in out) + " Z"

def geom_to_path(g):
    parts = []
    for poly in _poly_parts(g):
        parts.append(ring_to_path(poly.exterior.coords))
        for hole in poly.interiors: parts.append(ring_to_path(hole.coords))
    return " ".join(p for p in parts if p)

def _absorb(shapes, ribbons):
    slugs = list(shapes)
    for piece in _poly_parts(ribbons):
        best, best_len = None, -1.0
        for s in slugs:
            b = shapes[s].boundary
            shared = b.intersection(piece).length if b is not None else 0.0
            if shared > best_len: best, best_len = s, shared
        if best is None or best_len <= 0:   # îlot isolé : rattacher au plus proche
            best = min(slugs, key=lambda s: shapes[s].distance(piece))
        d = shapes[best].distance(piece)
        merged = shapes[best].union(piece.buffer(d + 1.0) if d > 0 else piece)
        shapes[best] = polyize(merged)
    return shapes

# ---- 1. charger les 27 circonscriptions (WGS84) ----------------------------
SLUGS = [p.stem for p in sorted(GEO.glob("*.json"))
         if p.stem not in ("reps", "boundaries_list")]
geo = {}
for s in SLUGS:
    g = make_valid(shape(json.load(open(GEO / f"{s}.json"))))
    # jeter les slivers dégénérés (ex. saint-laurent)
    parts = [p for p in _poly_parts(g) if p.area > 1e-9]
    geo[s] = unary_union(parts)
print(len(geo), "circonscriptions chargées")

# ---- 2. projection initiale (équirectangulaire, cos lat0) ------------------
union = unary_union(list(geo.values()))
minlon, minlat, maxlon, maxlat = union.bounds
lat0 = 45.55
k = math.cos(math.radians(lat0))
x0 = minlon * k
cw, ch = (maxlon * k - x0), (maxlat - minlat)
aw, ah = W - 2 * PAD, H - 2 * PAD
scale = min(aw / cw, ah / ch)
ox, oy = PAD + (aw - scale * cw) / 2, PAD + (ah - scale * ch) / 2

def project_geom(g):
    def tr(x, y, z=None):
        return (ox + (x * k - x0) * scale, oy + (maxlat - y) * scale)
    return affinity.affine_transform(g, [k * scale, 0, 0, -scale,
                                         ox - x0 * scale, oy + maxlat * scale])

proj = {s: polyize(project_geom(g)) for s, g in geo.items()}
punion = unary_union(list(proj.values()))

# ---- 3. calibrer (sx, sy, tx, ty) sur le contour canonique du site ---------
site_js = sys.argv[1] if len(sys.argv) > 1 else "ville-montreal.data.js"
outline = load_site_outline(site_js)
print("outline bounds:", [round(v, 1) for v in outline.bounds])
print("proj union bounds:", [round(v, 1) for v in punion.bounds])

def fitted(params, g):
    sx, sy, tx, ty = params
    return affinity.affine_transform(g, [sx, 0, 0, sy, tx, ty])

pu = punion.simplify(0.5)
ou = outline.simplify(0.5)
def cost(params):
    try:
        f = fitted(params, pu)
        return f.symmetric_difference(ou).area
    except Exception:
        return 1e12

# départ : appariement des bboxes
pb, ob = punion.bounds, outline.bounds
sx0 = (ob[2] - ob[0]) / (pb[2] - pb[0]); sy0 = (ob[3] - ob[1]) / (pb[3] - pb[1])
x00 = [sx0, sy0, ob[0] - pb[0] * sx0, ob[1] - pb[1] * sy0]
print("départ bbox:", [round(v, 4) for v in x00], "coût:", round(cost(x00)))
res = minimize(cost, x00, method="Nelder-Mead",
               options={"xatol": 1e-4, "fatol": 1.0, "maxiter": 2000})
print("optimum:", [round(v, 4) for v in res.x], "coût:", round(res.fun))
iou = fitted(res.x, pu).intersection(ou).area / fitted(res.x, pu).union(ou).area
print("IoU après calibration: %.4f" % iou)

shapes = {s: polyize(fitted(res.x, g)) for s, g in proj.items()}

# ---- 4. découpe sur le contour + résorption des liserés --------------------
for s in shapes:
    shapes[s] = polyize(shapes[s].intersection(outline))
# tout l'écart restant est un artefact (les circonscriptions pavent toute l'île)
for _ in range(3):
    gap = outline.difference(unary_union(list(shapes.values())))
    gap = polyize(gap.buffer(0))
    if gap.is_empty or gap.area < 1.0: break
    print("gap résiduel: %.1f px²  (%d morceaux)" % (gap.area, len(_poly_parts(gap))))
    shapes = _absorb(shapes, gap)
    for s in shapes: shapes[s] = polyize(shapes[s].intersection(outline))
gap = outline.difference(unary_union(list(shapes.values())))
print("gap final: %.2f px²" % gap.area)

# ---- 5. députés -------------------------------------------------------------
def norm(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()
    return "".join(c for c in s if c.isalnum())

reps = json.load(open(GEO / "reps.json"))
by_dist = {norm(r["district_name"]): r for r in reps}

# nom d'affichage officiel (tirets cadratins) par slug
NAMES = {
 "acadie": "Acadie", "anjou-louis-riel": "Anjou–Louis-Riel",
 "bourassa-sauve": "Bourassa-Sauvé", "camille-laurin": "Camille-Laurin",
 "darcy-mcgee": "D'Arcy-McGee", "gouin": "Gouin",
 "hochelaga-maisonneuve": "Hochelaga-Maisonneuve", "jacques-cartier": "Jacques-Cartier",
 "jeanne-mance-viger": "Jeanne-Mance–Viger", "lafontaine": "LaFontaine",
 "laurier-dorion": "Laurier-Dorion", "marguerite-bourgeoys": "Marguerite-Bourgeoys",
 "marquette": "Marquette", "maurice-richard": "Maurice-Richard", "mercier": "Mercier",
 "mont-royal-outremont": "Mont-Royal–Outremont", "nelligan": "Nelligan",
 "notre-dame-de-grace": "Notre-Dame-de-Grâce", "pointe-aux-trembles": "Pointe-aux-Trembles",
 "robert-baldwin": "Robert-Baldwin", "rosemont": "Rosemont",
 "saint-henri-sainte-anne": "Saint-Henri–Sainte-Anne", "saint-laurent": "Saint-Laurent",
 "sainte-marie-saint-jacques": "Sainte-Marie–Saint-Jacques", "verdun": "Verdun",
 "viau": "Viau", "westmount-saint-louis": "Westmount–Saint-Louis",
}
PARTY_SHORT = {
 "Parti libéral du Québec": "PLQ", "Québec solidaire": "QS",
 "Coalition avenir Québec": "CAQ", "Parti québécois": "PQ", "Indépendant": "IND",
}
records = {}
for s in SLUGS:
    r = by_dist.get(norm(NAMES[s]))
    if not r:
        print("!! pas de député pour", s); continue
    records[s] = {
        "name": NAMES[s], "depute": r["name"], "party": r["party_name"],
        "partyShort": PARTY_SHORT.get(r["party_name"], r["party_name"]),
        "url": r.get("url", ""), "photo": r.get("photo_url", ""),
        "email": r.get("email", ""), "roles": r.get("roles", []),
    }

# ---- 6. écrire deputes.data.js ----------------------------------------------
paths = {s: geom_to_path(shapes[s]) for s in SLUGS}
out = []
out.append("/* Députés de l'île de Montréal — DONNÉES (générées par tools/build_deputes.py).\n"
           "   27 circonscriptions provinciales (carte électorale 2017, 43e législature).\n"
           "   Géométrie : Represent API (Open North) / Élections Québec, projetée et\n"
           "   découpée sur le contour canonique de l'île (même silhouette que les autres\n"
           "   cartes). Députés : Assemblée nationale du Québec via Represent API. */\n")
out.append("const DEPUTES_GEOMETRY = " +
           json.dumps(paths, ensure_ascii=False, indent=0) + ";\n")
out.append("const DEPUTES = " +
           json.dumps(records, ensure_ascii=False, indent=1) + ";\n")
out.append('const PARTY_COLORS = {\n'
           ' "PLQ": "#d31f2c",\n "QS": "#ff5605",\n "CAQ": "#00addc",\n'
           ' "PQ": "#1a3c8f",\n "IND": "#8a8f98",\n};\n')
open("deputes.data.js", "w", encoding="utf-8").write("\n".join(out))
print("écrit deputes.data.js —", len(paths), "tracés,", len(records), "députés")
