/* Ville de Montréal — rendu de la carte des arrondissements (utilise createMap de app.js). */

/* ---- HTML builders -------------------------------------------------------
   All interpolated data passes through esc(); structural markup is literal. */
const sectionsHTML = (sections) => sections.map((s) =>
  `<div class="block"><p class="block-title">${esc(s.dir)}</p>` +
  (s.divs && s.divs.length
    ? `<ul class="items">${s.divs.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`
    : "") +
  `</div>`).join("");

const groupsHTML = (groups) => groups.map((g) =>
  `<div class="block"><p class="block-title">${esc(g.group)}</p>` +
  `<ul class="items">${g.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("");

/* ---- Ville de Montréal: arrondissements map ------------------------------ */
function initVilleMap() {
  const svg = el("ville-map");
  const panel = el("ville-panel");
  if (!svg || !panel) return;
  const map = createMap({
    svg,
    panel,
    shapes:  GEOMETRY.boroughs,
    context: GEOMETRY.suburbs,
    lookup:  (slug) => BOROUGHS[slug],
    renderPanel: (b) =>
      `<h2>${esc(b.name)}</h2><hr class="rule">${sectionsHTML(b.sections)}`,
    renderLanding: () => {
      const arr = Object.keys(BOROUGHS).map((s) => BOROUGHS[s].name)
        .sort((a, b) => a.localeCompare(b, "fr"));
      const villes = Object.keys(GEOMETRY.suburbs).slice()
        .sort((a, b) => a.localeCompare(b, "fr"));
      const PDF_ICON =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
      return `<h2>Ville de Montréal</h2><hr class="rule">` +
        `<p class="intro">L'agglomération de Montréal compte 19 arrondissements et 15 villes liées. ` +
        `Cliquez un territoire sur la carte pour voir son organisation.</p>` +
        `<div class="block"><p class="block-title">Arrondissements (19)</p>` +
        `<ul class="items">${arr.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>` +
        `<div class="block"><p class="block-title">Villes liées (15)</p>` +
        `<ul class="items">${villes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>` +
        `<div class="map-extra"><p class="block-title">Organigramme municipal</p>` +
        `<div class="mx-btns"><a class="mx-btn" href="https://ville.montreal.qc.ca/pls/portal/docs/page/intra_fr/media/documents/organigramme.pdf" target="_blank" rel="noopener">${PDF_ICON}<span class="mx-lab">Organigramme de la Ville de Montréal (PDF)</span></a></div></div>`;
    },
    // villes liées : cliquables, le panneau affiche simplement le nom de la ville
    contextRender: (name) =>
      `<h2>${esc(name)}</h2><hr class="rule"><p class="intro">Ville liée de l'agglomération de Montréal.</p>`,
  });
  // clicking the logo returns to the central-services landing state
  el("ville-logo")?.addEventListener("click", map.reset);

  // register this map's regions for the shared "Cartes" search (built in app.js)
  window.CARTES = window.CARTES || {};
  window.CARTES.ville = {
    groupLabel: "Ville de Montréal",
    select: map.select,
    entries: Object.keys(BOROUGHS).map((slug) => ({ label: BOROUGHS[slug].name, value: slug }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr")),
  };
}

initVilleMap();
