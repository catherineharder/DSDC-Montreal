/* Indicateurs — six onglets : Défavorisation, Équité, Participation, Social,
   Alimentaire, Outil (voir le registre TABS, plus bas).

   Chaque onglet porte un sélecteur d'indicateurs. Selon l'indicateur, la scène
   affiche :
     - une choroplèthe par territoire (découpages SQ / VdM / TQ) ;
     - un graphique ou une page défilante (données régionales seulement).
   Les valeurs viennent d'assets/data/indicateurs.data.js (INDIC_DATA), généré
   par tools/build_indicateurs.py. Cliquer un territoire affiche son détail ;
   cliquer hors de l'île revient à la fiche de l'indicateur.

   Note : la mosaïque IEMV par aire de diffusion (et son fichier de géométrie de
   702 Ko) a été retirée en juillet 2026 — le code était devenu inatteignable.
   Récupérable dans l'historique git si la vue revient. */

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
  const INK = "#000000", ACCENT = "#D97A22";

  /* ---- petits gabarits de rendu ------------------------------------------ */
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

  /* ---- registre : onglets et indicateurs ---------------------------------- */

  const rec = (grp, geoId, slug) => {
    const g = DATA[grp] && DATA[grp].geo && DATA[grp].geo[geoId];
    return g ? g[slug] : null;
  };

  const srcNote = (t) => `<p class="iq-note">${t}</p>`;

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
  /* ================= Onglet 2 — Équité des milieux de vie ================= */

  const DIMS_IEMV = DATA.iemv && DATA.iemv.meta.dims ? DATA.iemv.meta.dims : {};
  const PART = DATA.participation || null;

  /* ================= Onglet 3 — Capital social ============================ */

  const CAP = DATA.capital || null;

  /* Réseaux territoriaux de services : libellés courts, utilisés par la carte
     sociale et par les panneaux de satisfaction. */
  const RTS_NAMES = {
    "061": "Ouest-de-l'Île", "062": "Centre-Ouest", "063": "Centre-Sud",
    "064": "Nord-de-l'Île", "065": "Est-de-l'Île",
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

  /* Outil : les 12 RT en disposition verticale. Chaque RT = boîte verte (le
     résultat + sa définition) ; s'il comporte un revers, une boîte jaune sous
     la verte. Définitions non cliquables. Le panneau de droite décrit l'outil. */
  const rtCleanRevers = (s) => String(s || "").replace(/^\s*Revers\s*[—–-]\s*/i, "");
  const rtVerticalHTML = () =>
    `<div class="outil-page">` +
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
      return `<div class="soc-page"><header class="soc-hero">` +
        `<h2>${esc(label)}</h2></header>` +
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

  /* ================= Onglet — Social (carte seule + panneau) ===============
     La scène ne porte que la carte des 5 réseaux territoriaux de services
     (RTS), colorée par la part de la population SATISFAITE de sa vie sociale
     — comme les autres onglets à carte. Tout le récit vit dans le panneau de
     droite : à l'ouverture, la satisfaction (Montréal et par territoire) puis
     le sentiment d'appartenance et le degré de solitude ; au clic sur un
     territoire, son détail (4 catégories, deux cycles, repère Montréal). */

  const SAT_C = ["#46747F", "#9dbcc1", "#D97A22", "#C43E42"];
  /* seuils sur la part satisfaite (très + plutôt satisfaisante), 2020-2021 */
  const SAT_BREAKS = [79, 81, 83];
  /* clés de SANTE_TERR -> codes de RTS utilisés par les données EQSP */
  const TERR_CODE = { "ouest": "061", "centre-ouest": "062", "centre-sud": "063",
    "nord": "064", "est": "065" };
  const satClass = (v) => {
    if (v == null) return -1;
    let i = 0;
    while (i < SAT_BREAKS.length && v >= SAT_BREAKS[i]) i++;
    return i;
  };
  const satisfPart = (d) => +(d[0] + d[1]).toFixed(1);
  /* barre empilée 4 catégories ; mark = repère pointillé (en %) */
  const satStack = (dist, mark, markTitle) => {
    const cats = (CAP && CAP.satisfaction && CAP.satisfaction.cats) || [];
    return `<div class="sat-stack">` + dist.map((v, i) =>
      `<span class="sat-seg" style="width:${v}%;background:${SAT_C[i]}" ` +
      `title="${esc(cats[i] || "")} : ${FR(v, 1)} %">` + (v >= 9 ? FR(v, 0) : "") + `</span>`).join("") +
      (mark != null ? `<span class="sat-mark" style="left:${Math.min(99.6, mark)}%"` +
        (markTitle ? ` title="${esc(markTitle)}"` : "") + `></span>` : "") +
      `</div>`;
  };
  const satLegend = () => {
    const cats = (CAP && CAP.satisfaction && CAP.satisfaction.cats) || [];
    return `<div class="sat-legend">` + cats.map((c, i) =>
      `<span><span class="sat-sw" style="background:${SAT_C[i]}"></span>${esc(c)}</span>`).join("") + `</div>`;
  };

  /* carte RTS (même projection 1000x875 que les autres cartes), colorée par
     la part satisfaite de sa vie sociale */
  const socialMapSVG = () => {
    if (typeof SANTE_TERR === "undefined" || !CAP || !CAP.satisfaction) return "";
    const sat = CAP.satisfaction.c2020;
    const shapes = Object.entries(SANTE_TERR).map(([key, d]) => {
      const code = TERR_CODE[key];
      const v = (code && sat[code]) ? satisfPart(sat[code]) : null;
      const cl = satClass(v);
      const fill = cl < 0 ? "var(--cream)" : SAT_PAL4[cl];
      return `<path class="soc-rts" d="${d}" data-rts="${code}" fill="${fill}" tabindex="0" role="button" ` +
        `aria-label="${esc(RTS_NAMES[code] || key)} — ${PCT(v, 1)} de la population satisfaite">` +
        `<title>${esc(RTS_NAMES[code] || key)} — ${PCT(v, 1)} satisfait·es</title></path>`;
    }).join("");
    const outline = (typeof TDQ_SILHOUETTE !== "undefined")
      ? `<path class="tdq-outline" d="${TDQ_SILHOUETTE}" aria-hidden="true"/>` : "";
    const keys = SAT_PAL4.map((c, i) => {
      const lo = i === 0 ? null : SAT_BREAKS[i - 1];
      const hi = i === SAT_PAL4.length - 1 ? null : SAT_BREAKS[i];
      const lab = lo == null ? `< ${hi} %` : hi == null ? `≥ ${lo} %` : `${lo} – ${hi} %`;
      return `<div><span class="sw" style="background:${c}"></span>${lab}</div>`;
    }).join("");
    return `<div class="soc-map-wrap">` +
      `<div class="soc-map-legend"><div class="sml-t">Satisfaction de sa vie sociale<br>(2020-2021)</div>${keys}` +
      `<div class="sml-n">Population de 15 ans et plus,<br>par réseau territorial de services</div></div>` +
      `<svg class="soc-map" viewBox="0 0 1000 875" preserveAspectRatio="xMidYMid meet" role="group" ` +
      `aria-label="Carte de la satisfaction de la vie sociale par réseau territorial de services">` +
      `${shapes}${outline}</svg></div>`;
  };

  /* ---- petits graphiques du panneau (format étroit) ----------------------- */
  const miniLine = (cfg) => {
    const { labels, series, ymin, ymax } = cfg;
    const W = 320, H = 168, L = 24, R = 10, T = 30, B = 22;
    const iw = W - L - R, ih = H - T - B;
    const x = (i) => L + iw * i / (labels.length - 1);
    const y = (v) => T + ih * (1 - (v - ymin) / (ymax - ymin));
    let out = `<svg viewBox="0 0 ${W} ${H}" role="img" class="trend-svg mini-line">`;
    out += series.map((s, i) =>
      `<circle cx="${L + i * 96 + 4}" cy="${T - 18}" r="4" fill="${s.c}"/>` +
      `<text x="${L + i * 96 + 12}" y="${T - 14}" class="tc-lab" fill="${s.c}">${esc(s.lbl)}</text>`).join("");
    out += `<line x1="${L}" y1="${T + ih}" x2="${W - R}" y2="${T + ih}" stroke="#000" stroke-width="1"/>`;
    out += labels.map((lb, i) => (i % 2 === 0 || i === labels.length - 1)
      ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="tc-axis">${esc(lb)}</text>` : "").join("");
    series.forEach((s) => {
      out += `<polyline points="${s.vals.map((v, i) => `${x(i)},${y(v)}`).join(" ")}" fill="none" ` +
        `stroke="${s.c}" stroke-width="2.2" stroke-linejoin="round"/>`;
      s.vals.forEach((v, i) => { out += `<circle cx="${x(i)}" cy="${y(v)}" r="2.6" fill="${s.c}"/>`; });
      const last = s.vals.length - 1;
      out += `<text x="${x(last)}" y="${y(s.vals[last]) - 8}" text-anchor="end" class="tc-val" ` +
        `fill="${s.c}">${FR(s.vals[last], 0)}</text>`;
    });
    return out + `</svg>`;
  };

  const miniSolitude = () => {
    const s = CAP && CAP.solitude;
    if (!s) return "";
    const W = 320, H = 130, L = 58, R = 16;
    const iw = W - L - R, xmin = 4.7, xmax = 5.5;
    const x = (v) => L + iw * (v - xmin) / (xmax - xmin);
    const row = (lbl, d, c, yy) =>
      `<text x="${L - 8}" y="${yy + 4}" text-anchor="end" class="tc-lab" fill="${c}">${lbl}</text>` +
      `<line x1="${x(d.ic[0])}" y1="${yy}" x2="${x(d.ic[1])}" y2="${yy}" stroke="${c}" stroke-width="2.5" opacity=".45"/>` +
      `<line x1="${x(d.ic[0])}" y1="${yy - 5}" x2="${x(d.ic[0])}" y2="${yy + 5}" stroke="${c}" stroke-width="2" opacity=".45"/>` +
      `<line x1="${x(d.ic[1])}" y1="${yy - 5}" x2="${x(d.ic[1])}" y2="${yy + 5}" stroke="${c}" stroke-width="2" opacity=".45"/>` +
      `<circle cx="${x(d.moy)}" cy="${yy}" r="5" fill="${c}"/>` +
      `<text x="${x(d.moy)}" y="${yy - 11}" text-anchor="middle" class="tc-val" fill="${c}">${FR(d.moy, 2)}</text>`;
    let out = `<svg viewBox="0 0 ${W} ${H}" role="img" class="trend-svg">`;
    [4.8, 5.0, 5.2, 5.4].forEach((v) => {
      out += `<line x1="${x(v)}" y1="18" x2="${x(v)}" y2="${H - 26}" stroke="#e6e1d5" stroke-width="1"/>` +
        `<text x="${x(v)}" y="${H - 10}" text-anchor="middle" class="tc-axis">${FR(v, 1)}</text>`;
    });
    out += row("Montréal", s.mtl, ACCENT, 42);
    out += row("Québec", s.qc, INK, 84);
    return out + `</svg>`;
  };

  /* détail d'un RTS : 4 catégories + comparaison des deux cycles */
  const socialRtsPanel = (code) => {
    const sat = CAP && CAP.satisfaction;
    const v20 = sat && sat.c2020[code], v14 = sat && sat.c2014[code];
    if (!v20) return `<p class="intro">Données non disponibles pour ce territoire.</p>`;
    const m20 = sat.c2020.mtl, m14 = sat.c2014.mtl;
    const s20 = satisfPart(v20), s14 = v14 ? satisfPart(v14) : null;
    const ms20 = satisfPart(m20), ms14 = satisfPart(m14);
    const delta = (s14 != null) ? +(s20 - s14).toFixed(1) : null;
    return lead(big(s20, SAT_C[0], 1),
        `de la population de 15 ans et plus se dit <strong>très ou plutôt satisfaite</strong> de sa vie sociale ` +
        `en 2020-2021 <span class="indic-ref">· Montréal : ${PCT(ms20, 1)}</span>`) +
      satLegend() +
      `<p class="iq-title">Répartition (2020-2021)</p>` +
      satStack(v20, ms20, `Montréal : ${FR(ms20, 1)} % satisfait·es`) +
      `<p class="iq-title">Évolution — 2014-2015 vs 2020-2021</p>` +
      (v14
        ? `<div class="sat-row"><span class="sat-lab">2014-2015</span>` +
          satStack(v14, ms14, `Montréal 2014-2015 : ${FR(ms14, 1)} % satisfait·es`) + `</div>` +
          `<div class="sat-row"><span class="sat-lab">2020-2021</span>` +
          satStack(v20, ms20, `Montréal 2020-2021 : ${FR(ms20, 1)} % satisfait·es`) + `</div>` +
          `<p class="intro" style="margin-top:10px">Part satisfaite&nbsp;: <strong>${PCT(s14, 1)}</strong> en 2014-2015 ` +
          `→ <strong>${PCT(s20, 1)}</strong> en 2020-2021 ` +
          `<span class="indic-ref">(${delta > 0 ? "+" : "−"}${FR(Math.abs(delta), 1)} point${Math.abs(delta) >= 2 ? "s" : ""})</span>. ` +
          `À Montréal&nbsp;: ${PCT(ms14, 1)} → ${PCT(ms20, 1)}.</p>`
        : `<p class="intro">Cycle 2014-2015 non disponible pour ce territoire.</p>`) +
      `<p class="iq-note"><span class="sat-mark-key"></span> Le trait pointillé marque la part satisfaite de ` +
      `l'ensemble de Montréal pour le même cycle.</p>` +
      srcNote(esc(CAP.meta ? CAP.meta.satisfaction : ""));
  };

  /* panneau par défaut : satisfaction (Montréal + territoires), puis
     sentiment d'appartenance et degré de solitude */
  const socialLanding = () => {
    if (!CAP) return `<p class="intro">Données en cours d'intégration.</p>`;
    const sat = CAP.satisfaction, a = CAP.appartenance;
    const satBlock = sat
      ? `<p class="intro"><strong>Satisfaction de sa vie sociale</strong> — en 2020-2021, ` +
        `<strong>${PCT(satisfPart(sat.c2020.mtl), 0)}</strong> des Montréalais·es de 15 ans et plus se disaient ` +
        `très ou plutôt satisfait·es, contre ${PCT(satisfPart(sat.c2014.mtl), 0)} en 2014-2015. La carte colore ` +
        `chaque territoire selon cette part&nbsp;; cliquez-en un pour son détail.</p>` +
        satLegend() +
        `<p class="iq-title">Montréal — 2014-2015 vs 2020-2021</p>` +
        `<div class="sat-row"><span class="sat-lab">2014-2015</span>${satStack(sat.c2014.mtl)}</div>` +
        `<div class="sat-row"><span class="sat-lab">2020-2021</span>${satStack(sat.c2020.mtl)}</div>` +
        `<p class="iq-title">Par territoire (RTS, 2020-2021)</p>` +
        ["061", "062", "063", "064", "065"].filter((c) => sat.c2020[c]).map((c) =>
          `<div class="sat-row"><span class="sat-lab">${esc(RTS_NAMES[c] || c)}</span>` +
          `${satStack(sat.c2020[c])}</div>`).join("") +
        srcNote(esc(CAP.meta ? CAP.meta.satisfaction : ""))
      : "";
    const appartBlock = a
      ? `<hr class="rule">` +
        `<p class="intro"><strong>Sentiment d'appartenance</strong> — part de la population de 12 ans et plus dont ` +
        `le sentiment d'appartenance à sa communauté locale est très ou plutôt fort. À Montréal, il progresse&nbsp;: ` +
        `<strong style="color:${ACCENT}">${PCT(a.mtl[a.mtl.length - 1], 0)} en ${esc(a.cycles[a.cycles.length - 1])}</strong>, ` +
        `contre ${PCT(a.mtl[0], 0)} dix ans plus tôt — légèrement au-dessus de la moyenne québécoise.</p>` +
        miniLine({
          labels: a.cycles.map((c) => c.replace(/^20/, "")), ymin: 50, ymax: 70,
          series: [{ vals: a.mtl, c: ACCENT, lbl: "Montréal" }, { vals: a.qc, c: INK, lbl: "Québec" }],
        }) +
        srcNote(esc(CAP.meta ? CAP.meta.appartenance : ""))
      : "";
    const solBlock = (CAP.solitude && CAP.solitude.mtl)
      ? `<hr class="rule">` +
        `<p class="intro"><strong>Degré de solitude</strong> — score moyen déclaré (EQSP 2020-2021 ; un score plus ` +
        `élevé = plus de solitude). Il est <strong style="color:${ACCENT}">légèrement plus élevé à Montréal ` +
        `(${FR(CAP.solitude.mtl.moy, 2)})</strong> que dans l'ensemble du Québec (${FR(CAP.solitude.qc.moy, 2)})&nbsp;; ` +
        `l'écart est faible mais les intervalles de confiance ne se recoupent presque pas.</p>` +
        miniSolitude() +
        srcNote(esc(CAP.meta ? CAP.meta.solitude : ""))
      : "";
    return satBlock + appartBlock + solBlock;
  };

  const socialOption = {
    id: "social", label: "Social", kind: "graph", available: !!CAP,
    landing: socialLanding,
    render: () => (CAP ? socialMapSVG() : `<p class="intro">Données en cours d'intégration.</p>`),
    /* interactions de la carte */
    mount: (root) => {
      const map = root.querySelector(".soc-map");
      if (!map) return;
      const shapes = root.querySelectorAll(".soc-rts");
      const clear = () => shapes.forEach((q) => q.classList.remove("active"));
      const pick = (code) => {
        clear();
        shapes.forEach((q) => { if (q.dataset.rts === code) q.classList.add("active"); });
        panel.innerHTML = `<h2>${esc(RTS_NAMES[code] || code)}</h2><hr class="rule">` + socialRtsPanel(code);
        panel.scrollTop = 0;
      };
      shapes.forEach((p) => {
        p.addEventListener("click", () => pick(p.dataset.rts));
        p.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(p.dataset.rts); }
        });
      });
      map.addEventListener("click", (e) => {
        if (e.target === map || e.target.classList.contains("tdq-outline")) {
          clear();
          renderLanding();
          panel.scrollTop = 0;
        }
      });
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
    { id: "alim", label: "Alimentaire", title: "Insécurité alimentaire",
      options: [alimScrollOption], noSelect: true },
    { id: "outil", label: "Outil",
      title: "Outil d'appréciation des effets de l'action intersectorielle locale",
      options: [rtOption], noSelect: true },
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
    if (option.kind === "graph" || !option.available) {
      legend.innerHTML = ""; legend.style.display = "none"; return;
    }
    legend.style.display = "";
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
      `<h2>${esc(option.label)}</h2><hr class="rule">` +
      (option.available ? option.landing(geo)
        : `<p class="intro">Données en cours d'intégration.</p>`);
  };

  const reset = () => {
    selected = null;
    Object.values(paths).forEach((p) => p.classList.remove("active"));
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
    const isSvg = option.kind === "map";
    svg.style.display = isSvg ? "" : "none";
    if (graph) {
      graph.hidden = isSvg;
      graph.innerHTML = "";
    }
    if (graph) graph.classList.toggle("indic-page", !!option.pageMode);
    if (option.kind === "map") {
      buildChoropleth(geo);
      paint();
    } else if (graph) {
      graph.innerHTML = option.render ? option.render() : "";
      if (option.mount) option.mount(graph);
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

  /* ---- contrôles ------------------------------------------------------------ */
  /* Sélecteur d'indicateur : soit un menu déroulant (par défaut), soit — si
     tab.toggle — une bascule de boutons dans le style des interrupteurs de
     dimension (chaque bouton peut porter sa couleur via --dim-c). */
  let optSwitch = null;
  const ensureOptSwitch = () => {
    if (optSwitch || !selectEl) return;
    optSwitch = document.createElement("div");
    optSwitch.className = "dim-switch indic-optswitch";
    // role="group" et non "tablist" : les enfants sont des <button> ordinaires,
    // sans role="tab" ni panneaux associés. Un tablist vide de tabs est annoncé
    // « liste d'onglets, 0 onglet » par les lecteurs d'écran.
    optSwitch.setAttribute("role", "group");
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
        (o.dimC ? ` class="dim-tinted" style="--dim-c:${o.dimC}"` : "") +
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
    const mapKind = option.kind === "map";
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
    if (title) {
      const t = tab.title || tab.label;
      title.textContent = t;
      title.classList.toggle("t-long", t.length > 30);
    }
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
