# tools/ — outils hors ligne

Ce dossier ne contient **pas** de code qui tourne sur GitHub. C'est de l'outillage
ponctuel, à lancer à la main sur un poste, pour refabriquer des fichiers du site
à partir d'une source externe : la géométrie des cartes, et le cadre conceptuel.

## build_cadre.py

À lancer **après chaque réexport d'un des deux cadres depuis Illustrator** :

```bash
pip3 install svgelements     # une seule fois
python3 tools/build_cadre.py
```

Deux dessins, deux onglets de la page `/cadre` :

| Fichier            | Onglet             |
| ------------------ | ------------------ |
| `cadre.svg`        | Cadre conceptuel   |
| `cadre-simple.svg` | Cadre simplifié    |

Le geste complet, quand un dessin change :

1. dans Illustrator, exporter en SVG (Objet ID : **Nom de calque**, Style :
   CSS interne, Police : conserver le texte, Réactif : coché) ;
2. enregistrer à la racine du dépôt sous le nom ci-dessus, en écrasant l'ancien
   — ces deux fichiers ne sont jamais retouchés à la main ;
3. lancer la commande.

Le script retire le bandeau de titre, recadre la vue sur le dessin, rend les
boîtes cliquables, insère le tout dans `cadre-frame.html` et affiche à la fin la
liste des fiches encore vides.

Ce qu'il faut savoir :

- **les zones cliquables se repèrent différemment dans les deux fichiers.**
  Dans `cadre.svg`, c'est le nom de calque (« … box »), via la table `BOXES`.
  Dans `cadre-simple.svg`, dont les calques ne sont pas nommés, c'est le texte
  écrit dans la boîte, via la table `SIMPLE_BOXES` — donc **reformuler une
  étiquette de ce dessin oblige à corriger la ligne correspondante**. Dans les
  deux cas le script s'arrête et vous dit ce qu'il ne retrouve plus ;
- **l'ordre de `BOXES` est l'ordre d'empilement.** Une boîte qui en contient
  d'autres doit être listée avant elles, sinon elle les recouvre et vole leurs
  clics ;
- **le contenu des fiches vit dans `assets/data/cadre.data.js`** et ne dépend
  pas d'Illustrator. Rédiger un texte n'oblige à relancer aucun script. Un même
  concept peut être cliquable dans les deux dessins : il n'a qu'une fiche.

L'onglet « Exemple » est indépendant de tout ça : c'est `exemple-namur.html`,
une planche autonome chargée en iframe, qu'on peut aussi ouvrir seule.

## build_tables_quartier.py

Régénère `assets/data/tables-quartier.data.js` : le contour de l'île + les 32
territoires des tables, projetés en SVG. Le résultat est un **artefact figé** : la
carte ne change que si les frontières officielles changent.

Dépendances et entrées (non incluses dans le dépôt) :

- la librairie Python `shapely` (`pip install shapely`) ;
- `montreal-silhouette.geojson` (calibrage de la projection) ;
- `tables_de_quartier_32_2024.geojson` (les 32 territoires, source ArcGIS
  « Tables_de_Quartier_32_MTL_2024 ») ;
- un fichier `*.data.js` du site fournissant le contour canonique (réutilisé tel
  quel pour que les trois cartes partagent exactement le même tracé de côte).

Exemple :

```bash
python3 tools/build_tables_quartier.py \
  --silhouette montreal-silhouette.geojson \
  --tables tables_de_quartier_32_2024.geojson \
  --site-outline assets/data/ville-montreal.data.js \
  --out assets/data/tables-quartier.data.js
```

> ⚠️ Ne touche **que** la géométrie (le fond de carte). La **liste des membres**
> des tables, elle, vient de la feuille Google « Tables de quartier » et est
> régénérée par `sync/builders/tables.py`. Les deux sont indépendants.
