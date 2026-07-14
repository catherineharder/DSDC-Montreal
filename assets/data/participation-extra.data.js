/* Participation électorale — données provinciale et fédérale (recherche).
   Ces paliers ne sont disponibles qu'en taux d'ENSEMBLE : les circonscriptions
   provinciales et fédérales ne coïncident pas avec les arrondissements
   montréalais, donc pas de ventilation par territoire sans agrégation par
   bureau de vote. On expose donc le taux global, cité, plutôt que d'inventer
   des valeurs par arrondissement.
   (Le taux municipal 2021 par arrondissement, lui, vit dans indicateurs.data.js.) */
window.PARTICIPATION_EXTRA = {
  provincial: {
    level: "Élection provinciale (2022)",
    overall: 66.06,
    ref: "ensemble du Québec",
    meta: "Élections Québec, élection générale du 3 octobre 2022 — taux de participation de l'ensemble du Québec. Le taux par arrondissement n'est pas publié (les circonscriptions provinciales ne coïncident pas avec les arrondissements).",
    url: "https://www.electionsquebec.qc.ca/en/results-and-statistics/history-of-voter-turnout/",
  },
  federal: {
    level: "Élection fédérale (2021)",
    overall: 62.6,
    ref: "ensemble du Canada",
    meta: "Élections Canada, 44e élection générale du 20 septembre 2021 — taux de participation national. Le taux par arrondissement n'est pas publié (les circonscriptions fédérales ne coïncident pas avec les arrondissements).",
    url: "https://www.elections.ca/content.aspx?section=ele&dir=turn&document=index&lang=e",
  },
};
