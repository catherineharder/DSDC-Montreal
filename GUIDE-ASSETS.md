# Ajouter des visuels au site

Les visuels du site (logos, schémas, illustrations) vivent dans `images/assets/`
et sont associés à un emplacement de la page par le manifeste
`assets/data/assets-manifest.js`.

> **Aucun jeton, aucun secret, aucune connexion à Notion n'est nécessaire — ni
> ici, ni dans GitHub.** Le site ne va chercher aucune image tout seul. La
> synchronisation de nuit ne touche qu'aux feuilles Google (texte), jamais aux
> images.

## Comment ça marche

Trois pièces, et rien d'autre :

1. **L'image** dans `images/assets/`, nommée d'après son étiquette
   (ex. `structure-systeme-sante.png`).
2. **Une ligne dans le manifeste** `assets/data/assets-manifest.js` :
   `"structure-systeme-sante": "images/assets/structure-systeme-sante.png"`.
3. **Un emplacement dans la page** qui porte `data-asset="structure-systeme-sante"`.
   Au chargement, `assets/js/assets.js` remplit chaque emplacement avec l'image
   correspondante et masque le cadre « à ajouter ».

## Étiquettes déjà utilisées

| Étiquette | Emplacement rempli |
|---|---|
| `structure-systeme-sante` | Cartes → Santé Québec → « Structure du système » |
| `developpement-des-communautes` | Accueil → section Développement des communautés |
| `assemblee-nationale` | Cartes → Députés (logo) |

Pour afficher une image ailleurs, on ajoute `data-asset="mon-etiquette"` à
l'endroit voulu dans la page.

## Ajouter une image

Le plus simple : demandez à Claude, en lui disant que vous avez déposé l'image
dans la page Notion **Assets**. La compétence `notion-assets-sync` fait tout le
trajet — elle récupère l'image, la nomme, la place dans `images/assets/`, met le
manifeste à jour et la relie à son emplacement.

Cette compétence tourne **sur votre ordinateur**, dans votre session Claude. Elle
lit Notion avec votre propre connexion Notion : le site, le dépôt GitHub et la
synchronisation de nuit n'ont aucun accès à Notion et n'en ont pas besoin.

À la main, si vous préférez :

1. Déposez le fichier dans `images/assets/`, en minuscules, sans accent ni
   espace (ex. `mon-schema.png`).
2. Ajoutez sa ligne dans `assets/data/assets-manifest.js`.
3. Vérifiez qu'un emplacement de la page porte bien le `data-asset`
   correspondant.
4. Poussez sur GitHub.

## Pages couverture des Ressources

Elles suivent une mécanique **différente et automatique** : voir
`images/ressources/LISEZ-MOI.md`. Il n'y a ni manifeste ni `data-asset` à
remplir — le nom du fichier suffit.
