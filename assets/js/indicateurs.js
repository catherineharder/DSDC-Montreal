/* Indicateurs — carte des indicateurs de développement social et communautaire,
   à l'échelle des 32 territoires de table de quartier.
   Réutilise la géométrie de la carte Tables de quartier (tables-quartier.data.js) :
   silhouette de l'île, secteurs sans table (inertes) et 32 territoires cliquables.
   Les valeurs viennent d'assets/data/indicateurs.data.js (fichier généré).

   Premier indicateur : indice de défavorisation matérielle et sociale (IDMS, INSPQ 2021),
   agrégé par territoire — % de la population résidant dans une aire de diffusion des
   quintiles 4-5 (référence régionale : RSS de Montréal). D'autres indicateurs
   s'ajoutent au registre INDIC_REGISTRY ci-dessous. */

function initIndicMap() {
  const svg = el("indic-map");
  const panel = el("indic-panel");
  const eyebrow = el("indic-eyebrow");
  const legend = el("indic-legend");
  const title = el("indic-title");
  if (!svg || !panel || typeof TDQ_GEOMETRY === "undefined") return;

  const DEFAVO = (typeof INDIC_DEFAVO !== "undefined") ? INDIC_DEFAVO : null;

  /* ---- registre des indicateurs affichables sur la carte -----------------
     id      clé interne
     label   libellé de l'eyebrow / titre
     value   (slug) -> valeur numérique à cartographier (null = pas de donnée)
     fmt     (v) -> texte affiché
     breaks  bornes des classes (croissantes) ; palette = breaks.length+1 couleurs
     pal     couleurs des classes (clair -> foncé)
     legendTitle / legendNote
     panel   (slug, record) -> HTML détaillé du panneau                        */
  const PCT = (v) => (v == null ? "n. d." : v.toFixed(0).replace(".", ",") + " %");
  const q45 = (dist) => dist[3] + dist[4];

  const defavoIndic = (dim, lbl) => ({
    id: "defavo-" + dim,
    label: "Défavorisation " + lbl,
    available: !!DEFAVO,
    value: (slug) => {
      const r = DEFAVO && DEFAVO.quartiers[slug];
      return r ? q45(r[dim]) : null;
    },
    fmt: PCT,
    breaks: [20, 30, 40, 50, 60],
    pal: ["#fdeee3", "#fbcfae", "#f7a370", "#e86f31", "#bf4a12", "#873108"],
    legendTitle: "Défavorisation " + lbl + " (IDMS 2021)",
    legendNote: "% de la population en quintiles 4-5\n(référence : région de Montréal)",
    panel: (slug, t) => {
      const r = DEFAVO && DEFAVO.quartiers[slug];
      if (!r) return `<p class="intro">Données non disponibles pour ce territoire.</p>`;
      const bars = (dist, pal) => [0, 1, 2, 3, 4].map((i) =>
        `<div class="iq-row"><span class="lab">Q${i + 1}</span>` +
        `<div class="iq-bar"><span style="width:${Math.min(100, dist[i])}%;background:${pal[i]}"></span></div>` +
        `<span class="iq-val">${dist[i].toFixed(1).replace(".", ",")} %</span></div>`).join("");
      const PAL_M = ["#c9dbc9", "#e9e3cf", "#f7c9a0", "#e86f31", "#873108"];
      return (
        `<div class="indic-kpi">` +
        `<div class="kpi"><div class="n">${PCT(q45(r.mat))}</div><div class="l">population en quintiles 4-5 de défavorisation <strong>matérielle</strong></div></div>` +
        `<div class="kpi"><div class="n">${PCT(q45(r.soc))}</div><div class="l">population en quintiles 4-5 de défavorisation <strong>sociale</strong></div></div>` +
        `</div>` +
        `<p class="intro" style="margin-top:10px">Population 2021 : ${r.pop.toLocaleString("fr-CA")} · ${r.nad} aires de diffusion</p>` +
        `<p class="iq-title">Défavorisation matérielle — répartition par quintile</p>${bars(r.mat, PAL_M)}` +
        `<p class="iq-title">Défavorisation sociale — répartition par quintile</p>${bars(r.soc, PAL_M)}` +
        `<p class="iq-note">Q1 = 20 % le plus favorisé … Q5 = 20 % le plus défavorisé de la région de Montréal (RSS-06). ` +
        `Population des aires de diffusion (AD) affectée au territoire de chaque table de quartier. ` +
        `Source : INSPQ, Indice de défavorisation matérielle et sociale 2021 ; Statistique Canada, Recensement 2021.</p>`
      );
    },
  });

  const INDIC_REGISTRY = [
    defavoIndic("mat", "matérielle"),
    defavoIndic("soc", "sociale"),
  ];

  /* ---- fond de carte : silhouette + secteurs sans table + 32 territoires -- */
  if (typeof TDQ_NOTABLE !== "undefined" && TDQ_NOTABLE) {
    const nt = document.createElementNS(SVG_NS, "path");
    nt.setAttribute("d", TDQ_NOTABLE);
    nt.setAttribute("class", "tdq-notable");
    svg.appendChild(nt);
  }

  const lookup = (slug) =>
    (typeof TDQ_TABLES !== "undefined" && TDQ_TABLES[slug]) ? { ...TDQ_TABLES[slug], slug } : { name: slug, slug };

  const paths = {};
  Object.entries(TDQ_GEOMETRY.tables).forEach(([slug, d]) => {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    p.setAttribute("class", "arr");
    p.dataset.slug = slug;
    p.setAttribute("tabindex", "0");
    p.setAttribute("role", "button");
    p.setAttribute("aria-label", lookup(slug).name);
    p.addEventListener("click", () => select(slug));
    p.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(slug); }
    });
    svg.appendChild(p);
    paths[slug] = p;
  });

  if (typeof TDQ_SILHOUETTE !== "undefined") {
    const outline = document.createElementNS(SVG_NS, "path");
    outline.setAttribute("d", TDQ_SILHOUETTE);
    outline.setAttribute("class", "tdq-outline");
    svg.appendChild(outline);
  }

  /* ---- état + rendu ------------------------------------------------------ */
  let current = INDIC_REGISTRY[0];
  let selected = null;

  const classOf = (ind, v) => {
    if (v == null) return -1;
    let i = 0;
    while (i < ind.breaks.length && v >= ind.breaks[i]) i++;
    return i;
  };

  const paint = () => {
    Object.entries(paths).forEach(([slug, p]) => {
      const v = current.value(slug);
      const c = classOf(current, v);
      p.classList.toggle("nodata", c < 0);
      if (c >= 0) p.style.fill = current.pal[c]; else p.style.removeProperty("fill");
    });
  };

  const renderLegend = () => {
    if (!legend) return;
    if (!current.available) { legend.innerHTML = ""; legend.style.display = "none"; return; }
    legend.style.display = "";
    const rows = current.pal.map((c, i) => {
      const lo = i === 0 ? null : current.breaks[i - 1];
      const hi = i === current.pal.length - 1 ? null : current.breaks[i];
      const lab = lo == null ? `< ${hi} %` : hi == null ? `≥ ${lo} %` : `${lo} – ${hi} %`;
      return `<div><span class="sw" style="background:${c}"></span>${lab}</div>`;
    }).join("");
    legend.innerHTML =
      `<div style="font-weight:700">${esc(current.legendTitle)}</div>` +
      rows +
      `<div style="color:var(--muted);white-space:pre-line">${esc(current.legendNote)}</div>`;
  };

  const renderLanding = () => {
    panel.innerHTML =
      `<h2>Indicateurs par quartier</h2><hr class="rule">` +
      `<p class="intro">Des indicateurs de développement social et communautaire, cartographiés à l'échelle ` +
      `des territoires des 32 tables de quartier de l'île de Montréal — la même carte que la section Cartes.</p>` +
      (current.available
        ? `<p class="intro"><strong>${esc(current.label)}</strong> — l'indice de défavorisation matérielle et sociale ` +
          `(IDMS) de l'INSPQ résume, pour chaque aire de diffusion (400 à 700 personnes), la dimension ` +
          `<strong>matérielle</strong> (revenu, emploi, scolarité) et la dimension <strong>sociale</strong> ` +
          `(personnes vivant seules, familles monoparentales, personnes séparées, divorcées ou veuves) de la défavorisation. ` +
          `La carte montre la part de la population de chaque territoire vivant dans les aires de diffusion les plus ` +
          `défavorisées (quintiles 4-5) de la région de Montréal.</p>` +
          `<p class="intro">Cliquez un territoire pour le détail par quintile.</p>`
        : `<p class="intro">Données de défavorisation en cours d'intégration.</p>`);
  };

  const select = (slug) => {
    if (!current.available) return;
    selected = slug;
    Object.values(paths).forEach((p) => p.classList.remove("active"));
    if (paths[slug]) paths[slug].classList.add("active");
    const t = lookup(slug);
    panel.innerHTML = `<h2>${esc(t.name)}</h2><hr class="rule">` + current.panel(slug, t);
    panel.scrollTop = 0;
  };

  const setIndic = (id) => {
    current = INDIC_REGISTRY.find((x) => x.id === id) || INDIC_REGISTRY[0];
    if (eyebrow) [...eyebrow.querySelectorAll(".map-pick")].forEach((b) =>
      b.setAttribute("aria-current", b.dataset.indic === current.id ? "page" : "false"));
    if (title) title.textContent = current.label;
    paint();
    renderLegend();
    if (selected) select(selected); else renderLanding();
  };

  if (eyebrow) {
    eyebrow.innerHTML = INDIC_REGISTRY.map((x) =>
      `<button class="map-pick" data-indic="${x.id}">${esc(x.label)}</button>`).join("");
    eyebrow.addEventListener("click", (e) => {
      const b = e.target.closest(".map-pick");
      if (b) setIndic(b.dataset.indic);
    });
  }

  setIndic(INDIC_REGISTRY[0].id);
}

initIndicMap();
