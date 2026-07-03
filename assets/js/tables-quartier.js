/* Tables de quartier — carte des 32 territoires des tables de quartier de l'île,
   découpés sur la silhouette de Montréal (voir assets/data/tables-quartier.data.js).
   Réutilise createMap d'app.js. La silhouette sert de fond (sous les tables) et de
   contour net (au-dessus), tous deux inertes ; chaque table est cliquable. */

function initTdqMap() {
  const svg = el("tdq-map");
  const panel = el("tdq-panel");
  if (!svg || !panel || typeof TDQ_GEOMETRY === "undefined") return;

  const lookup = (slug) => {
    if (typeof TDQ_TABLES === "undefined" || !TDQ_TABLES[slug]) return null;
    return { ...TDQ_TABLES[slug], slug };
  };

  // Membres d'une table, groupés par catégorie (puces vertes via --accent du
  // view #view-tdq). Chaque organisme avec lien ouvre sa fiche Google Maps
  // dans un nouvel onglet ; survol = vert.
  const membersHTML = (slug) => {
    const groups = (typeof TDQ_MEMBERS !== "undefined" && TDQ_MEMBERS[slug]) || [];
    if (!groups.length)
      return `<p class="intro">Liste des membres : à venir.</p>`;
    return groups.map((g) => {
      const items = g.items.map((it) =>
        it.l
          ? `<li><a class="tdq-org" href="${esc(it.l)}" target="_blank" rel="noopener">${esc(it.n)}</a></li>`
          : `<li>${esc(it.n)}</li>`).join("");
      return `<div class="block"><p class="block-title">${esc(g.c)}</p>` +
        (items ? `<ul class="items">${items}</ul>` : "") +
        `</div>`;
    }).join("");
  };

  const intro =
    "32 tables de quartier couvrent l'île de Montréal. Soutenues par l'Initiative " +
    "montréalaise de soutien au développement social local (Ville de Montréal, " +
    "Centraide du Grand Montréal et Direction régionale de santé publique), ce sont " +
    "des regroupements locaux intersectoriels — citoyens, organismes et institutions — " +
    "réunis autour du développement social de leur milieu.";

  // Secteurs sans table de quartier (faible opacité, inertes), sous les tables.
  if (typeof TDQ_NOTABLE !== "undefined" && TDQ_NOTABLE) {
    const nt = document.createElementNS(SVG_NS, "path");
    nt.setAttribute("d", TDQ_NOTABLE);
    nt.setAttribute("class", "tdq-notable");
    svg.appendChild(nt);
  }

  // Les 32 tables (vraies divisions), cliquables — opacité moyenne, survol/clic = forte.
  const tdqMap = createMap({
    svg,
    panel,
    shapes: TDQ_GEOMETRY.tables,
    lookup,
    renderPanel: (t) =>
      `<h2>${esc(t.name)}${editPencil(EDIT_SHEETS.tables)}</h2><hr class="rule">` +
      `<p class="intro">Membres de la table de quartier. ` +
      `Cliquez un organisme pour ouvrir sa fiche Google Maps.</p>` +
      membersHTML(t.slug),
    renderLanding: () =>
      `<h2>Tables de quartier${editPencil(EDIT_SHEETS.tables)}</h2><hr class="rule">` +
      `<p class="intro">${esc(intro)}</p>` +
      `<p class="intro">Cliquez un territoire pour afficher sa table de quartier.</p>`,
  });

  // Contour net de l'île, par-dessus tout (inerte, laisse passer les clics).
  const outline = document.createElementNS(SVG_NS, "path");
  outline.setAttribute("d", TDQ_SILHOUETTE);
  outline.setAttribute("class", "tdq-outline");
  svg.appendChild(outline);

  // register this map's regions for the shared "Cartes" search (built in app.js)
  window.CARTES = window.CARTES || {};
  window.CARTES.tdq = {
    groupLabel: "Tables de quartier",
    select: tdqMap.select,
    entries: Object.keys(TDQ_TABLES).map((slug) => ({ label: TDQ_TABLES[slug].name, value: slug }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr")),
  };

  // Membres des tables dans la même recherche : chaque organisme est une
  // entrée (étiquette de groupe = sa table). La sélection ouvre la carte TDQ,
  // sélectionne la table, puis fait défiler le panneau jusqu'à l'organisme
  // et le surligne brièvement. Valeur encodée « slug§nom » (aucun nom ne
  // contient « § » ; le slug non plus).
  if (typeof TDQ_MEMBERS !== "undefined") {
    const memberEntries = [];
    Object.keys(TDQ_MEMBERS).forEach((slug) => {
      const table = lookup(slug);
      const group = "Membre · " + (table ? table.name : slug);
      TDQ_MEMBERS[slug].forEach((g) => g.items.forEach((it) => {
        memberEntries.push({ label: it.n, value: slug + "§" + it.n, group });
      }));
    });
    memberEntries.sort((a, b) => a.label.localeCompare(b.label, "fr"));
    window.CARTES.tdqm = {
      entries: memberEntries,
      pick: (raw) => {
        const i = raw.indexOf("§");
        const slug = raw.slice(0, i), name = raw.slice(i + 1);
        if (window.showCartesMap) window.showCartesMap("tdq");
        tdqMap.select(slug);
        const li = [...panel.querySelectorAll(".items li")]
          .find((n) => n.textContent.trim() === name);
        if (!li) return;
        li.classList.add("member-hit");
        li.addEventListener("animationend", () => li.classList.remove("member-hit"), { once: true });
        const pr = panel.getBoundingClientRect(), lr = li.getBoundingClientRect();
        panel.scrollTop += lr.top - pr.top - panel.clientHeight / 2 + lr.height / 2;
      },
    };
  }
}

initTdqMap();
