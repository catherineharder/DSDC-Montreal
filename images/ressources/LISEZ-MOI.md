# Pages couverture de l'onglet « Ressources »

Les pages couverture ne sont **pas** dans la feuille Google. Elles se
rattachent à une fiche par le **nom du fichier**.

## Ajouter une couverture

1. Ouvrir `assets/data/ressources.data.js` : la liste des noms de fichier
   attendus est écrite en commentaire, en tête du fichier, une ligne par
   source (celles sans image sont marquées « aucune image »).
2. Déposer l'image ici, sous ce nom exact, avec l'une des extensions
   acceptées : `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`.
3. À la prochaine synchronisation (chaque nuit, ou manuellement via l'onglet
   Actions de GitHub), la fiche affichera l'image au lieu de l'aperçu
   générique.

Exemple : la fiche « Charte d'Ottawa pour la promotion de la santé » attend
`charte-d-ottawa-pour-la-promotion-de-la-sante.jpg`.

## Format

Les fiches affichent la couverture en portrait, dans une case d'environ
200 px de large. Une image de 400 à 600 px de large suffit largement ;
au-delà, on alourdit la page pour rien.

Aucune action n'est requise : sans image, la fiche affiche un aperçu
générique, et c'est le cas de toutes les fiches aujourd'hui.
