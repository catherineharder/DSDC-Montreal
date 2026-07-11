/* Députés de l'île de Montréal — carte des 27 circonscriptions provinciales
   (Assemblée nationale du Québec), colorées par parti du député ou de la
   députée en poste (voir assets/data/deputes.data.js, fichier généré).
   Réutilise createMap d'app.js ; chaque tracé porte son --accent de parti,
   repris par les règles .arr (fill/hover/actif) sans CSS additionnel. */

function initDeputesMap() {
  const svg = el("deputes-map");
  const panel = el("deputes-panel");
  if (!svg || !panel || typeof DEPUTES_GEOMETRY === "undefined") return;

  const lookup = (slug) => (DEPUTES[slug] ? { ...DEPUTES[slug], slug } : null);
  const partyColor = (d) => PARTY_COLORS[d.partyShort] || PARTY_COLORS.IND;
  const partyDot = (d) =>
    `<span class="party-dot" style="background:${partyColor(d)}"></span>`;

  // décomptes par parti (pour l'accueil du panneau)
  const counts = {};
  Object.values(DEPUTES).forEach((d) => { counts[d.party] = (counts[d.party] || 0) + 1; });
  const countsHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([party, n]) => {
      const short = Object.values(DEPUTES).find((d) => d.party === party).partyShort;
      return `<li>${partyDot({ partyShort: short })}${esc(party)} — ${n} député${n > 1 ? "s" : ""}</li>`;
    }).join("");

  const map = createMap({
    svg,
    panel,
    shapes: DEPUTES_GEOMETRY,
    lookup,
    renderPanel: (d) =>
      `<h2>${esc(d.name)}</h2><hr class="rule">` +
      `<p class="depute-nom">${esc(d.depute)}</p>` +
      `<p class="depute-parti">${partyDot(d)}${esc(d.party)}</p>` +
      `<div class="block"><p class="block-title">Coordonnées</p><ul class="items">` +
      (d.email ? `<li><a class="tdq-org" href="mailto:${esc(d.email)}">${esc(d.email)}</a></li>` : "") +
      (d.url ? `<li><a class="tdq-org" href="${esc(d.url)}" target="_blank" rel="noopener">Fiche à l'Assemblée nationale</a></li>` : "") +
      `</ul></div>`,
    renderLanding: () =>
      `<h2>Députés de l'île de Montréal</h2><hr class="rule">` +
      `<p class="intro">Les 27 circonscriptions électorales provinciales de l'île de Montréal ` +
      `et leur député ou députée à l'Assemblée nationale du Québec (43<sup>e</sup> législature : ` +
      `élections générales de 2022, élections partielles et changements d'allégeance depuis). ` +
      `Cliquez une circonscription pour afficher son député ou sa députée.</p>` +
      `<ul class="items depute-counts">${countsHTML}</ul>` +
      `<p class="intro">Carte électorale de 2017, en vigueur pour la législature actuelle. ` +
      `Source : Assemblée nationale du Québec (via Represent / Open North), juillet 2026.</p>`,
  });

  // couleur de parti : chaque tracé reçoit son --accent (utilisé par .arr)
  svg.querySelectorAll(".arr").forEach((p) => {
    const d = DEPUTES[p.dataset.slug];
    if (d) p.style.setProperty("--accent", partyColor(d));
  });

  // register this map's regions for the shared "Cartes" search (built in app.js) :
  // chaque circonscription est trouvable par son nom ET par le nom de son député.
  window.CARTES = window.CARTES || {};
  window.CARTES.deputes = {
    groupLabel: "Circonscription",
    select: map.select,
    entries: Object.keys(DEPUTES).flatMap((slug) => [
      { label: DEPUTES[slug].name, value: slug },
      { label: DEPUTES[slug].depute, value: slug, group: "Député·e · " + DEPUTES[slug].name },
    ]).sort((a, b) => a.label.localeCompare(b.label, "fr")),
  };
}

initDeputesMap();
