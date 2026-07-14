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
    meta: "Élections Québec, élection générale du 3 octobre 2022. Taux d'ensemble du Québec 66,06 %. Sur l'île de Montréal, la participation a été plus faible : 55,25 % à l'Ouest et 62,09 % à l'Est de l'île (agrégats officiels).",
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
