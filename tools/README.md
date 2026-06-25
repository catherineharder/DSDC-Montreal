# tools/ — outils hors ligne (cartographie)

Ce dossier ne contient **pas** de code qui tourne sur GitHub. C'est de l'outillage
ponctuel, à lancer à la main sur un poste, uniquement pour **refabriquer la
géométrie de la carte des tables de quartier**.

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
