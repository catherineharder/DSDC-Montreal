/* Santé Québec — rendu de la carte RTS/RLS (injecte son propre style à l'exécution). */

function initSanteMap() {
  const svg = el("sante-map");
  const panel = el("panel-sante");
  if (!svg || !panel) return;
  const legend = document.querySelector("#view-sante .legend");
  const order = ["ouest","centre-ouest","centre-sud","nord","est"];
  let activeSlug = null, activeRLS = null;

  if (!document.getElementById("sante-style")) {
    const st = document.createElementNS("http://www.w3.org/1999/xhtml","style");
    st.id = "sante-style";
    st.textContent =
      ".sq-bg{fill:transparent;cursor:default;}"
      + ".sq-terr{fill:var(--accent);fill-opacity:.20;stroke:var(--ink);stroke-width:3;"
      + "stroke-linejoin:round;stroke-linecap:round;cursor:pointer;transition:fill-opacity 140ms ease;}"
      + ".sq-terr:hover{fill-opacity:.55;}.sq-terr:focus{outline:none;}.sq-terr:focus-visible{stroke-width:3;}"
      + ".sq-rls{fill:var(--accent);fill-opacity:.55;stroke:var(--ink);stroke-width:3;"
      + "stroke-linejoin:round;stroke-linecap:round;cursor:pointer;transition:fill-opacity 140ms ease;}"
      + ".sq-rls:hover{fill-opacity:.80;}.sq-rls.active{fill-opacity:1;}"
      + ".sq-rls:focus{outline:none;}.sq-rls:focus-visible{stroke-width:3;}"
      + ".rls-card{cursor:pointer;border-radius:8px;transition:background .15s}"
      + ".rls-card:hover{background:rgba(0,0,0,.04)}.rls-card.sel{background:rgba(0,0,0,.06)}"
      + ".sante-hint{font-size:12px;color:var(--muted);margin:.2rem 0 1rem;}"
      + ".legend .sw.high{background:var(--accent);}";
    document.head.appendChild(st);
  }

  const SQ_KEY =
    '<div><span class="sw low"></span>Région sociosanitaire (RSS) de Montréal</div>'
    + '<div><span class="sw mid"></span>Les 5 réseaux territoriaux de services (RTS)</div>'
    + '<div><span class="sw high"></span>Les réseaux locaux de services (RLS)</div>';
  const setLegend = () => { if (legend) legend.innerHTML = SQ_KEY; };
  const clearSvg = () => { while (svg.firstChild) svg.removeChild(svg.firstChild); };
  const addPath = (d, cls) => {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d); p.setAttribute("class", cls); svg.appendChild(p); return p;
  };
  const keyAct = (p, fn) => p.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });

  const PDF_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
  const santeExtrasHTML = () =>
    `<div class="map-extra">` +
      `<p class="block-title">Structure du système</p>` +
      `<figure class="mx-fig" data-enlarge="images/cartes/structure-systeme-sante.png" ` +
        `data-caption="Structure du système de santé et de services sociaux du Québec" ` +
        `data-source="https://www.quebec.ca/sante/systeme-et-services-de-sante/organisation-des-services/systeme-quebecois-de-sante-et-de-services-sociaux/structure-systeme-sante-services-sociaux-quebec">` +
        `<img src="images/cartes/structure-systeme-sante.png" alt="Structure du système de santé et de services sociaux du Québec">` +
        `<div class="mx-ph"><svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 16 5-5 4 4"/><circle cx="8.5" cy="8.5" r="1.5"/></svg><span>Structure du système — image à ajouter<br>(cliquer pour la source)</span></div>` +
        `<figcaption>Cliquer pour agrandir · <a href="https://www.quebec.ca/sante/systeme-et-services-de-sante/organisation-des-services/systeme-quebecois-de-sante-et-de-services-sociaux/structure-systeme-sante-services-sociaux-quebec" target="_blank" rel="noopener">source&nbsp;: quebec.ca</a></figcaption>` +
      `</figure>` +
      `<div class="mx-btns">` +
        `<a class="mx-btn" href="https://cdn-contenu.quebec.ca/cdn-contenu/premier-ministre/equipe/conseil-ministre/conseil-ministres.pdf" target="_blank" rel="noopener">${PDF_ICON}<span class="mx-lab">Conseil des ministres</span></a>` +
        `<a class="mx-btn" href="https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/sante-services-sociaux/publications-adm/ORG_organigramme_MSSS_01.pdf" target="_blank" rel="noopener">${PDF_ICON}<span class="mx-lab">Organigramme du MSSS</span></a>` +
        `<a class="mx-btn" href="https://fichier.sitesq.apps.ti.sante.quebec/sq-1/2026-03/Structure%20organisationnelle_Sant%C3%A9%20Qu%C3%A9bec_v27.02.2026.pdf" target="_blank" rel="noopener">${PDF_ICON}<span class="mx-lab">Haute direction de Santé Québec</span></a>` +
      `</div>` +
    `</div>`;

  const landingHTML = () =>
    `<h2>Santé Québec &ndash; Île de Montréal</h2><hr class="rule">` +
    `<p class="intro">L'île de Montréal est divisée en 5 territoires de Santé Québec ` +
    `(anciens CIUSSS). Survolez ou cliquez un territoire pour le mettre en évidence et ` +
    `afficher ses réseaux locaux de services (RLS) ; cliquez un RLS pour voir ses CLSC.</p>` +
    `<ul class="items">${order.map((s) => `<li>${esc(SANTE[s].name)}</li>`).join("")}</ul>` +
    santeExtrasHTML();

  const terrHTML = (t) =>
    `<h2>${esc(t.name)}</h2><hr class="rule">` +
    `<p class="sante-hint">Cliquez un RLS (carte ou liste) pour le situer · cliquez ailleurs pour revenir aux territoires.</p>` +
    t.rls.map((r) =>
      `<div class="block rls-card${r.code === activeRLS ? " sel" : ""}" data-rls="${esc(r.code)}">` +
      `<p class="block-title">${esc(r.nom)}</p>` +
      `<ul class="items">${r.clsc.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` +
      `</div>`).join("");

  const renderPanel = () => {
    panel.innerHTML = activeSlug ? terrHTML(SANTE[activeSlug]) : landingHTML();
    panel.scrollTop = 0;
    if (activeSlug) panel.querySelectorAll(".rls-card").forEach((c) =>
      c.addEventListener("click", () => pickRLS(c.dataset.rls)));
    else if (window.wireMapExtras) window.wireMapExtras(panel);
  };

  const render = () => {
    clearSvg();
    const bg = document.createElementNS(SVG_NS, "rect");
    bg.setAttribute("x","0"); bg.setAttribute("y","0");
    bg.setAttribute("width","1000"); bg.setAttribute("height","875");
    bg.setAttribute("class","sq-bg"); svg.appendChild(bg);
    bg.addEventListener("click", reset);
    order.forEach((slug) => {
      if (slug === activeSlug) {
        SANTE[slug].rls.forEach((r) => {
          const p = addPath(SANTE_RLS[r.slug], "sq-rls" + (r.code === activeRLS ? " active" : ""));
          p.dataset.slug = r.slug; p.setAttribute("tabindex","0");
          p.setAttribute("role","button"); p.setAttribute("aria-label", r.nom);
          const fn = () => pickRLS(r.code);
          p.addEventListener("click", fn); keyAct(p, fn);
        });
      } else {
        const p = addPath(SANTE_TERR[slug], "sq-terr");
        p.setAttribute("tabindex","0"); p.setAttribute("role","button");
        p.setAttribute("aria-label", SANTE[slug].name);
        const fn = () => pickTerr(slug);
        p.addEventListener("click", fn); keyAct(p, fn);
      }
    });
    setLegend(activeSlug ? "Réseau local de services (RLS)" : "Territoire de Santé Québec");
  };

  function pickTerr(slug) { activeSlug = slug; activeRLS = null; render(); renderPanel(); }
  function pickRLS(code) {
    activeRLS = (activeRLS === code) ? null : code;
    svg.querySelectorAll(".sq-rls").forEach((n) =>
      n.classList.toggle("active", n.dataset.slug === "rls-" + code && activeRLS === code));
    panel.querySelectorAll(".rls-card").forEach((c) =>
      c.classList.toggle("sel", c.dataset.rls === code && activeRLS === code));
    const card = panel.querySelector('.rls-card[data-rls="' + code + '"]');
    if (card && activeRLS === code && card.scrollIntoView) card.scrollIntoView({ block: "nearest" });
  }
  function reset() { activeSlug = null; activeRLS = null; render(); renderPanel(); }

  render(); renderPanel();
  el("sante-logo")?.addEventListener("click", reset);

  // register this map's territoires (RTS) + RLS for the shared "Cartes" search
  const sqEntries = [];
  order.forEach((slug) => {
    sqEntries.push({ label: SANTE[slug].name, value: "T:" + slug });
    SANTE[slug].rls.forEach((r) => sqEntries.push({ label: r.nom, value: "R:" + slug + ":" + r.code }));
  });
  const selectFromSearch = (v) => {
    if (v.charAt(0) === "T") { pickTerr(v.slice(2)); }
    else { const parts = v.split(":"); pickTerr(parts[1]); pickRLS(parts[2]); }
  };
  window.CARTES = window.CARTES || {};
  window.CARTES.sante = { groupLabel: "Santé Québec", select: selectFromSearch, entries: sqEntries };
}

initSanteMap();
