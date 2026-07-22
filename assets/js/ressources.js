/* Rendu de l'onglet « Ressources » : fiches (page couverture + titre + date + tag),
   recherche par nom/organisme, filtres par tag, tri par date/titre.
   Clic sur une fiche = ouverture du document dans un nouvel onglet. */
(function () {
  "use strict";
  const root = document.getElementById("view-ressources");
  if (!root || !window.RESSOURCES) return;

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
  const strip = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const prettyDate = (d) => {
    if (!d) return "s. d.";
    const m = String(d).match(/^(\d{4})-(\d{2})$/);
    if (m) { const mois = ["janv.","févr.","mars","avr.","mai","juin","juill.","août","sept.","oct.","nov.","déc."]; return mois[+m[2] - 1] + " " + m[1]; }
    return String(d);
  };
  const TAGS = ["Contexte", "DS", "DC", "Montréal", "Outils"];

  const state = { q: "", tags: new Set(), sort: "date-desc" };

  root.innerHTML =
    '<div class="res-wrap">' +
      '<header class="res-hero">' +
        '<h1>Ressources</h1>' +
        '<p>Toutes les sources documentaires citées dans le site, réunies en un seul endroit. Cherchez par nom, filtrez par thème, puis cliquez une fiche pour ouvrir le document.</p>' +
      '</header>' +
      '<div class="res-tools">' +
        '<div class="res-search"><svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
          '<input type="search" id="res-q" placeholder="Rechercher une source…" autocomplete="off"></div>' +
        '<div class="res-filters" id="res-filters"></div>' +
        '<div class="res-sort"><select id="res-sort" aria-label="Trier">' +
          '<option value="date-desc">Plus récentes</option>' +
          '<option value="date-asc">Plus anciennes</option>' +
          '<option value="title-asc">Titre (A–Z)</option>' +
        '</select></div>' +
      '</div>' +
      '<div class="res-grid" id="res-grid"></div>' +
      '<div class="res-empty" id="res-empty" hidden>Aucune source ne correspond à votre recherche.</div>' +
    '</div>';

  const filtersEl = root.querySelector("#res-filters");
  filtersEl.innerHTML = TAGS.map((t) =>
    '<button class="res-chip" type="button" data-tag="' + t + '" aria-pressed="false">' + t + '</button>').join("");
  const gridEl = root.querySelector("#res-grid");
  const emptyEl = root.querySelector("#res-empty");
  const qEl = root.querySelector("#res-q");
  const sortEl = root.querySelector("#res-sort");

  const cardHTML = (r) => {
    const cover = r.cover
      ? '<img src="' + esc(r.cover) + '" alt="Page couverture — ' + esc(r.title) + '" loading="lazy">'
      : '<div class="res-ph"><svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M14 4v5h5"/></svg><span class="rp-t">Page couverture<br>à ajouter</span></div>';
    return '<a class="res-card" href="' + esc(r.url) + '" target="_blank" rel="noopener">' +
      '<div class="res-cover">' + cover +
        '<span class="res-open" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg></span>' +
      '</div>' +
      '<div class="res-meta">' +
        '<span class="res-tag" data-tag="' + esc(r.tag) + '">' + esc(r.tag) + '</span>' +
        '<h3>' + esc(r.title) + '</h3>' +
        '<span class="res-date">' + esc(r.org) + ' · ' + prettyDate(r.date) + '</span>' +
      '</div></a>';
  };

  const sortFns = {
    "date-desc": (a, b) => String(b.date || "").localeCompare(String(a.date || "")),
    "date-asc": (a, b) => String(a.date || "").localeCompare(String(b.date || "")),
    "title-asc": (a, b) => a.title.localeCompare(b.title, "fr"),
  };

  const render = () => {
    const nq = strip(state.q.trim());
    let list = window.RESSOURCES.filter((r) => {
      if (state.tags.size && !state.tags.has(r.tag)) return false;
      if (!nq) return true;
      return strip(r.title + " " + r.org + " " + r.tag).includes(nq);
    });
    list = list.slice().sort(sortFns[state.sort] || sortFns["date-desc"]);
    gridEl.innerHTML = list.map(cardHTML).join("");
    emptyEl.hidden = list.length !== 0;
  };

  qEl.addEventListener("input", () => { state.q = qEl.value; render(); });
  sortEl.addEventListener("change", () => { state.sort = sortEl.value; render(); });
  filtersEl.addEventListener("click", (e) => {
    const b = e.target.closest(".res-chip"); if (!b) return;
    const t = b.dataset.tag;
    if (state.tags.has(t)) { state.tags.delete(t); b.setAttribute("aria-pressed", "false"); }
    else { state.tags.add(t); b.setAttribute("aria-pressed", "true"); }
    render();
  });

  render();
})();
