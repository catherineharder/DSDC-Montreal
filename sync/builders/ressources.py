# -*- coding: utf-8 -*-
"""Ressources : feuille « Ressources » -> assets/data/ressources.data.js.

Colonnes attendues (repérées par leur EN-TÊTE, l'ordre est libre) :

    Titre | Organisme | Date | Etiquette | Lien

La colonne Date ne contient que l'ANNÉE (2024) : c'est tout ce que le site
affiche et tout ce qui sert au tri. Un mois saisi par mégarde est ignoré.

Les accents et la casse des en-têtes n'ont pas d'importance : « Étiquette »,
« etiquette » et « ETIQUETTE » sont acceptés. Les synonymes courants le sont
aussi (« Source » pour Organisme, « URL » pour Lien, « Tag » pour Etiquette).

PAGES COUVERTURE — volontairement absentes de la feuille.
Elles se rattachent par le NOM DU FICHIER : le site cherche une image dans
images/ressources/ dont le nom est le « slug » du titre de la fiche
(minuscules, sans accents, tirets). Si le fichier existe, il devient la
couverture ; sinon la fiche affiche l'aperçu générique. Ajouter une couverture
ne demande donc ni colonne dans la feuille, ni modification du code : on dépose
l'image au bon nom, c'est tout. Le slug attendu de chaque fiche est écrit en
commentaire en tête du fichier généré.

Bibliothèque standard seulement.
"""
import csv
import io
import json
import re
import unicodedata

# Les étiquettes que le site sait afficher (assets/js/ressources.js, const TAGS).
# Une étiquette inconnue est signalée et la fiche est publiée sans filtre utile,
# plutôt que d'être silencieusement perdue.
TAGS = ["Contexte", "DS", "DC", "Montréal", "Outils"]

# Extensions acceptées pour une page couverture, par ordre de préférence.
COVER_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif"]
COVER_DIR = "images/ressources"


def _sans_accents(s):
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c))


def _norm_entete(s):
    """Un en-tête -> une clé comparable : minuscules, sans accents ni ponctuation."""
    return re.sub(r"[^a-z0-9]+", "", _sans_accents(s or "").lower())


def slug(titre):
    """Titre de fiche -> nom de fichier attendu pour sa page couverture."""
    s = _sans_accents(titre or "").lower()
    s = s.replace("'", "-").replace("’", "-")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return re.sub(r"-{2,}", "-", s)[:80]


def _norm_tag(val):
    """Rapproche l'étiquette saisie d'une des cinq connues (casse/accents libres)."""
    cible = _norm_entete(val)
    for t in TAGS:
        if _norm_entete(t) == cible:
            return t
    return (val or "").strip()


def _norm_date(val):
    """Ne retient QUE l'année (le site n'affiche et ne trie que par année).

    On accepte quand même tout ce qu'un tableur ou une personne pressée peut
    produire — 2025-03, 2025-03-01, 03/2025, « mars 2025 » — et on n'en garde
    que les quatre chiffres. Saisir juste l'année dans la feuille est donc la
    règle, mais un mois oublié là ne casse rien.
    """
    v = (val or "").strip()
    if not v:
        return ""
    m = re.search(r"(1[6-9]\d{2}|20\d{2})", v)   # première année plausible
    return m.group(1) if m else v


def csv_to_rows(text):
    return list(csv.reader(io.StringIO(text)))


def build(rows, cover_exists):
    """rows : listes (avec en-tête). cover_exists(slug) -> chemin ou None.

    Retourne (liste de fiches, avertissements).
    """
    if not rows:
        raise RuntimeError("Onglet « Ressources » vide.")
    entetes = [_norm_entete(c) for c in rows[0]]

    def col(*noms):
        for n in noms:
            k = _norm_entete(n)
            if k in entetes:
                return entetes.index(k)
        return -1

    i_titre = col("titre", "title")
    i_org = col("organisme", "org", "source", "auteur")
    i_date = col("date", "annee")
    i_tag = col("etiquette", "tag", "categorie")
    i_url = col("lien", "url", "link", "adresse")
    if i_titre < 0 or i_url < 0:
        raise RuntimeError(
            "Onglet Ressources : les en-têtes « Titre » et « Lien » sont requis.")

    def cell(row, i):
        return row[i].strip() if 0 <= i < len(row) else ""

    fiches, warnings, vus = [], [], set()
    for n, row in enumerate(rows[1:], start=2):
        titre, url = cell(row, i_titre), cell(row, i_url)
        if not titre and not url:
            continue                                   # ligne vide : ignorée
        if not titre:
            warnings.append(f"ligne {n} : lien sans titre, ignorée ({url[:60]})")
            continue
        if not url:
            warnings.append(f"ligne {n} : « {titre[:50]} » sans lien, ignorée")
            continue
        if not re.match(r"^https?://", url):
            warnings.append(f"ligne {n} : « {titre[:50]} » — lien qui ne commence "
                            f"pas par http(s), ignorée")
            continue
        s = slug(titre)
        if s in vus:
            warnings.append(f"ligne {n} : titre en double « {titre[:50]} »")
        vus.add(s)
        tag = _norm_tag(cell(row, i_tag))
        if tag and tag not in TAGS:
            warnings.append(f"ligne {n} : étiquette inconnue « {tag} » "
                            f"(attendu : {', '.join(TAGS)})")
        fiches.append({
            "title": titre,
            "org": cell(row, i_org),
            "date": _norm_date(cell(row, i_date)),
            "tag": tag,
            "url": url,
            "cover": cover_exists(s),
        })
    return fiches, warnings


HEADER = (
    "/* Catalogue des sources documentaires du site DSDC Montréal.\n"
    "   GÉNÉRÉ AUTOMATIQUEMENT depuis la feuille Google « Ressources — site »\n"
    "   par sync/sync_all.py. NE PAS ÉDITER À LA MAIN : modifiez la feuille,\n"
    "   le site se met à jour à la prochaine synchronisation.\n"
    "\n"
    "   Les pages couverture ne sont PAS dans la feuille. Pour en ajouter une,\n"
    "   déposez l'image dans images/ressources/ sous le nom indiqué ci-dessous\n"
    "   (extension .jpg, .jpeg, .png, .webp ou .avif) ; elle sera reprise à la\n"
    "   prochaine synchronisation. Sans image, la fiche affiche un aperçu\n"
    "   générique.\n"
)


def render_js(fiches):
    noms = "\n".join(
        f"     {slug(f['title'])}{'' if f['cover'] else '   (aucune image)'}"
        for f in fiches)
    return (HEADER + "\n   Noms de fichier attendus :\n" + noms + " */\n"
            "window.RESSOURCES = "
            + json.dumps(fiches, ensure_ascii=False, indent=2) + ";\n")


def run(cfg, fetch, repo_root):
    dossier = repo_root / cfg.get("covers_dir", COVER_DIR)

    def cover_exists(s):
        for ext in COVER_EXT:
            if (dossier / (s + ext)).is_file():
                return f"{cfg.get('covers_dir', COVER_DIR)}/{s}{ext}"
        return None

    text = fetch(cfg["sheet_id"], cfg["tab"])
    fiches, warnings = build(csv_to_rows(text), cover_exists)
    if not fiches:
        raise RuntimeError(
            "Onglet Ressources : aucune fiche valide. Rien n'a été écrit "
            "(le catalogue publié est conservé).")
    (repo_root / cfg["output"]).write_text(render_js(fiches), encoding="utf-8")
    for w in warnings:
        print(f"[attention] ressources : {w}")
    avec = sum(1 for f in fiches if f["cover"])
    msg = (f"{cfg['output']} — {len(fiches)} sources, "
           f"{avec} page(s) couverture")
    if warnings:
        msg += f" ; {len(warnings)} avertissement(s), voir [attention]"
    return msg
