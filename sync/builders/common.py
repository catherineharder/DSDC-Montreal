# -*- coding: utf-8 -*-
"""Outils partagés par la synchronisation (bibliothèque standard seulement).

Récupère chaque onglet d'une feuille Google publiée en lecture (« Tout le monde
disposant du lien : Lecteur ») via le point d'accès gviz qui exporte n'importe
quel onglet en CSV, par son NOM :

    https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=<ONGLET>

Aucune clé d'API ni « publication sur le Web » n'est requise : il suffit que la
feuille soit partagée en lecture par lien.
"""
import urllib.parse
import urllib.request

GVIZ = ("https://docs.google.com/spreadsheets/d/{sid}/gviz/tq"
        "?tqx=out:csv&sheet={tab}")


def fetch_tab(sheet_id, tab, timeout=60):
    """Retourne le texte CSV d'un onglet. Lève une exception en cas d'échec."""
    url = GVIZ.format(sid=sheet_id, tab=urllib.parse.quote(tab))
    req = urllib.request.Request(url, headers={"User-Agent": "DRSP-Sync/2.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
    # gviz renvoie une page HTML d'erreur si la feuille n'est pas accessible.
    head = raw.lstrip()[:15].lower()
    if head.startswith("<!doctype") or head.startswith("<html"):
        raise RuntimeError(
            f"Onglet « {tab} » inaccessible (HTML reçu au lieu de CSV). "
            "Vérifiez l'ID de la feuille et le partage « lecteur par lien ».")
    return raw
