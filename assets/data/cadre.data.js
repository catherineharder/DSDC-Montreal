/* ---------------------------------------------------------------------------
   Contenu du cadre conceptuel DSDC — panneau de droite de /cadre.
   Fichier écrit à la main : c'est ici qu'on rédige les fiches.

   Une clé par boîte cliquable du dessin. La correspondance entre une boîte
   d'Illustrator et sa clé est fixée dans tools/build_cadre.py (table BOXES) :
   renommer un calque dans Illustrator ne casse donc pas le contenu déjà écrit.

   Champs d'une fiche, tous facultatifs sauf « title » :
     title      titre affiché en haut du panneau
     definition texte principal ; les sauts de ligne sont conservés
     connexes   liste de termes affichés en pastilles
     exMtl      encadré « Exemple à Montréal »
     exInsp     encadré « Exemple inspirant »
     extra      encadré « Pour aller plus loin »
     images     [{ "file": "images/xxx.png", "caption": "…" }]
     source     ligne de source, en bas de la fiche

   Une fiche dont « definition » est vide et qui n'a ni exemple ni image
   affiche « Fiche à compléter » : c'est voulu, il n'y a rien à corriger.

   Les URL écrites dans les textes deviennent des liens automatiquement.
   Après modification : rien à exécuter, le fichier est lu tel quel par la page.
   --------------------------------------------------------------------------- */

window.CADRE_DATA = {
  "enjeux": {
    "title": "Enjeux transversaux",
    "definition": "Les enjeux transversaux — rapports de pouvoir, transformation numérique, changements climatiques — traversent l'ensemble des dimensions du DS et du DC. Ils exigent une approche intégrée plutôt que sectorielle afin d'éviter d'aggraver les inégalités sociales de santé. À titre d'exemple, le PNSP considère la santé mentale comme « une préoccupation transversale à l'ensemble des actions ».",
    "connexes": [
      "Intersectorialité",
      "Santé dans toutes les politiques",
      "Approche intégrée"
    ],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Ministère de la Santé et des Services sociaux. (2015). Programme national de santé publique 2015-2025. Gouvernement du Québec."
  },
  "rapports": {
    "title": "Rapports de pouvoir",
    "definition": "« Le pouvoir est une composante des règles, et les règles sont puissantes. Il est important de souligner que les règles constituent la manifestation des rapports de force » : elles « consignent et encodent » les systèmes oppresseurs (p. ex. capitalisme, racisme, capacitisme, cis-hétéronormativité, sexisme, colonialisme) et entraînent des schémas d'avantages qui apparaissent dans les conditions de la vie quotidienne.",
    "connexes": [
      "Oppression systémique",
      "Racisme structurel",
      "Intersectionnalité"
    ],
    "exMtl": "",
    "exInsp": "Le PNSP 2025-2035 oriente les interventions vers les populations privées d'équité afin de réduire les écarts produits par les rapports de pouvoir structurels.",
    "extra": "",
    "images": [],
    "source": "Centre de collaboration nationale des déterminants de la santé. (2024). Déterminants de la santé : Parlons-en. CCNDS, Université St. Francis Xavier. https://nccdh.ca/wp-content/uploads/2024/10/CCNDS_Lets_talk_Determinants_of_health_FR.pdf"
  },
  "transformation": {
    "title": "Transformation numérique",
    "definition": "Les technologies numériques et les mégadonnées peuvent améliorer les services de santé et les services sociaux, mais leur effet sur l'équité en santé dépend de la manière dont elles sont déployées. Réaliser ce potentiel exige un accès équitable aux services, peu importe l'accès au numérique et la littératie numérique; une conception inclusive des services, dont les priorités sont définies par les personnes utilisatrices; l'encadrement des modèles d'affaires inéquitables des plateformes; et des cadres de droits de la personne protégeant la dignité, l'autonomie et la vie privée. L'intelligence artificielle générative doit être conçue et gouvernée de façon délibérée pour réduire — et non élargir — la fracture numérique. (traduction libre)",
    "connexes": [
      "Fracture numérique",
      "Intelligence artificielle",
      "Littératie numérique"
    ],
    "exMtl": "",
    "exInsp": "Le PNSP 2025-2035 prévoit des activités de surveillance et de soutien face à la fracture numérique et à la désinformation en santé.",
    "extra": "",
    "images": [],
    "source": "Organisation mondiale de la Santé. (2025). World report on social determinants of health equity: Executive summary. OMS. https://doi.org/10.2471/B09387 (traduction libre)"
  },
  "changements": {
    "title": "Changements climatiques",
    "definition": "Les actions climatiques qui s'attaquent aux déterminants sociaux de l'équité en santé doivent être intersectorielles : réduire la pollution par une réglementation environnementale plus stricte, développer le transport collectif et promouvoir des pratiques agricoles durables qui renforcent la sécurité alimentaire et la nutrition. Les cadres reconnaissant les fardeaux inégaux du réchauffement climatique — dont le Fonds pour les pertes et préjudices lancé à la COP29 — sont des mesures importantes pour réparer les iniquités de santé liées au climat. (traduction libre)",
    "connexes": [
      "Triple crise planétaire",
      "Résilience climatique",
      "Adaptation"
    ],
    "exMtl": "",
    "exInsp": "L'activité 38 du PNSP 2025-2035 soutient la création de milieux de vie complets et résilients au climat.",
    "extra": "",
    "images": [],
    "source": "Organisation mondiale de la Santé. (2025). World report on social determinants of health equity: Executive summary. OMS. https://doi.org/10.2471/B09387 (traduction libre)"
  },
  "determinants": {
    "title": "Déterminants structurels de la santé",
    "definition": "Les déterminants structurels de la santé sont « les règles écrites et non écrites qui créent, maintiennent ou éliminent des schémas durables et hiérarchiques d'avantages entre des groupes construits à l'échelle sociale » et la manifestation des déséquilibres du pouvoir. Ces règles prennent la forme de valeurs, de croyances, de visions du monde, de culture et de normes; de gouvernance; de lois, de politiques, de règlements et de budgets; et de pratiques institutionnelles. (traduction libre)",
    "connexes": [
      "Déterminants sociaux des ISS",
      "Causes profondes des ISS",
      "Macrodéterminants"
    ],
    "exMtl": "Le cadre de référence de la DRSP (2023) cible explicitement les déterminants structurels (revenu, racisme systémique, aménagement) à Montréal.",
    "exInsp": "",
    "extra": "",
    "images": [
      {
        "file": "images/determinants-structurels.png",
        "caption": "Déterminants structurels de la santé"
      }
    ],
    "source": "Heller, J. C., Givens, M. L., Johnson, S. P. et Kindig, D. A. (2024). Keeping it political and powerful: Defining the structural determinants of health. The Milbank Quarterly, 102(2), 351-366. https://doi.org/10.1111/1468-0009.12695 ; Centre de collaboration nationale des déterminants de la santé. (2024). Déterminants de la santé : Parlons-en. https://nccdh.ca/wp-content/uploads/2024/10/CCNDS_Lets_talk_Determinants_of_health_FR.pdf"
  },
  "valeurs": {
    "title": "Valeurs, croyances, culture, normes",
    "definition": "Les valeurs sont des « normes culturellement définies, partagées par des individus ou des groupes, concernant ce qui est souhaitable, convenable, beau, bon ou mauvais. Les valeurs servent de balises générales à la vie en société. » Les croyances sont des « idées partagées par un collectif de personnes au sein d'un système socioculturel. »\n\nLa vision du monde est une conception consciente ou inconsciente de la société, fondée sur nos valeurs, nos croyances et les présupposés qui façonnent la manière dont nous donnons sens au monde.\n\n« La culture renvoie aux croyances, valeurs, pratiques, comportements et artéfacts partagés qui caractérisent un groupe ou une société. Les normes, quant à elles, sont les règles non écrites ou les attentes qui guident et régulent les comportements au sein d'un groupe culturel ou social donné. » (traduction libre)",
    "connexes": [
      "Culture",
      "Idéologies",
      "Normes sociales"
    ],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Elwell (2013), Healey et Hinson (2013) et Matsumoto (2017), cités dans Heller, J. C., Givens, M. L., Johnson, S. P. et Kindig, D. A. (2024). Keeping it political and powerful: Defining the structural determinants of health. The Milbank Quarterly, 102(2), 351-366. https://doi.org/10.1111/1468-0009.12695 (traduction libre)"
  },
  "gouvernance": {
    "title": "Gouvernance",
    "definition": "« Système de valeurs, de politiques et d'institutions par lequel une société gère ses affaires économiques, politiques et sociales au moyen d'interactions entre l'État, la société civile et le secteur privé. C'est la façon dont une société s'organise pour prendre et mettre en œuvre des décisions. » La gouvernance peut prendre de nombreuses formes, des modèles démocratiques aux modèles autoritaires, et s'appliquer à plusieurs contextes : entreprise, international, national, local. (traduction libre)",
    "connexes": [
      "Économie politique",
      "Déterminants macroéconomiques",
      "Constellations de pouvoir"
    ],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Programme des Nations Unies pour le développement. (1997). Governance for sustainable human development: A UNDP policy document. PNUD. Cité dans Heller et al. (2024). The Milbank Quarterly, 102(2), 351-366. https://doi.org/10.1111/1468-0009.12695 (traduction libre)"
  },
  "lois": {
    "title": "Lois, politiques, règlements, budgets",
    "definition": "Instruments utilisés par les gouvernements et les organisations publiques et privées pour atteindre leurs objectifs et façonner le contexte et les comportements. Une loi est une « coutume ou pratique contraignante d'une communauté [...] appliquée par une autorité de contrôle ». Une politique est « une ligne de conduite ou une méthode d'action définie [...] pour guider et déterminer les décisions présentes et futures ». Un règlement est « une règle ou un ordre émis par une autorité exécutive ou un organisme de réglementation [...] ayant force de loi ». Un budget est « un plan de coordination des ressources et des dépenses ». (traduction libre)",
    "connexes": [
      "Politiques publiques favorables à la santé",
      "Santé dans toutes les politiques (HiAP)",
      "Politiques fiscales"
    ],
    "exMtl": "",
    "exInsp": "« Une politique de promotion de la santé combine des méthodes différentes mais complémentaires, et notamment la législation, les mesures fiscales, la taxation et les changements organisationnels. » (OMS, 1986, Charte d'Ottawa)",
    "extra": "",
    "images": [],
    "source": "Merriam-Webster (2024), cité dans Heller, J. C., Givens, M. L., Johnson, S. P. et Kindig, D. A. (2024). Keeping it political and powerful: Defining the structural determinants of health. The Milbank Quarterly, 102(2), 351-366. https://doi.org/10.1111/1468-0009.12695 (traduction libre)"
  },
  "methodes": {
    "title": "Méthodes institutionnelles",
    "definition": "« Les façons dont les membres d'une institution exercent leurs fonctions et leurs responsabilités, souvent à travers des modèles, procédures et règles établis de comportement. Elles peuvent comprendre les processus décisionnels, les protocoles de communication, les évaluations du rendement, les pratiques d'embauche et de promotion, ainsi que l'allocation des ressources. » (traduction libre)",
    "connexes": [
      "Coconstruction",
      "ADS+",
      "Mobilisation des connaissances"
    ],
    "exMtl": "La Table des groupes de femmes de Montréal déploie le site et la formation ADS+ pour outiller les municipalités et les organismes.",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "National Research Council. (2015). Enhancing the effectiveness of team science. National Academies Press. https://doi.org/10.17226/19007. Cité dans Heller et al. (2024). The Milbank Quarterly, 102(2), 351-366. https://doi.org/10.1111/1468-0009.12695 (traduction libre)"
  },
  "ds": {
    "title": "Développement social (DS)",
    "definition": "« Le développement social vise à améliorer les conditions de vie, favoriser l'inclusion sociale, réduire les inégalités et renforcer les potentiels individuels et collectifs grâce à la participation active et intersectorielle d'actrices et d'acteurs communautaires, institutionnels, étatiques ainsi qu'à l'engagement citoyen. »",
    "connexes": [
      "Conditions de vie décentes",
      "Citoyenneté démocratique",
      "Déterminants sociaux de la santé"
    ],
    "exMtl": "La Politique de développement social « Montréal de tous les possibles » (2017) de la Ville de Montréal.",
    "exInsp": "Pour l'INSPQ (2002), le DS vise la mise en place, dans les communautés, les régions et à l'échelle d'une société, des conditions requises pour permettre aux communautés d'avoir droit à des conditions de vie décentes, de développer pleinement leurs potentiels, de participer activement à la vie sociale et d'être traitées avec dignité.",
    "extra": "",
    "images": [],
    "source": "St-Louis, M.-P. et St-Germain, L. (2022). ABC du développement social : Guide d'apprentissage et d'accompagnement du RQDS. Réseau québécois de développement social et Centre de recherche sociale appliquée. https://praxis.encommun.io/n/Cn8Qli81z0qogQmaszP5Y9YUcSQ/ ; Institut national de santé publique du Québec. (2002). La santé des communautés : perspectives pour la contribution de la santé publique au développement social et au développement des communautés. Gouvernement du Québec. https://www.inspq.qc.ca/pdf/publications/082_SanteCommunautes.pdf"
  },
  "roles": {
    "title": "Rôles de la santé publique",
    "definition": "Le CCNDS (2013) définit quatre rôles de la santé publique pour améliorer l'équité en santé : 1) évaluer et faire rapport sur la présence et l'incidence des iniquités en santé et sur les stratégies efficaces pour les atténuer; 2) modifier et orienter les interventions et les services afin d'atténuer les iniquités; 3) établir des partenariats avec d'autres secteurs; et 4) participer à l'élaboration des politiques.",
    "connexes": [
      "Équité en santé",
      "Iniquités en santé",
      "Action intersectorielle"
    ],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [
      {
        "file": "images/role-sante-publique-1.webp",
        "caption": "Les quatre rôles de la santé publique pour améliorer l'équité en santé (CCNDS, 2013)"
      }
    ],
    "source": "Centre de collaboration nationale des déterminants de la santé. (2013). Le rôle de la santé publique dans l'amélioration de l'équité en santé : Parlons-en. CCNDS, Université St. Francis Xavier. https://nccdh.ca/wp-content/uploads/2024/10/PHR_FR_Final.pdf"
  },
  "financement": {
    "title": "Financement, soutien et accompagnement",
    "definition": "",
    "connexes": [],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": ""
  },
  "connaissances": {
    "title": "Développement et partage de connaissances",
    "definition": "",
    "connexes": [],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": ""
  },
  "influence": {
    "title": "Influence et transformation des politiques publiques",
    "definition": "",
    "connexes": [],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": ""
  },
  "ds-participation": {
    "title": "Participation citoyenne et inclusion",
    "definition": "« La participation citoyenne, dans le domaine de la santé publique, fait référence à l'implication des communautés dans des projets visant à améliorer la santé des populations. » Elle mobilise les savoirs expérientiels des résidents, légitime l'action publique et augmente la pertinence des interventions.",
    "connexes": [
      "Coconstruction",
      "Savoirs expérientiels",
      "Engagement communautaire"
    ],
    "exMtl": "Le Budget participatif de Montréal (3e édition, 2024-2025) : une enveloppe de 45 M$, 880 idées recueillies et 28 000 votes.",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Lebel et Dufour (2020), cités dans Direction régionale de santé publique de Montréal. (2023). Le pouvoir d'agir des communautés et la lutte aux inégalités sociales de santé au cœur des priorités de santé publique pour une métropole résiliente. https://santepubliquemontreal.ca/sites/drsp/files/media/document/DRSP_Pub_2023_CadreRefPouvoirAgirCommLutteInegalSocialSP.pdf"
  },
  "ds-concertation": {
    "title": "Concertation, collaboration et mobilisation",
    "definition": "« La concertation est un processus volontaire, plus ou moins formel et décisionnel, de mise en commun d'analyses et de solutions à des problèmes reconnus. Elle permet le rassemblement des [parties prenantes] qui cherchent un consensus fondé sur une problématique commune, en vue d'élaborer et de mettre en œuvre, par exemple, des stratégies et des politiques économiques et sociales. »",
    "connexes": [
      "Partenariat",
      "Tables de quartier",
      "Intersectorialité"
    ],
    "exMtl": "Les 32 Tables de quartier de la Coalition montréalaise des Tables de quartier réunissent organismes communautaires, institutions, élus et citoyens autour du développement social local.",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Institut national de santé publique du Québec. (2002). La santé des communautés : perspectives pour la contribution de la santé publique au développement social et au développement des communautés. Gouvernement du Québec. https://www.inspq.qc.ca/pdf/publications/082_SanteCommunautes.pdf"
  },
  "action-intersectorielle": {
    "title": "Action intersectorielle et multiréseau",
    "definition": "",
    "connexes": [],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": ""
  },
  "prealable-processus-resultat": {
    "title": "Préalable, processus et résultat",
    "definition": "",
    "connexes": [],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": ""
  },
  "institutions": {
    "title": "Institutions",
    "definition": "",
    "connexes": [],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": ""
  },
  "prive": {
    "title": "Privé",
    "definition": "",
    "connexes": [],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": ""
  },
  "communautaire": {
    "title": "Communautaire",
    "definition": "",
    "connexes": [],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": ""
  },
  "citoyens": {
    "title": "Citoyen·ne·s",
    "definition": "",
    "connexes": [],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": ""
  },
  "gouvernance-collaborative": {
    "title": "Gouvernance collaborative",
    "definition": "« Une gouvernance partagée, qui laisse aux communautés le soin d'établir elles-mêmes les priorités d'action pour agir sur l'amélioration des conditions de vie. »",
    "connexes": [
      "Gouvernance partagée",
      "Concertation",
      "Leadership collaboratif"
    ],
    "exMtl": "Les 32 Tables de quartier de la Coalition montréalaise des Tables de quartier (CMTQ), soutenues par l'IMSDSL, illustrent une gouvernance collaborative ancrée dans chaque quartier.",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Initiative montréalaise de soutien au développement social local. (2020). Cadre de référence de l'Initiative montréalaise de soutien au développement social local."
  },
  "concertation": {
    "title": "Concertation",
    "definition": "« La concertation est un processus volontaire, plus ou moins formel et décisionnel, de mise en commun d'analyses et de solutions à des problèmes reconnus. Elle permet le rassemblement des [parties prenantes] qui cherchent un consensus fondé sur une problématique commune, en vue d'élaborer et de mettre en œuvre, par exemple, des stratégies et des politiques économiques et sociales. »",
    "connexes": [
      "Partenariat",
      "Tables de quartier",
      "Intersectorialité"
    ],
    "exMtl": "Les 32 Tables de quartier de la Coalition montréalaise des Tables de quartier réunissent organismes communautaires, institutions, élus et citoyens autour du développement social local.",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Institut national de santé publique du Québec. (2002). La santé des communautés : perspectives pour la contribution de la santé publique au développement social et au développement des communautés. Gouvernement du Québec. https://www.inspq.qc.ca/pdf/publications/082_SanteCommunautes.pdf"
  },
  "participation": {
    "title": "Participation citoyenne",
    "definition": "« La participation citoyenne, dans le domaine de la santé publique, fait référence à l'implication des communautés dans des projets visant à améliorer la santé des populations. » Elle mobilise les savoirs expérientiels des résidents, légitime l'action publique et augmente la pertinence des interventions.",
    "connexes": [
      "Coconstruction",
      "Savoirs expérientiels",
      "Engagement communautaire"
    ],
    "exMtl": "Le Budget participatif de Montréal (3e édition, 2024-2025) : une enveloppe de 45 M$, 880 idées recueillies et 28 000 votes.",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Lebel et Dufour (2020), cités dans Direction régionale de santé publique de Montréal. (2023). Le pouvoir d'agir des communautés et la lutte aux inégalités sociales de santé au cœur des priorités de santé publique pour une métropole résiliente. https://santepubliquemontreal.ca/sites/drsp/files/media/document/DRSP_Pub_2023_CadreRefPouvoirAgirCommLutteInegalSocialSP.pdf"
  },
  "vision": {
    "title": "Vision commune",
    "definition": "« L'impact collectif exige que les différences de définition du problème et de l'objectif soient discutées et résolues. » Sans définition partagée du problème, les acteurs travaillent en parallèle sans levier collectif : l'agenda commun est la première condition de l'impact collectif. (traduction libre)",
    "connexes": [
      "Agenda commun",
      "Diagnostic partagé"
    ],
    "exMtl": "La planification de quartier 2023-2028 de Verdun, « Notre quartier inclusif et solidaire », coconstruite par les acteurs réunis autour de la Table de quartier.",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Kania, J. et Kramer, M. (2011). Collective impact. Stanford Social Innovation Review, 9(1), 36-41. https://ssir.org/articles/entry/collective_impact (traduction libre)"
  },
  "action-collective": {
    "title": "Action collective",
    "definition": "Structures et processus — formels et informels — par lesquels les acteurs d'un milieu coordonnent leur action : une vision commune, des espaces de concertation et la participation citoyenne. Ces mécanismes transforment la juxtaposition d'acteurs en action coordonnée (INSPQ, 2002; DRSP, 2023).",
    "connexes": [
      "Impact collectif",
      "Concertation",
      "Vision commune"
    ],
    "exMtl": "Le Projet impact collectif (PIC), phase 2 (2022-2027), combine financement pluriannuel, accompagnement et apprentissage partagé dans les quartiers montréalais.",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Institut national de santé publique du Québec. (2002). La santé des communautés. https://www.inspq.qc.ca/pdf/publications/082_SanteCommunautes.pdf ; Direction régionale de santé publique de Montréal. (2023). Le pouvoir d'agir des communautés. https://santepubliquemontreal.ca/sites/drsp/files/media/document/DRSP_Pub_2023_CadreRefPouvoirAgirCommLutteInegalSocialSP.pdf"
  },
  "impact": {
    "title": "Impact collectif sur les priorités locales",
    "definition": "L'impact collectif structure la collaboration d'acteurs de différents secteurs autour d'un problème social complexe, à partir d'un agenda commun et d'une organisation porteuse dédiée (Kania et Kramer, 2011).",
    "connexes": [
      "Agenda commun",
      "Organisation pivot (backbone)",
      "Mesure partagée"
    ],
    "exMtl": "Le Projet impact collectif (PIC), phase 2 (2022-2027), piloté par Centraide du Grand Montréal, finance dans 17 quartiers montréalais des démarches collectives ciblant les priorités locales.",
    "exInsp": "La boîte à outils de l'impact collectif de l'Institut Tamarack. https://www.tamarackcommunity.ca/collective-impact-toolkit",
    "extra": "Les cinq conditions de l'impact collectif (Kania et Kramer, 2011) :\n1. Programme commun (common agenda) : une vision partagée du changement, construite collectivement.\n2. Système de mesure partagé (shared measurement) : des indicateurs et une collecte de données communs pour l'apprentissage stratégique.\n3. Activités qui se renforcent mutuellement (mutually reinforcing activities) : des actions coordonnées et complémentaires, non dupliquées.\n4. Communication continue (continuous communication) : un dialogue soutenu pour bâtir la confiance.\n5. Structure de soutien dédiée (backbone support) : une équipe « épine dorsale » qui coordonne l'ensemble.",
    "images": [],
    "source": "Kania, J. et Kramer, M. (2011). Collective impact. Stanford Social Innovation Review, 9(1), 36-41. https://ssir.org/articles/entry/collective_impact ; Tamarack Institute. (s. d.). La boîte à outils de l'impact collectif. https://www.tamarackcommunity.ca/collective-impact-toolkit"
  },
  "equite": {
    "title": "Équité en santé",
    "definition": "L'équité en santé signifie que toutes les personnes peuvent atteindre leur plein potentiel de santé sans être désavantagées par leur position sociale ou par d'autres circonstances déterminées socialement (CCNDS). Elle se distingue de l'égalité : il s'agit de répondre aux besoins selon leur ampleur, et non d'offrir la même chose à tous.",
    "connexes": [
      "Inégalités sociales de santé",
      "Justice sociale",
      "Gradient social"
    ],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Centre de collaboration nationale des déterminants de la santé. (s. d.). Glossaire des principaux concepts liés à l'équité en santé. https://nccdh.ca/fr/learn/glossaire/"
  },
  "dc": {
    "title": "Développement des communautés (DC)",
    "definition": "« Le développement des communautés est un processus de coopération volontaire, d'entraide et de construction de liens sociaux entre les résidents et les institutions d'un milieu local. Ce processus vise l'amélioration des conditions de vie sur les plans social, culturel, économique et environnemental. »",
    "connexes": [
      "Développement social local",
      "Empowerment",
      "Milieu local"
    ],
    "exMtl": "L'Initiative montréalaise de soutien au développement social local (IMSDSL) soutient 32 Tables de quartier depuis 2006.",
    "exInsp": "",
    "extra": "À la DRSP, les personnes vivant à Montréal incluent toutes les personnes qui résident, travaillent ou étudient à Montréal, peu importe leur statut migratoire : les personnes demandeuses d'asile, réfugiées et migrantes à statut précaire font partie des communautés montréalaises (DRSP, 2023).",
    "images": [],
    "source": "Institut national de santé publique du Québec. (2002). La santé des communautés : perspectives pour la contribution de la santé publique au développement social et au développement des communautés. Gouvernement du Québec. https://www.inspq.qc.ca/pdf/publications/082_SanteCommunautes.pdf"
  },
  "mobilisation": {
    "title": "Mobilisation des actifs",
    "definition": "L'approche ABCD (Asset-Based Community Development) part des forces et des capacités existantes d'une communauté plutôt que de ses manques. Le CCNDS définit l'approche fondée sur les atouts comme une démarche qui « consiste à cartographier les capacités et les actifs des individus, des associations et des institutions locales ».",
    "connexes": [
      "Approche par les forces",
      "Cartographie des actifs",
      "Community Capitals Framework"
    ],
    "exMtl": "Le programme Leadership rassembleur de Centraide et Dynamo cartographie les leaders et les actifs des quartiers montréalais et bâtit sur ces forces plutôt que sur les déficits.",
    "exInsp": "",
    "extra": "L'approche ABCD identifie cinq catégories d'actifs : 1) les individus, avec leurs compétences et capacités; 2) les associations citoyennes informelles; 3) les institutions formelles; 4) les actifs liés aux lieux (terrains, bâtiments); et 5) les connexions du tissu relationnel. Partir des forces existantes accélère l'action, renforce la fierté et la résilience des communautés, et évite les approches déficitaires stigmatisantes.",
    "images": [],
    "source": "Kretzmann, J. P. et McKnight, J. L. (1993). Building communities from the inside out: A path toward finding and mobilizing a community's assets. ACTA Publications ; Centre de collaboration nationale des déterminants de la santé. (s. d.). Glossaire. https://nccdh.ca/fr/learn/glossaire/"
  },
  "capital": {
    "title": "Capital social et cohésion sociale",
    "definition": "« Le capital social est l'ensemble des ressources offertes aux individus par l'entremise de leurs relations sociales […]. Il s'agit des caractéristiques de l'organisation sociale telles que les réseaux, les normes et la confiance, qui facilitent la coordination et la coopération dans l'intérêt collectif. Le capital social se retrouve donc à la fois au niveau individuel et collectif. »",
    "connexes": [
      "Bonding",
      "Bridging",
      "Linking"
    ],
    "exMtl": "L'étude « Liens sociaux et COVID-19 » (Cité-ID, 2021) documente le capital social dans six arrondissements de Montréal et son rôle dans la résilience urbaine.",
    "exInsp": "",
    "extra": "",
    "images": [
      {
        "file": "images/capital-social.png",
        "caption": "Bonding, bridging, linking : les trois formes du capital social"
      }
    ],
    "source": "Arnaud, J., St-Amand, R.-M., Therrien, M.-C. et Normandin, J.-M. (2021). Liens sociaux et COVID-19 : Étude dans six arrondissements de Montréal. Cité-ID living lab, Gouvernance de la résilience urbaine. https://numerique.banq.qc.ca/patrimoine/details/52327/4408989"
  },
  "savoir": {
    "title": "Savoir et apprentissage",
    "definition": "« Fonder l'action collective sur la délibération, la planification, l'innovation et l'apprentissage collectif. » Les apprentissages collectifs et le partage de savoirs — scientifiques, expérientiels et citoyens — conditionnent la durabilité des initiatives de développement des communautés.",
    "connexes": [
      "Savoirs expérientiels",
      "Apprentissage collectif",
      "Transfert de connaissances"
    ],
    "exMtl": "La communauté de pratique de la Coalition montréalaise des Tables de quartier (CMTQ), animée par Dynamo.",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Institut national de santé publique du Québec, cité dans Direction régionale de santé publique de Montréal. (2023). Le pouvoir d'agir des communautés et la lutte aux inégalités sociales de santé au cœur des priorités de santé publique pour une métropole résiliente. https://santepubliquemontreal.ca/sites/drsp/files/media/document/DRSP_Pub_2023_CadreRefPouvoirAgirCommLutteInegalSocialSP.pdf"
  },
  "leadership": {
    "title": "Leadership et capacité organisationnelle",
    "definition": "Le développement du leadership et de la capacité collective d'agir du milieu vise à maximiser le pouvoir des communautés d'intervenir sur les enjeux qui les touchent (IMSDSL, 2020). Le renforcement des capacités communautaires (community capacity building) est le processus par lequel les communautés, les organisations et les individus développent les compétences, les ressources et les structures nécessaires pour agir collectivement sur leur santé et leurs conditions de vie.",
    "connexes": [
      "Community capacity building",
      "Leadership partagé",
      "Organisation collective"
    ],
    "exMtl": "Le Forum jeunesse de l'île de Montréal accompagne depuis plus de 20 ans les conseils étudiants et les jeunes citoyens.",
    "exInsp": "",
    "extra": "Liberato et coll. (2011) synthétisent neuf dimensions interreliées du renforcement des capacités : opportunités d'apprentissage et développement des compétences; mobilisation des ressources; partenariats, liens et réseautage; leadership; prise de décision participative; approche fondée sur les actifs; sentiment d'appartenance; communication; et trajectoire de développement.",
    "images": [],
    "source": "Initiative montréalaise de soutien au développement social local. (2020). Cadre de référence ; Liberato, S. C. et coll. (2011). Measuring capacity building in communities: A review of the literature. BMC Public Health, 11, 850. https://doi.org/10.1186/1471-2458-11-850"
  },
  "ressources": {
    "title": "Ressources et maillage",
    "definition": "Disponibilité et accessibilité de ressources — financières, humaines, matérielles, informationnelles — et d'espaces de participation pour soutenir l'action collective. La mobilisation des ressources et le réseautage sont des dimensions centrales du renforcement des capacités communautaires (Liberato et coll., 2011).",
    "connexes": [
      "Mobilisation des ressources",
      "Réseautage",
      "Capacités communautaires"
    ],
    "exMtl": "Le service 211 Grand Montréal maille citoyens et plus de 5 000 ressources communautaires, sociales et de santé, 24 heures sur 24, 7 jours sur 7.",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": "Liberato, S. C., Brimblecombe, J., Ritchie, J., Ferguson, M. et Coveney, J. (2011). Measuring capacity building in communities: A review of the literature. BMC Public Health, 11, 850. https://doi.org/10.1186/1471-2458-11-850"
  },
  "recherche": {
    "title": "Recherche et évaluation",
    "definition": "",
    "connexes": [],
    "exMtl": "",
    "exInsp": "",
    "extra": "",
    "images": [],
    "source": ""
  }
};
