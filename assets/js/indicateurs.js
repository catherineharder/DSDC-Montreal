/* Indicateurs — quatre onglets : Défavorisation, Équité des milieux de vie,
   Capital social, Résultats transitoires.

   Chaque onglet (eyebrow) porte un menu déroulant d'indicateurs. Selon
   l'indicateur, la scène affiche :
     - une choroplèthe par territoire (découpages SQ / VdM / TQ) ;
     - une mosaïque d'aires de diffusion (IEMV, 3 classes de vulnérabilité)
       surmontée des contours du découpage choisi ;
     - un graphique (données disponibles à l'échelle régionale seulement) ;
     - la grille des 12 résultats transitoires (CACIS/CReSP).
   Les valeurs viennent d'assets/data/indicateurs.data.js (INDIC_DATA) et
   d'assets/data/indicateurs-iemv-geo.data.js (IEMV_GEO), générés par
   tools/build_indicateurs.py. Cliquer un territoire affiche son détail ;
   cliquer hors de l'île revient à la fiche de l'indicateur. */

function initIndicMap() {
  const svg = el("indic-map");
  const panel = el("indic-panel");
  const eyebrow = el("indic-eyebrow");
  const geosEl = el("indic-geos");
  const selectEl = el("indic-select");
  const legend = el("indic-legend");
  const title = el("indic-title");
  const graph = el("indic-graph");
  if (!svg || !panel || typeof TDQ_GEOMETRY === "undefined") return;

  const DATA = (typeof INDIC_DATA !== "undefined") ? INDIC_DATA : null;
  const GEOPATHS = (typeof IEMV_GEO !== "undefined") ? IEMV_GEO : null;
  if (!DATA) return;

  const FR = (v, nd = 0) => (v == null ? "n. d." : v.toFixed(nd).replace(".", ","));
  const PCT = (v, nd = 0) => (v == null ? "n. d." : FR(v, nd) + " %");
  const q45 = (dist) => dist[3] + dist[4];

  /* ---- découpages territoriaux ------------------------------------------ */
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
  // Découpage supplémentaire (hors bascule SQ/VdM/TQ) : circonscriptions
  // provinciales de l'île, réutilisé par la participation provinciale.
  const circGeo = {
    id: "circ", label: "Circ.", full: "Circonscriptions provinciales de l'île",
    unit: "circonscriptions provinciales",
    shapes: () => (typeof DEPUTES_GEOMETRY !== "undefined" ? DEPUTES_GEOMETRY : {}),
    backdrop: () => ({}),
    name: (slug) => (typeof DEPUTES !== "undefined" && DEPUTES[slug]) ? DEPUTES[slug].name : slug,
  };
  const GEOS_ALL = GEOS.concat([circGeo]);

  /* ---- couleurs ---------------------------------------------------------- */
  /* Rampes alignées sur la palette DSDC : orange (matérielle), teal (sociale),
     olive (revenu/MPC), rouge (logement), sable (participation). */
  const DIM = {
    mat: { lbl: "matérielle", short: "Matérielle", c: "#D97A22",
           pal6: ["#faedd9", "#f2d09e", "#e8ad63", "#df8f34", "#D97A22", "#9c560f"],
           ramp5: ["#faedd9", "#f2d09e", "#e8ad63", "#df8f34", "#b9651a"] },
    soc: { lbl: "sociale", short: "Sociale", c: "#46747F",
           pal6: ["#e7eeef", "#c7dadd", "#9dbcc1", "#6d9aa1", "#46747F", "#2f545c"],
           ramp5: ["#e7eeef", "#c7dadd", "#9dbcc1", "#6d9aa1", "#3a636d"] },
  };
  const MPC_PAL6 = ["#eef0e6", "#d7dcc3", "#b9c199", "#95a06a", "#6C6F3F", "#4c4f28"];
  const LOG_PAL6 = ["#f6e2e3", "#eab8bb", "#db8a8f", "#cf5b62", "#C43E42", "#8f2a2e"];
  const PART_PAL6 = ["#f4ecd8", "#e6d3a6", "#d7b972", "#c69f45", "#a8842f", "#7d6120"];
  const SAT_PAL4 = ["#dbe6e8", "#9dbcc1", "#5f8990", "#2f545c"];
  /* IEMV : 3 classes de vulnérabilité (teintes distinctes) + crème hors-données */
  const NIV = {
    pv: { c: "#8a2f4f", lbl: "Vulnérable et prioritaire" },
    vnp: { c: "#d19aa8", lbl: "Vulnérable non prioritaire" },
    nv: { c: "#f0e7d9", lbl: "Non vulnérable" },
  };
  const INK = "#000000", MUTED = "#000000", ACCENT = "#D97A22";

  /* ---- petits gabarits de rendu ------------------------------------------ */
  const barsHTML = (labels, dist, ramp, nd = 1) => labels.map((lab, i) =>
    `<div class="iq-row"><span class="lab">${lab}</span>` +
    `<div class="iq-bar"><span style="width:${Math.min(100, dist[i])}%;background:${ramp[i]}"></span></div>` +
    `<span class="iq-val">${PCT(dist[i], nd)}</span></div>`).join("");

  const lead = (valueHTML, rest) =>
    `<p class="indic-lead">${valueHTML} ${rest}</p>`;

  const big = (v, color, nd = 0) =>
    `<strong class="indic-big" style="color:${color}">${PCT(v, nd)}</strong>`;

  /* mini-graphique d'évolution : deux courbes (matérielle / sociale).
     Règle anti-chevauchement : à chaque point, l'étiquette de la valeur la
     plus haute s'affiche au-dessus du point, celle de la plus basse en
     dessous. */
  const trendChart = (tr) => {
    if (!tr || !tr.years || tr.years.length < 2) return "";
    const W = 300, H = 150, L = 26, R = 74, T = 18, B = 20;
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
    /* position d'étiquette par point : la plus haute au-dessus, l'autre en dessous */
    const labelAbove = (d, i) => {
      if (series.length < 2) return true;
      const o = d === "mat" ? "soc" : "mat";
      const v = tr[d][i], vo = tr[o] ? tr[o][i] : null;
      if (v == null) return true;
      if (vo == null) return true;
      if (v === vo) return d === series[0];
      return v > vo;
    };
    const lineFor = (d) => {
      const vals = tr[d], col = DIM[d].c;
      const pts = vals.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(" ");
      const dots = vals.map((v, i) => {
        if (v == null) return "";
        const above = labelAbove(d, i);
        return `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${col}"/>` +
          `<text x="${x(i)}" y="${y(v) + (above ? -7 : 15)}" text-anchor="middle" class="tc-val" fill="${col}">${Math.round(v)}</text>`;
      }).join("");
      return `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round"/>` + dots +
        (endY[d] == null ? "" : `<text x="${x(vals.length - 1) + 8}" y="${endY[d] + 3.5}" class="tc-lab" fill="${col}">${DIM[d].short}</text>`);
    };
    return `<svg class="trend-svg" viewBox="0 0 ${W} ${H}" role="img" ` +
      `aria-label="Évolution du pourcentage de population en quintiles 4-5, ${tr.years.join(", ")}">` +
      `<line x1="${L}" y1="${y(40)}" x2="${W - R + 4}" y2="${y(40)}" stroke="#000000" stroke-width="1" stroke-dasharray="4 3"/>` +
      `<text x="${L}" y="${y(40) + 12}" class="tc-ref">Montréal : 40 %</text>` +
      `<line x1="${L}" y1="${y(0)}" x2="${W - R + 4}" y2="${y(0)}" stroke="#000000" stroke-width="1"/>` +
      tr.years.map((yr, i) => `<text x="${x(i)}" y="${H - 4}" text-anchor="middle" class="tc-axis">${yr}</text>`).join("") +
      series.map(lineFor).join("") +
      `</svg>`;
  };

  /* graphique de série(s) pour la scène (grand format), même règle
     anti-chevauchement des étiquettes. series = [{vals, c, lbl}] */
  const bigLine = (cfg) => {
    const { labels, series, ymin, ymax, refLine, note, extra } = cfg;
    const W = 760, H = 430, L = 60, R = 120, T = 34, B = 46;
    const iw = W - L - R, ih = H - T - B;
    const x = (i) => L + iw * i / (labels.length - 1);
    const y = (v) => T + ih * (1 - (v - ymin) / (ymax - ymin));
    const at = (si, i) => series[si].vals[i];
    const above = (si, i) => {
      if (series.length < 2) return true;
      const v = at(si, i), others = series.map((s, j) => j !== si ? s.vals[i] : null).filter((u) => u != null);
      if (!others.length || v == null) return true;
      return v >= Math.max(...others);
    };
    const endY = series.map((s) => { const v = s.vals[s.vals.length - 1]; return v == null ? null : y(v); });
    for (let a = 0; a < endY.length; a++) {
      for (let b = a + 1; b < endY.length; b++) {
        if (endY[a] != null && endY[b] != null && Math.abs(endY[a] - endY[b]) < 20) {
          const mid = (endY[a] + endY[b]) / 2;
          if (endY[a] <= endY[b]) { endY[a] = mid - 11; endY[b] = mid + 11; }
          else { endY[a] = mid + 11; endY[b] = mid - 11; }
        }
      }
    }
    let out = `<svg viewBox="0 0 ${W} ${H}" role="img" class="big-line">`;
    if (refLine != null) {
      out += `<line x1="${L}" y1="${y(refLine.v)}" x2="${W - R + 8}" y2="${y(refLine.v)}" stroke="#000000" stroke-width="1" stroke-dasharray="5 4"/>` +
        `<text x="${L}" y="${y(refLine.v) - 7}" class="bl-ref">${esc(refLine.lbl)}</text>`;
    }
    out += `<line x1="${L}" y1="${T + ih}" x2="${W - R + 8}" y2="${T + ih}" stroke="#000000" stroke-width="1.2"/>`;
    out += labels.map((lb, i) => `<text x="${x(i)}" y="${H - 14}" text-anchor="middle" class="bl-axis">${esc(lb)}</text>`).join("");
    series.forEach((s, si) => {
      const pts = s.vals.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(" ");
      out += `<polyline points="${pts}" fill="none" stroke="${s.c}" stroke-width="3" stroke-linejoin="round"/>`;
      out += s.vals.map((v, i) => v == null ? "" :
        `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="${s.c}"/>` +
        `<text x="${x(i)}" y="${y(v) + (above(si, i) ? -12 : 24)}" text-anchor="middle" class="bl-val" fill="${s.c}">${FR(v, s.nd == null ? 0 : s.nd)}</text>`).join("");
      if (endY[si] != null)
        out += `<text x="${x(s.vals.length - 1) + 12}" y="${endY[si] + 5}" class="bl-lab" fill="${s.c}">${esc(s.lbl)}</text>`;
    });
    out += extra || "";
    out += note ? `<text x="${L}" y="${T - 16}" class="bl-note">${esc(note)}</text>` : "";
    out += `</svg>`;
    return out;
  };

  /* ---- couche cartographique ---------------------------------------------- */
  let paths = {};
  const clearStage = () => { while (svg.firstChild) svg.removeChild(svg.firstChild); paths = {}; };

  const addPath = (d, cls) => {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    if (cls) p.setAttribute("class", cls);
    svg.appendChild(p);
    return p;
  };

  const addOutline = () => {
    if (typeof TDQ_SILHOUETTE === "undefined") return;
    const o = addPath(TDQ_SILHOUETTE, "tdq-outline");
    o.setAttribute("aria-hidden", "true");
  };

  const wireRegion = (p, slug, geo) => {
    p.dataset.slug = slug;
    p.setAttribute("tabindex", "0");
    p.setAttribute("role", "button");
    p.setAttribute("aria-label", geo.name(slug));
    p.addEventListener("click", () => select(slug));
    p.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(slug); }
    });
  };

  /* choroplèthe classique : régions pleines, colorées par classe */
  const buildChoropleth = (geo) => {
    clearStage();
    Object.values(geo.backdrop()).forEach((d) => addPath(d, "tdq-notable"));
    Object.entries(geo.shapes()).forEach(([slug, d]) => {
      const p = addPath(d, "arr");
      wireRegion(p, slug, geo);
      paths[slug] = p;
    });
    addOutline();
  };

  /* mosaïque IEMV : classes d'AD dissoutes (inertes) + contours cliquables */
  const buildMosaic = (geo, optId) => {
    clearStage();
    const gp = GEOPATHS && GEOPATHS[optId];
    if (gp) {
      ["nv", "vnp", "pv"].forEach((cls) => {
        if (!gp[cls]) return;
        const p = addPath(gp[cls]);
        p.setAttribute("fill", NIV[cls].c);
        p.setAttribute("fill-rule", "evenodd");
        p.setAttribute("stroke", "none");
        p.style.pointerEvents = "none";
      });
    }
    Object.entries(geo.shapes()).forEach(([slug, d]) => {
      const p = addPath(d, "indic-overlay");
      wireRegion(p, slug, geo);
      paths[slug] = p;
    });
    addOutline();
  };

  /* ---- registre : onglets et indicateurs ---------------------------------- */

  const rec = (grp, geoId, slug) => {
    const g = DATA[grp] && DATA[grp].geo && DATA[grp].geo[geoId];
    return g ? g[slug] : null;
  };

  const srcNote = (t) => `<p class="iq-note">${t}</p>`;

  /* -- fabrique « taux simple » (faible revenu, logement) -- */
  const rateOption = (cfg) => ({
    id: cfg.id, label: cfg.label, kind: "map",
    available: !!DATA[cfg.key],
    breaks: cfg.breaks,
    value: (geoId, slug) => { const r = rec(cfg.key, geoId, slug); return r ? r.v : null; },
    pal: () => cfg.pal,
    legendTitle: () => cfg.legendTitle,
    legendNote: () => cfg.legendNote,
    landing: (geo) =>
      `<p class="intro">${cfg.descr}</p>` +
      `<p class="intro">Découpage : <strong>${esc(geo.full)}</strong>. Cliquez un territoire pour le détail.</p>` +
      srcNote(cfg.source),
    panel: (geo, slug) => {
      const r = rec(cfg.key, geo.id, slug);
      if (!r) return `<p class="intro">Données non disponibles pour ce territoire.</p>`;
      const overall = DATA[cfg.key].meta.overall;
      return lead(big(r.v, cfg.pal[cfg.pal.length - 1], 1), cfg.leadText +
          (overall != null ? ` <span class="indic-ref">· île de Montréal : ${PCT(overall, 1)}</span>` : "")) +
        `<p class="intro" style="margin-top:8px">${cfg.baseLine(r)} · ${r.nad} aires de diffusion</p>` +
        srcNote(cfg.note);
    },
  });

  /* ================= Onglet 1 — Défavorisation ============================ */

  /* -- Défavorisation : bascule à 4 indicateurs (matérielle, sociale, revenu,
        logement). Le panneau d'un territoire affiche TOUJOURS les 4, quel que
        soit l'indicateur qui colore la carte. -- */
  const DEFAVO_META = {
    mat: { short: "Matérielle", label: "Défavorisation matérielle", c: DIM.mat.c, pal: DIM.mat.pal6,
           breaks: [20, 30, 40, 50, 60], value: (g, s) => { const r = rec("defavo", g, s); return r ? q45(r.mat) : null; },
           legendTitle: "Défavorisation matérielle (IDMS 2021)", legendNote: "% de la population en quintiles 4-5\n(référence : région de Montréal)" },
    soc: { short: "Sociale", label: "Défavorisation sociale", c: DIM.soc.c, pal: DIM.soc.pal6,
           breaks: [20, 30, 40, 50, 60], value: (g, s) => { const r = rec("defavo", g, s); return r ? q45(r.soc) : null; },
           legendTitle: "Défavorisation sociale (IDMS 2021)", legendNote: "% de la population en quintiles 4-5\n(référence : région de Montréal)" },
    mpc: { short: "Revenu", label: "Faible revenu (MPC)", c: MPC_PAL6[4], pal: MPC_PAL6,
           breaks: [5, 10, 15, 20, 25], value: (g, s) => { const r = rec("mpc", g, s); return r ? r.v : null; },
           legendTitle: "Faible revenu selon la MPC (2021)", legendNote: "% de la population sous la mesure\ndu panier de consommation (2020)" },
    log: { short: "Logement", label: "Logement inabordable", c: LOG_PAL6[4], pal: LOG_PAL6,
           breaks: [15, 20, 25, 30, 35], value: (g, s) => { const r = rec("logement", g, s); return r ? r.v : null; },
           legendTitle: "Logement inabordable (2021)", legendNote: "% des ménages consacrant 30 % ou plus\nde leur revenu au logement" },
  };
  const dv4Row = (label, val, color, nd = 1) =>
    `<div class="dv4-row"><span class="dv4-sw" style="background:${color}"></span>` +
    `<span class="dv4-lab">${label}</span><span class="dv4-val">${PCT(val, nd)}</span></div>`;
  const defavoPanel = (geo, slug) => {
    const rD = rec("defavo", geo.id, slug), rM = rec("mpc", geo.id, slug), rL = rec("logement", geo.id, slug);
    if (!rD && !rM && !rL) return `<p class="intro">Données non disponibles pour ce territoire.</p>`;
    const pop = rD ? rD.pop : (rM ? rM.pop : null);
    const trend = rD && rD.trend ? trendChart(rD.trend) : "";
    return (pop != null ? `<p class="intro">Population 2021 : ${pop.toLocaleString("fr-CA")}</p>` : "") +
      `<p class="iq-title">Les quatre indicateurs, pour ce territoire (2021)</p>` +
      `<div class="dv4">` +
        dv4Row("Défavorisation matérielle", rD ? q45(rD.mat) : null, DIM.mat.c) +
        dv4Row("Défavorisation sociale", rD ? q45(rD.soc) : null, DIM.soc.c) +
        dv4Row("Faible revenu (MPC)", rM ? rM.v : null, MPC_PAL6[4]) +
        dv4Row("Logement inabordable", rL ? rL.v : null, LOG_PAL6[4]) +
      `</div>` +
      (trend ? `<p class="iq-title">Évolution de la défavorisation (% en quintiles 4-5)</p>` + trend : "") +
      srcNote("Défavorisation matérielle et sociale : INSPQ, IDMS 2021 — % de la population en quintiles 4-5 " +
        "(référence : région de Montréal). Revenu : mesure du panier de consommation (MPC), Recensement 2021 " +
        "(revenus de 2020, incluant la PCU). Logement : ménages consacrant 30 % ou plus de leur revenu au logement, " +
        "Recensement 2021.");
  };
  const defavoOption = (key) => {
    const m = DEFAVO_META[key];
    return {
      id: "defavo-" + key, label: m.label, short: m.short, dimC: m.c, kind: "map",
      available: !!DATA.defavo,
      breaks: m.breaks,
      value: m.value,
      pal: () => m.pal,
      legendTitle: () => m.legendTitle,
      legendNote: () => m.legendNote,
      landing: (geo) =>
        `<p class="intro"><strong>Défavorisation</strong> — quatre lectures d'un même territoire : ` +
        `défavorisation matérielle et sociale (IDMS), faible revenu (MPC) et logement inabordable. ` +
        `La carte est colorée selon l'indicateur sélectionné (<strong>${esc(m.label.toLowerCase())}</strong>) ; ` +
        `cliquez un territoire pour voir les <strong>quatre</strong> valeurs et l'évolution.</p>` +
        `<p class="intro">Découpage : <strong>${esc(geo.full)}</strong>.</p>` +
        srcNote(`Sources : <a href="https://www.inspq.qc.ca/defavorisation/indice-de-defavorisation-materielle-et-sociale" ` +
          `target="_blank" rel="noopener">INSPQ, IDMS</a> ; Statistique Canada, Recensement 2021.`),
      panel: defavoPanel,
    };
  };

  const alimOption = {
    id: "alim", label: "Insécurité alimentaire", kind: "graph",
    available: !!DATA.alim,
    render: () => {
      const a = DATA.alim;
      const years = a.years.map(String);
      const iMtl = a.years.indexOf(2023);
      const mtlVals = a.years.map((y) => (y === 2023 ? a.mtl2023 : null));
      return bigLine({
        labels: years, ymin: 0, ymax: 26,
        series: [
          { vals: a.qc, c: INK, lbl: "Québec", nd: 0 },
          { vals: mtlVals, c: ACCENT, lbl: "Montréal", nd: 0 },
        ],
      });
    },
    landing: () =>
      `<p class="intro"><strong>Insécurité alimentaire des ménages</strong> — part des ménages dont l'accès à ` +
      `la nourriture est limité par le manque d'argent (insécurité marginale, modérée ou grave, mesurée par ` +
      `l'Enquête canadienne sur le revenu).</p>` +
      `<p class="intro">En 2023, <strong style="color:${ACCENT}">22 % des ménages montréalais</strong> étaient en ` +
      `situation d'insécurité alimentaire — plus que dans l'ensemble du Québec (19 %), une proportion en forte ` +
      `hausse depuis 2021. Ces données n'existent qu'à l'échelle régionale : le graphique remplace la carte.</p>` +
      srcNote(`Source : <a href="${DATA.alim.meta.url}" target="_blank" rel="noopener">Institut de la statistique ` +
        `du Québec (ECR 2018-2023)</a>, mars 2026. Montréal et Laval sont les régions les plus touchées ` +
        `(22 % et 23 % en 2023).`),
  };

  /* ================= Onglet 2 — Équité des milieux de vie ================= */

  const DIMS_IEMV = DATA.iemv && DATA.iemv.meta.dims ? DATA.iemv.meta.dims : {};

  const iemvOption = (optId, dimKey) => ({
    id: "iemv-" + optId, label: dimKey ? DIMS_IEMV[dimKey] : "Ensemble des dimensions",
    kind: "mosaic", mosaicId: optId,
    available: !!(DATA.iemv && GEOPATHS),
    legendTitle: () => dimKey
      ? "IEMV — " + DIMS_IEMV[dimKey]
      : "IEMV — niveau de vulnérabilité",
    legendNote: () => dimKey
      ? "Aires de diffusion vulnérables pour cette\ndimension ; « prioritaire » = au moins 4\nvulnérabilités sur 6, toutes dimensions"
      : "Aires de diffusion selon le nombre de\nvulnérabilités cumulées : 0-2, 3, ou 4-6",
    landing: (geo) =>
      `<p class="intro"><strong>Indice d'équité des milieux de vie (IEMV, Ville de Montréal, 2026)</strong> — ` +
      `chaque aire de diffusion cumule de 0 à 6 vulnérabilités parmi six dimensions : culture, sports et ` +
      `loisirs ; ressources et proximité ; sécurité urbaine ; environnementale ; économique ; sociale.</p>` +
      `<p class="intro">La Ville qualifie de <strong style="color:${NIV.pv.c}">vulnérables et prioritaires</strong> ` +
      `les milieux cumulant au moins 4 vulnérabilités, de <strong>vulnérables non prioritaires</strong> ceux qui ` +
      `en cumulent 3, et de <strong>non vulnérables</strong> les autres (0 à 2).` +
      (dimKey ? ` La carte montre les milieux vulnérables pour la dimension <strong>${esc(DIMS_IEMV[dimKey])}</strong>, ` +
        `selon qu'ils se trouvent ou non en zone prioritaire.` : "") + `</p>` +
      `<p class="intro">Contours : <strong>${esc(geo.full)}</strong>. Cliquez un territoire pour le détail.</p>` +
      srcNote(`Source : <a href="https://donnees.montreal.ca/dataset/indice-equite-milieux-vie" target="_blank" ` +
        `rel="noopener">Ville de Montréal, données ouvertes</a>. Mesure relative servant à prioriser les ` +
        `investissements municipaux ; non comparable d'une version à l'autre.`),
    panel: (geo, slug) => {
      const r = rec("iemv", geo.id, slug);
      if (!r) return `<p class="intro">Données non disponibles pour ce territoire.</p>`;
      const ov = DATA.iemv.meta.overall || null;
      if (!dimKey) {
        const labs = [NIV.nv.lbl, NIV.vnp.lbl, NIV.pv.lbl];
        const ramp = [NIV.nv.c, NIV.vnp.c, NIV.pv.c];
        return lead(big(r.niv[2], NIV.pv.c),
            `de la population en zone <strong>vulnérable et prioritaire</strong>` +
            (ov ? ` <span class="indic-ref">· île : ${PCT(ov.niv[2])}</span>` : "")) +
          `<p class="intro" style="margin-top:6px">Population 2021 : ${r.pop.toLocaleString("fr-CA")} · ${r.nad} aires de diffusion</p>` +
          `<p class="iq-title">Répartition de la population</p>` +
          labs.map((lb, i) =>
            `<div class="iq-row"><span class="lab lab-wide">${lb}</span>` +
            `<div class="iq-bar"><span style="width:${Math.min(100, r.niv[i])}%;background:${ramp[i]};` +
            (i === 0 ? "outline:1px solid #d8d2c6;outline-offset:-1px" : "") + `"></span></div>` +
            `<span class="iq-val">${PCT(r.niv[i], 1)}</span></div>`).join("") +
          `<p class="iq-title">Nombre de vulnérabilités cumulées</p>` +
          barsHTML(["0", "1", "2", "3", "4", "5", "6"], r.dist,
            ["#eee9f6", "#e3d9f1", "#cbb5e2", "#b08fd2", "#9169bf", "#7247a8", "#552f8a"]) +
          srcNote(`Source : Ville de Montréal, IEMV version 2026.`);
      }
      const dm = r.dims[dimKey];   // [vulnérable, vulnérable et prioritaire]
      const vnp = Math.max(0, +(dm[0] - dm[1]).toFixed(1));
      const nv = Math.max(0, +(100 - dm[0]).toFixed(1));
      const rows = [[NIV.pv.lbl, dm[1], NIV.pv.c], [NIV.vnp.lbl, vnp, NIV.vnp.c], [NIV.nv.lbl, nv, NIV.nv.c]];
      return lead(big(dm[0], NIV.pv.c),
          `de la population en milieu vulnérable — dimension <strong>${esc(DIMS_IEMV[dimKey])}</strong>` +
          (ov ? ` <span class="indic-ref">· île : ${PCT(ov.dims[dimKey][0])}</span>` : "")) +
        `<p class="intro" style="margin-top:6px">Population 2021 : ${r.pop.toLocaleString("fr-CA")} · ${r.nad} aires de diffusion</p>` +
        `<p class="iq-title">Répartition de la population</p>` +
        rows.map(([lb, v, c], i) =>
          `<div class="iq-row"><span class="lab lab-wide">${lb}</span>` +
          `<div class="iq-bar"><span style="width:${Math.min(100, v)}%;background:${c};` +
          (i === 2 ? "outline:1px solid #d8d2c6;outline-offset:-1px" : "") + `"></span></div>` +
          `<span class="iq-val">${PCT(v, 1)}</span></div>`).join("") +
        srcNote(`« Prioritaire » : aires cumulant au moins 4 vulnérabilités sur 6, toutes dimensions confondues. ` +
          `Source : Ville de Montréal, IEMV version 2026.`);
    },
  });

  /* ================= Onglet 3 — Capital social ============================ */

  const CAP = DATA.capital || null;

  const appartOption = {
    id: "appart", label: "Sentiment d'appartenance", kind: "graph",
    available: !!(CAP && CAP.appartenance),
    render: () => {
      const a = CAP.appartenance;
      return bigLine({
        labels: a.cycles, ymin: 40, ymax: 75,
        series: [
          { vals: a.mtl, c: ACCENT, lbl: "Montréal" },
          { vals: a.qc, c: MUTED, lbl: "Québec" },
        ],
      });
    },
    landing: () =>
      `<p class="intro"><strong>Sentiment d'appartenance à sa communauté locale</strong> — part de la population ` +
      `de 12 ans et plus qui décrit son sentiment d'appartenance comme <strong>très ou plutôt fort</strong>.</p>` +
      `<p class="intro">À Montréal, ce sentiment progresse : <strong style="color:${ACCENT}">65 % en 2019-2020</strong>, ` +
      `contre 59 % dix ans plus tôt — un niveau légèrement supérieur à la moyenne québécoise. Donnée régionale ` +
      `seulement : le graphique remplace la carte.</p>` +
      srcNote(esc(CAP && CAP.meta ? CAP.meta.appartenance : "")),
  };

  const RTS_OF_RLS = (slug) => {
    const code = (slug || "").replace("rls-", "").slice(0, 3);
    return { "061": "061", "062": "062", "063": "063", "064": "064", "065": "065" }[code] || null;
  };
  const RTS_NAMES = {
    "061": "Ouest-de-l'Île", "062": "Centre-Ouest", "063": "Centre-Sud",
    "064": "Nord-de-l'Île", "065": "Est-de-l'Île",
  };
  const insat = (v4) => +(v4[2] + v4[3]).toFixed(1);

  const satisfOption = {
    id: "satisf", label: "Satisfaction de sa vie sociale", kind: "map", fixedGeo: "sq",
    available: !!(CAP && CAP.satisfaction && CAP.satisfaction.c2020),
    breaks: [16, 18, 20],
    value: (geoId, slug) => {
      const t = RTS_OF_RLS(slug);
      const v = t && CAP.satisfaction.c2020[t];
      return v ? insat(v) : null;
    },
    pal: () => SAT_PAL4,
    legendTitle: () => "Insatisfaction de sa vie sociale (2020-2021)",
    legendNote: () => "% de la population plutôt ou très\ninsatisfaite de sa vie sociale, par RTS\n(les RLS d'un même RTS partagent la valeur)",
    landing: (geo) =>
      `<p class="intro"><strong>Satisfaction par rapport à sa vie sociale</strong> — en 2020-2021, ` +
      `<strong>81 %</strong> des Montréalais·es de 15 ans et plus se disaient très ou plutôt satisfait·es de leur ` +
      `vie sociale (Québec : 85 %). La carte montre la part <strong>insatisfaite</strong>, disponible par réseau ` +
      `territorial de services (RTS) seulement.</p>` +
      `<p class="intro">Cliquez un territoire pour le détail.</p>` +
      srcNote(esc(CAP && CAP.meta ? CAP.meta.satisfaction : "")),
    panel: (geo, slug) => {
      const t = RTS_OF_RLS(slug);
      const v = t && CAP.satisfaction.c2020[t];
      if (!v) return `<p class="intro">Données non disponibles pour ce territoire.</p>`;
      const cats = ["Très satisfaisante", "Plutôt satisfaisante", "Plutôt insatisfaisante", "Très insatisfaisante"];
      const ramp = ["#1f5e8c", "#93bed8", "#e5a33f", "#c2410c"];
      return lead(big(insat(v), "#1f5e8c", 1),
          `de la population plutôt ou très <strong>insatisfaite</strong> de sa vie sociale — RTS ` +
          `${esc(RTS_NAMES[t] || t)} (2020-2021) <span class="indic-ref">· Montréal : 18,5 %</span>`) +
        `<p class="iq-title">Niveau de satisfaction (2020-2021)</p>` +
        cats.map((lb, i) =>
          `<div class="iq-row"><span class="lab lab-wide">${lb}</span>` +
          `<div class="iq-bar"><span style="width:${Math.min(100, v[i])}%;background:${ramp[i]}"></span></div>` +
          `<span class="iq-val">${PCT(v[i], 1)}</span></div>`).join("") +
        srcNote(`Valeur du RTS appliquée à chacun de ses RLS. ` + esc(CAP.meta ? CAP.meta.satisfaction : ""));
    },
  };

  const solitudeOption = {
    id: "solitude", label: "Degré de solitude", kind: "graph",
    available: !!(CAP && CAP.solitude && CAP.solitude.mtl),
    render: () => {
      const s = CAP.solitude;
      const W = 760, H = 300, L = 150, R = 70, T = 70, B = 60;
      const iw = W - L - R;
      const xmin = 4.7, xmax = 5.5;
      const x = (v) => L + iw * (v - xmin) / (xmax - xmin);
      const row = (lbl, d, c, yy) =>
        `<text x="${L - 14}" y="${yy + 5}" text-anchor="end" class="bl-lab" fill="${c}">${lbl}</text>` +
        `<line x1="${x(d.ic[0])}" y1="${yy}" x2="${x(d.ic[1])}" y2="${yy}" stroke="${c}" stroke-width="3" opacity=".45"/>` +
        `<line x1="${x(d.ic[0])}" y1="${yy - 7}" x2="${x(d.ic[0])}" y2="${yy + 7}" stroke="${c}" stroke-width="2.5" opacity=".45"/>` +
        `<line x1="${x(d.ic[1])}" y1="${yy - 7}" x2="${x(d.ic[1])}" y2="${yy + 7}" stroke="${c}" stroke-width="2.5" opacity=".45"/>` +
        `<circle cx="${x(d.moy)}" cy="${yy}" r="7" fill="${c}"/>` +
        `<text x="${x(d.moy)}" y="${yy - 16}" text-anchor="middle" class="bl-val" fill="${c}">${FR(d.moy, 2)}</text>`;
      let out = `<svg viewBox="0 0 ${W} ${H}" role="img" class="big-line">`;
      [4.8, 5.0, 5.2, 5.4].forEach((v) => {
        out += `<line x1="${x(v)}" y1="${T - 16}" x2="${x(v)}" y2="${H - B + 8}" stroke="#e6e1d5" stroke-width="1"/>` +
          `<text x="${x(v)}" y="${H - B + 28}" text-anchor="middle" class="bl-axis">${FR(v, 1)}</text>`;
      });
      out += row("Montréal", s.mtl, ACCENT, T + 40);
      out += row("Québec", s.qc, MUTED, T + 110);
      out += `<text x="${L}" y="${T - 34}" class="bl-note">Degré moyen de solitude (EQSP 2020-2021) — un score plus élevé = plus de solitude ; traits = IC à 99 %</text>`;
      out += `</svg>`;
      return out;
    },
    landing: () =>
      `<p class="intro"><strong>Degré de solitude</strong> — score moyen déclaré par la population de 15 ans ` +
      `et plus (EQSP 2020-2021).</p>` +
      `<p class="intro">Le degré moyen de solitude est <strong style="color:${ACCENT}">légèrement plus élevé à ` +
      `Montréal (5,11)</strong> que dans l'ensemble du Québec (4,99) ; l'écart est faible mais les intervalles de ` +
      `confiance ne se recoupent presque pas. Donnée régionale seulement : le graphique remplace la carte.</p>` +
      srcNote(esc(CAP && CAP.meta ? CAP.meta.solitude : "")),
  };

  const PART = DATA.participation || null;
  const participOption = {
    id: "particip", label: "Participation électorale", kind: "map", fixedGeo: "vdm",
    available: !!PART,
    breaks: [30, 35, 40, 45, 50],
    value: (geoId, slug) => (PART.geo[slug] != null ? PART.geo[slug] : null),
    pal: () => PART_PAL6,
    legendTitle: () => "Participation électorale (municipales 2021)",
    legendNote: () => "% des personnes inscrites ayant voté,\npar arrondissement (villes liées : scrutins\ndistincts, non affichés)",
    landing: (geo) =>
      `<p class="intro"><strong>Participation électorale</strong> — part des électrices et électeurs inscrits ` +
      `ayant voté à l'élection municipale du 7 novembre 2021, par arrondissement.</p>` +
      `<p class="intro">À l'échelle de la ville, la participation a été de <strong>38,3 %</strong> — de 29 % ` +
      `(Saint-Laurent) à 56 % (Outremont) selon l'arrondissement. Les villes liées tiennent leurs propres ` +
      `scrutins et ne sont pas affichées.</p>` +
      srcNote(`Source : Élections Montréal, résultats officiels de l'élection générale de 2021.`),
    panel: (geo, slug) => {
      const v = PART.geo[slug];
      if (v == null) {
        return `<p class="intro">Ville liée : scrutin municipal distinct de celui de la Ville de Montréal ` +
          `(donnée non affichée).</p>`;
      }
      return lead(big(v, PART_PAL6[5], 1),
          `des personnes inscrites ont voté aux élections municipales de 2021 ` +
          `<span class="indic-ref">· Ville de Montréal : 38,3 %</span>`) +
        srcNote(`Taux du scrutin de la mairie d'arrondissement (Ville-Marie : moyenne pondérée des trois ` +
          `districts, la mairie d'arrondissement y étant assumée par la mairie de Montréal). ` +
          `Source : Élections Montréal, 2021.`);
    },
  };

  /* ================= Onglet 4 — Résultats transitoires ===================== */

  const RT_FONCTIONS = [
    { id: "f1", nom: "Se constituer et se maintenir",
      descr: "Interne aux réseaux : se mettre en place et travailler ensemble.",
      rts: [1, 2, 3] },
    { id: "f2", nom: "Se représenter et influencer",
      descr: "Ouverture, sollicitation d'appuis, reconnaissance externe.",
      rts: [4, 5, 6, 7, 8] },
    { id: "f3", nom: "Faire converger les acteurs et les ressources",
      descr: "Engagement — ou désengagement — des acteurs et des ressources nécessaires à l'action.",
      rts: [9, 10, 11, 12] },
  ];
  const RTS = {
    1: { t: "Construction de réseaux",
      d: "Mise en relation en continu d'acteurs sociaux et d'entités non humaines (connaissances, rapports, politiques, technologies, financements) et leur mise en action dans des projets collectifs." },
    2: { t: "Adoption de structures et de règles de gouvernance en réseau",
      d: "Modes de fonctionnement collectif adoptés et appliqués par un réseau pour réguler la participation, le processus décisionnel et la coordination des activités ou des projets." },
    3: { t: "Traitement des controverses",
      d: "Identification et élaboration de solutions devant les controverses qui empêchent les acteurs de coopérer et l'action de progresser." },
    4: { t: "Production d'intermédiaires",
      d: "Expression dans des productions (plans, bilans, mémoires) d'idées et de positions convergentes (priorités, projets, solutions) dans un réseau." },
    5: { t: "Placement d'intermédiaires",
      d: "Introduction d'intermédiaires dans d'autres réseaux, auprès d'acteurs décisionnels, dans des médias ou dans d'autres intermédiaires (mémoires, p. ex.)." },
    6: { t: "Mise en mouvement d'intermédiaires",
      d: "Valorisation ou utilisation des intermédiaires par des acteurs ou des réseaux d'intérêt." },
    7: { t: "Représentations par des porte-parole",
      d: "Actions (rencontres, lettres, manifestations) visant à communiquer des positions, à intéresser d'autres acteurs-clés ou des réseaux, à influencer leur position et leur engagement." },
    8: { t: "Solidification des porte-parole et des intermédiaires",
      d: "Renforcement de la légitimité et de la crédibilité des porte-parole et des intermédiaires qu'ils mettent de l'avant, pour une reconnaissance accrue par les populations et les acteurs stratégiques." },
    9: { t: "Alignement d'intérêts — déplacements d'acteurs",
      d: "Convergence de positions, engagement des acteurs dans de nouveaux rôles, transformations dans les rapports de pouvoir qui favorisent la poursuite de l'action collective et sa coordination.",
      r: "Revers — désalignement d'intérêts : émergence d'intérêts divergents ou changement de position d'acteurs stratégiques qui entravent la réalisation d'actions." },
    10: { t: "Captation de ressources",
      d: "Accès aux ressources (financement, main-d'œuvre, expertise, soutien technique) nécessaires au fonctionnement du réseau et à l'actualisation de ses buts.",
      r: "Revers — perte de ressources : perte de ressources financières, humaines ou matérielles, ou échec subi dans leur obtention." },
    11: { t: "Extension et renforcement des réseaux et de leurs projets",
      d: "Maintien de la mobilisation, enrôlement de nouveaux acteurs, renforcement des liens et des compétences, interconnexions entre réseaux ; solidification ou extension des projets portés.",
      r: "Revers — affaiblissement / réduction : retrait d'acteurs stratégiques, pertes de ressources ou dissidence qui affaiblissent les réseaux et leurs projets." },
    12: { t: "Engagement d'acteurs décisionnels dans la réalisation du changement",
      d: "Engagement d'acteurs détenant les leviers de décision et d'action indispensables à la réalisation des projets (émission de permis, propriété de terrain, p. ex.).",
      r: "Revers — non-engagement / désengagement : refus ou retrait d'acteurs détenant les leviers indispensables, qui fait obstacle à la réalisation du changement." },
  };

  const rtGridHTML = () =>
    `<div class="rt-grid">` + RT_FONCTIONS.map((f) =>
      `<div class="rt-col"><h3>${esc(f.nom)}</h3><p class="rt-fdescr">${esc(f.descr)}</p>` +
      f.rts.map((n) =>
        `<button class="rt-item" data-rt="${n}" aria-pressed="false">` +
        `<span class="rt-num">RT ${n}</span><span class="rt-t">${esc(RTS[n].t)}</span>` +
        (RTS[n].r ? `<span class="rt-flag" title="Comporte un résultat transitoire de revers">⇄</span>` : "") +
        `</button>`).join("") +
      `</div>`).join("") + `</div>`;

  /* Outil : les 12 RT en disposition verticale. Chaque RT = boîte verte (le
     résultat + sa définition) ; s'il comporte un revers, une boîte jaune sous
     la verte. Définitions non cliquables. Le panneau de droite décrit l'outil. */
  const rtCleanRevers = (s) => String(s || "").replace(/^\s*Revers\s*[—–-]\s*/i, "");
  const rtVerticalHTML = () =>
    `<div class="outil-page">` +
    `<header class="outil-head"><span class="soc-kicker">Outil d'appréciation</span>` +
    `<h2>Les 12 résultats transitoires</h2>` +
    `<p>Les événements marquants que les réseaux intersectoriels locaux enchaînent pour transformer ` +
    `concrètement les milieux de vie, regroupés en trois fonctions. La boîte verte décrit le résultat ; ` +
    `la boîte jaune, son « revers » lorsqu'il existe.</p></header>` +
    RT_FONCTIONS.map((f) =>
      `<section class="outil-fn"><h3>${esc(f.nom)}</h3><p class="outil-fdescr">${esc(f.descr)}</p>` +
      f.rts.map((n) => {
        const rt = RTS[n];
        return `<div class="rt-block">` +
          `<div class="rt-green"><span class="rt-n">RT ${n}</span>` +
          `<p class="rt-t">${esc(rt.t)}</p><p class="rt-d">${esc(rt.d)}</p></div>` +
          (rt.r ? `<div class="rt-yellow"><span class="rt-rev">Revers</span>` +
            `<p>${esc(rtCleanRevers(rt.r))}</p></div>` : "") +
          `</div>`;
      }).join("") +
      `</section>`).join("") +
    `</div>`;

  const rtOption = {
    id: "rt", label: "L'outil", kind: "graph", pageMode: true,
    available: true,
    render: rtVerticalHTML,
    landing: () =>
      `<p class="intro"><strong>L'Outil d'appréciation des effets de l'action intersectorielle locale</strong> ` +
      `est un outil interactif en ligne qui aide les instances intersectorielles — comme les Tables de quartier — ` +
      `à retracer le cours de leur action jusqu'à ses effets.</p>` +
      `<p class="intro">À partir d'une ligne du temps des événements marquants d'un projet, chaque événement est ` +
      `associé à l'un des <strong>12 résultats transitoires</strong> types. On schématise ainsi la chaîne de ` +
      `résultats qui mène aux transformations concrètes des milieux de vie.</p>` +
      `<p class="intro">Développé par la <strong>Chaire CACIS</strong> avec <strong>Communagir</strong> et la ` +
      `<strong>Coalition montréalaise des Tables de quartier</strong>, où il a notamment été appliqué.</p>` +
      srcNote(`Source : Bilodeau, Potvin et coll., <a href="https://chairecacis.org/fichiers/publications/feuillet_cresp-cacis.pdf" ` +
        `target="_blank" rel="noopener">Lumière sur la recherche au CReSP, nº 1 (2023)</a>. ` +
        `Outil interactif : <a href="https://chairecacis-outilinteractif.org" target="_blank" rel="noopener">` +
        `chairecacis-outilinteractif.org</a>.`),
  };

  /* ================= Onglet — Équité (choroplèthe + boîte à 7 options) =====
     Une couleur par territoire selon la dimension choisie (ou l'ensemble) ;
     cliquer un territoire affiche la lecture des six dimensions par nom. */
  const EQ_RAMP = ["#e7eeef", "#c7dadd", "#9dbcc1", "#6d9aa1", "#46747F", "#2f545c"];
  const equitePanel = (geo, slug, dimKey) => {
    const r = rec("iemv", geo.id, slug);
    if (!r) return `<p class="intro">Données non disponibles pour ce territoire.</p>`;
    const head = dimKey
      ? lead(big(r.dims[dimKey] ? r.dims[dimKey][0] : null, EQ_RAMP[4], 1),
          `de la population en milieu vulnérable — <strong>${esc(DIMS_IEMV[dimKey])}</strong>`)
      : lead(big(r.p4 != null ? r.p4 : (r.niv ? r.niv[2] : null), EQ_RAMP[4], 1),
          `de la population en milieu <strong>vulnérable et prioritaire</strong> (≥ 4 vulnérabilités)`);
    const rows = Object.keys(DIMS_IEMV).map((k) => {
      const dm = r.dims[k]; const v = dm ? dm[0] : null; const on = k === dimKey;
      return `<div class="iq-row${on ? " iq-on" : ""}"><span class="lab lab-wide">${esc(DIMS_IEMV[k])}</span>` +
        `<div class="iq-bar"><span style="width:${Math.min(100, v || 0)}%;background:${EQ_RAMP[4]}"></span></div>` +
        `<span class="iq-val">${PCT(v, 1)}</span></div>`;
    }).join("");
    return head +
      `<p class="intro" style="margin-top:6px">Population 2021 : ${r.pop.toLocaleString("fr-CA")} · ${r.nad} aires de diffusion</p>` +
      `<p class="iq-title">Les six dimensions — % de la population en milieu vulnérable</p>` + rows +
      srcNote("« Vulnérable et prioritaire » : aires cumulant au moins 4 vulnérabilités sur 6. " +
        "Source : Ville de Montréal, IEMV version 2026.");
  };
  const equiteOption = (optId, dimKey) => ({
    id: "equite-" + optId, label: dimKey ? DIMS_IEMV[dimKey] : "Ensemble", short: dimKey ? DIMS_IEMV[dimKey] : "Ensemble",
    kind: "map", available: !!DATA.iemv,
    breaks: dimKey ? [10, 20, 30, 40, 50] : [5, 10, 20, 30, 40],
    value: (g, s) => {
      const r = rec("iemv", g, s); if (!r) return null;
      return dimKey ? (r.dims[dimKey] ? r.dims[dimKey][0] : null) : (r.p4 != null ? r.p4 : (r.niv ? r.niv[2] : null));
    },
    pal: () => EQ_RAMP,
    legendTitle: () => dimKey ? "Équité — " + DIMS_IEMV[dimKey] : "Équité — milieux prioritaires",
    legendNote: () => dimKey
      ? "% de la population en milieu vulnérable\npour cette dimension"
      : "% de la population en milieu vulnérable\net prioritaire (≥ 4 vulnérabilités sur 6)",
    landing: (geo) =>
      `<p class="intro"><strong>Indice d'équité des milieux de vie (IEMV, Ville de Montréal, 2026)</strong> — chaque ` +
      `milieu cumule de 0 à 6 vulnérabilités parmi six dimensions. Choisissez une dimension (ou l'ensemble) dans la ` +
      `boîte ci-contre ; la carte se colore selon cet indicateur. Cliquez un territoire pour la lecture des six ` +
      `dimensions.</p>` +
      `<p class="intro">Découpage : <strong>${esc(geo.full)}</strong> — données agrégées à ce découpage.</p>` +
      srcNote(`Source : <a href="https://donnees.montreal.ca/dataset/indice-equite-milieux-vie" target="_blank" ` +
        `rel="noopener">Ville de Montréal, données ouvertes</a>. Mesure relative servant à prioriser les ` +
        `investissements municipaux.`),
    panel: (geo, slug) => equitePanel(geo, slug, dimKey),
  });

  /* ================= Onglet — Participation électorale =====================
     Bascule municipale / provinciale / fédérale. Municipale : Élections
     Montréal 2021 (données existantes). Provinciale / fédérale : fichier de
     recherche séparé (window.PARTICIPATION_EXTRA), sinon bouton désactivé. */
  const PART_EXTRA = (typeof window !== "undefined" && window.PARTICIPATION_EXTRA) || null;
  const participLevel = (id, label, short, meta, geoObj, overall, breaks) => ({
    id: "part-" + id, label, short, dimC: "#a8842f", kind: "map", fixedGeo: "vdm",
    available: !!geoObj,
    breaks: breaks || [30, 40, 50, 60, 70],
    value: (g, s) => (geoObj && geoObj[s] != null ? geoObj[s] : null),
    pal: () => PART_PAL6,
    legendTitle: () => label + " — participation",
    legendNote: () => "% des personnes inscrites ayant voté,\npar arrondissement",
    landing: (geo) =>
      `<p class="intro"><strong>Participation électorale — ${esc(label.toLowerCase())}</strong>. Taux de ` +
      `participation par arrondissement. ` +
      (overall != null ? `Participation d'ensemble : <strong>${FR(overall, 1)} %</strong>. ` : "") +
      `Cliquez un territoire pour son taux.</p>` +
      (geoObj ? "" : `<p class="intro"><em>Données par territoire à intégrer.</em></p>`) +
      srcNote(meta || ""),
    panel: (geo, slug) => {
      const v = geoObj && geoObj[slug];
      if (v == null) return `<p class="intro">Donnée non disponible pour ce territoire.</p>`;
      return lead(big(v, PART_PAL6[5], 1),
          `des personnes inscrites ont voté — <strong>${esc(short.toLowerCase())}</strong>` +
          (overall != null ? ` <span class="indic-ref">· ensemble : ${FR(overall, 1)} %</span>` : "")) +
        srcNote(meta || "");
    },
  });
  // Provincial / fédéral : pas de carte par arrondissement (les circonscriptions
  // ne coïncident pas). On affiche les taux réels d'ensemble + la comparaison
  // entre paliers, en page défilante. Aucune valeur par territoire inventée.
  const participStat = (id, label, short, data) => ({
    id: "part-" + id, label, short, dimC: "#a8842f", kind: "graph", pageMode: true,
    available: !!data,
    landing: () => !data ? `<p class="intro">Données à intégrer.</p>` :
      `<p class="intro"><strong>${esc(label)}</strong></p>` +
      `<p class="intro">Participation d'ensemble : <strong style="color:#a8842f">${FR(data.overall, 2)} %</strong> ` +
      `(${esc(data.ref)}).</p>` +
      (data.zones ? `<p class="intro">Sur l'île de Montréal : ` +
        data.zones.map((z) => `${esc(z.nom)} <strong>${FR(z.taux, 2)} %</strong>`).join(" · ") + `.</p>` : "") +
      `<p class="intro">Le détail par circonscription individuelle reste à saisir depuis le fichier officiel.</p>` +
      srcNote(`Source : <a href="${esc(data.url)}" target="_blank" rel="noopener">${esc(data.meta)}</a>`),
    render: () => {
      if (!data) return `<p class="intro">Données à intégrer.</p>`;
      const pv = PART_EXTRA && PART_EXTRA.provincial, fd = PART_EXTRA && PART_EXTRA.federal;
      const rows = [["Municipale — Ville de Montréal (2021)", PART ? PART.meta.overall : null, "#a8842f"]];
      if (pv) {
        (pv.zones || []).forEach((z) => rows.push([`Provinciale — ${z.nom} (2022)`, z.taux, "#c69f45"]));
        rows.push(["Provinciale — ensemble du Québec (2022)", pv.overall, "#8a6a1f"]);
      }
      if (fd) rows.push(["Fédérale — ensemble du Canada (2021)", fd.overall, "#7d6120"]);
      return `<div class="soc-page"><header class="soc-hero"><span class="soc-kicker">Participation électorale</span>` +
        `<h2>${esc(label)}</h2><p>Taux de participation selon le palier de gouvernement. Plus l'élection est ` +
        `« locale » (municipale), plus la participation tend à être faible.</p></header>` +
        `<div class="part-compare">` + rows.map(([lb, v, c]) => v == null ? "" :
          `<div class="pc-row"><span class="pc-lab">${esc(lb)}</span>` +
          `<div class="pc-bar"><span style="width:${Math.min(100, v)}%;background:${c}"></span></div>` +
          `<span class="pc-val">${FR(v, 1)} %</span></div>`).join("") +
        `</div>` +
        `<p class="soc-src">Les taux provincial et fédéral sont des taux d'ensemble ; la ventilation montréalaise ` +
        `provinciale (Ouest / Est de l'île) est publiée, le détail par circonscription reste à ajouter. ` +
        `Sources : Élections Montréal (2021) ; Élections Québec (2022) ; Élections Canada (2021).</p></div>`;
    },
  });
  // Provincial : vraie carte découpée par circonscription (géométrie des députés).
  const participProvMap = (data) => ({
    id: "part-prov", label: "Provinciale (2022)", short: "Provincial", dimC: "#a8842f",
    kind: "map", fixedGeo: "circ",
    available: !!(data && data.byCirc && typeof DEPUTES_GEOMETRY !== "undefined"),
    breaks: [52, 56, 60, 64, 68],
    value: (g, s) => (data && data.byCirc && data.byCirc[s] != null ? data.byCirc[s] : null),
    pal: () => PART_PAL6,
    legendTitle: () => "Participation provinciale (2022)",
    legendNote: () => (data && data.exactPerRiding
      ? "% des inscrits ayant voté,\npar circonscription"
      : "% des inscrits ayant voté — taux de zone\n(Ouest / Est) en attendant les taux exacts"),
    landing: (geo) =>
      `<p class="intro"><strong>Participation provinciale (2022)</strong> — élection générale du 3 octobre 2022, ` +
      `par circonscription de l'île. Participation d'ensemble du Québec : <strong>66,06 %</strong>.</p>` +
      (data && !data.exactPerRiding
        ? `<p class="intro">Chaque circonscription est colorée au taux de sa zone (Ouest 55,25 % · Est 62,09 %) ` +
          `en attendant les taux exacts par circonscription.</p>` : "") +
      `<p class="intro">Cliquez une circonscription pour son taux.</p>` + srcNote(esc(data ? data.meta : "")),
    panel: (geo, slug) => {
      const v = data && data.byCirc && data.byCirc[slug];
      if (v == null) return `<p class="intro">Donnée non disponible pour cette circonscription.</p>`;
      return lead(big(v, PART_PAL6[5], 1),
          `des personnes inscrites ont voté — <strong>${esc(geo.name(slug))}</strong> (provincial, 2022) ` +
          `<span class="indic-ref">· Québec : 66,06 %</span>`) + srcNote(esc(data ? data.meta : ""));
    },
  });
  function participTabOptions() {
    const pv = PART_EXTRA && PART_EXTRA.provincial, fd = PART_EXTRA && PART_EXTRA.federal;
    const provOpt = (pv && pv.byCirc && typeof DEPUTES_GEOMETRY !== "undefined")
      ? participProvMap(pv)
      : participStat("prov", "Provinciale (2022)", "Provincial", pv);
    return [
      participLevel("mun", "Municipale (2021)", "Municipal",
        "Source : Élections Montréal, élection générale du 7 novembre 2021.",
        PART ? PART.geo : null, PART ? PART.meta.overall : null, [30, 35, 40, 45, 50]),
      provOpt,
      participStat("fed", "Fédérale (2021)", "Fédéral", fd),
    ];
  }

  /* ================= Onglet — Social (récit défilant) ======================
     Sentiment d'appartenance · satisfaction de la vie sociale · solitude,
     présentés en page défilante plutôt qu'en carte. */
  const socialOption = {
    id: "social", label: "Social", kind: "graph", pageMode: true, available: !!CAP,
    landing: () =>
      `<p class="intro"><strong>Capital social</strong> — la trame de liens, d'appartenance et de soutien qui relie ` +
      `les personnes à leur milieu. Trois mesures se lisent en faisant défiler la section&nbsp;: le sentiment ` +
      `d'appartenance, la satisfaction de la vie sociale et le degré de solitude.</p>` +
      srcNote("Sources : Institut de la statistique du Québec (ESCC, EQSP) — voir chaque section."),
    render: () => {
      if (!CAP) return `<p class="intro">Données en cours d'intégration.</p>`;
      const a = CAP.appartenance;
      const appartChart = a ? bigLine({
        labels: a.cycles, ymin: 40, ymax: 75,
        series: [{ vals: a.mtl, c: ACCENT, lbl: "Montréal" }, { vals: a.qc, c: INK, lbl: "Québec" }],
      }) : "";
      const solChart = (CAP.solitude && solitudeOption.render) ? solitudeOption.render() : "";
      return `<div class="soc-page">` +
        `<header class="soc-hero">` +
        `<h2>Les liens qui tiennent un milieu</h2>` +
        `<p>Trois lectures complémentaires du tissu social montréalais.</p></header>` +

        `<section class="soc-sec"><div class="soc-num" style="color:${ACCENT}">65&nbsp;%</div>` +
        `<div class="soc-body"><h3>Sentiment d'appartenance</h3>` +
        `<p>Part de la population de 12 ans et plus dont le sentiment d'appartenance à sa communauté locale est ` +
        `très ou plutôt fort. À Montréal, il progresse&nbsp;: <strong>65&nbsp;% en 2019-2020</strong>, contre 59&nbsp;% ` +
        `dix ans plus tôt — légèrement au-dessus de la moyenne québécoise.</p>` +
        `<div class="soc-chart">${appartChart}</div>` +
        `<p class="soc-src">${esc(CAP.meta ? CAP.meta.appartenance : "")}</p></div></section>` +

        (function () {
          const sat = CAP.satisfaction;
          if (!sat) return "";
          const SAT_C = ["#46747F", "#9dbcc1", "#D97A22", "#C43E42"];
          const stack = (dist) => `<div class="sat-stack">` + dist.map((v, i) =>
            `<span class="sat-seg" style="width:${v}%;background:${SAT_C[i]}" title="${esc(sat.cats[i])} : ${FR(v, 1)} %">` +
            (v >= 9 ? FR(v, 0) : "") + `</span>`).join("") + `</div>`;
          const legend = `<div class="sat-legend">` + sat.cats.map((c, i) =>
            `<span><span class="sat-sw" style="background:${SAT_C[i]}"></span>${esc(c)}</span>`).join("") + `</div>`;
          const rts = ["061", "062", "063", "064", "065"].filter((c) => sat.c2020[c]).map((c) =>
            `<div class="sat-row"><span class="sat-lab">${esc(RTS_NAMES[c] || c)}</span>${stack(sat.c2020[c])}</div>`).join("");
          return `<section class="soc-sec"><div class="soc-num" style="color:#46747F">81&nbsp;%</div>` +
            `<div class="soc-body"><h3>Satisfaction de la vie sociale</h3>` +
            `<p>En 2020-2021, <strong>81&nbsp;%</strong> des Montréalais·es de 15 ans et plus se disaient satisfait·es ` +
            `de leur vie sociale — mais la satisfaction a <strong>reculé</strong> depuis 2014-2015 (93&nbsp;%), la part ` +
            `« plutôt ou très insatisfaite » passant de 7&nbsp;% à près de 19&nbsp;%.</p>` +
            legend +
            `<p class="iq-title">Montréal — 2014-2015 vs 2020-2021</p>` +
            `<div class="sat-row"><span class="sat-lab">2014-2015</span>${stack(sat.c2014.mtl)}</div>` +
            `<div class="sat-row"><span class="sat-lab">2020-2021</span>${stack(sat.c2020.mtl)}</div>` +
            `<p class="iq-title">Par territoire (RTS, 2020-2021)</p>${rts}` +
            `<p class="soc-src">${esc(CAP.meta ? CAP.meta.satisfaction : "")}</p></div></section>`;
        })() +

        `<section class="soc-sec"><div class="soc-num" style="color:${ACCENT}">5,11</div>` +
        `<div class="soc-body"><h3>Degré de solitude</h3>` +
        `<p>Score moyen déclaré (échelle EQSP 2020-2021 ; un score plus élevé = plus de solitude). Le degré moyen ` +
        `est <strong>légèrement plus élevé à Montréal (5,11)</strong> que dans l'ensemble du Québec (4,99) ; l'écart ` +
        `est faible mais les intervalles de confiance ne se recoupent presque pas.</p>` +
        `<div class="soc-chart">${solChart}</div>` +
        `<p class="soc-src">${esc(CAP.meta ? CAP.meta.solitude : "")}</p></div></section>` +
        `</div>`;
    },
  };

  /* ================= Onglet — Alimentaire (page défilante) =================
     Insécurité alimentaire : série temporelle (ISQ) + mise en contexte
     (CMM, DRSP). Données régionales : pas de carte. */
  const alimScrollOption = {
    id: "alim", label: "Alimentaire", kind: "graph", pageMode: true, available: !!DATA.alim,
    landing: () =>
      `<p class="intro"><strong>Insécurité alimentaire</strong> — quand l'accès à une nourriture suffisante et ` +
      `saine est limité par le manque d'argent. Faites défiler la section pour voir l'évolution et le portrait ` +
      `montréalais.</p>` +
      srcNote("Sources : Institut de la statistique du Québec ; Communauté métropolitaine de Montréal ; " +
        "Direction régionale de santé publique de Montréal."),
    render: () => {
      if (!DATA.alim) return `<p class="intro">Données en cours d'intégration.</p>`;
      const a = DATA.alim;
      const years = a.years.map(String);
      const mtlVals = a.years.map((y) => (y === 2023 ? a.mtl2023 : null));
      const chart = bigLine({
        labels: years, ymin: 0, ymax: 26,
        series: [{ vals: a.qc, c: INK, lbl: "Québec", nd: 0 }, { vals: mtlVals, c: ACCENT, lbl: "Montréal", nd: 0 }],
      });
      const qc2023 = a.qc[a.years.indexOf(2023)];
      const qc2021 = a.qc[a.years.indexOf(2021)];
      const rise = (a.mtl2023 != null && qc2021 != null) ? null : null;
      const regBar = (lab, v, c) =>
        `<div class="pc-row"><span class="pc-lab">${esc(lab)}</span>` +
        `<div class="pc-bar"><span style="width:${Math.min(100, v * 3)}%;background:${c}"></span></div>` +
        `<span class="pc-val">${FR(v, 0)} %</span></div>`;
      return `<div class="soc-page alim-page">` +
        `<header class="soc-hero alim-hero"><h2>Se nourrir à Montréal</h2>` +
        `<p>Manger à sa faim n'est pas acquis pour tout le monde. À Montréal, l'insécurité alimentaire — quand le ` +
        `manque d'argent limite l'accès à une nourriture suffisante et saine — a bondi ces dernières années.</p></header>` +

        `<section class="soc-sec alim-big"><div class="soc-num alim-figure" style="color:${ACCENT}">22&nbsp;%</div>` +
        `<div class="soc-body"><h3>des ménages montréalais en situation d'insécurité alimentaire (2023)</h3>` +
        `<p>Soit plus d'un ménage sur cinq — insécurité marginale, modérée ou grave. C'est davantage que dans ` +
        `l'ensemble du Québec (${FR(qc2023, 0)}&nbsp;%), et en <strong>forte hausse</strong> depuis 2021.</p></div></section>` +

        `<section class="soc-sec"><div class="soc-num" style="color:${ACCENT}">↗</div>` +
        `<div class="soc-body"><h3>Une montée rapide depuis 2021</h3>` +
        `<p>Au Québec, la proportion est passée de ${FR(qc2021, 0)}&nbsp;% en 2021 à ${FR(qc2023, 0)}&nbsp;% en 2023. ` +
        `L'inflation alimentaire et la crise du logement rognent le budget consacré à la nourriture.</p>` +
        `<div class="soc-chart">${chart}</div>` +
        `<p class="soc-src">Source : <a href="${esc(a.meta.url)}" target="_blank" rel="noopener">Institut de la ` +
        `statistique du Québec, « L'insécurité alimentaire au Québec entre 2018 et 2023 » (ECR)</a>, mars 2026.</p></div></section>` +

        `<section class="soc-sec"><div class="soc-num" style="color:#6C6F3F">3</div>` +
        `<div class="soc-body"><h3>Montréal et Laval, régions les plus touchées (2023)</h3>` +
        `<div class="part-compare">` +
          regBar("Ensemble du Québec", qc2023, "#6C6F3F") +
          regBar("Montréal", a.mtl2023, ACCENT) +
          (a.laval2023 != null ? regBar("Laval", a.laval2023, "#C43E42") : "") +
        `</div>` +
        `<p class="soc-src">Barres à l'échelle relative. Source : ISQ, ECR 2018-2023.</p></div></section>` +

        `<section class="soc-sec"><div class="soc-num" style="color:#46747F">≈</div>` +
        `<div class="soc-body"><h3>Les mêmes territoires que la défavorisation</h3>` +
        `<p>L'insécurité alimentaire frappe surtout les ménages locataires, les familles monoparentales et les ` +
        `personnes seules — et se concentre dans les milieux les plus défavorisés. Elle se lit donc en écho aux ` +
        `cartes de <strong>défavorisation</strong> et d'<strong>équité</strong> de cette section.</p>` +
        `<p class="soc-src">Mise en contexte : Communauté métropolitaine de Montréal, ` +
        `<a href="https://indicateurs-vitaux.cmm.qc.ca/developpement-social/part-de-la-population-en-situation-d-insecurite-alimentaire/" ` +
        `target="_blank" rel="noopener">Indicateurs vitaux — insécurité alimentaire</a> ; DRSP de Montréal, ` +
        `<a href="https://santepubliquemontreal.ca/sites/drsp/files/media/document/Pub_20260507_PortraitSante.pdf" ` +
        `target="_blank" rel="noopener">Portrait de santé de la population (2026)</a>.</p></div></section>` +
        `</div>`;
    },
  };

  /* ---- onglets ------------------------------------------------------------ */
  const TABS = [
    { id: "defavo", label: "Défavorisation", toggle: true,
      options: [
        defavoOption("mat"),
        defavoOption("soc"),
        defavoOption("mpc"),
        defavoOption("log"),
      ] },
    { id: "equite", label: "Équité", title: "Équité des milieux de vie", boxSelect: true,
      options: [
        equiteOption("ens", null),
        equiteOption("cult", "cult"),
        equiteOption("prox", "prox"),
        equiteOption("secu", "secu"),
        equiteOption("envi", "envi"),
        equiteOption("eco", "eco"),
        equiteOption("soci", "soci"),
      ] },
    { id: "particip", label: "Participation", title: "Participation électorale", toggle: true, hideGeo: true,
      options: participTabOptions() },
    { id: "social", label: "Social", options: [socialOption], noSelect: true },
    { id: "alim", label: "Alimentaire", options: [alimScrollOption], noSelect: true },
    { id: "outil", label: "Outil", options: [rtOption], noSelect: true },
  ];

  /* ---- état ---------------------------------------------------------------- */
  let tab = TABS[0];
  let option = tab.options[0];
  let geo = GEOS.find((g) => g.id === "tq");
  let selected = null;

  /* ---- rendu ---------------------------------------------------------------- */
  const classOf = (v) => {
    if (v == null) return -1;
    let i = 0;
    while (i < option.breaks.length && v >= option.breaks[i]) i++;
    return i;
  };

  const paint = () => {
    if (option.kind !== "map") return;
    const pal = option.pal();
    Object.entries(paths).forEach(([slug, p]) => {
      const v = option.value(geo.id, slug);
      const c = classOf(v);
      p.classList.toggle("nodata", c < 0);
      if (c >= 0) p.style.fill = pal[c]; else p.style.removeProperty("fill");
    });
  };

  const renderLegend = () => {
    if (!legend) return;
    if (option.kind === "graph" || option.kind === "rt" || !option.available) {
      legend.innerHTML = ""; legend.style.display = "none"; return;
    }
    legend.style.display = "";
    if (option.kind === "mosaic") {
      legend.innerHTML =
        `<div style="font-weight:700">${esc(option.legendTitle())}</div>` +
        ["pv", "vnp", "nv"].map((cls) =>
          `<div><span class="sw" style="background:${NIV[cls].c}"></span>${NIV[cls].lbl}</div>`).join("") +
        `<div style="color:var(--muted);white-space:pre-line">${esc(option.legendNote())}</div>`;
      return;
    }
    const pal = option.pal();
    const rows = pal.map((c, i) => {
      const lo = i === 0 ? null : option.breaks[i - 1];
      const hi = i === pal.length - 1 ? null : option.breaks[i];
      const lab = lo == null ? `< ${hi} %` : hi == null ? `≥ ${lo} %` : `${lo} – ${hi} %`;
      return `<div><span class="sw" style="background:${c}"></span>${lab}</div>`;
    }).join("");
    legend.innerHTML =
      `<div style="font-weight:700">${esc(option.legendTitle())}</div>` + rows +
      `<div style="color:var(--muted);white-space:pre-line">${esc(option.legendNote())}</div>`;
  };

  const renderLanding = () => {
    panel.innerHTML =
      `<h2>${esc(option.kind === "rt" ? tab.label : option.label)}</h2><hr class="rule">` +
      (option.available ? option.landing(geo)
        : `<p class="intro">Données en cours d'intégration.</p>`);
  };

  const reset = () => {
    selected = null;
    Object.values(paths).forEach((p) => p.classList.remove("active"));
    if (option.kind === "rt" && graph) {
      graph.querySelectorAll(".rt-item").forEach((b) => b.setAttribute("aria-pressed", "false"));
    }
    renderLanding();
    panel.scrollTop = 0;
  };

  const select = (slug) => {
    if (!option.available || !option.panel) return;
    selected = slug;
    Object.values(paths).forEach((p) => p.classList.remove("active"));
    if (paths[slug]) paths[slug].classList.add("active");
    panel.innerHTML = `<h2>${esc(geo.name(slug))}</h2><hr class="rule">` + option.panel(geo, slug);
    panel.scrollTop = 0;
  };

  /* ---- scène : carte / mosaïque / graphique / grille RT --------------------- */
  const renderStage = () => {
    const isSvg = option.kind === "map" || option.kind === "mosaic";
    svg.style.display = isSvg ? "" : "none";
    if (graph) {
      graph.hidden = isSvg;
      graph.innerHTML = "";
    }
    if (graph) graph.classList.toggle("indic-page", !!option.pageMode);
    if (option.kind === "map") {
      buildChoropleth(geo);
      paint();
    } else if (option.kind === "mosaic") {
      buildMosaic(geo, option.mosaicId);
    } else if (graph) {
      graph.innerHTML = option.render ? option.render() : "";
    }
    // Pages défilantes : révélation progressive des sections au défilement.
    if (option.pageMode && graph) {
      const secs = graph.querySelectorAll(".soc-sec");
      if (window.IntersectionObserver) {
        const io = new IntersectionObserver((ents) => {
          ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("reveal-in"); io.unobserve(e.target); } });
        }, { root: graph, threshold: 0.12 });
        secs.forEach((s) => { s.classList.add("reveal"); io.observe(s); });
      }
    }
    renderLegend();
  };

  if (graph) {
    graph.addEventListener("click", (e) => {
      if (option.kind !== "rt") return;
      const b = e.target.closest(".rt-item");
      if (!b) { reset(); return; }
      graph.querySelectorAll(".rt-item").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)));
      panel.innerHTML = `<h2>RT ${b.dataset.rt} — ${esc(RTS[b.dataset.rt].t)}</h2><hr class="rule">` +
        rtOption.panelFor(b.dataset.rt);
      panel.scrollTop = 0;
    });
  }

  /* ---- contrôles ------------------------------------------------------------ */
  /* Sélecteur d'indicateur : soit un menu déroulant (par défaut), soit — si
     tab.toggle — une bascule de boutons dans le style des interrupteurs de
     dimension (chaque bouton peut porter sa couleur via --dim-c). */
  let optSwitch = null;
  const ensureOptSwitch = () => {
    if (optSwitch || !selectEl) return;
    optSwitch = document.createElement("div");
    optSwitch.className = "dim-switch indic-optswitch";
    optSwitch.setAttribute("role", "tablist");
    optSwitch.setAttribute("aria-label", "Choisir un indicateur");
    selectEl.parentNode.insertBefore(optSwitch, selectEl.nextSibling);
    optSwitch.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b && !b.disabled) setOption(b.dataset.opt);
    });
  };
  const renderSelect = () => {
    if (!selectEl) return;
    ensureOptSwitch();
    if (tab.noSelect) {
      selectEl.style.display = "none";
      if (optSwitch) optSwitch.style.display = "none";
      return;
    }
    const mapStage = document.querySelector("#view-indic .map-stage");
    if (tab.boxSelect) {
      // boîte verticale « comme la légende » : superposée à la carte (n'ampute
      // pas la hauteur de carte), 7 options, la sélectionnée se colore.
      selectEl.style.display = "none";
      optSwitch.style.display = "";
      if (mapStage && optSwitch.parentNode !== mapStage) mapStage.appendChild(optSwitch);
      optSwitch.className = "indic-boxselect";
      optSwitch.innerHTML = `<div class="bs-title">Dimension</div>` + tab.options.map((o) =>
        `<button data-opt="${o.id}" aria-current="${o.id === option.id}">` +
        `<span class="bs-sw"></span>${esc(o.short || o.label)}</button>`).join("");
      return;
    }
    // hors boxSelect : ramener la bascule dans la rangée de contrôles
    if (optSwitch.parentNode !== selectEl.parentNode) selectEl.parentNode.insertBefore(optSwitch, geosEl);
    if (tab.toggle) {
      selectEl.style.display = "none";
      optSwitch.style.display = "";
      optSwitch.className = "dim-switch indic-optswitch";
      optSwitch.innerHTML = tab.options.map((o) =>
        `<button data-opt="${o.id}" aria-current="${o.id === option.id}"` +
        (o.available === false ? " disabled title=\"Données à venir\"" : "") +
        (o.dimC ? ` style="--dim-c:${o.dimC}"` : "") +
        `>${esc(o.short || o.label)}</button>`).join("");
      return;
    }
    selectEl.style.display = "";
    if (optSwitch) optSwitch.style.display = "none";
    selectEl.innerHTML = tab.options.map((o) =>
      `<option value="${o.id}"${o.id === option.id ? " selected" : ""}>${esc(o.label)}</option>`).join("");
  };

  const renderGeos = () => {
    if (!geosEl) return;
    const mapKind = option.kind === "map" || option.kind === "mosaic";
    if (tab.hideGeo || !mapKind) { geosEl.innerHTML = ""; return; }
    geosEl.innerHTML = GEOS.map((g) => {
      const off = option.fixedGeo && option.fixedGeo !== g.id;
      return `<button data-geo="${g.id}" title="${esc(off
        ? "Données disponibles seulement au découpage " + (GEOS.find((x) => x.id === option.fixedGeo) || {}).full
        : g.full)}" aria-current="${g.id === geo.id}"${off ? " disabled" : ""}>${esc(g.label)}</button>`;
    }).join("");
  };

  const setGeo = (id) => {
    geo = GEOS.find((g) => g.id === id) || geo;
    renderGeos();
    renderStage();
    reset(); // les identifiants de territoires diffèrent d'un découpage à l'autre
  };

  const setOption = (id) => {
    option = tab.options.find((o) => o.id === id) || tab.options[0];
    if (option.fixedGeo) geo = GEOS_ALL.find((g) => g.id === option.fixedGeo) || geo;
    renderSelect();
    renderGeos();
    renderStage();
    reset();
  };

  const setTab = (id) => {
    tab = TABS.find((t) => t.id === id) || TABS[0];
    if (title) title.textContent = tab.title || tab.label;
    if (eyebrow) [...eyebrow.querySelectorAll(".map-pick")].forEach((b) =>
      b.setAttribute("aria-current", b.dataset.tab === tab.id ? "page" : "false"));
    setOption(tab.options[0].id);
  };

  if (eyebrow) {
    eyebrow.innerHTML = TABS.map((t) =>
      `<button class="map-pick" data-tab="${t.id}">${esc(t.label)}</button>`).join("");
    eyebrow.addEventListener("click", (e) => {
      const b = e.target.closest(".map-pick");
      if (b) setTab(b.dataset.tab);
    });
  }
  if (selectEl) selectEl.addEventListener("change", () => setOption(selectEl.value));
  if (geosEl) {
    geosEl.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b && !b.disabled && b.dataset.geo !== geo.id) setGeo(b.dataset.geo);
    });
  }

  /* clic hors de l'île (fond du svg) : retour à la fiche de l'indicateur */
  svg.addEventListener("click", (e) => { if (e.target === svg) reset(); });

  /* ---- barre coulissante entre carte et panneau -----------------------------
     Utilise la fabrique partagée de app.js (window.makeSplitter) pour un
     comportement identique aux cartes ; conserve la clé « indicSplit ». */
  if (window.makeSplitter) window.makeSplitter(document.querySelector("#view-indic .wrap"), "indicSplit");

  setTab(TABS[0].id);
}

initIndicMap();
