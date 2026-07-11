/* Indicateurs — carte des indicateurs de développement social et communautaire,
   à l'échelle des 32 territoires de table de quartier.
   Réutilise la géométrie de la carte Tables de quartier (tables-quartier.data.js) :
   silhouette de l'île, secteurs sans table (inertes) et 32 territoires cliquables.
   Les valeurs viennent d'assets/data/indicateurs.data.js (généré par
   tools/build_indicateurs.py).

   Structure : un sous-onglet (eyebrow) par INDICATEUR ; un indicateur peut avoir
   plusieurs DIMENSIONS (p. ex. défavorisation matérielle / sociale), basculées
   par le sélecteur dans l'en-tête de carte. Le panneau de droite présente
   toujours toutes les dimensions du territoire sélectionné.

   Indicateur 1 : indice de défavorisation matérielle et sociale (IDMS, INSPQ),
   2011-2016-2021, % de la population en quintiles régionaux 4-5 (RSS Montréal). */

function initIndicMap() {
  const svg = el("indic-map");
  const panel = el("indic-panel");
  const eyebrow = el("indic-eyebrow");
  const dimsEl = el("indic-dims");
  const legend = el("indic-legend");
  const title = el("indic-title");
  if (!svg || !panel || typeof TDQ_GEOMETRY === "undefined") return;

  const DEFAVO = (typeof INDIC_DEFAVO !== "undefined") ? INDIC_DEFAVO : null;

  const PCT = (v) => (v == null ? "n. d." : v.toFixed(0).replace(".", ",") + " %");
  const q45 = (dist) => dist[3] + dist[4];

  /* couleurs par dimension — cohérentes de la carte au panneau (orange = matérielle,
     bleu = sociale : paire distinguable en vision des couleurs déficiente) */
  const DIM = {
    mat: { lbl: "matérielle", short: "Matérielle", c: "#bf4a12",
           pal6: ["#fdeee3", "#fbcfae", "#f7a370", "#e86f31", "#bf4a12", "#873108"],
           ramp5: ["#fdeee3", "#fbcfae", "#f7a370", "#e86f31", "#a33a10"] },
    soc: { lbl: "sociale", short: "Sociale", c: "#2b6f9e",
           pal6: ["#eaf2f7", "#c8ddeb", "#93bed8", "#5695bf", "#2b6f9e", "#174e74"],
           ramp5: ["#eaf2f7", "#c8ddeb", "#93bed8", "#5695bf", "#225980"] },
  };

  /* mini-graphique d'évolution : % de la population en quintiles 4-5, deux courbes
     (matérielle / sociale) étiquetées directement, référence Montréal à 40 %
     (par construction, 40 % de la population régionale est en Q4-Q5 chaque année). */
  const trendChart = (tr) => {
    if (!tr || !tr.years || tr.years.length < 2) return "";
    const W = 300, H = 168, L = 26, R = 74, T = 20, B = 22;
    const iw = W - L - R, ih = H - T - B;
    const x = (i) => L + iw * i / (tr.years.length - 1);
    const y = (v) => T + ih * (1 - v / 100);
    const series = ["mat", "soc"].filter((d) => tr[d] && tr[d].some((v) => v != null));
    // étiquettes de fin de courbe : écartées si les deux lignes se terminent proches
    const endY = {};
    series.forEach((d) => { const v = tr[d][tr[d].length - 1]; endY[d] = v == null ? null : y(v); });
    if (series.length === 2 && endY.mat != null && endY.soc != null && Math.abs(endY.mat - endY.soc) < 14) {
      const mid = (endY.mat + endY.soc) / 2, up = endY.mat <= endY.soc ? "mat" : "soc", dn = up === "mat" ? "soc" : "mat";
      endY[up] = mid - 7; endY[dn] = mid + 7;
    }
    const lineFor = (d) => {
      const vals = tr[d], col = DIM[d].c;
      const pts = vals.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(" ");
      const dots = vals.map((v, i) => v == null ? "" :
        `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${col}"/>` +
        `<text x="${x(i)}" y="${y(v) - 7}" text-anchor="middle" class="tc-val" fill="${col}">${Math.round(v)}</text>`).join("");
      return `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round"/>` + dots +
        (endY[d] == null ? "" : `<text x="${x(vals.length - 1) + 8}" y="${endY[d] + 3.5}" class="tc-lab" fill="${col}">${DIM[d].short}</text>`);
    };
    return `<svg class="trend-svg" viewBox="0 0 ${W} ${H}" role="img" ` +
      `aria-label="Évolution du pourcentage de population en quintiles 4-5, ${tr.years.join(", ")}">` +
      `<line x1="${L}" y1="${y(40)}" x2="${W - R + 4}" y2="${y(40)}" stroke="#9a948a" stroke-width="1" stroke-dasharray="4 3"/>` +
      `<text x="${L}" y="${y(40) + 12}" class="tc-ref">Montréal : 40 %</text>` +
      `<line x1="${L}" y1="${y(0)}" x2="${W - R + 4}" y2="${y(0)}" stroke="#dcd6c8" stroke-width="1"/>` +
      tr.years.map((yr, i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="tc-axis">${yr}</text>`).join("") +
      series.map(lineFor).join("") +
      `</svg>`;
  };

  /* ---- registre des indicateurs (un sous-onglet chacun) ------------------- */
  const GROUPS = [{
    id: "defavo",
    label: "Défavorisation",
    available: !!DEFAVO,
    breaks: [20, 30, 40, 50, 60],
    dims: ["mat", "soc"],
    dimTitle: (d) => "Défavorisation " + DIM[d].lbl,
    value: (slug, d) => {
      const r = DEFAVO && DEFAVO.quartiers[slug];
      return r ? q45(r[d]) : null;
    },
    pal: (d) => DIM[d].pal6,
    legendTitle: (d) => "Défavorisation " + DIM[d].lbl + " (IDMS 2021)",
    legendNote: "% de la population en quintiles 4-5\n(référence : région de Montréal)",
    landing: () =>
      `<p class="intro"><strong>Indice de défavorisation matérielle et sociale (IDMS)</strong> — l'indice de ` +
      `l'INSPQ résume, pour chaque aire de diffusion (400 à 700 personnes), la dimension <strong>matérielle</strong> ` +
      `(revenu, emploi, scolarité) et la dimension <strong>sociale</strong> (personnes vivant seules, familles ` +
      `monoparentales, personnes séparées, divorcées ou veuves) de la défavorisation. La carte montre la part de ` +
      `la population de chaque territoire vivant dans les aires de diffusion les plus défavorisées ` +
      `(quintiles 4-5) de la région de Montréal, en 2021 ; le bouton au-dessus de la carte bascule entre les ` +
      `deux dimensions.</p>` +
      `<p class="intro">Cliquez un territoire pour voir les deux dimensions, l'évolution 2011-2021 et le détail ` +
      `par quintile.</p>`,
    panel: (slug) => {
      const r = DEFAVO && DEFAVO.quartiers[slug];
      if (!r) return `<p class="intro">Données non disponibles pour ce territoire.</p>`;
      const bars = (dist, ramp) => [0, 1, 2, 3, 4].map((i) =>
        `<div class="iq-row"><span class="lab">Q${i + 1}</span>` +
        `<div class="iq-bar"><span style="width:${Math.min(100, dist[i])}%;background:${ramp[i]}"></span></div>` +
        `<span class="iq-val">${dist[i].toFixed(1).replace(".", ",")} %</span></div>`).join("");
      const trend = trendChart(r.trend);
      return (
        `<div class="indic-kpi">` +
        `<div class="kpi"><div class="n" style="color:${DIM.mat.c}">${PCT(q45(r.mat))}</div><div class="l">population en quintiles 4-5 de défavorisation <strong>matérielle</strong> (2021)</div></div>` +
        `<div class="kpi"><div class="n" style="color:${DIM.soc.c}">${PCT(q45(r.soc))}</div><div class="l">population en quintiles 4-5 de défavorisation <strong>sociale</strong> (2021)</div></div>` +
        `</div>` +
        `<p class="intro" style="margin-top:10px">Population 2021 : ${r.pop.toLocaleString("fr-CA")} · ${r.nad} aires de diffusion</p>` +
        (trend
          ? `<p class="iq-title">Évolution — % en quintiles 4-5</p>` + trend +
            `<p class="iq-note">L'IDMS est une mesure <strong>relative</strong> : les quintiles sont recalculés à chaque ` +
            `recensement. La courbe montre la position du territoire par rapport au reste de la région — ` +
            `pas l'évolution absolue de ses conditions de vie.</p>`
          : "") +
        `<p class="iq-title">Défavorisation matérielle — répartition par quintile (2021)</p>${bars(r.mat, DIM.mat.ramp5)}` +
        `<p class="iq-title">Défavorisation sociale — répartition par quintile (2021)</p>${bars(r.soc, DIM.soc.ramp5)}` +
        `<p class="iq-note">Q1 = 20 % le plus favorisé … Q5 = 20 % le plus défavorisé de la région de Montréal (RSS-06). ` +
        `Population des aires de diffusion (AD) affectée au territoire de chaque table de quartier. ` +
        `Source : INSPQ, Indice de défavorisation matérielle et sociale ; Statistique Canada, recensements 2011-2021.</p>`
      );
    },
  }];

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
  let group = GROUPS[0];
  let dim = group.dims ? group.dims[0] : null;
  let selected = null;

  const classOf = (v) => {
    if (v == null) return -1;
    let i = 0;
    while (i < group.breaks.length && v >= group.breaks[i]) i++;
    return i;
  };

  const paint = () => {
    const pal = group.pal(dim);
    Object.entries(paths).forEach(([slug, p]) => {
      const v = group.value(slug, dim);
      const c = classOf(v);
      p.classList.toggle("nodata", c < 0);
      if (c >= 0) p.style.fill = pal[c]; else p.style.removeProperty("fill");
    });
  };

  const renderLegend = () => {
    if (!legend) return;
    if (!group.available) { legend.innerHTML = ""; legend.style.display = "none"; return; }
    legend.style.display = "";
    const pal = group.pal(dim);
    const rows = pal.map((c, i) => {
      const lo = i === 0 ? null : group.breaks[i - 1];
      const hi = i === pal.length - 1 ? null : group.breaks[i];
      const lab = lo == null ? `< ${hi} %` : hi == null ? `≥ ${lo} %` : `${lo} – ${hi} %`;
      return `<div><span class="sw" style="background:${c}"></span>${lab}</div>`;
    }).join("");
    legend.innerHTML =
      `<div style="font-weight:700">${esc(group.legendTitle(dim))}</div>` +
      rows +
      `<div style="color:var(--muted);white-space:pre-line">${esc(group.legendNote)}</div>`;
  };

  const renderLanding = () => {
    panel.innerHTML =
      `<h2>Indicateurs par quartier</h2><hr class="rule">` +
      `<p class="intro">Des indicateurs de développement social et communautaire, cartographiés à l'échelle ` +
      `des territoires des 32 tables de quartier de l'île de Montréal — la même carte que la section Cartes.</p>` +
      (group.available ? group.landing()
        : `<p class="intro">Données en cours d'intégration.</p>`);
  };

  const select = (slug) => {
    if (!group.available) return;
    selected = slug;
    Object.values(paths).forEach((p) => p.classList.remove("active"));
    if (paths[slug]) paths[slug].classList.add("active");
    panel.innerHTML = `<h2>${esc(lookup(slug).name)}</h2><hr class="rule">` + group.panel(slug);
    panel.scrollTop = 0;
  };

  const renderDims = () => {
    if (!dimsEl) return;
    if (!group.dims || group.dims.length < 2) { dimsEl.innerHTML = ""; return; }
    dimsEl.innerHTML = group.dims.map((d) =>
      `<button data-dim="${d}" style="--dim-c:${DIM[d].c}" aria-current="${d === dim}">${esc(DIM[d].short)}</button>`).join("");
  };

  const setDim = (d) => {
    dim = d;
    if (dimsEl) [...dimsEl.querySelectorAll("button")].forEach((b) =>
      b.setAttribute("aria-current", String(b.dataset.dim === dim)));
    if (title) title.textContent = group.dimTitle ? group.dimTitle(dim) : group.label;
    paint();
    renderLegend();
  };

  const setGroup = (id) => {
    group = GROUPS.find((g) => g.id === id) || GROUPS[0];
    dim = group.dims ? group.dims[0] : null;
    if (eyebrow) [...eyebrow.querySelectorAll(".map-pick")].forEach((b) =>
      b.setAttribute("aria-current", b.dataset.group === group.id ? "page" : "false"));
    renderDims();
    setDim(dim);
    if (selected) select(selected); else renderLanding();
  };

  if (eyebrow) {
    eyebrow.innerHTML = GROUPS.map((g) =>
      `<button class="map-pick" data-group="${g.id}">${esc(g.label)}</button>`).join("");
    eyebrow.addEventListener("click", (e) => {
      const b = e.target.closest(".map-pick");
      if (b) setGroup(b.dataset.group);
    });
  }
  if (dimsEl) {
    dimsEl.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b && b.dataset.dim !== dim) setDim(b.dataset.dim);
    });
  }

  setGroup(GROUPS[0].id);
}

initIndicMap();
