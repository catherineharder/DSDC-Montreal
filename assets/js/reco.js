/* Onglet « Recommandations » : cinq pistes d'action à gauche, panneau de
   ressource à droite. Un clic (ou Entrée/Espace) sur une piste affiche dans le
   panneau la ressource qui aide concrètement à la mettre en œuvre.
   Les cinq documents sont aussi listés dans l'onglet Ressources. */
(function () {
  "use strict";
  const list = document.getElementById("reco-list");
  const panel = document.getElementById("reco-panel");
  if (!list || !panel) return;

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

  /* Une fiche par recommandation : le libellé de la piste, puis la ressource
     associée (titre, organisme, année, ce qu'elle apporte, lien). */
  const RECOS = {
    1: {
      title: "Partager le pouvoir, pas seulement la parole",
      sub: "Viser le partenariat et le leadership citoyen plutôt que la consultation. Bâtir la confiance avec les citoyens.",
      res: {
        title: "L'expérience citoyenne au service de la prévention — cadre de référence",
        org: "Direction régionale de santé publique de Montréal",
        date: "2022",
        why: "Le cadre distingue les degrés d'implication citoyenne — information, consultation, partenariat, leadership — et donne les conditions à réunir pour monter d'un cran. C'est l'outil de référence de la DRSP pour passer de la parole au pouvoir partagé.",
        url: "https://santepubliquemontreal.ca/sites/drsp/files/media/document/DRSP_Pub_2022_10_01_ExperienceCitoyenneCadreReference.pdf",
      },
    },
    2: {
      title: "Investir le rôle d'influence des politiques publiques",
      sub: "Une veille et les compétences pour porter le DS-DC devant les décideurs. Renforcer les contacts politiques.",
      res: {
        title: "Cadre de référence en influence des politiques publiques à la DRSP Montréal",
        org: "Direction régionale de santé publique de Montréal",
        date: "2025",
        why: "Produit par l'équipe Politiques publiques et partenariats stratégiques, il définit ce qu'est l'influence des politiques publiques à la DRSP, les rôles et les compétences requises, et les stratégies pour porter un enjeu auprès des paliers décisionnels.",
        url: "https://santepubliquemontreal.ca/sites/drsp/files/media/document/DRSP_Pub_2025-01-01_Cadre%20de%20r%C3%A9f%C3%A9rence_PPPS.pdf",
      },
    },
    3: {
      title: "Alléger la charge qu'on impose au milieu",
      sub: "Financement souple et à la mission, reddition de comptes simplifiée, moins de comités.",
      res: {
        title: "Avis déposé à la DRSP de Montréal sur la révision du cadre de financement de santé publique",
        org: "Regroupements montréalais d'organismes communautaires (RIOCM et al.)",
        date: "2024",
        why: "L'avis documente, du point de vue des groupes eux-mêmes, ce que la charge administrative coûte au milieu : financement par projet, exigences de reddition de comptes, multiplication des comités. Il formule les demandes précises d'allègement.",
        url: "https://riocm.org/wp-content/uploads/2024/08/2024-06-AVIS-DRSP-regroupements-Revision-du-cadre-de-sante-publique.pdf",
      },
    },
    4: {
      title: "Outiller le milieu communautaire avec des données",
      sub: "Interpeller des chercheurs, choisir des indicateurs avec les milieux, créer des outils accessibles et une mesure commune.",
      res: {
        title: "Le Dispositif participatif de caractérisation des communautés locales",
        org: "Institut national de santé publique du Québec (INSPQ)",
        date: "2014",
        why: "Une démarche éprouvée où les indicateurs sont choisis avec les acteurs du territoire, puis restitués en portraits de communauté lisibles et actionnables. L'évaluation d'implantation dans trois régions décrit les conditions de succès et les pièges à éviter.",
        url: "https://www.inspq.qc.ca/sites/default/files/publications/1785_caracterisation_communautes_locales.pdf",
      },
    },
    5: {
      title: "S'ouvrir à des partenaires non-conventionnels",
      sub: "Inclure davantage les communautés religieuses, sociétés de développement commercial, associations de marchands, etc.",
      res: {
        title: "La mobilisation — Comprendre et agir",
        org: "Communagir",
        date: "2023",
        why: "Comment se construit l'« acteur collectif » : élargir le nous au-delà des partenaires habituels, ajuster les cadres de référence entre acteurs très différents, et entretenir l'engagement avec les six R (reconnaissance, respect, rôles, relations, récompenses, résultats).",
        url: "https://communagir.org/contenus-et-outils/comprendre-et-agir/la-mobilisation/",
      },
    },
  };

  const COLORS = { 1: "#C43E42", 2: "#46747F", 3: "#D97A22", 4: "#6C6F3F", 5: "#D7B063" };

  function render(id) {
    const r = RECOS[id];
    if (!r) return;
    panel.style.setProperty("--r-c", COLORS[id] || "#D7B063");
    panel.innerHTML =
      '<span class="reco-p-num" aria-hidden="true">' + esc(id) + "</span>" +
      "<h2>" + esc(r.title) + "</h2>" +
      '<p class="reco-p-sub">' + esc(r.sub) + "</p>" +
      '<hr class="rule">' +
      '<article class="reco-res">' +
        "<h3>" + esc(r.res.title) + "</h3>" +
        '<p class="reco-res-meta">' + esc(r.res.org) + " · " + esc(r.res.date) + "</p>" +
        '<p class="reco-res-why">' + esc(r.res.why) + "</p>" +
        '<a class="reco-res-link" href="' + esc(r.res.url) + '" target="_blank" rel="noopener noreferrer">' +
          "Ouvrir la ressource ↗</a>" +
      "</article>";
    panel.scrollTop = 0;
  }

  function select(card) {
    if (!card) return;
    list.querySelectorAll(".reco-card").forEach((c) => {
      const on = c === card;
      c.classList.toggle("active", on);
      c.setAttribute("aria-expanded", on ? "true" : "false");
    });
    render(card.dataset.reco);
  }

  list.addEventListener("click", (e) => {
    const card = e.target.closest(".reco-card");
    if (card) select(card);
  });

  /* Piste 1 ouverte par défaut, pour que le panneau ne soit jamais vide. */
  select(list.querySelector(".reco-card"));
})();
