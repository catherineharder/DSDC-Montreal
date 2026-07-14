/* Catalogue des sources documentaires citées dans le site DSDC Montréal.
   Chaque fiche : { title, org, date (AAAA-MM ou AAAA), tag, url, cover }.
   - tag ∈ { Cadre, Gouvernance, Indicateurs, Outil, Pratiques }
   - cover : chemin d'une image de page couverture (images/ressources/…).
     Laisser null pour afficher un aperçu générique ; Katie ajoutera les
     vraies pages couvertures (voir le futur skill « images depuis Notion »).
   Ajouter une source = ajouter un objet ici ; le rendu est automatique. */
window.RESSOURCES = [
  { title: "Le développement social — À propos", org: "Réseau québécois de développement social (RQDS)", date: "2023", tag: "Cadre",
    url: "https://rqds.org/a-propos/", cover: null },
  { title: "Le développement des communautés", org: "Collectif des partenaires en développement des communautés", date: "2022", tag: "Cadre",
    url: "https://www.collectifpdc.org/le-developpement-des-communautes", cover: null },
  { title: "Structure du système de santé et de services sociaux du Québec", org: "Gouvernement du Québec", date: "2025", tag: "Gouvernance",
    url: "https://www.quebec.ca/sante/systeme-et-services-de-sante/organisation-des-services/systeme-quebecois-de-sante-et-de-services-sociaux/structure-systeme-sante-services-sociaux-quebec", cover: null },
  { title: "Conseil des ministres — organigramme", org: "Cabinet du premier ministre du Québec", date: "2026", tag: "Gouvernance",
    url: "https://cdn-contenu.quebec.ca/cdn-contenu/premier-ministre/equipe/conseil-ministre/conseil-ministres.pdf", cover: null },
  { title: "Organigramme du ministère de la Santé et des Services sociaux (MSSS)", org: "MSSS", date: "2026", tag: "Gouvernance",
    url: "https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/sante-services-sociaux/publications-adm/ORG_organigramme_MSSS_01.pdf", cover: null },
  { title: "Structure organisationnelle — Santé Québec", org: "Santé Québec", date: "2026-02", tag: "Gouvernance",
    url: "https://fichier.sitesq.apps.ti.sante.quebec/sq-1/2026-03/Structure%20organisationnelle_Sant%C3%A9%20Qu%C3%A9bec_v27.02.2026.pdf", cover: null },
  { title: "Organigramme — Ville de Montréal", org: "Ville de Montréal", date: "2025", tag: "Gouvernance",
    url: "https://ville.montreal.qc.ca/pls/portal/docs/page/intra_fr/media/documents/organigramme.pdf", cover: null },
  { title: "Part de la population en situation d'insécurité alimentaire", org: "Communauté métropolitaine de Montréal — Indicateurs vitaux", date: "2024", tag: "Indicateurs",
    url: "https://indicateurs-vitaux.cmm.qc.ca/developpement-social/part-de-la-population-en-situation-d-insecurite-alimentaire/", cover: null },
  { title: "Portrait de santé de la population montréalaise", org: "Direction régionale de santé publique de Montréal (DRSP)", date: "2026-05", tag: "Indicateurs",
    url: "https://santepubliquemontreal.ca/sites/drsp/files/media/document/Pub_20260507_PortraitSante.pdf", cover: null },
  { title: "Feuillet CRESP-CACIS — outil d'analyse", org: "Chaire CACIS", date: "2021", tag: "Outil",
    url: "https://chairecacis.org/fichiers/publications/feuillet_cresp-cacis.pdf", cover: null },
  { title: "Outil interactif d'aide à l'action intersectorielle", org: "Chaire CACIS", date: "2022", tag: "Outil",
    url: "https://chairecacis-outilinteractif.org/", cover: null },
];
