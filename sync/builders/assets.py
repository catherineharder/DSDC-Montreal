# -*- coding: utf-8 -*-
"""Assets : page Notion « Assets » -> images/assets/ + manifeste JS.

Katie ajoute des images à la page Notion « Assets ». L'étiquette d'une image
vient (par ordre de priorité) :
  1. de sa LÉGENDE (caption), si elle en a une ;
  2. du TITRE DU BLOC PARENT (toggle/dépliant ou titre repliable) qui la
     contient — c.-à-d. « déposer l'image dans un toggle nommé "DC definition" »
     suffit ;
  3. sinon « image-N ».
Le script :
  1. lit les blocs de la page via l'API Notion (récursivement, pour trouver
     les images placées dans des toggles) ;
  2. applique les alias de sync/config.json (clé "aliases" : étiquette Notion
     -> étiquette du site, p. ex. "dc-definition" ->
     "developpement-des-communautes") ;
  3. télécharge chaque image dans images/assets/<slug-de-l-étiquette>.<ext> ;
  4. écrit assets/data/assets-manifest.js :
         window.ASSETS = { "developpement-des-communautes": "images/assets/…png", … }
Le site (assets/js/assets.js) remplace ensuite tout <img data-asset="étiquette">
par l'image correspondante si elle existe.

Prérequis (une seule fois) : créer une intégration Notion, la partager avec la
page « Assets », et fournir le jeton via la variable d'environnement
NOTION_TOKEN (voir GUIDE-ASSETS.md). Le page_id vit dans sync/config.json.

Bibliothèque standard seulement (urllib), comme sync/builders/common.py.
"""
import json
import os
import re
import unicodedata
import urllib.request

NOTION_VERSION = "2022-06-28"
API = "https://api.notion.com/v1"
IMG_EXT = {"image/png": ".png", "image/jpeg": ".jpg", "image/jpg": ".jpg",
           "image/gif": ".gif", "image/webp": ".webp", "image/svg+xml": ".svg"}


def _slug(s):
    s = unicodedata.normalize("NFKD", (s or "").strip().lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-") or "image"


def _token():
    return os.environ.get("NOTION_TOKEN", "").strip()


def _api_get(path, token):
    req = urllib.request.Request(API + path, headers={
        "Authorization": "Bearer " + token,
        "Notion-Version": NOTION_VERSION,
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def _blocks(page_id, token):
    """Tous les blocs enfants (pagination gérée)."""
    out, cursor = [], None
    while True:
        q = "?page_size=100" + (("&start_cursor=" + cursor) if cursor else "")
        data = _api_get("/blocks/%s/children%s" % (page_id, q), token)
        out.extend(data.get("results", []))
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return out


def _rich_text(block):
    """Texte brut d'un bloc (toggle, titre, paragraphe…)."""
    payload = block.get(block.get("type"), {}) or {}
    parts = payload.get("rich_text") or []
    return "".join(p.get("plain_text", "") for p in parts).strip()


def _images(page_id, token, parent_label="", depth=0):
    """Paires (bloc image, étiquette héritée du bloc parent), récursif.
    Une image placée dans un toggle « DC definition » hérite de cette étiquette."""
    if depth > 3:
        return []
    out = []
    for b in _blocks(page_id, token):
        t = b.get("type")
        if t == "image":
            out.append((b, parent_label))
        elif b.get("has_children"):
            label = _rich_text(b) or parent_label
            out.extend(_images(b["id"], token, label, depth + 1))
    return out


def _caption(img):
    parts = img.get("caption") or []
    return "".join(p.get("plain_text", "") for p in parts).strip()


def _image_url(img):
    if img.get("type") == "external":
        return (img.get("external") or {}).get("url", "")
    return (img.get("file") or {}).get("url", "")


def run(cfg, fetch, repo_root):
    """fetch est ignoré : on parle directement à l'API Notion (jeton requis).
    Sans NOTION_TOKEN, on ignore proprement (la synchro globale ne casse pas)."""
    token = _token()
    if not token:
        print("[note] assets : NOTION_TOKEN absent — étape ignorée (voir GUIDE-ASSETS.md).")
        return cfg["output"] + " — ignoré (NOTION_TOKEN absent)"
    page_id = cfg["page_id"]
    out_dir = repo_root / cfg.get("images_dir", "images/assets")
    out_dir.mkdir(parents=True, exist_ok=True)

    aliases = {_slug(k): v for k, v in (cfg.get("aliases") or {}).items()}
    manifest, seen, n = {}, {}, 0
    for b, parent_label in _images(page_id, token):
        img = b.get("image", {})
        url = _image_url(img)
        if not url:
            continue
        label = _caption(img) or parent_label or ("image-%d" % (n + 1))
        # alias : étiquette Notion -> étiquette attendue par le site
        label = aliases.get(_slug(label), label)
        slug = _slug(label)
        # évite d'écraser deux images homonymes
        if slug in seen:
            seen[slug] += 1
            slug = "%s-%d" % (slug, seen[slug])
        else:
            seen[slug] = 1
        # télécharge (l'extension vient du Content-Type, sinon de l'URL)
        req = urllib.request.Request(url, headers={"User-Agent": "dsdc-assets-sync"})
        with urllib.request.urlopen(req, timeout=60) as r:
            ct = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
            data = r.read()
        ext = IMG_EXT.get(ct) or (re.search(r"\.(png|jpe?g|gif|webp|svg)", url.lower()) or [".png"])[0]
        if not ext.startswith("."):
            ext = "." + ext
        fname = slug + ext
        (out_dir / fname).write_bytes(data)
        manifest[label] = cfg.get("images_dir", "images/assets") + "/" + fname
        # clé secondaire = slug, pratique pour référencer par data-asset
        manifest.setdefault(slug, cfg.get("images_dir", "images/assets") + "/" + fname)
        n += 1

    header = ("/* Manifeste des visuels — GÉNÉRÉ depuis la page Notion « Assets »\n"
              "   par sync/sync_all.py. NE PAS ÉDITER À LA MAIN. Associe une étiquette\n"
              "   (légende de l'image dans Notion) au fichier téléchargé. */\n")
    js = header + "window.ASSETS = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n"
    (repo_root / cfg["output"]).write_text(js, encoding="utf-8")
    return "%s — %d image(s) depuis Notion" % (cfg["output"], n)
