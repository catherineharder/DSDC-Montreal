# -*- coding: utf-8 -*-
"""Glossaire : feuille « Acronymes » (Acronyme | Signification | Source) -> acronymes.html.

Reprend le gabarit éprouvé de l'ancien scripts/sync_acronymes.py.
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
<meta name="viewport" content="width=1480">
<title>Glossaire des acronymes, DRSP</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #1a1a1a;
    --muted: #5a5a5a;
    --hairline: #e5e5e5;
    --accent: #3b6fa8;
    --tag-bg: #f1f1f1;
    --tag-ink: #5a5a5a;
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, 'Helvetica Neue', Arial, sans-serif;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: var(--font-sans);
    color: var(--ink);
    background: #ffffff;
    font-size: 12pt;
    line-height: 1.45;
  }
  nav.toc {
    position: sticky; top: 0;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--hairline);
    padding: 14px 48px;
    font-size: 10pt;
    z-index: 10;
    display: flex; gap: 24px; align-items: center;
  }
  nav.toc a { color: var(--muted); text-decoration: none; }
  nav.toc a:hover { color: var(--accent); }
  nav.toc .brand { font-weight: 500; color: var(--ink); margin-right: auto; }

  main { max-width: 1100px; margin: 0 auto; padding: 0 48px; }

  .hero {
    padding: 30px 0 24px;
    border-bottom: 1px solid var(--hairline);
  }
  .hero .label {
    font-size: 10pt; color: var(--muted);
    letter-spacing: 0.06em; margin-bottom: 24px;
  }
  .hero h1 {
    font-size: 46px; font-weight: 700;
    line-height: 1.05; letter-spacing: -0.02em;
    margin: 0 0 24px;
  }
  .hero p.lead {
    font-size: 13pt; color: var(--muted);
    max-width: 720px; margin: 0;
    line-height: 1.55;
  }

  .controls {
    display: flex; gap: 16px; align-items: center;
    padding: 24px 0 8px;
    border-bottom: 1px solid var(--hairline);
    margin-bottom: 32px;
    position: sticky; top: 0;
    background: #fff; z-index: 5;
  }
  .controls input {
    flex: 1; max-width: 360px;
    padding: 10px 14px;
    border: 1px solid var(--hairline);
    border-radius: 6px;
    font-size: 11pt;
    font-family: inherit;
    color: var(--ink);
    outline: none;
  }
  .controls input:focus { border-color: var(--accent); }
  .controls .count {
    font-size: 10pt; color: var(--muted);
  }
  .alpha-index {
    display: flex; flex-wrap: wrap; gap: 4px; align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--hairline);
    margin-bottom: 32px;
    font-size: 10pt;
  }
  .gloss-search {
    margin-left: auto; min-width: 280px; flex: 0 0 auto;
    padding: 9px 13px; border: 1px solid var(--hairline); border-radius: 6px;
    font: inherit; font-size: 11pt; color: var(--ink); outline: none;
  }
  .gloss-search:focus { border-color: var(--accent); }
  .alpha-index a {
    display: inline-block;
    min-width: 28px;
    text-align: center;
    padding: 4px 8px;
    color: var(--muted);
    text-decoration: none;
    border-radius: 4px;
  }
  .alpha-index a:hover {
    color: var(--accent);
    background: #f4f4f4;
  }

  .letter-block { margin-bottom: 40px; scroll-margin-top: 120px; }
  .letter-block h3.letter {
    font-size: 24pt; font-weight: 400;
    color: var(--accent);
    margin: 0 0 16px;
    letter-spacing: -0.02em;
    border-bottom: 1px solid var(--hairline);
    padding-bottom: 8px;
  }
  .letter-block dl { margin: 0; }
  .entry {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  .entry dt {
    font-weight: 500;
    font-size: 10.5pt;
    color: var(--ink);
  }
  .entry dd {
    margin: 0;
    font-size: 10.5pt;
    color: var(--ink);
    line-height: 1.5;
  }
  .entry .src {
    display: inline-block;
    margin-left: 8px;
    padding: 1px 8px;
    background: var(--tag-bg);
    color: var(--tag-ink);
    font-size: 8.5pt;
    border-radius: 3px;
    font-weight: 400;
    vertical-align: 2px;
    white-space: nowrap;
  }
  .entry.hidden { display: none; }

  /* Crayon d'édition : ouvre la feuille Google source (lecture seule sans accès). */
  .edit-pencil {
    display: inline-flex; align-items: center;
    vertical-align: middle; margin-left: 10px;
    color: var(--muted); opacity: .45;
    transition: opacity 120ms ease, color 120ms ease;
  }
  .edit-pencil:hover, .edit-pencil:focus-visible { opacity: 1; color: var(--accent); }

  footer {
    border-top: 1px solid var(--hairline);
    padding: 32px 48px 64px;
    color: var(--muted);
    font-size: 10pt;
    max-width: 1100px;
    margin: 56px auto 0;
  }
</style>
</head>
<body>

<main>

  <section class="hero">
    <h1>Glossaire des acronymes<a class="edit-pencil" href="{{SHEET_URL}}" target="_blank" rel="noopener" title="Suggérer une modification (ouvre la feuille Google)" aria-label="Suggérer une modification"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></a></h1>
    </section>

  <div class="alpha-index">
{{ALPHA_INDEX}}
    <input id="q" type="search" class="gloss-search" placeholder="Rechercher un acronyme…" autocomplete="off">
  </div>

{{LETTER_BLOCKS}}
</main>

<footer>
  Direction régionale de santé publique, CIUSSS du Centre-Sud-de-l'Île-de-Montréal. {{FOOTER_DATE}}.
</footer>

<script>
(function(){
  const q = document.getElementById('q');
  const countEl = document.getElementById('count');
  const entries = Array.from(document.querySelectorAll('.entry'));
  const blocks = Array.from(document.querySelectorAll('.letter-block'));
  const total = entries.length;
  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  q.addEventListener('input', () => {
    const term = norm(q.value.trim());
    let visible = 0;
    entries.forEach(e => {
      if (!term) { e.classList.remove('hidden'); visible++; return; }
      const text = norm(e.textContent);
      if (text.includes(term)) { e.classList.remove('hidden'); visible++; }
      else e.classList.add('hidden');
    });
    blocks.forEach(b => {
      const anyVisible = b.querySelectorAll('.entry:not(.hidden)').length > 0;
      b.style.display = anyVisible ? '' : 'none';
    });
    if (countEl) countEl.textContent = visible + (visible === 1 ? ' entrée' : ' entrées') + (term ? ' (filtré)' : '');
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
        acronyme = row[0].strip()
        signification = row[1].strip() if len(row) > 1 else ""
        source = row[2].strip() if len(row) > 2 else ""
        if not acronyme:
            continue
        entries.append((acronyme, signification, source))
    # Tri alphabétique insensible aux accents et à la casse : l'ordre des
    # lignes dans la feuille Google n'a donc aucune importance.
    def sort_key(entry):
        nfkd = unicodedata.normalize("NFKD", entry[0])
        return "".join(c for c in nfkd if not unicodedata.combining(c)).casefold()
    entries.sort(key=sort_key)
    return entries


def render_entry(acronyme, signification, source):
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
            f'  <h3 class="letter">{letter}</h3>\n  <dl>\n{body}\n  </dl>\n</section>')
    alpha_links = " ".join(f'<a href="#lt-{l}">{l}</a>' for l in order)
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
            .replace("{{SHEET_URL}}", sheet_url)
            .replace("{{FOOTER_DATE}}", french_month_year())), count


def run(cfg, fetch, repo_root):
    text = fetch(cfg["sheet_id"], cfg["tab"])
    rows = list(csv.reader(io.StringIO(text)))
    sheet_url = f"https://docs.google.com/spreadsheets/d/{cfg['sheet_id']}/edit"
    out_html, count = build(rows, sheet_url)
    (repo_root / cfg["output"]).write_text(out_html, encoding="utf-8")
    return f"{cfg['output']} — {count} acronymes"
