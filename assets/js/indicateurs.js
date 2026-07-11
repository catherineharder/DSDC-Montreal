/* Indicateurs — cartes des indicateurs de développement social et communautaire.

   Trois découpages territoriaux, basculés par le sélecteur SQ / VdM / TQ :
     sq  — réseaux locaux de services (géométrie de la carte Santé Québec) ;
     vdm — arrondissements et villes liées (carte Ville de Montréal) ;
     tq  — territoires des 32 tables de quartier (carte Tables de quartier).
   Les géométries viennent des fichiers .data.js des cartes de la section Cartes ;
   les valeurs viennent d'assets/data/indicateurs.data.js (INDIC_DATA, généré par
   tools/build_indicateurs.py).

   Registre GROUPS : un sous-onglet (eyebrow) par indicateur ; un indicateur peut
   avoir plusieurs dimensions (p. ex. défavorisation matérielle / sociale),
   basculées par le second sélecteur. Cliquer un territoire affiche son détail ;
   cliquer hors de l'île revient à la fiche de l'indicateur. La barre entre la
   carte et le panneau se glisse pour redimensionner. */

function initIndicMap() {
  const svg = el("indic-map");
  const panel = el("indic-panel");
  const eyebrow = el("indic-eyebrow");
  const geosEl = el("indic-geos");
  const dimsEl = el("indic-dims");
  const legend = el("indic-legend");
  const title = el("indic-title");
  if (!svg || !panel || typeof TDQ_GEOMETRY === "undefined") return;

  const DATA = (typeof INDIC_DATA !== "undefined") ? INDIC_DATA : null;

  const PCT = (v) => (v == null ? "n. d." : v.toFixed(0).replace(".", ",") + " %");
  const q45 = (dist) => dist[3] + dist[4];

  /* ---- découpages territoriaux -------------------------------------------
     shapes()  : { slug: pathD } régions choroplèthes cliquables
     backdrop(): { slug: pathD } régions inertes (secteurs sans table)
     name(slug): libellé du territoire
     unit      : formulation utilisée dans les textes du panneau              */
  const RLS_NAMES = {};
  if (typeof SANTE !== "undefined") {
    Object.values(SANTE).forEach((t) =>
      (t.rls || []).forEach((r) => { RLS_NAMES[r.slug] = r.nom; }));
  }
  const GEOS = [
    { id: "sq", label: "SQ", full: "Santé Québec — réseaux locaux de services (RLS)",
      unit: "réseaux locaux de services (RLS)",
      shapes: () => (typeof SANTE_RLS !== "undefined" ? SANTE_RLS : {}),
      backdrop: () => ({}),
      name: (slug) => RLS_NAMES[slug] || slug },
    { id: "vdm", label: "VdM", full: "Ville de Montréal — arrondissements et villes liées",
      unit: "arrondissements et villes liées",
      shapes: () => (typeof GEOMETRY !== "undefined"
        ? { ...GEOMETRY.suburbs, ...GEOMETRY.boroughs } : {}),
      backdrop: () => ({}),
      name: (slug) => (typeof BOROUGHS !== "undefined" && BOROUGHS[slug])
        ? BOROUGHS[slug].name : slug },
    { id: "tq", label: "TQ", full: "Tables de quartier — 32 territoires",
      unit: "territoires des 32 tables de quartier",
      shapes: () => TDQ_GEOMETRY.tables,
      backdrop: () => (typeof TDQ_NOTABLE !== "undefined" && TDQ_NOTABLE
        ? { notable: TDQ_NOTABLE } : {}),
      name: (slug) => (typeof TDQ_TABLES !== "undefined" && TDQ_TABLES[slug])
        ? TDQ_TABLES[slug].name : slug },
  ];

  /* ---- couleurs par dimension de la défavorisation ------------------------
     orange = matérielle, bleu = sociale (paire distinguable en vision des
     couleurs déficiente), reprises de la carte au panneau. */
  const DIM = {
    mat: { lbl: "matérielle", short: "Matérielle", c: "#bf4a12",
           pal6: ["#fdeee3", "#fbcfae", "#f7a370", "#e86f31", "#bf4a12", "#873108"],
           ramp5: ["#fdeee3", "#fbcfae", "#f7a370", "#e86f31", "#a33a10"] },
    soc: { lbl: "sociale", short: "Sociale", c: "#2b6f9e",
           pal6: ["#eaf2f7", "#c8ddeb", "#93bed8", "#5695bf", "#2b6f9e", "#174e74"],
           ramp5: ["#eaf2f7", "#c8ddeb", "#93bed8", "#5695bf", "#225980"] },
  };
  const IEMV_PAL6 = ["#f4f0f9", "#ded2ee", "#c0a8dc", "#9d7ac6", "#7a52ac", "#563385"];
  const IEMV_RAMP7 = ["#f4f0f9", "#e3d9f1", "#cbb5e2", "#b08fd2", "#9169bf", "#7247a8", "#552f8a"];
  const MPC_PAL6 = ["#edf5ef", "#cfe5d5", "#a3ccae", "#6fae81", "#3f8a58", "#1e5e3a"];
  const LOG_PAL6 = ["#fdeef3", "#f8ccdc", "#ef9dba", "#dd6494", "#b93a6e", "#8a1f4d"];

  /* mini-graphique d'évolution : % de la population en quintiles 4-5, deux courbes
     étiquetées directement, référence Montréal à 40 % (par construction, 40 % de la
     population régionale est en Q4-Q5 chaque année). */
  const trendChart = (tr) => {
    if (!tr || !tr.years || tr.years.length < 2) return "";
    const W = 300, H = 168, L = 26, R = 74, T = 20, B = 22;
    const iw = W - L - R, ih = H - T - B;
    const x = (i) => L + iw * i / (tr.years.length - 1);
    const y = (v) => T + ih * (1 - v / 100);
    const series = ["mat", "soc"].filter((d) => tr[d] && tr[d].some((v) => v != null));
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

  const barsHTML = (labels, dist, ramp) => labels.map((lab, i) =>
    `<div class="iq-row"><span class="lab">${lab}</span>` +
    `<div class="iq-bar"><span style="width:${Math.min(100, dist[i])}%;background:${ramp[i]}"></span></div>` +
    `<span class="iq-val">${dist[i].toFixed(1).replace(".", ",")} %</span></div>`).join("");

  const rec = (grp, geoId, slug) => {
    const g = DATA && DATA[grp] && DATA[grp].geo[geoId];
    return g ? g[slug] : null;
  };

  /* fabrique d'indicateur « taux simple » : une valeur (%) par territoire,
     comparée à la valeur montréalaise dans le panneau. */
  const rateGroup = (cfg) => ({
    id: cfg.id,
    label: cfg.label,
    available: !!(DATA && DATA[cfg.id]),
    breaks: cfg.breaks,
    dims: null,
    dimTitle: () => cfg.title,
    value: (geoId, slug) => { const r = rec(cfg.id, geoId, slug); return r ? r.v : null; },
    pal: () => cfg.pal,
    legendTitle: () => cfg.legendTitle,
    legendNote: () => cfg.legendNote,
    landing: (geo) => cfg.landing(geo),
    panel: (geo, slug) => {
      const r = rec(cfg.id, geo.id, slug);
      if (!r) return `<p class="intro">Données non disponibles pour ce territoire.</p>`;
      const overall = DATA[cfg.id].meta.overall;
      const dark = cfg.pal[cfg.pal.length - 1];
      return (
        `<div class="indic-kpi">` +
        `<div class="kpi"><div class="n" style="color:${dark}">${PCT(r.v)}</div><div class="l">${cfg.kpiLabel}</div></div>` +
        (overall != null
          ? `<div class="kpi"><div class="n" style="color:var(--muted)">${PCT(overall)}</div><div class="l">île de Montréal (comparaison)</div></div>`
          : "") +
        `</div>` +
        `<p class="intro" style="margin-top:10px">${cfg.baseLine(r)} · ${r.nad} aires de diffusion</p>` +
        `<p class="iq-note">${cfg.note}</p>`
      );
    },
  });

  /* ---- registre des indicateurs (un sous-onglet chacun) ------------------- */
  const GROUPS = [
    {
      id: "defavo",
      label: "Défavorisation",
      available: !!(DATA && DATA.defavo),
      breaks: [20, 30, 40, 50, 60],
      dims: ["mat", "soc"],
      dimTitle: (d) => "Défavorisation " + DIM[d].lbl,
      value: (geoId, slug, d) => { const r = rec("defavo", geoId, slug); return r ? q45(r[d]) : null; },
      pal: (d) => DIM[d].pal6,
      legendTitle: (d) => "Défavorisation " + DIM[d].lbl + " (IDMS 2021)",
      legendNote: () => "% de la population en quintiles 4-5\n(référence : région de Montréal)",
      landing: (geo) =>
        `<p class="intro"><strong>Indice de défavorisation matérielle et sociale (IDMS)</strong> — l'indice de ` +
        `l'INSPQ résume, pour chaque aire de diffusion (400 à 700 personnes), la dimension <strong>matérielle</strong> ` +
        `(revenu, emploi, scolarité) et la dimension <strong>sociale</strong> (personnes vivant seules, familles ` +
        `monoparentales, personnes séparées, divorcées ou veuves) de la défavorisation. La carte montre la part de ` +
        `la population de chaque territoire vivant dans les aires de diffusion les plus défavorisées ` +
        `(quintiles 4-5) de la région de Montréal, en 2021.</p>` +
        `<p class="intro">Découpage affiché : <strong>${esc(geo.full)}</strong>. Cliquez un territoire pour voir ` +
        `les deux dimensions, l'évolution 2011-2021 et le détail par quintile ; cliquez hors de l'île pour ` +
        `revenir à cette fiche.</p>` +
        `<p class="iq-note">Source : INSPQ, <a href="https://www.inspq.qc.ca/defavorisation/indice-de-defavorisation-materielle-et-sociale" ` +
        `target="_blank" rel="noopener">Indice de défavorisation matérielle et sociale</a> ; Statistique Canada, ` +
        `recensements 2011-2021. Population des aires de diffusion affectée aux territoires par point représentatif ` +
        `(TQ), arrondissement de rattachement (VdM) ou code de RLS (SQ).</p>`,
      panel: (geo, slug) => {
        const r = rec("defavo", geo.id, slug);
        if (!r) return `<p class="intro">Données non disponibles pour ce territoire.</p>`;
        const trend = trendChart(r.trend);
        const Q = ["Q1", "Q2", "Q3", "Q4", "Q5"];
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
          `<p class="iq-title">Défavorisation matérielle — répartition par quintile (2021)</p>${barsHTML(Q, r.mat, DIM.mat.ramp5)}` +
          `<p class="iq-title">Défavorisation sociale — répartition par quintile (2021)</p>${barsHTML(Q, r.soc, DIM.soc.ramp5)}` +
          `<p class="iq-note">Q1 = 20 % le plus favorisé … Q5 = 20 % le plus défavorisé de la région de Montréal (RSS-06). ` +
          `Source : INSPQ, Indice de défavorisation matérielle et sociale ; Statistique Canada, recensements 2011-2021.</p>`
        );
      },
    },
    rateGroup({
      id: "mpc",
      label: "Faible revenu",
      title: "Faible revenu (MPC)",
      breaks: [5, 10, 15, 20, 25],
      pal: MPC_PAL6,
      legendTitle: "Faible revenu selon la MPC (2021)",
      legendNote: "% de la population sous la mesure\ndu panier de consommation (2020)",
      kpiLabel: "population en situation de faible revenu selon la <strong>mesure du panier de consommation</strong> (MPC, revenus de 2020)",
      baseLine: (r) => `Population en ménage privé : ${r.pop.toLocaleString("fr-CA")}`,
      note: "La MPC est la mesure officielle de la pauvreté au Canada : elle établit le coût d'un panier de " +
        "biens et services de base (logement, alimentation, vêtements, transport et autres nécessités) et " +
        "compte les personnes dont le revenu disponible n'y suffit pas. Revenus de l'année 2020, marqués par " +
        "les prestations d'urgence de la pandémie (PCU), qui ont abaissé temporairement les taux de faible revenu. " +
        "Source : Statistique Canada, Recensement 2021, profil des aires de diffusion.",
      landing: (geo) =>
        `<p class="intro"><strong>Faible revenu selon la mesure du panier de consommation (MPC)</strong> — la ` +
        `mesure officielle de la pauvreté au Canada : le pourcentage de personnes dont le revenu disponible ne ` +
        `suffit pas au coût d'un panier de biens et services de base dans leur région. La carte montre ce taux ` +
        `pour chaque territoire (revenus de 2020, recensement de 2021).</p>` +
        `<p class="intro">Découpage affiché : <strong>${esc(geo.full)}</strong>. Cliquez un territoire pour le ` +
        `détail ; cliquez hors de l'île pour revenir à cette fiche.</p>` +
        `<p class="iq-note">Les revenus de 2020 incluent les prestations d'urgence de la pandémie (PCU), qui ont ` +
        `temporairement abaissé les taux de faible revenu partout au pays. Source : Statistique Canada, ` +
        `Recensement 2021 ; agrégation par aire de diffusion.</p>`,
    }),
    rateGroup({
      id: "logement",
      label: "Logement",
      title: "Logement — taux d'effort ≥ 30 %",
      breaks: [15, 20, 25, 30, 35],
      pal: LOG_PAL6,
      legendTitle: "Taux d'effort au logement ≥ 30 % (2021)",
      legendNote: "% des ménages consacrant 30 % ou plus\nde leur revenu aux frais de logement",
      kpiLabel: "ménages consacrant <strong>30 % ou plus</strong> de leur revenu aux frais de logement",
      baseLine: (r) => `Ménages privés : ${r.men.toLocaleString("fr-CA")}`,
      note: "Le seuil de 30 % est la norme canadienne d'abordabilité du logement : au-delà, un ménage risque de " +
        "devoir comprimer ses autres dépenses essentielles. Ménages privés dont le rapport frais de " +
        "logement / revenu est calculable (locataires et propriétaires). " +
        "Source : Statistique Canada, Recensement 2021, profil des aires de diffusion.",
      landing: (geo) =>
        `<p class="intro"><strong>Taux d'effort au logement</strong> — le pourcentage des ménages qui consacrent ` +
        `30 % ou plus de leur revenu total aux frais de logement (loyer ou paiements hypothécaires, services ` +
        `publics, taxes). C'est la norme canadienne d'abordabilité : au-delà de ce seuil, le logement gruge les ` +
        `autres dépenses essentielles du ménage.</p>` +
        `<p class="intro">Découpage affiché : <strong>${esc(geo.full)}</strong>. Cliquez un territoire pour le ` +
        `détail ; cliquez hors de l'île pour revenir à cette fiche.</p>` +
        `<p class="iq-note">Source : Statistique Canada, Recensement 2021, profil des aires de diffusion. Les ` +
        `frais de logement de 2021 sont mis en rapport avec les revenus de 2020 (année marquée par les ` +
        `prestations d'urgence de la pandémie).</p>`,
    }),
    {
      id: "iemv",
      label: "Équité des milieux de vie",
      available: !!(DATA && DATA.iemv),
      breaks: [10, 20, 30, 40, 50],
      dims: null,
      dimTitle: () => "Équité des milieux de vie",
      value: (geoId, slug) => { const r = rec("iemv", geoId, slug); return r ? r.p4 : null; },
      pal: () => IEMV_PAL6,
      legendTitle: () => "Équité des milieux de vie (2026)",
      legendNote: () => "% de la population en zone vulnérable\net prioritaire (≥ 4 vulnérabilités sur 6)",
      landing: (geo) =>
        `<p class="intro"><strong>Indice d'équité des milieux de vie (IEMV)</strong> — l'indice de la ` +
        `<strong>Ville de Montréal</strong> compte, pour chaque aire de diffusion, le nombre de vulnérabilités ` +
        `cumulées (0 à 6) parmi six dimensions : sociale, économique, environnementale, accès aux ressources de ` +
        `proximité, accès à la culture, au sport et au loisir, et sécurité urbaine (23 indicateurs, agrégés par ` +
        `analyse en composantes principales). La Ville considère comme <strong>vulnérables et prioritaires</strong> ` +
        `les milieux cumulant au moins 4 vulnérabilités ; la carte montre la part de la population de chaque ` +
        `territoire vivant dans ces zones.</p>` +
        `<p class="intro">Découpage affiché : <strong>${esc(geo.full)}</strong>. Cliquez un territoire pour le ` +
        `détail ; cliquez hors de l'île pour revenir à cette fiche.</p>` +
        `<p class="iq-note">L'IEMV est une mesure relative produite par la Ville de Montréal (version 2026) ; elle ` +
        `sert à prioriser les investissements municipaux et ne permet pas de suivre une évolution dans le temps. ` +
        `Source : <a href="https://donnees.montreal.ca/dataset/indice-equite-milieux-vie" target="_blank" ` +
        `rel="noopener">Ville de Montréal, données ouvertes</a>.</p>`,
      panel: (geo, slug) => {
        const r = rec("iemv", geo.id, slug);
        if (!r) return `<p class="intro">Données non disponibles pour ce territoire.</p>`;
        return (
          `<div class="indic-kpi">` +
          `<div class="kpi"><div class="n" style="color:${IEMV_PAL6[5]}">${PCT(r.p4)}</div><div class="l">population en zone <strong>vulnérable et prioritaire</strong> (≥ 4 vulnérabilités sur 6)</div></div>` +
          `</div>` +
          `<p class="intro" style="margin-top:10px">Population 2021 : ${r.pop.toLocaleString("fr-CA")} · ${r.nad} aires de diffusion</p>` +
          `<p class="iq-title">Répartition — nombre de vulnérabilités cumulées</p>` +
          barsHTML(["0", "1", "2", "3", "4", "5", "6"], r.dist, IEMV_RAMP7) +
          `<p class="iq-note">Nombre de vulnérabilités cumulées par aire de diffusion parmi les 6 dimensions de ` +
          `l'IEMV (Ville de Montréal, version 2026). Mesure relative, non comparable d'une version à l'autre. ` +
          `Source : Ville de Montréal, données ouvertes.</p>`
        );
      },
    },
  ];

  /* ---- état ---------------------------------------------------------------- */
  let geo = GEOS.find((g) => g.id === "tq");
  let group = GROUPS[0];
  let dim = group.dims ? group.dims[0] : null;
  let selected = null;
  let paths = {};

  /* ---- couche cartographique (reconstruite à chaque changement de découpage) */
  const buildLayers = () => {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    paths = {};
    Object.values(geo.backdrop()).forEach((d) => {
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", "tdq-notable");
      svg.appendChild(p);
    });
    Object.entries(geo.shapes()).forEach(([slug, d]) => {
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", "arr");
      p.dataset.slug = slug;
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
      p.setAttribute("aria-label", geo.name(slug));
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
  };

  /* ---- rendu ---------------------------------------------------------------- */
  const classOf = (v) => {
    if (v == null) return -1;
    let i = 0;
    while (i < group.breaks.length && v >= group.breaks[i]) i++;
    return i;
  };

  const paint = () => {
    const pal = group.pal(dim);
    Object.entries(paths).forEach(([slug, p]) => {
      const v = group.value(geo.id, slug, dim);
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
      `<div style="color:var(--muted);white-space:pre-line">${esc(group.legendNote(dim))}</div>`;
  };

  const renderLanding = () => {
    panel.innerHTML =
      `<h2>${esc(group.label)}</h2><hr class="rule">` +
      (group.available ? group.landing(geo)
        : `<p class="intro">Données en cours d'intégration.</p>`);
  };

  const reset = () => {
    selected = null;
    Object.values(paths).forEach((p) => p.classList.remove("active"));
    renderLanding();
    panel.scrollTop = 0;
  };

  const select = (slug) => {
    if (!group.available) return;
    selected = slug;
    Object.values(paths).forEach((p) => p.classList.remove("active"));
    if (paths[slug]) paths[slug].classList.add("active");
    panel.innerHTML = `<h2>${esc(geo.name(slug))}</h2><hr class="rule">` + group.panel(geo, slug);
    panel.scrollTop = 0;
  };

  /* clic hors de l'île (fond du svg) : retour à la fiche de l'indicateur */
  svg.addEventListener("click", (e) => { if (e.target === svg) reset(); });

  /* ---- contrôles ------------------------------------------------------------ */
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
    if (title) title.textContent = group.dimTitle(dim);
    paint();
    renderLegend();
  };

  const setGeo = (id) => {
    geo = GEOS.find((g) => g.id === id) || geo;
    if (geosEl) [...geosEl.querySelectorAll("button")].forEach((b) =>
      b.setAttribute("aria-current", String(b.dataset.geo === geo.id)));
    buildLayers();
    setDim(dim);
    reset(); // les identifiants de territoires diffèrent d'un découpage à l'autre
  };

  const setGroup = (id) => {
    group = GROUPS.find((g) => g.id === id) || GROUPS[0];
    dim = group.dims ? group.dims[0] : null;
    if (eyebrow) [...eyebrow.querySelectorAll(".map-pick")].forEach((b) =>
      b.setAttribute("aria-current", b.dataset.group === group.id ? "page" : "false"));
    renderDims();
    setDim(dim);
    if (selected && group.available && rec(group.id, geo.id, selected)) select(selected);
    else reset();
  };

  if (eyebrow) {
    eyebrow.innerHTML = GROUPS.map((g) =>
      `<button class="map-pick" data-group="${g.id}">${esc(g.label)}</button>`).join("");
    eyebrow.addEventListener("click", (e) => {
      const b = e.target.closest(".map-pick");
      if (b) setGroup(b.dataset.group);
    });
  }
  if (geosEl) {
    geosEl.innerHTML = GEOS.map((g) =>
      `<button data-geo="${g.id}" title="${esc(g.full)}" aria-current="${g.id === geo.id}">${esc(g.label)}</button>`).join("");
    geosEl.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b && b.dataset.geo !== geo.id) setGeo(b.dataset.geo);
    });
  }
  if (dimsEl) {
    dimsEl.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b && b.dataset.dim !== dim) setDim(b.dataset.dim);
    });
  }

  /* ---- barre coulissante entre carte et panneau ----------------------------- */
  const initSplitter = () => {
    const wrap = document.querySelector("#view-indic .wrap");
    const side = wrap && wrap.querySelector(".map-side");
    if (!wrap || !side) return;
    const handle = document.createElement("div");
    handle.className = "split-handle";
    handle.title = "Glisser pour redimensionner";
    wrap.insertBefore(handle, side.nextSibling);
    const KEY = "indicSplit";
    const apply = (p) => { side.style.flex = "0 0 " + p + "%"; };
    let saved = null;
    try { saved = parseFloat(localStorage.getItem(KEY)); } catch (_) { /* stockage indisponible */ }
    if (saved && saved >= 35 && saved <= 85) apply(saved);
    let dragging = false;
    handle.addEventListener("pointerdown", (e) => {
      dragging = true;
      handle.classList.add("dragging");
      handle.setPointerCapture(e.pointerId);
      document.body.style.userSelect = "none";
    });
    handle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const rct = wrap.getBoundingClientRect();
      const p = Math.max(35, Math.min(85, 100 * (e.clientX - rct.left) / rct.width));
      apply(p);
      try { localStorage.setItem(KEY, p.toFixed(1)); } catch (_) { /* ignoré */ }
    });
    const stop = () => { dragging = false; handle.classList.remove("dragging"); document.body.style.userSelect = ""; };
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  };

  initSplitter();
  buildLayers();
  setGroup(GROUPS[0].id);
}

initIndicMap();
