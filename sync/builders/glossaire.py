# -*- coding: utf-8 -*-
"""Glossaire : feuille « Acronymes » (Acronyme | Signification) -> acronymes.html.

Gabarit aligné sur l'identité visuelle DSDC Montréal (crème #F2EEE4, accents
terreux, tout cerné de noir, Inter) — mêmes jetons que assets/css/app.css.
La page est affichée en iframe dans l'onglet « Glossaire » : elle n'a donc pas
de barre de navigation propre, mais reprend la même grammaire visuelle que les
onglets Ressources et Recommandations.
Bibliothèque standard seulement.
"""
import csv
import html
import io
import unicodedata
from datetime import datetime

MOIS_FR = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
           "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

TEMPLATE = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>
/* Même garde-fou que cadre.html : cette page vit dans l'iframe de index.html,
   qui porte la barre de navigation. Atteinte seule en haut de fenêtre, elle
   privait le visiteur de toute navigation. On renvoie vers /glossaire. */
(function () {
  if (window.top !== window.self) return;
  if (!/^https?:$/.test(location.protocol)) return;
  if (!/\\/acronymes\\.html$/.test(location.pathname)) return;
  location.replace(
    location.pathname.replace(/\\/acronymes\\.html$/, "/glossaire") +
    location.search + location.hash
  );
})();
</script>
<title>Glossaire des acronymes — DSDC Montréal</title>
<meta name="description" content="Les acronymes du milieu du développement social et de la santé publique à Montréal, de A à Z. Cherchable et synchronisé depuis la feuille de référence.">
<link rel="canonical" href="https://dsdcmontreal.ca/glossaire">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<meta property="og:type" content="article">
<meta property="og:site_name" content="DSDC Montréal">
<meta property="og:locale" content="fr_CA">
<meta property="og:title" content="Glossaire des acronymes">
<meta property="og:description" content="Les acronymes du milieu du développement social et de la santé publique à Montréal, de A à Z.">
<meta property="og:url" content="https://dsdcmontreal.ca/glossaire">
<meta property="og:image" content="https://dsdcmontreal.ca/images/og-dsdc-montreal.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  /* ---- Jetons de design (identiques à assets/css/app.css) ---------------- */
  :root {
    --ink:#000000; --rule:#000000;
    --cream:#F2EEE4; --paper:#ffffff;
    --sand:#D7B063; --orange:#D97A22; --red:#C43E42; --olive:#6C6F3F; --teal:#46747F;
    --accent:#000000;            /* accent de l'onglet Glossaire */
    --font-sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,'Helvetica Neue',Arial,sans-serif;
    --tools-h:118px;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0; padding: 0 0 0;
    font-family: var(--font-sans);
    color: var(--ink);
    background: var(--cream);
    font-size: 15px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  /* ---- Titre (pas de surtitre ni de sous-titre : le titre est seul) ------ */
  .g-hero { padding: 44px clamp(24px,6vw,90px) 24px; border-bottom: 2px solid var(--ink); }
  .g-hero h1 {
    margin: 0;
    font-size: clamp(34px,5vw,60px); font-weight: 800; letter-spacing: -.02em; line-height: 1.02;
  }

  /* crayon d'édition : ouvre la feuille Google source */
  .edit-pencil {
    display: inline-flex; align-items: center; vertical-align: middle;
    margin-left: 12px; color: var(--ink); opacity: .45;
    transition: opacity 120ms ease, transform 120ms ease;
  }
  .edit-pencil:hover, .edit-pencil:focus-visible { opacity: 1; transform: translateY(-2px); }

  /* ---- Barre d'outils collante (recherche + index A-Z) ------------------- */
  .g-tools {
    position: sticky; top: 0; z-index: 5;
    background: var(--cream);
    padding: 16px clamp(24px,6vw,90px) 14px;
    border-bottom: 1.5px solid var(--ink);
    display: flex; flex-wrap: wrap; gap: 12px 14px; align-items: center;
  }
  .g-search { flex: 1 1 260px; position: relative; max-width: 420px; }
  .g-search input {
    width: 100%; padding: 10px 14px 10px 40px;
    border: 1.5px solid var(--ink); border-radius: 10px;
    font: inherit; font-size: 15px;
    background: var(--paper); color: var(--ink); outline: none;
  }
  .g-search input:focus { box-shadow: 3px 3px 0 var(--ink); }
  .g-search svg {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    width: 18px; height: 18px; pointer-events: none;
  }
  .g-count {
    font-size: 13px; font-weight: 700;
    border: 1.5px solid var(--ink); border-radius: 999px;
    padding: 6px 14px; background: var(--sand); white-space: nowrap;
  }
  .g-alpha { flex: 1 1 100%; display: flex; flex-wrap: wrap; gap: 6px; }
  .g-alpha a {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 32px; padding: 5px 9px;
    font-size: 13px; font-weight: 700; text-decoration: none;
    color: var(--ink); background: var(--paper);
    border: 1.5px solid var(--ink); border-radius: 999px;
    transition: background 120ms ease, color 120ms ease, transform 120ms ease;
  }
  .g-alpha a:hover, .g-alpha a:focus-visible { background: var(--ink); color: var(--cream); transform: translateY(-1px); }
  .g-alpha a.off { opacity: .25; pointer-events: none; }

  /* ---- Corps ------------------------------------------------------------ */
  main { padding: 30px clamp(24px,6vw,90px) 10px; }

  .letter-block { margin: 0 0 38px; scroll-margin-top: calc(var(--tools-h) + 12px); }
  .letter-block h2.letter {
    display: flex; align-items: center; gap: 14px;
    margin: 0 0 14px;
  }
  .letter-block h2.letter .l-badge {
    flex: 0 0 auto;
    width: 46px; height: 46px;
    display: flex; align-items: center; justify-content: center;
    font-size: 21px; font-weight: 800; letter-spacing: -.01em;
    border: 2px solid var(--ink); border-radius: 12px;
    background: var(--paper); box-shadow: 4px 4px 0 var(--ink);
  }
  .letter-block h2.letter .l-rule { flex: 1; height: 2px; background: var(--ink); }

  .letter-block dl { margin: 0; }
  .entry {
    display: grid; grid-template-columns: 190px minmax(0,1fr);
    gap: 8px 20px;
    padding: 11px 14px;
    border-bottom: 1px solid var(--rule);
  }
  .entry:first-of-type { border-top: 1px solid var(--rule); }
  .entry:nth-of-type(even) { background: rgba(255,255,255,.5); }
  .entry dt { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -.005em; }
  .entry dd { margin: 0; font-size: 14.5px; line-height: 1.5; }
  .entry .src {
    display: inline-block; margin-left: 10px;
    padding: 2px 10px;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
    border: 1.5px solid var(--ink); border-radius: 999px;
    background: var(--sand); white-space: nowrap; vertical-align: 1px;
  }
  .entry.hidden { display: none; }

  .g-empty {
    margin: 10px 0 0; padding: 30px;
    font-size: 15px; font-weight: 600; text-align: center;
    border: 2px dashed var(--ink); border-radius: 14px; background: var(--paper);
  }
  .g-empty[hidden] { display: none; }

  /* ---- Pied de page ----------------------------------------------------- */
  footer {
    margin: 40px 0 0;
    padding: 22px clamp(24px,6vw,90px) 60px;
    border-top: 2px solid var(--ink);
    font-size: 13px; font-weight: 600;
    background: var(--paper);
  }

  @media (max-width: 720px) {
    .entry { grid-template-columns: 1fr; gap: 2px; padding: 12px 10px; }
    .g-count { order: 3; }
  }
</style>
</head>
<body>

<header class="g-hero">
  <h1>Glossaire des acronymes<a class="edit-pencil" href="{{SHEET_URL}}" target="_blank" rel="noopener" title="Suggérer une modification (ouvre la feuille Google)" aria-label="Suggérer une modification"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></a></h1>
</header>

<div class="g-tools">
  <div class="g-search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    <input id="q" type="search" placeholder="Rechercher un acronyme ou un mot…" autocomplete="off" aria-label="Rechercher un acronyme">
  </div>
  <span class="g-count" id="count">{{COUNT}} acronymes</span>
  <nav class="g-alpha" aria-label="Index alphabétique">
{{ALPHA_INDEX}}
  </nav>
</div>

<main>
{{LETTER_BLOCKS}}
  <p class="g-empty" id="empty" hidden>Aucun résultat ne correspond à votre recherche.</p>
</main>

<footer>
  Direction régionale de santé publique, CIUSSS du Centre-Sud-de-l'Île-de-Montréal. {{FOOTER_DATE}}.
</footer>

<script>
(function(){
  const q = document.getElementById('q');
  const countEl = document.getElementById('count');
  const emptyEl = document.getElementById('empty');
  const entries = Array.from(document.querySelectorAll('.entry'));
  const blocks = Array.from(document.querySelectorAll('.letter-block'));
  const chips = Array.from(document.querySelectorAll('.g-alpha a'));
  const total = entries.length;
  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,''); }
  /* L'accord doit porter sur « acronyme » ET sur « trouvé » : sans quoi une
     recherche à un seul résultat affichait « 1 acronyme trouvés ». */
  function label(n, found){
    return n + (n === 1 ? ' acronyme' : ' acronymes') + (found ? (n === 1 ? ' trouvé' : ' trouvés') : '');
  }
  q.addEventListener('input', () => {
    const term = norm(q.value.trim());
    let visible = 0;
    entries.forEach(e => {
      const hit = !term || norm(e.textContent).includes(term);
      e.classList.toggle('hidden', !hit);
      if (hit) visible++;
    });
    const live = new Set();
    blocks.forEach(b => {
      const any = b.querySelector('.entry:not(.hidden)') !== null;
      b.style.display = any ? '' : 'none';
      if (any) live.add(b.id);
    });
    chips.forEach(c => c.classList.toggle('off', !!term && !live.has(c.getAttribute('href').slice(1))));
    if (emptyEl) emptyEl.hidden = visible !== 0;
    if (countEl) countEl.textContent = label(visible, !!term);
  });
})();
</script>

</body>
</html>
"""


def base_letter(s):
    if not s:
        return "#"
    first = s.strip()[:1]
    nfkd = unicodedata.normalize("NFKD", first)
    stripped = "".join(c for c in nfkd if not unicodedata.combining(c))
    return stripped.upper() if stripped.isalpha() else "#"


def parse_entries(rows):
    entries = []
    for i, row in enumerate(rows):
        if i == 0:
            continue  # en-tête
        if not row or not row[0]:
            continue
        # Deux colonnes : Acronyme | Signification. Une éventuelle troisième
        # colonne (l'ancienne « Source », jamais affichée) est ignorée.
        acronyme = row[0].strip()
        signification = row[1].strip() if len(row) > 1 else ""
        if not acronyme:
            continue
        entries.append((acronyme, signification))
    # Tri alphabétique insensible aux accents et à la casse : l'ordre des
    # lignes dans la feuille Google n'a donc aucune importance.
    def sort_key(entry):
        nfkd = unicodedata.normalize("NFKD", entry[0])
        return "".join(c for c in nfkd if not unicodedata.combining(c)).casefold()
    entries.sort(key=sort_key)
    return entries


def render_entry(acronyme, signification):
    a = html.escape(acronyme, quote=True)
    s = html.escape(signification, quote=True)
    return f'    <div class="entry"><dt>{a}</dt><dd>{s}</dd></div>'


def build_letter_blocks(entries):
    groups, order = {}, []
    for entry in entries:
        letter = base_letter(entry[0])
        if letter not in groups:
            groups[letter] = []
            order.append(letter)
        groups[letter].append(entry)
    order.sort(key=lambda l: (l == "#", l))
    blocks_html = []
    for letter in order:
        body = "\n".join(render_entry(*e) for e in groups[letter])
        blocks_html.append(
            f'<section class="letter-block" id="lt-{letter}">\n'
            f'  <h2 class="letter"><span class="l-badge">{letter}</span>'
            f'<span class="l-rule" aria-hidden="true"></span></h2>\n'
            f'  <dl>\n{body}\n  </dl>\n</section>')
    alpha_links = "\n".join(
        f'    <a href="#lt-{l}">{l}</a>' for l in order)
    return alpha_links, "\n".join(blocks_html), len(entries)


def french_month_year(now=None):
    now = now or datetime.now()
    return f"{MOIS_FR[now.month]} {now.year}"


def build(rows, sheet_url=""):
    entries = parse_entries(rows)
    if not entries:
        raise RuntimeError("Glossaire : aucune entrée trouvée dans la feuille.")
    alpha, blocks, count = build_letter_blocks(entries)
    return (TEMPLATE
            .replace("{{ALPHA_INDEX}}", alpha)
            .replace("{{LETTER_BLOCKS}}", blocks)
            .replace("{{COUNT}}", str(count))
            .replace("{{SHEET_URL}}", sheet_url)
            .replace("{{FOOTER_DATE}}", french_month_year())), count


def run(cfg, fetch, repo_root):
    text = fetch(cfg["sheet_id"], cfg["tab"])
    rows = list(csv.reader(io.StringIO(text)))
    sheet_url = f"https://docs.google.com/spreadsheets/d/{cfg['sheet_id']}/edit"
    out_html, count = build(rows, sheet_url)
    (repo_root / cfg["output"]).write_text(out_html, encoding="utf-8")
    return f"{cfg['output']} — {count} acronymes"
