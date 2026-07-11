#!/usr/bin/env python3
"""Extrait du Profil du recensement 2021 (StatCan, 98-401-X2021006, AD du Québec)
les caractéristiques utiles au tableau de bord, pour l'île de Montréal (AD 2466…).

Gère les éditions anglaise et française (dont l'édition « CI » avec intervalles
de confiance ; encodage latin-1 côté français). Écrit un petit cache CSV
(Indicators/census2021_mtl.csv) pour que build_indicateurs.py n'ait jamais à
relire le fichier de 6 Go.

Le zip complet doit être dans DRSP/Indicators/ (nom contenant 98-401 et .zip).
Lancement (long, ~3-6 min) : python3 tools/extract_census2021.py
"""

import csv
import io
import re
import sys
import unicodedata
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IND = ROOT.parent / "Indicators"
OUT = IND / "census2021_mtl.csv"

# fragments de noms de caractéristiques à conserver (comparaison sans accents,
# en minuscules) — versions françaises et anglaises
KEEP = [
    "panier de consommation", "market basket measure",
    "frais de logement", "shelter cost", "shelter-cost",
    "population, 2021",
    "faible revenu", "low-income", "low income",
]


def fold(s):
    """minuscules + sans accents (robuste aux problèmes d'encodage)"""
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


def find_col(hdr, *patterns):
    """indice de la première colonne dont le nom (sans accents) contient un motif"""
    folded = [re.sub(r"[^a-z0-9_+, ]", "", fold(h)) for h in hdr]
    for pat in patterns:
        for i, h in enumerate(folded):
            if pat in h:
                return i
    return None


def main():
    zpath = next(iter(sorted(IND.glob("*98-401*.zip"))), None)
    if zpath is None:
        sys.exit("ERREUR : zip du Profil du recensement (98-401…) introuvable dans DRSP/Indicators/.")
    z = zipfile.ZipFile(zpath)
    names = sorted((n for n in z.namelist() if n.lower().endswith(".csv") and "data" in n.lower()),
                   key=lambda n: z.getinfo(n).file_size, reverse=True)
    if not names:
        sys.exit("ERREUR : csv de données introuvable dans le zip.")
    src = names[0]
    encoding = "latin-1" if re.search(r"fran|_fra", src, re.I) else "utf-8-sig"
    print(f"Lecture de {src} ({z.getinfo(src).file_size/1e9:.2f} Go décompressé, {encoding})…",
          flush=True)

    kept = scanned = 0
    with z.open(src) as fh, open(OUT, "w", newline="", encoding="utf-8") as out:
        txt = io.TextIOWrapper(fh, encoding=encoding, errors="replace")
        rdr = csv.reader(txt)
        hdr = next(rdr)
        col_geo = find_col(hdr, "code_geo_alt", "alt_geo_code")
        col_cid = find_col(hdr, "id_caracteristique", "characteristic_id")
        col_cnm = find_col(hdr, "nom_caracteristique", "characteristic_name")
        col_c1 = find_col(hdr, "c1_chiffre_total", "c1_count_total")
        col_r = find_col(hdr, "c10_taux_total", "c10_rate_total")
        if None in (col_geo, col_cid, col_cnm, col_c1):
            sys.exit(f"ERREUR : colonnes introuvables dans l'en-tête : {hdr[:12]}")
        w = csv.writer(out)
        w.writerow(["DAUID", "CID", "NAME", "C1", "RATE"])
        for row in rdr:
            scanned += 1
            geo = row[col_geo]
            if len(geo) != 8 or not geo.startswith("2466"):
                continue
            name = row[col_cnm].strip()
            if not any(k in fold(name) for k in KEEP):
                continue
            w.writerow([geo, row[col_cid], name, row[col_c1],
                        row[col_r] if col_r is not None else ""])
            kept += 1
            if kept % 50000 == 0:
                print(f"  … {kept} lignes retenues ({scanned:,} lues)", flush=True)
    print(f"Terminé : {kept} lignes retenues sur {scanned:,} lues -> {OUT}")


if __name__ == "__main__":
    main()
