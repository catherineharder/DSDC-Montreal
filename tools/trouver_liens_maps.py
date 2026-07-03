#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Résout le lien Google Maps exact de chaque organisme de la feuille
« Tables_de_quartier » (onglet Membres) via l'API Places (New).

Usage :
    python3 trouver_liens_maps.py VOTRE_CLE_API

- Lit la feuille publiée (export CSV public, aucune clé requise pour ça).
- Une requête par organisme UNIQUE (les doublons sont résolus une seule fois).
- Écrit liens-membres.csv à côté du script : ligne, organisme, statut, lien.
  statut = "exact"  -> lien de profil Google Maps (googleMapsUri)
  statut = "doute"  -> correspondance faible : lien de recherche conservé
- Réexécutable : ne coûte que ~1 500 requêtes (niveau gratuit largement suffisant).

Bibliothèque standard uniquement (aucune installation nécessaire).
"""
import csv
import io
import json
import sys
import time
import unicodedata
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path

SHEET_ID = "11P0JPIxhEmf3EFvXxVx2z_NYmQ-oNo7u"
GVIZ = (f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq"
        f"?tqx=out:csv&sheet=Membres")
API = "https://places.googleapis.com/v1/places:searchText"
# Biais géographique : île de Montréal (centre + rayon 25 km)
BIAS = {"circle": {"center": {"latitude": 45.55, "longitude": -73.65},
                   "radius": 25000.0}}
SEUIL = 0.62  # similarité de nom minimale pour déclarer « exact »


def norm(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return " ".join(s.lower().replace("’", "'").split())


def similar(a, b):
    a, b = norm(a), norm(b)
    if not a or not b:
        return 0.0
    if a in b or b in a:
        return 1.0
    return SequenceMatcher(None, a, b).ratio()


def search_place(name, key):
    body = json.dumps({
        "textQuery": f"{name}, Montréal, QC, Canada",
        "locationBias": BIAS,
        "languageCode": "fr",
        "maxResultCount": 3,
    }).encode("utf-8")
    req = urllib.request.Request(API, data=body, method="POST", headers={
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.googleMapsUri",
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8")).get("places", [])


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage : python3 trouver_liens_maps.py VOTRE_CLE_API")
    key = sys.argv[1]

    rows = list(csv.reader(io.StringIO(
        urllib.request.urlopen(GVIZ, timeout=30).read().decode("utf-8"))))
    header, data = rows[0], rows[1:]

    out_path = Path(__file__).parent / "liens-membres.csv"
    cache = {}
    done = exact = 0
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["ligne", "organisme", "statut", "lien"])
        for i, row in enumerate(data, start=2):  # ligne 1 = en-tête
            row = (row + [""] * 5)[:5]
            org = row[3].strip()
            if not org:
                continue
            k = norm(org)
            if k not in cache:
                try:
                    places = search_place(org, key)
                except Exception as e:
                    print(f"  ! erreur API pour « {org} » : {e}")
                    places = []
                best, score = None, 0.0
                for p in places:
                    s = similar(org, p.get("displayName", {}).get("text", ""))
                    addr = p.get("formattedAddress", "")
                    if "QC" not in addr and "Québec" not in addr:
                        s -= 0.3
                    if s > score:
                        best, score = p, s
                if best and score >= SEUIL:
                    cache[k] = ("exact", best["googleMapsUri"])
                else:
                    cache[k] = ("doute", "")
                time.sleep(0.05)
                done += 1
                if done % 50 == 0:
                    print(f"  {done} organismes uniques traités…")
            statut, lien = cache[k]
            if statut == "exact":
                exact += 1
            w.writerow([i, org, statut, lien])

    total = sum(1 for r in data if (r + [""] * 4)[3].strip())
    print(f"\nTerminé : {total} lignes, {done} organismes uniques interrogés, "
          f"{exact} liens exacts.\nRésultat : {out_path}")


if __name__ == "__main__":
    main()
