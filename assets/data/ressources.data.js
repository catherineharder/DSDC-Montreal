/* Catalogue des sources documentaires citées dans le site DSDC Montréal.
   Chaque fiche : { title, org, date (AAAA-MM ou AAAA), tag, url, cover }.
   - tag ∈ { Contexte, DS, DC, Montréal, Outils }
     · Contexte  = politiques, plans et cadres structurants
     · DS        = développement social / déterminants sociaux de la santé
     · DC        = développement des communautés
     · Montréal  = démarches et exemples de terrain montréalais
     · Outils    = outils pratiques et interactifs
   - cover : chemin d'une image de page couverture (images/ressources/…).
     Laisser null pour afficher un aperçu générique ; les vraies pages
     couvertures sont ajoutées dans images/ressources/ (voir le nom prévu
     dans Index_des_lectures.xlsx, colonne « Nom couverture »).
   Ajouter une source = ajouter un objet ici ; le rendu est automatique. */
window.RESSOURCES = [
  /* ---- Cadres de référence (définitions DS / DC) ---- */
  { title: "Le développement social — À propos", org: "Réseau québécois de développement social (RQDS)", date: "2023", tag: "DS",
    url: "https://rqds.org/a-propos/", cover: null },
  { title: "Le développement des communautés", org: "Collectif des partenaires en développement des communautés", date: "2022", tag: "DC",
    url: "https://www.collectifpdc.org/le-developpement-des-communautes", cover: null },

  /* ---- Contexte : gouvernance et structures ---- */
  { title: "Structure du système de santé et de services sociaux du Québec", org: "Gouvernement du Québec", date: "2025", tag: "Contexte",
    url: "https://www.quebec.ca/sante/systeme-et-services-de-sante/organisation-des-services/systeme-quebecois-de-sante-et-de-services-sociaux/structure-systeme-sante-services-sociaux-quebec", cover: null },
  { title: "Portrait de santé de la population montréalaise", org: "Direction régionale de santé publique de Montréal (DRSP)", date: "2026-05", tag: "Contexte",
    url: "https://santepubliquemontreal.ca/sites/drsp/files/media/document/Pub_20260507_PortraitSante.pdf", cover: null },
  { title: "Programme national de santé publique 2025-2035", org: "Ministère de la Santé et des Services sociaux (MSSS)", date: "2025", tag: "Contexte",
    url: "https://publications.msss.gouv.qc.ca/msss/fichiers/2025/25-297-03W.pdf", cover: null },
  { title: "Priorités triennales de santé publique 2025-2028", org: "Ministère de la Santé et des Services sociaux (MSSS)", date: "2025", tag: "Contexte",
    url: "https://publications.msss.gouv.qc.ca/msss/fichiers/2025/25-297-16W.pdf", cover: null },
  { title: "Plan gouvernemental de promotion de la santé (PGPS) 2022-2025", org: "Ministère de la Santé et des Services sociaux (MSSS)", date: "2022", tag: "Contexte",
    url: "https://publications.msss.gouv.qc.ca/msss/fichiers/2022/22-297-05W.pdf", cover: null },
  { title: "Le pouvoir d'agir des communautés et la lutte aux inégalités sociales de santé — cadre de référence", org: "Direction régionale de santé publique de Montréal (DRSP)", date: "2023", tag: "Contexte",
    url: "https://santepubliquemontreal.ca/sites/drsp/files/media/document/DRSP_Pub_2023_CadreRefPouvoirAgirCommLutteInegalSocialSP.pdf", cover: null },

  /* ---- Déterminants sociaux / développement social ---- */
  { title: "A Conceptual Framework for Action on the Social Determinants of Health", org: "Organisation mondiale de la Santé (OMS)", date: "2010", tag: "DS",
    url: "https://iris.who.int/server/api/core/bitstreams/ca294183-3263-470f-a5fe-8e124ec48c72/content", cover: null },
  { title: "Charte d'Ottawa pour la promotion de la santé", org: "Organisation mondiale de la Santé (OMS)", date: "1986", tag: "DS",
    url: "https://www.afro.who.int/sites/default/files/2017-06/hpr%20ottawa_charter.pdf", cover: null },
  { title: "Fair Society, Healthy Lives — The Marmot Review", org: "Institute of Health Equity — Marmot Review", date: "2010", tag: "DS",
    url: "https://www.instituteofhealthequity.org/resources-reports/the-marmot-review-working-committee-3-report/the-marmot-review-working-committee-3-report.pdf", cover: null },
  { title: "La santé des communautés : perspectives pour la contribution de la santé publique", org: "Institut national de santé publique du Québec (INSPQ)", date: "2002", tag: "DS",
    url: "https://www.inspq.qc.ca/sites/default/files/publications/082_santecommunautes.pdf", cover: null },
  { title: "Déterminants de la santé : Parlons-en", org: "Centre de collaboration nationale des déterminants de la santé (CCNDS)", date: "2024", tag: "DS",
    url: "https://nccdh.ca/wp-content/uploads/2024/10/CCNDS_Lets_talk_Determinants_of_health_FR.pdf", cover: null },
  { title: "World report on social determinants of health equity", org: "Organisation mondiale de la Santé (OMS)", date: "2025-05", tag: "DS",
    url: "https://www.who.int/publications/i/item/9789240107588", cover: null },

  /* ---- Développement des communautés ---- */
  { title: "Building Communities from the Inside Out (ABCD)", org: "Kretzmann & McKnight — ABCD Institute", date: "1993", tag: "DC",
    url: "https://nvcnetwork.org/wp/wp-content/uploads/2018/07/Building_Communities_from_the_Inside_Out.doc", cover: null },
  { title: "Asset-Based Community Development (ABCD) — How to get started", org: "Tamarack Institute", date: "2019", tag: "DC",
    url: "https://www.tamarackcommunity.ca/hubfs/VC/Documents/Asset-Based%20Community%20Development%20(ABCD)%20-%20A%20Booklet%20for%20Residents.pdf", cover: null },
  { title: "Les cinq conditions de l'impact collectif", org: "Tamarack Institute", date: "2017", tag: "DC",
    url: "https://www.tamarackcommunity.ca/hubfs/Collective%20Impact/Tools/Five%20Conditions%20Tools%20April%202017.pdf", cover: null },
  { title: "Community Development Framework", org: "Winnipeg Regional Health Authority (WRHA)", date: "2017", tag: "DC",
    url: "https://wrha.mb.ca/files/community-development-framework.pdf", cover: null },
  { title: "Community Engagement for Health Equity — Parlons-en", org: "Centre de collaboration nationale des déterminants de la santé (CCNDS)", date: "2024", tag: "DC",
    url: "https://nccdh.ca/wp-content/uploads/2024/10/Lets-Talk-Community-Engagement-EN.pdf", cover: null },
  { title: "L'expérience citoyenne au service de la prévention — cadre de référence", org: "Direction régionale de santé publique de Montréal (DRSP)", date: "2020", tag: "DC",
    url: "https://santepubliquemontreal.ca/sites/drsp/files/media/document/DRSP_Pub_2022_10_01_ExperienceCitoyenneCadreReference.pdf", cover: null },

  /* ---- Montréal : démarches de terrain ---- */
  { title: "Initiative montréalaise de soutien au développement social local — cadre de référence", org: "Initiative montréalaise de soutien au développement social local", date: "2024", tag: "Montréal",
    url: "http://www.tablesdequartiermontreal.org/wp-content/uploads/2024/09/IMSDSL_CadreReference_web-1.pdf", cover: null },
  { title: "Plan de développement social de Montréal-Nord", org: "Table de quartier de Montréal-Nord (TQMN)", date: "2021", tag: "Montréal",
    url: "https://www.tqmn.ca/site/assets/files/1352/tqnm_le-pds_vf.pdf", cover: null },
  { title: "Le système alimentaire verdunois", org: "Concertation en développement social de Verdun (CDSV)", date: "2024", tag: "Montréal",
    url: "https://cdsv.org/wp-content/uploads/2025/08/Le-Systeme-Alimentaire-Verdunois-Automne-2024.pdf", cover: null },

  /* ---- Indicateurs / données ---- */
  { title: "Part de la population en situation d'insécurité alimentaire", org: "Communauté métropolitaine de Montréal — Indicateurs vitaux", date: "2024", tag: "Montréal",
    url: "https://indicateurs-vitaux.cmm.qc.ca/developpement-social/part-de-la-population-en-situation-d-insecurite-alimentaire/", cover: null },

  /* ---- Outils ---- */
  { title: "Feuillet CRESP-CACIS — outil d'analyse", org: "Chaire CACIS", date: "2021", tag: "Outils",
    url: "https://chairecacis.org/fichiers/publications/feuillet_cresp-cacis.pdf", cover: null },
  { title: "Outil interactif d'aide à l'action intersectorielle", org: "Chaire CACIS", date: "2022", tag: "Outils",
    url: "https://chairecacis-outilinteractif.org/", cover: null },
  { title: "Outil d'appréciation des effets de l'action intersectorielle locale", org: "Communagir", date: null, tag: "Outils",
    url: "https://communagir.org/nouvelles/outil-d-appreciation-des-effets-de-l-action-intersectorielle-locale/", cover: null },
  { title: "Indice de défavorisation matérielle et sociale", org: "Institut national de santé publique du Québec (INSPQ)", date: null, tag: "Outils",
    url: "https://www.inspq.qc.ca/defavorisation/indice-de-defavorisation-materielle-et-sociale", cover: null },
];
