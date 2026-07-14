/* Participation électorale — paliers provincial et fédéral (recherche).
   Données réelles et citées. Le taux par circonscription individuelle n'a pas
   été saisi ici (à compléter depuis le fichier officiel d'Élections Québec) ;
   on expose les taux d'ensemble et, pour le provincial, la ventilation
   Ouest / Est de l'île publiée par la source. Aucune valeur inventée.
   (Le taux municipal 2021 par arrondissement vit dans indicateurs.data.js.) */
window.PARTICIPATION_EXTRA = {
  provincial: {
    level: "Élection provinciale (2022)",
    overall: 66.06,
    ref: "ensemble du Québec",
    // Ventilation réelle de l'île (source : Wikipédia, agrégats officiels Élections Québec)
    zones: [
      { nom: "Ouest de l'île", taux: 55.25, inscrits: 671569 },
      { nom: "Est de l'île", taux: 62.09, inscrits: 621279 },
    ],
    // Découpage des 27 circonscriptions de l'île en Ouest / Est (source Wikipédia).
    // byCirc est rempli plus bas : chaque circonscription reçoit le taux de sa
    // zone EN ATTENDANT les taux exacts par circonscription (fichier officiel
    // Élections Québec). Remplacer une valeur = taux exact de cette circonscription.
    zonesRidings: {
      ouest: ["acadie", "darcy-mcgee", "jacques-cartier", "marguerite-bourgeoys", "marquette",
        "mont-royal-outremont", "nelligan", "notre-dame-de-grace", "robert-baldwin",
        "saint-henri-sainte-anne", "saint-laurent", "verdun", "westmount-saint-louis"],
      est: ["anjou-louis-riel", "bourassa-sauve", "camille-laurin", "gouin", "hochelaga-maisonneuve",
        "jeanne-mance-viger", "lafontaine", "laurier-dorion", "maurice-richard", "mercier",
        "pointe-aux-trembles", "rosemont", "sainte-marie-saint-jacques", "viau"],
    },
    byCirc: {},          // rempli ci-dessous
    exactPerRiding: false, // passera à true quand les 27 taux exacts seront saisis
    meta: "Élections Québec, élection générale du 3 octobre 2022. Taux d'ensemble du Québec 66,06 %. Sur l'île de Montréal : 55,25 % à l'Ouest et 62,09 % à l'Est (agrégats officiels). Chaque circonscription est colorée au taux de sa zone en attendant les taux exacts par circonscription.",
    url: "https://www.electionsquebec.qc.ca/en/results-and-statistics/history-of-voter-turnout/",
  },
  federal: {
    level: "Élection fédérale (2021)",
    overall: 62.6,
    ref: "ensemble du Canada",
    meta: "Élections Canada, 44e élection générale du 20 septembre 2021 — taux de participation national 62,6 %. Le taux par territoire montréalais n'est pas repris ici (à compléter par circonscription).",
    url: "https://www.elections.ca/content.aspx?section=ele&dir=turn&document=index&lang=e",
  },
};

// Remplit provincial.byCirc à partir du découpage Ouest / Est (valeurs de zone).
(function () {
  var p = window.PARTICIPATION_EXTRA.provincial, zr = p.zonesRidings, by = p.byCirc;
  (zr.ouest || []).forEach(function (s) { by[s] = p.zones[0].taux; });
  (zr.est || []).forEach(function (s) { by[s] = p.zones[1].taux; });
})();
