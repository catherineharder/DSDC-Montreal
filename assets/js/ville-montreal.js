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
    renderLanding: () =>
      `<h2>Services centraux</h2><hr class="rule">` +
      `<p class="intro">Organisation municipale 2026, regroupée par direction. ` +
      `Cliquez un arrondissement pour voir ses directions et divisions.</p>` +
      groupsHTML(CITY_GROUPS),
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
