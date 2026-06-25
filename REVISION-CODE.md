# Revue de code — Site Ressources EUSP

Revue menée comme un·e développeur·se senior, avant mise en ligne. Résumé : **base
saine et bien pensée**, quelques défauts d'hygiène de dépôt (corrigés) et un piège
d'architecture sur les données (corrigé). Détails ci-dessous.

## Ce qui était déjà bien

- **Site statique, zéro compilation.** Vanilla JS, aucun framework, aucun bundler.
  Pour un site de référence interne, c'est le bon choix : durable, lisible, rien à
  maintenir côté build.
- **Séparation données / rendu.** Chaque section suit le patron `*.data.js`
  (données) + `*.js` (rendu), avec un espace de noms global clair (`window.CONC`,
  `TDQ_MEMBERS`, etc.). C'est exactement ce qui rend le contenu « pilotable ».
- **Un seul contour d'île partagé** par les trois cartes (mêmes pixels) : décision
  cohérente, bien documentée dans le code.
- **Accessibilité de base** présente (`aria-current`, `aria-live`, `role`, `lang=fr`).
- **Recherche intégrée** côté client dans le glossaire et les concertations,
  normalisation des accents incluse (`normalize('NFD')`). Soigné.

## Problèmes trouvés — et corrigés

1. **`node_modules/` versionné (~25 Mo) sans `package.json`.** Dépendances
   orphelines (`tldts`, `css-tree`…) qui n'ont rien à faire dans un site statique.
   → **Supprimé.** Déjà couvert par `.gitignore`.
2. **`__pycache__/` et `.DS_Store` versionnés.** Bruit. → **Supprimés.**
3. **Double source de vérité pour Concertations — le vrai piège.** Le contenu était
   édité **à la main** dans `concertations.data.js`, mais `tools/build_concertations.py`
   prétendait le **régénérer** à partir d'une autre source : le relancer **écrasait
   les retouches manuelles**. C'est une bombe à retardement (déjà notée comme
   « ne pas lancer ce script »). → **Source unique désormais : la feuille Google.**
   Le script dangereux a été **supprimé**, et la feuille a été pré-remplie à
   l'identique à partir du `data.js` actuel (vérifié, voir plus bas).
4. **Synchronisation opaque et fragile.** L'ancien mécanisme dépendait d'un secret
   `CSV_URL` (une URL « Publier sur le Web » par feuille, invisible et facile à
   casser). → **Remplacé** par un système unifié `sync/` qui lit chaque onglet par
   son **nom** via l'export CSV public de Google (gviz). **Aucun secret**, un seul
   `sync/config.json` lisible dans le dépôt, extensible aux trois sources.
5. **Aucune vérification.** Rien ne garantissait qu'une régénération ne perdait pas
   de données. → **Ajout d'un test aller-retour** (données → feuille → données) :
   pour Concertations, la reconstruction est **strictement identique** à l'original
   (égalité JSON champ par champ).

## Recommandations (optionnelles, non bloquantes)

- **Injection HTML via `innerHTML`.** Les rendus (`concertations.js`, etc.) insèrent
  les champs sans échappement — voulu, car certaines descriptions contiennent du
  HTML simple (`<em>`). Conséquence : une personne éditant une feuille peut injecter
  du balisage. Le risque est faible (vos propres feuilles, site interne), mais à
  garder en tête. Si un jour les feuilles sont ouvertes à plus large, prévoir un
  échappement sélectif.
- **Petite intégration continue.** Un *workflow* qui lance `sync/sync_all.py` sur
  chaque *pull request* (sans pousser) détecterait tôt une feuille mal formée.
- **Sections « À venir ».** `Ressources` et le panneau Santé Québec sont des
  ébauches (« Données à intégrer »). À compléter ou masquer avant une diffusion
  large.
- **Licence.** Si le dépôt devient public au-delà de l'équipe, ajoutez un fichier
  `LICENSE`.
- **Actions épinglées.** `checkout@v4` / `setup-python@v5` : versions majeures
  épinglées, bien. Envisager un *pin* par SHA pour durcir davantage.

## Verdict

Prêt à mettre en ligne. L'architecture « feuilles Google → fichiers générés →
GitHub Pages » est simple, sans secret, et **survivra à votre départ** : votre
superviseur·e n'édite que des feuilles (voir `GUIDE-SUPERVISEUR.md`), jamais le
code.
