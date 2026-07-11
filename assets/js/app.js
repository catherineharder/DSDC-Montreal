/* Cœur de l'application : helpers, fabrique de carte réutilisable (createMap), bascule des onglets (initNav). */

"use strict";
const SVG_NS = "http://www.w3.org/2000/svg";
const el = (id) => document.getElementById(id);

/* Escape any value before interpolating it into innerHTML. Data is static today,
   but escaping removes the standing XSS risk the moment it comes from a fetch
   or contains stray "&"/"<" from source CSVs. */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

/* ---- Édition des données sources (Google Sheets) --------------------------
   Chaque section affiche un petit crayon qui ouvre sa feuille Google dans un
   nouvel onglet. Les personnes ayant accès en écriture peuvent corriger ;
   les autres voient la feuille en lecture seule (mêmes IDs que sync/config.json). */
const EDIT_SHEETS = {
  concertations: "https://docs.google.com/spreadsheets/d/1dDpLbIMQCE9OoCvnZNVQc0R8gkmydV8I/edit",
  tables: "https://docs.google.com/spreadsheets/d/11P0JPIxhEmf3EFvXxVx2z_NYmQ-oNo7u/edit",
  glossaire: "https://docs.google.com/spreadsheets/d/1RRaZ4SMFaWm3m78ypPufWrClJymn4y7n/edit",
};
const editPencil = (url) =>
  `<a class="edit-pencil" href="${url}" target="_blank" rel="noopener" ` +
  `title="Suggérer une modification (ouvre la feuille Google)" aria-label="Suggérer une modification">` +
  `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
  `<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></a>`;

/* ---- Navigation: show one view at a time ---------------------------------
   Plain nav semantics (aria-current="page"), not the ARIA tab pattern: the
   buttons are page switches, and Tab-to-focus + Enter is the expected model. */
function initNav() {
  const buttons = [...document.querySelectorAll(".nav-item")];
  if (!buttons.length) return;

  // Chaque onglet a sa propre URL (ex. /DSDC-Montreal/concertations).
  // Le préfixe de base est lu depuis la balise <base> (source unique).
  const baseEl = document.querySelector("base");
  const BASE = baseEl ? new URL(baseEl.href).pathname : "/";
  const VIEW_SLUG = {
    accueil: "", cartes: "cartes", conc: "concertations", cadre: "cadre",
    indic: "indicateurs", ressources: "ressources", gloss: "glossaire",
  };
  const SLUG_VIEW = {};
  Object.keys(VIEW_SLUG).forEach((v) => { SLUG_VIEW[VIEW_SLUG[v]] = v; });
  SLUG_VIEW["cadre-conceptuel"] = "cadre"; // ancienne URL (liens existants)

  const apply = (view) => {
    buttons.forEach((b) => {
      const on = b.dataset.view === view;
      b.setAttribute("aria-current", on ? "page" : "false");
      const v = el("view-" + b.dataset.view);
      if (v) { v.classList.toggle("active", on); v.toggleAttribute("hidden", !on); }
    });
    // la page d'accueil n'a pas de bouton d'onglet : on la bascule à part
    const home = el("view-accueil");
    if (home) {
      const on = view === "accueil";
      home.classList.toggle("active", on);
      home.toggleAttribute("hidden", !on);
    }
  };
  const viewFromPath = () => {
    const seg = location.pathname.slice(BASE.length).replace(/^\/+|\/+$/g, "").split("/")[0];
    return SLUG_VIEW[seg] || "accueil";
  };
  const go = (view, push) => {
    apply(view);
    if (push) history.pushState({ view }, "", BASE + (VIEW_SLUG[view] || ""));
  };

  buttons.forEach((b) => b.addEventListener("click", () => go(b.dataset.view, true)));
  // Cliquer la marque « DS-DC Montréal » ramène à la page d'accueil.
  const brand = document.querySelector(".brand");
  if (brand) {
    brand.setAttribute("role", "link");
    brand.setAttribute("tabindex", "0");
    brand.addEventListener("click", () => go("accueil", true));
    brand.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go("accueil", true); }
    });
  }
  window.addEventListener("popstate", () => apply(viewFromPath()));
  go(viewFromPath(), false); // état initial (sans empiler d'historique)
}

/* ---- "Cartes" tab : pick a map from the list in the left column -------------
   One top-level tab (Cartes) holds three island maps (Santé Québec, Ville de
   Montréal, Tables de quartier). Each map's left column lists the three names;
   the selected one is boxed (aria-current). Clicking a name swaps the map. */
function initCartes() {
  const maps = ["sante", "ville", "tdq"];
  const picks = [...document.querySelectorAll(".map-pick")];
  if (!picks.length) return;
  const showMap = (map) => {
    maps.forEach((k) => {
      const v = el("view-" + k);
      if (v) { const on = k === map; v.classList.toggle("active", on); v.toggleAttribute("hidden", !on); }
    });
    picks.forEach((p) => p.setAttribute("aria-current", p.dataset.map === map ? "page" : "false"));
  };
  picks.forEach((p) => p.addEventListener("click", () => showMap(p.dataset.map)));
  window.showCartesMap = showMap;
  showMap("sante"); // default
}

/* ---- Reusable map factory ------------------------------------------------
   Renders an interactive choropleth into an <svg> and drives a side panel.
   Built to be reused by every territorial view (Ville today; CIUSSS next).
     opts.svg           target <svg> element
     opts.panel         side-panel element populated on selection
     opts.shapes        { slug: pathD }  clickable regions
     opts.context       { slug: pathD }  inert backdrop regions (villes liées)
     opts.lookup        slug -> record  (record.name used for aria-label)
     opts.renderPanel   (record) -> HTML shown when a region is selected
     opts.renderLanding () -> HTML shown initially and on reset()
   Returns { select, reset } for external control (e.g. logo click).        */
function createMap(opts) {
  const { svg, panel, shapes, context = {}, lookup, renderPanel, renderLanding, contextRender } = opts;

  const addPath = (d, cls) => {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    p.setAttribute("class", cls);
    svg.appendChild(p);
    return p;
  };
  const clearActive = () => svg.querySelectorAll(".active").forEach((n) => n.classList.remove("active"));
  const activate = (sel, slug) => {
    const node = [...svg.querySelectorAll(sel)].find((n) => n.dataset.slug === slug);
    if (node) node.classList.add("active");
  };

  const select = (slug) => {
    clearActive();
    activate(".arr", slug);
    const record = lookup(slug);
    if (record) { panel.innerHTML = renderPanel(record); panel.scrollTop = 0; }
  };
  const selectContext = (slug) => {
    clearActive();
    activate(".suburb", slug);
    panel.innerHTML = contextRender(slug);
    panel.scrollTop = 0;
  };
  const reset = () => { clearActive(); panel.innerHTML = renderLanding(); panel.scrollTop = 0; };

  const wire = (p, slug, handler, label) => {
    p.dataset.slug = slug;
    p.setAttribute("tabindex", "0");
    p.setAttribute("role", "button");
    p.setAttribute("aria-label", label); // setAttribute escapes natively
    p.addEventListener("click", () => handler(slug));
    p.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(slug); }
    });
  };

  // backdrop first (villes liées) — clickable only when contextRender is provided
  Object.entries(context).forEach(([slug, d]) => {
    const p = addPath(d, "suburb");
    if (contextRender) wire(p, slug, selectContext, slug);
  });
  // interactive regions (arrondissements) painted on top
  Object.entries(shapes).forEach(([slug, d]) => {
    const p = addPath(d, "arr");
    const rec = lookup(slug);
    wire(p, slug, select, rec ? rec.name : slug);
  });

  reset();
  return { select, reset };
}

/* ---- Reusable map search box --------------------------------------------
   Builds a search input + results dropdown for a map view. `entries` is a list
   of { label, value, group? }; picking a result calls onPick(value). Inserted
   into a map's left column so each map can be navigated by name as well as by
   clicking the territory. Accent-insensitive matching. */
const stripAccents = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function makeSearch(entries, onPick, placeholder) {
  const wrap = document.createElement("div");
  wrap.className = "map-search";
  const input = document.createElement("input");
  input.type = "search";
  input.placeholder = placeholder || "Rechercher…";
  input.setAttribute("autocomplete", "off");
  const results = document.createElement("div");
  results.className = "map-results";
  wrap.appendChild(input);
  wrap.appendChild(results);

  const render = (q) => {
    const nq = stripAccents(q.trim());
    if (!nq) { results.classList.remove("open"); results.innerHTML = ""; return; }
    const matches = entries
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => stripAccents(e.label).includes(nq))
      .slice(0, 40);
    results.innerHTML = matches.length
      ? matches.map(({ e, i }) =>
          `<div class="mr-item" data-i="${i}">${esc(e.label)}` +
          (e.group ? `<span class="mr-g">${esc(e.group)}</span>` : "") + `</div>`).join("")
      : `<div class="mr-item mr-none">Aucun résultat</div>`;
    results.classList.add("open");
  };

  input.addEventListener("input", () => render(input.value));
  input.addEventListener("focus", () => render(input.value));
  results.addEventListener("click", (ev) => {
    const it = ev.target.closest(".mr-item");
    if (!it || it.classList.contains("mr-none")) return;
    const entry = entries[+it.dataset.i];
    if (!entry) return;
    input.value = entry.label;
    results.classList.remove("open");
    onPick(entry.value);
  });
  document.addEventListener("click", (ev) => { if (!wrap.contains(ev.target)) results.classList.remove("open"); });
  return wrap;
}
window.makeSearch = makeSearch;
window.CARTES = window.CARTES || {};

/* One shared search for all three maps: a combined index of every territory,
   placed at the top-right of the eyebrow. Picking a result switches to that
   map and selects the region. Built on DOMContentLoaded, after each map has
   registered its entries into window.CARTES.
   Registries may carry per-entry group labels (entry.group overrides
   reg.groupLabel) and a custom reg.pick(value) instead of the default
   "switch map + select territory" — used by the tables-de-quartier member
   index ("tdqm"), whose entries select a table then highlight the member. */
function buildCartesSearch() {
  const order = ["sante", "ville", "tdq", "tdqm"];
  const combined = [];
  order.forEach((k) => {
    const reg = window.CARTES[k];
    if (!reg) return;
    reg.entries.forEach((e) => combined.push({ label: e.label, value: k + "§" + e.value, group: e.group || reg.groupLabel }));
  });
  if (!combined.length) return;
  const pick = (v) => {
    const i = v.indexOf("§");
    const k = v.slice(0, i), raw = v.slice(i + 1);
    const reg = window.CARTES[k];
    if (!reg) return;
    if (reg.pick) { reg.pick(raw); return; }
    if (window.showCartesMap) window.showCartesMap(k);
    if (reg.select) reg.select(raw);
  };
  document.querySelectorAll("#view-cartes .map-eyebrow").forEach((eb) => {
    eb.appendChild(makeSearch(combined, pick)); // placeholder par défaut : « Rechercher… »
  });
}
document.addEventListener("DOMContentLoaded", buildCartesSearch);

initNav();
initCartes();
