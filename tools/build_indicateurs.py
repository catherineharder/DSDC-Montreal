#!/usr/bin/env python3
"""Génère assets/data/indicateurs.data.js — indicateurs agrégés par table de quartier.

Indicateur 1 : indice de défavorisation matérielle et sociale (IDMS, INSPQ),
recensements 2011, 2016 et 2021.

Méthode
-------
1. Pour chaque année, lit la table de correspondance INSPQ (aire de diffusion ->
   quintiles régionaux QuintMatRSS / QuintSocRSS) et garde les AD de la région
   sociosanitaire de Montréal (RSS 06). Les AD scindées entre plusieurs CLSC
   sont dédupliquées (mêmes quintiles, même population).
2. Prend la géométrie des AD de la même année :
   - 2021 : GeoJSON de l'Indice d'équité des milieux de vie (Ville de Montréal);
   - 2016 / 2011 : fichiers des limites cartographiques de Statistique Canada
     (lda_000b16a_e.zip / gda_000b11a_e.zip), lus directement dans le zip.
3. Affecte chaque AD au territoire de table de quartier qui contient son point
   représentatif (tables_de_quartier_32_2024.geojson, WGS84). Les AD des
   secteurs sans table (villes liées non couvertes) sont exclues.
4. Agrège la population par quintile régional pour chaque territoire :
   - répartitions détaillées (5 quintiles) pour 2021;
   - série 2011-2016-2021 du % de population en quintiles 4-5 (tendance).

L'IDMS est une mesure relative : les quintiles sont recalculés à chaque
recensement, la tendance s'interprète donc comme l'évolution de la position
du territoire par rapport au reste de la région.

Usage : python3 tools/build_indicateurs.py
(chemins relatifs à la racine du dépôt github-pages)
"""

import io
import json
import re
import sys
import unicodedata
import zipfile
from pathlib import Path

import openpyxl
import shapefile  # pyshp
from pyproj import Transformer
from shapely.geometry import Point, shape
from shapely.prepared import prep

ROOT = Path(__file__).resolve().parent.parent          # github-pages/
DRSP = ROOT.parent                                     # dossier DRSP
IND = DRSP / "Indicators"
TDQ_GEOJSON = DRSP / "tables_de_quartier_32_2024.geojson"
OUT = ROOT / "assets" / "data" / "indicateurs.data.js"

INSPQ_XLSX = {
    2011: IND / "A-DonnéesIDMS_Qc2011_fr" / "1.a TableCorrespondances_Qc2011_NouveauDecoupage_fr.xlsx",
    2016: IND / "A-DonnéesIDMS_Qc2016_fr" / "1. TableCorrespondancesCompleteQuebec2016.xlsx",
    2021: IND / "A-DonnéesIDMS_Qc2021_fr" / "1. TableCorrespondancesCompleteQuebec2021_fr.xlsx",
}
POPCOL = {2011: "ADPOP2011", 2016: "ADPOP2016", 2021: "ADPOP2021"}

# Géométrie des AD par année.
AD_GEOJSON_2021 = [IND / "resultats_iemv_v2026_agglo.geojson",
                   IND / "resultats_iemv_v2026_agglo.json"]
AD_SHAPEZIP = {2016: IND / "lda_000b16a_e.zip", 2011: IND / "gda_000b11a_e.zip"}
STATCAN_EPSG = 3347  # Lambert conique conforme (fichiers des limites StatCan)


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()


def load_inspq(year):
    """AD (RSS 06) -> (pop, quintMatRSS, quintSocRSS). Dédupliqué."""
    path = INSPQ_XLSX[year]
    if not path.exists():
        return None
    wb = openpyxl.load_workbook(path, read_only=True)
    ws = wb["Données"]
    rows = ws.iter_rows(values_only=True)
    hdr = {h: i for i, h in enumerate(next(rows))}
    out = {}
    for r in rows:
        if str(r[hdr["RSS"]]) != "06":
            continue
        ad = str(r[hdr["AD"]])
        if ad in out:
            continue  # AD scindée entre CLSC : mêmes quintiles, même pop
        pop = r[hdr[POPCOL[year]]] or 0
        qm, qs = r[hdr["QuintMatRSS"]], r[hdr["QuintSocRSS"]]
        if qm is None or qs is None:
            continue
        out[ad] = (pop, int(qm), int(qs))
    return out


def ad_id_from_props(props):
    for k, v in props.items():
        kl = k.lower()
        if "adidu" in kl or "dauid" in kl or kl in ("ad", "geo_code"):
            return str(v).split(".")[0]
    return None


def points_2021():
    """ad -> Point WGS84, depuis le GeoJSON IEMV (EPSG variable, lu dans le fichier)."""
    path = next((p for p in AD_GEOJSON_2021 if p.exists()), None)
    if path is None:
        sys.exit("ERREUR : GeoJSON IEMV introuvable dans DRSP/Indicators/ "
                 "(resultats_iemv_v2026_agglo.geojson/.json).")
    gj = json.load(open(path, encoding="utf-8"))
    crs_name = ((gj.get("crs") or {}).get("properties") or {}).get("name", "")
    m = re.search(r"EPSG::?(\d+)", crs_name)
    epsg = int(m.group(1)) if m else 4326
    tr = (Transformer.from_crs(f"EPSG:{epsg}", "EPSG:4326", always_xy=True).transform
          if epsg != 4326 else None)
    pts = {}
    for f in gj["features"]:
        ad = ad_id_from_props(f["properties"])
        if ad is None or ad in pts:
            continue
        p = shape(f["geometry"]).representative_point()
        pts[ad] = Point(*tr(p.x, p.y)) if tr else p
    print(f"  géométrie 2021 : {path.name}, {len(pts)} AD")
    return pts


def points_statcan(year):
    """ad -> Point WGS84, depuis le fichier des limites StatCan (zip de shapefile,
    ou dossier du zip décompressé). Filtré sur l'île de Montréal (DAUID 2466…)."""
    zpath = AD_SHAPEZIP[year]
    folder = zpath.with_suffix("")  # zip décompressé dans un dossier du même nom
    if zpath.exists():
        z = zipfile.ZipFile(zpath)
        base = next(n[:-4] for n in z.namelist() if n.lower().endswith(".shp"))
        rdr = shapefile.Reader(
            shp=io.BytesIO(z.read(base + ".shp")),
            dbf=io.BytesIO(z.read(base + ".dbf")),
            shx=io.BytesIO(z.read(base + ".shx")), encoding="latin-1")
    elif folder.is_dir():
        shp = next(folder.glob("*.shp"), None)
        if shp is None:
            return None
        zpath = shp
        rdr = shapefile.Reader(str(shp), encoding="latin-1")
    else:
        return None
    fields = [f[0] for f in rdr.fields[1:]]
    i_dauid = next(i for i, f in enumerate(fields) if f.upper() == "DAUID")
    # 2016 : Lambert conique conforme (EPSG:3347) ; 2011 : déjà en degrés NAD83.
    # On détecte par l'ordre de grandeur des coordonnées (mètres vs degrés).
    proj = abs(rdr.bbox[0]) > 360 or abs(rdr.bbox[1]) > 360
    tr = (Transformer.from_crs(f"EPSG:{STATCAN_EPSG}", "EPSG:4326", always_xy=True).transform
          if proj else None)
    pts = {}
    for sr in rdr.iterShapeRecords():
        dauid = str(sr.record[i_dauid])
        if not dauid.startswith("2466") or dauid in pts:
            continue
        p = shape(sr.shape.__geo_interface__).representative_point()
        pts[dauid] = Point(*tr(p.x, p.y)) if tr else p
    print(f"  géométrie {year} : {zpath.name}, {len(pts)} AD (île de Montréal)")
    return pts


def assign(inspq, pts, tables):
    """Agrège la population par quintile et par table de quartier."""
    agg = {slug: {"pop": 0, "nad": 0, "mat": [0.0] * 5, "soc": [0.0] * 5}
           for slug, _, _ in tables}
    matched = no_table = no_geom = 0
    pop_matched = pop_no_table = 0
    for ad, (pop, qm, qs) in inspq.items():
        pt = pts.get(ad)
        if pt is None:
            no_geom += 1
            continue
        hit = None
        for slug, _, pg in tables:
            if pg.contains(pt):
                hit = slug
                break
        if hit is None:
            no_table += 1
            pop_no_table += pop
            continue
        a = agg[hit]
        a["pop"] += pop
        a["nad"] += 1
        a["mat"][qm - 1] += pop
        a["soc"][qs - 1] += pop
        matched += 1
        pop_matched += pop
    print(f"  appariées : {matched} (pop {pop_matched:,}) | hors territoire de table : "
          f"{no_table} (pop {pop_no_table:,}) | sans géométrie : {no_geom}")
    return agg


def q45(a, dim):
    return None if a["pop"] == 0 else round(100 * (a[dim][3] + a[dim][4]) / a["pop"], 1)


def main():
    tdq = json.load(open(TDQ_GEOJSON, encoding="utf-8"))
    tables = [(slugify(f["properties"]["nom"]), f["properties"]["nom"],
               prep(shape(f["geometry"]))) for f in tdq["features"]]
    print(f"Tables de quartier : {len(tables)}")

    results = {}   # year -> agg
    for year in (2011, 2016, 2021):
        inspq = load_inspq(year)
        if inspq is None:
            print(f"{year} : table INSPQ absente — année sautée")
            continue
        print(f"{year} : {len(inspq)} AD INSPQ (RSS 06), "
              f"pop {sum(p for p, _, _ in inspq.values()):,}")
        pts = points_2021() if year == 2021 else points_statcan(year)
        if pts is None:
            print(f"{year} : géométrie absente ({AD_SHAPEZIP.get(year)}) — année sautée")
            continue
        results[year] = assign(inspq, pts, tables)

    if 2021 not in results:
        sys.exit("ERREUR : l'année 2021 est requise.")

    years = sorted(results)
    quartiers = {}
    for slug, _, _ in sorted(tables):
        a21 = results[2021][slug]
        if a21["pop"] == 0:
            print(f"WARN : aucune AD 2021 pour {slug}")
            continue
        rec = {
            "pop": a21["pop"],
            "nad": a21["nad"],
            "mat": [round(100 * x / a21["pop"], 1) for x in a21["mat"]],
            "soc": [round(100 * x / a21["pop"], 1) for x in a21["soc"]],
        }
        if len(years) > 1:
            rec["trend"] = {
                "years": years,
                "mat": [q45(results[y][slug], "mat") for y in years],
                "soc": [q45(results[y][slug], "soc") for y in years],
            }
        quartiers[slug] = rec

    # contrôle : la part régionale en Q4-Q5 doit avoisiner 40 % chaque année
    for y in years:
        tp = sum(a["pop"] for a in results[y].values())
        tm = sum(a["mat"][3] + a["mat"][4] for a in results[y].values())
        ts = sum(a["soc"][3] + a["soc"][4] for a in results[y].values())
        print(f"contrôle {y} : pop couverte {tp:,} | Q4-Q5 mat {100*tm/tp:.1f} % | "
              f"soc {100*ts/tp:.1f} % (attendu ≈ 40 %)")

    meta = {
        "source": "INSPQ, Indice de défavorisation matérielle et sociale (2011, 2016, 2021) ; "
                  "Statistique Canada, recensements",
        "reference": "Quintiles régionaux (RSS 06 — Montréal) : QuintMatRSS / QuintSocRSS",
        "methode": "Population des aires de diffusion affectée au territoire de table de quartier "
                   "contenant leur point représentatif (géométrie : IEMV Ville de Montréal pour 2021, "
                   "limites cartographiques StatCan pour 2011 et 2016)",
        "annees": years,
    }
    js = ("/* Indicateurs — DONNÉES (généré par tools/build_indicateurs.py, ne pas éditer).\n"
          "   INDIC_DEFAVO : IDMS agrégé par territoire de table de quartier.\n"
          "   mat/soc = % de la population par quintile régional 2021 (Q1 favorisé … Q5 défavorisé) ;\n"
          "   trend = % de la population en quintiles 4-5 par recensement. */\n"
          "const INDIC_DEFAVO = " +
          json.dumps({"meta": meta, "quartiers": quartiers}, ensure_ascii=False, separators=(",", ":")) +
          ";\n")
    OUT.write_text(js, encoding="utf-8")
    print(f"Écrit : {OUT} ({len(quartiers)} territoires, années {years})")


if __name__ == "__main__":
    main()
