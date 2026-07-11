#!/usr/bin/env python3
"""Génère assets/data/indicateurs.data.js — indicateurs agrégés par table de quartier.

Indicateur 1 : indice de défavorisation matérielle et sociale (IDMS, INSPQ 2021).

Méthode
-------
1. Lit la table de correspondance INSPQ 2021 (aire de diffusion -> quintiles) et
   garde les AD de la région sociosanitaire de Montréal (RSS 06). Les AD scindées
   entre plusieurs CLSC sont dédupliquées (mêmes quintiles, même population).
2. Prend la géométrie des AD dans le GeoJSON de l'Indice d'équité des milieux de
   vie (Ville de Montréal, agglomération) — le seul fichier ouvert qui fournit
   les polygones d'AD 2021 pour toute l'île.
3. Affecte chaque AD au territoire de table de quartier qui contient son point
   représentatif (tables_de_quartier_32_2024.geojson, WGS84). Les AD situées
   dans les secteurs sans table (p. ex. villes liées non couvertes) sont exclues.
4. Agrège la population par quintile régional (QuintMatRSS / QuintSocRSS) pour
   chaque territoire et écrit les répartitions en pourcentages.

Usage : python3 tools/build_indicateurs.py
(chemins relatifs à la racine du dépôt github-pages)
"""

import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

import openpyxl
from pyproj import Transformer
from shapely.geometry import Point, shape
from shapely.prepared import prep

ROOT = Path(__file__).resolve().parent.parent          # github-pages/
DRSP = ROOT.parent                                     # dossier DRSP
INSPQ_XLSX = DRSP / "Indicators" / "Québec2021" / "A-DonnéesIDMS_Qc2021_fr" / \
    "1. TableCorrespondancesCompleteQuebec2021_fr.xlsx"
TDQ_GEOJSON = DRSP / "tables_de_quartier_32_2024.geojson"
OUT = ROOT / "assets" / "data" / "indicateurs.data.js"

# Géométrie des AD : GeoJSON de l'IEMV (agglomération). Premier fichier trouvé.
AD_GEOJSON_CANDIDATES = [
    DRSP / "Indicators" / "resultats_iemv_v2026_agglo.geojson",
    DRSP / "Indicators" / "resultats_iemv_v2026_agglo.json",
    DRSP / "Indicators" / "resultats_iemv_v2026-_vm.geojson",
]


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()


def find_ad_geojson():
    for p in AD_GEOJSON_CANDIDATES:
        if p.exists():
            return p
    # sinon, tout .geojson dans Indicators/ contenant des AD
    for p in sorted((DRSP / "Indicators").glob("*.geojson")):
        return p
    sys.exit("ERREUR : aucun GeoJSON d'aires de diffusion trouvé dans DRSP/Indicators/. "
             "Télécharger le GeoJSON IEMV (agglomération) de donnees.montreal.ca.")


def load_inspq():
    """AD (RSS 06) -> (pop, quintMatRSS, quintSocRSS). Dédupliqué."""
    wb = openpyxl.load_workbook(INSPQ_XLSX, read_only=True)
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
        pop = r[hdr["ADPOP2021"]] or 0
        qm, qs = r[hdr["QuintMatRSS"]], r[hdr["QuintSocRSS"]]
        if qm is None or qs is None:
            continue
        out[ad] = (pop, int(qm), int(qs))
    return out


def ad_id_from_props(props):
    """Trouve l'identifiant d'AD dans les propriétés du GeoJSON, quel que soit son nom."""
    for k, v in props.items():
        kl = k.lower()
        if kl in ("adidu", "dauid", "ad", "id_adidu", "ad_uid", "geo_code") or "adidu" in kl or "dauid" in kl:
            return str(v).split(".")[0]
    return None


def main():
    inspq = load_inspq()
    print(f"INSPQ : {len(inspq)} AD (RSS 06), pop {sum(p for p, _, _ in inspq.values()):,}")

    ad_path = find_ad_geojson()
    gj = json.load(open(ad_path, encoding="utf-8"))
    print(f"Géométrie AD : {ad_path.name}, {len(gj['features'])} entités")

    # CRS du fichier d'AD -> WGS84 (les territoires de table sont en WGS84).
    crs_name = ((gj.get("crs") or {}).get("properties") or {}).get("name", "")
    m = re.search(r"EPSG::?(\d+)", crs_name)
    epsg = int(m.group(1)) if m else 4326
    to_wgs84 = (Transformer.from_crs(f"EPSG:{epsg}", "EPSG:4326", always_xy=True).transform
                if epsg != 4326 else None)
    if to_wgs84:
        print(f"Reprojection des points EPSG:{epsg} -> WGS84")

    # clés d'AD disponibles dans le fichier
    sample = gj["features"][0]["properties"]
    if ad_id_from_props(sample) is None:
        sys.exit(f"ERREUR : identifiant d'AD introuvable dans les propriétés {list(sample)[:15]}")

    # territoires des tables de quartier (WGS84)
    tdq = json.load(open(TDQ_GEOJSON, encoding="utf-8"))
    tables = []
    for f in tdq["features"]:
        nom = f["properties"]["nom"]
        slug = slugify(nom)
        g = shape(f["geometry"])
        tables.append((slug, nom, prep(g), g))
    print(f"Tables de quartier : {len(tables)}")

    # affectation AD -> table par point représentatif
    agg = {slug: {"pop": 0, "nad": 0,
                  "mat": [0.0] * 5, "soc": [0.0] * 5} for slug, _, _, _ in tables}
    seen, matched, no_table, missing_inspq = set(), 0, 0, 0
    pop_matched = pop_no_table = 0
    for f in gj["features"]:
        ad = ad_id_from_props(f["properties"])
        if ad is None or ad in seen:
            continue
        seen.add(ad)
        if ad not in inspq:
            missing_inspq += 1
            continue
        pop, qm, qs = inspq[ad]
        pt = shape(f["geometry"]).representative_point()
        if to_wgs84:
            pt = Point(*to_wgs84(pt.x, pt.y))
        hit = None
        for slug, _, pg, _ in tables:
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

    print(f"AD géométrie : {len(seen)} | appariées à une table : {matched} "
          f"(pop {pop_matched:,}) | hors territoire de table : {no_table} "
          f"(pop {pop_no_table:,}) | sans donnée INSPQ : {missing_inspq}")
    inspq_only = set(inspq) - seen
    print(f"AD INSPQ sans géométrie : {len(inspq_only)} "
          f"(pop {sum(inspq[a][0] for a in inspq_only):,})")

    quartiers = {}
    for slug, a in sorted(agg.items()):
        if a["pop"] == 0:
            print(f"WARN : aucune AD pour {slug}")
            continue
        quartiers[slug] = {
            "pop": a["pop"],
            "nad": a["nad"],
            "mat": [round(100 * x / a["pop"], 1) for x in a["mat"]],
            "soc": [round(100 * x / a["pop"], 1) for x in a["soc"]],
        }

    meta = {
        "source": "INSPQ, Indice de défavorisation matérielle et sociale 2021 ; "
                  "Statistique Canada, Recensement 2021",
        "reference": "Quintiles régionaux (RSS 06 — Montréal) : QuintMatRSS / QuintSocRSS",
        "methode": "Population des aires de diffusion affectée au territoire de table de quartier "
                   "contenant leur point représentatif (géométrie : IEMV, Ville de Montréal)",
        "annee": 2021,
    }
    js = ("/* Indicateurs — DONNÉES (généré par tools/build_indicateurs.py, ne pas éditer).\n"
          "   INDIC_DEFAVO : IDMS 2021 agrégé par territoire de table de quartier.\n"
          "   mat/soc = % de la population par quintile régional (Q1 favorisé … Q5 défavorisé). */\n"
          "const INDIC_DEFAVO = " +
          json.dumps({"meta": meta, "quartiers": quartiers}, ensure_ascii=False, separators=(",", ":")) +
          ";\n")
    OUT.write_text(js, encoding="utf-8")
    print(f"Écrit : {OUT} ({len(quartiers)} territoires)")


if __name__ == "__main__":
    main()
