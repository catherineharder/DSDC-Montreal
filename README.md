# Ressources EUSP — site

Application web d'une seule page (un fichier `index.html` avec des **onglets**) qui présente
l'écosystème de la santé publique : Santé Québec, Ville de Montréal, Tables de quartier,
Concertations et partenaires, et un Glossaire.

Site statique : **aucune compilation requise**. Pour le prévisualiser, double-cliquez sur
`index.html` (il s'ouvre dans n'importe quel navigateur). Sur GitHub Pages, `index.html`
à la racine devient automatiquement la page d'accueil.

## Structure des fichiers

```
index.html                      Page d'accueil = la coquille de l'application (barre d'onglets + une <section> par onglet)

acronymes.html                  Glossaire — GÉNÉRÉ depuis la feuille Google « Glossaire » (ne pas éditer à la main)

assets/
  css/
    app.css                     Style partagé : design tokens, barre de nav, onglets, carte, composants communs
    concertations.css           Style propre à la section Concertations
  js/
    app.js                      Cœur : helpers + fabrique de carte (createMap) + bascule des onglets (initNav)
    ville-montreal.js           Logique de la carte Ville de Montréal (arrondissements)
    sante-quebec.js             Logique de la carte Santé Québec (territoires RTS / RLS)
    tables-quartier.js          Logique de la carte Tables de quartier + fiches membres
    concertations.js            Rendu de la section Concertations (lit window.CONC, construit le contenu)
  data/
    ville-montreal.data.js      DONNÉES de la carte Ville de Montréal (géométrie + organigramme) — éditez ici
    sante-quebec.data.js        DONNÉES de la carte Santé Québec (RTS, RLS, CLSC) — éditez ici
    tables-quartier.data.js     GÉOMÉTRIE de la carte des 32 tables (fond fixe) — voir tools/
    tables-quartier.members.js  Membres des tables — GÉNÉRÉ depuis la feuille Google « Tables de quartier »
    concertations.data.js       DONNÉES Concertations — GÉNÉRÉ depuis la feuille Google « Concertations »

sync/                           SYNCHRONISATION : feuilles Google -> fichiers du site (voir SETUP.md)
  sync_all.py                   Point d'entrée : lit sync/config.json, régénère les 3 fichiers générés
  config.json                   ID des 3 feuilles Google + onglets + fichier de sortie
  builders/
    common.py                   Téléchargement d'un onglet de feuille en CSV (export gviz public)
    glossaire.py                feuille « Acronymes »  -> acronymes.html
    concertations.py            6 onglets               -> assets/data/concertations.data.js
    tables.py                   feuille « Membres »     -> assets/data/tables-quartier.members.js

.github/workflows/
  sync.yml                      GitHub Action : lance sync/sync_all.py chaque nuit (03h00 UTC) + sur demande

tools/
  build_tables_quartier.py      OUTIL HORS LIGNE : régénère la géométrie de la carte des tables
                                (exige GeoJSON + shapely ; ne tourne pas en CI). Voir tools/README.md.

feuilles-sources-google/        Classeurs Excel de départ pour créer les 3 feuilles (ignoré par git)
SETUP.md                        Mise en ligne + branchement des feuilles (à lire en premier)
GUIDE-SUPERVISEUR.md            Comment éditer le contenu via les feuilles Google
```

### Trois sources de contenu, un seul mécanisme

Le contenu **éditable** du site provient de **trois feuilles Google** lues chaque
nuit par `sync/sync_all.py` (GitHub Action). Voir **SETUP.md** pour le branchement
et **GUIDE-SUPERVISEUR.md** pour l'édition au quotidien.

| Feuille Google | Fichier régénéré | Onglet(s) |
|---|---|---|
| Glossaire | `acronymes.html` | `Acronymes` |
| Concertations | `assets/data/concertations.data.js` | `Familles_partenaires`, `Partenaires`, `Familles_comites`, `Comites`, `Composition`, `Definitions` |
| Tables de quartier | `assets/data/tables-quartier.members.js` | `Membres` |

Aucun secret ni clé d'API : les feuilles sont lues via l'export CSV public de
Google (gviz), il suffit qu'elles soient partagées « lecteur par lien ».

## Comment fonctionnent les onglets

`index.html` contient une barre de navigation et une `<section class="view">` par onglet :

```html
<button class="nav-item" data-view="conc">Concertations</button>
...
<section class="view" id="view-conc"> ... </section>
```

`assets/js/app.js` (`initNav`) affiche la `<section>` dont l'`id` correspond à
`view-` + `data-view`, et masque les autres. C'est tout le mécanisme d'onglets.

## Ajouter une nouvelle section dans le même style

La section **Concertations** sert de gabarit : elle est *pilotée par les données*
(les données vivent dans un fichier, le rendu dans un autre). Pour créer une section
« Ma section » dans le même style :

1. **Données** — copiez `assets/data/concertations.data.js` vers
   `assets/data/masection.data.js` et remplacez `window.CONC` par `window.MASECTION`
   avec vos données.
2. **Rendu** — copiez `assets/js/concertations.js` vers `assets/js/masection.js`.
   En haut du fichier, changez `document.getElementById('conc-root')` pour
   `'masection-root'` et `window.CONC` pour `window.MASECTION`.
3. **Style** — réutilisez `concertations.css` tel quel, ou copiez-le vers
   `masection.css` pour des ajustements. Les couleurs/typographie communes viennent
   déjà de `app.css`.
4. **Branchement dans `index.html`** :
   - ajoutez un bouton d'onglet :
     `<button class="nav-item" data-view="masection" aria-current="false">Ma section</button>`
   - ajoutez la vue (conteneur vide que le JS remplit) :
     `<section class="view" id="view-masection" hidden><div class="conc-app embed" id="masection-root"></div></section>`
   - liez les fichiers : `<link rel="stylesheet" href="assets/css/masection.css">` dans `<head>`,
     et avant `</body>` :
     `<script src="assets/data/masection.data.js"></script>` puis
     `<script src="assets/js/masection.js"></script>`

Aucune autre modification n'est nécessaire : la bascule d'onglets fonctionne déjà.

## Modifier le contenu de Concertations

Le contenu (comités, partenaires, définitions, composition) se modifie désormais
dans la **feuille Google « Concertations »** (6 onglets). À la synchronisation,
`sync/builders/concertations.py` régénère `assets/data/concertations.data.js`
(`window.CONC`) ; le code de rendu (`concertations.js`) n'est jamais touché. Voir
**GUIDE-SUPERVISEUR.md** pour le détail des colonnes.

> **Ne modifiez plus `assets/data/concertations.data.js` à la main** : il est
> écrasé à chaque synchronisation. C'est la feuille qui fait foi.

Les couleurs (niveaux rouge/orange/jaune, familles de partenaires, repères noirs)
et la typographie restent définies dans `assets/css/concertations.css` (variables
en haut du fichier) — l'apparence est donc toujours réglée dans le CSS, seul le
**contenu** vient de la feuille.

## Modifier les cartes

Les trois cartes (qui partagent le même contour de l'île) sont regroupées sous un
seul onglet **Cartes**. À l'intérieur, une sous-barre (`.map-tabs`, gérée par
`initCartes` dans `app.js`) bascule entre les sous-vues `#view-sante`,
`#view-ville` et `#view-tdq`.

Chaque carte suit le même patron **données + logique** que Concertations :

- **Ville de Montréal** : géométrie et organigramme dans
  `assets/data/ville-montreal.data.js` ; rendu dans `assets/js/ville-montreal.js`.
- **Santé Québec** : territoires RTS, réseaux RLS et CLSC dans
  `assets/data/sante-quebec.data.js` ; rendu dans `assets/js/sante-quebec.js`.

Pour ajuster une carte (couleurs, étiquettes, géométrie), éditez surtout le fichier
`*.data.js` correspondant. Les fichiers sont chargés dans cet ordre par `index.html`
(les `*.data.js` avant leur logique, et `app.js` en premier car il fournit les
fonctions partagées `el`, `esc`, `createMap`) :

```
app.js → ville-montreal.data.js → ville-montreal.js
       → sante-quebec.data.js   → sante-quebec.js
       → concertations.data.js  → concertations.js
```

La carte Santé Québec génère son propre style à l'exécution ; celle de la Ville
réutilise `createMap` de `app.js`. Tout vit dans `github-pages/` : le site ne dépend
plus d'aucun fichier externe.

## Synchronisation automatique (Glossaire, Concertations, Tables)

Les trois fichiers générés (`acronymes.html`, `concertations.data.js`,
`tables-quartier.members.js`) sont **régénérés automatiquement** par
`sync/sync_all.py`, lancé par l'Action GitHub `.github/workflows/sync.yml` (chaque
nuit à 03h00 UTC et sur demande via l'onglet *Actions*).

Le script lit les feuilles Google via leur **export CSV public** (gviz) — il suffit
que chaque feuille soit partagée « Tout le monde disposant du lien : Lecteur », et
que son ID soit inscrit dans `sync/config.json`. Aucun secret de dépôt n'est requis.

L'onglet **Glossaire** de l'application affiche `acronymes.html` dans une `<iframe>` ;
il reste donc toujours à jour et conserve sa recherche intégrée.

**Ne modifiez pas les fichiers générés à la main** : ils sont écrasés à la prochaine
synchronisation. Pour changer l'apparence du glossaire, modifiez le gabarit
`TEMPLATE` dans `sync/builders/glossaire.py`. Branchement complet : voir **SETUP.md**.
