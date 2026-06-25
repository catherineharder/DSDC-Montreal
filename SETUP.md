# Installation et mise en ligne — procédure complète

Ce guide explique, étape par étape, comment **mettre le site en ligne sur GitHub
Pages** et **brancher les trois feuilles Google** qui alimentent le site. Suivez
les sections dans l'ordre. Comptez environ 30 minutes la première fois.

Public visé : la personne qui administre le dépôt (vous). Pour la personne qui
mettra le contenu à jour ensuite (votre superviseur·e), voir
**GUIDE-SUPERVISEUR.md**.

---

## Vue d'ensemble — comment le site se met à jour tout seul

```
   Vous / superviseur·e
   modifiez 3 feuilles Google
            │
            ▼
   Chaque nuit (03h00 UTC), GitHub Actions lance sync/sync_all.py
            │
            ▼
   Le script lit les feuilles et régénère 3 fichiers du site :
      • acronymes.html                              (Glossaire)
      • assets/data/concertations.data.js           (Concertations)
      • assets/data/tables-quartier.members.js      (Tables de quartier)
            │
            ▼
   Les changements sont publiés automatiquement sur GitHub Pages.
```

Vous n'avez **rien à coder** pour mettre le contenu à jour : tout passe par les
feuilles Google. La synchronisation est **quotidienne** ; vous pouvez aussi la
déclencher à la main (voir §5).

---

## 1. Créer le dépôt GitHub et y déposer le site

1. Créez un compte sur <https://github.com> si nécessaire.
2. En haut à droite : **+ → New repository**.
   - **Repository name** : par exemple `ressources-eusp`.
   - Laissez-le **Public** (obligatoire pour GitHub Pages gratuit).
   - Ne cochez rien d'autre. **Create repository**.
3. Sur la page du nouveau dépôt, cliquez **uploading an existing file**.
4. Glissez-déposez **tout le contenu** du dossier `github-pages` — mais **PAS** :
   - le dossier `feuilles-sources-google/` (sauvegardes Excel, inutiles en ligne) ;
   - le dossier `node_modules/` (déjà supprimé) ;
   - les fichiers `.DS_Store`.

   Le fichier `.gitignore` les ignore de toute façon ; ne les téléversez
   simplement pas.
5. En bas : **Commit changes**.

> **Plus simple avec Git en ligne de commande** (si vous connaissez) : voir §7.

---

## 2. Activer GitHub Pages

1. Dans le dépôt : **Settings → Pages**.
2. Sous **Build and deployment → Source**, choisissez **Deploy from a branch**.
3. **Branch** : `main`, dossier `/ (root)`. **Save**.
4. Patientez 1–2 minutes. L'adresse du site s'affiche en haut de la page Pages,
   du type `https://VOTRE-NOM.github.io/ressources-eusp/`.

Le site est en ligne. Il fonctionne déjà avec les données actuelles (figées dans
les fichiers). Les sections suivantes le rendent **modifiable par feuille Google**.

---

## 3. Transformer les trois classeurs Excel en feuilles Google

Dans votre Google Drive se trouvent (dans `DRSP/github-pages/feuilles-sources-google/`,
et copiés dans le dossier **« Site Ressources EUSP — feuilles sources »**) trois
fichiers : `Glossaire.xlsx`, `Concertations.xlsx`, `Tables_de_quartier.xlsx`.

Pour **chacun** des trois :

1. Dans Google Drive, **clic droit** sur le fichier → **Ouvrir avec → Google Sheets**.
2. Une feuille Google s'ouvre (les onglets sont conservés). Menu **Fichier →
   Enregistrer en tant que Google Sheets** si demandé.
3. Renommez-la clairement : « Glossaire — site », « Concertations — site »,
   « Tables de quartier — site ».
4. **Partagez-la en lecture** : bouton **Partager** (en haut à droite) →
   sous *Accès général*, choisissez **« Tout le monde disposant du lien »** et le
   rôle **« Lecteur »** → **Terminé**.

   > Cette étape est **indispensable** : elle permet à GitHub de lire la feuille
   > chaque nuit. Aucun mot de passe n'est exposé ; la feuille reste en lecture
   > seule pour le public, et vous seul·e pouvez la modifier.

5. Notez l'**ID de la feuille** : c'est la longue suite de caractères dans
   l'adresse, entre `/d/` et `/edit` :
   `https://docs.google.com/spreadsheets/d/`**`1AbCdEf...XYZ`**`/edit`

Répétez pour les trois fichiers. Vous obtenez **trois ID**.

---

## 4. Brancher les feuilles au site (`sync/config.json`)

1. Dans le dépôt GitHub, ouvrez **`sync/config.json`** → bouton crayon (**Edit**).
2. Remplacez chaque `TODO_ID_FEUILLE_…` par l'ID correspondant, **entre les
   guillemets**. Exemple :

   ```json
   "glossaire": {
     "sheet_id": "1AbCdEf...XYZ",
     "tab": "Acronymes",
     "output": "acronymes.html"
   }
   ```
3. **Commit changes**.

> Tant qu'un `sheet_id` commence par `TODO`, cette source est simplement ignorée
> par la synchronisation : vous pouvez donc brancher les feuilles une à la fois.

---

## 5. Lancer la première synchronisation (sans attendre la nuit)

1. Dans le dépôt : onglet **Actions**.
2. Si GitHub demande d'activer les workflows, cliquez **I understand… enable**.
3. À gauche, **« Synchronisation du site depuis Google Sheets »** → bouton
   **Run workflow → Run workflow**.
4. Au bout d'une minute, la coche verte indique que les trois fichiers ont été
   régénérés et publiés. Rechargez le site : il reflète vos feuilles.

À partir de là, **toute modification dans une feuille apparaît sur le site à la
prochaine synchronisation** (la nuit suivante), ou immédiatement si vous relancez
le workflow à la main.

---

## 6. À supprimer / à savoir

- **Rien d'autre à supprimer manuellement.** Le ménage a déjà été fait :
  `node_modules/` (~25 Mo), `__pycache__/`, `.DS_Store` et les anciens scripts
  remplacés (`scripts/sync_acronymes.py`, `tools/build_concertations.py`,
  `tools/build_members.py`) ont été retirés.
- **`tables_de_quartier.csv` / `tables_de_quartier.xlsx`** (à la racine) : ce
  sont les **données d'origine** des tables de quartier. Elles ne servent plus à
  alimenter le site (c'est la feuille Google qui le fait), mais on les garde comme
  archive de provenance. Vous pouvez les supprimer si vous préférez ; sans effet
  sur le site.
- **`tools/build_tables_quartier.py`** : génère la **géométrie de la carte** des
  32 tables. Il ne tourne **pas** automatiquement (il exige des fichiers GeoJSON
  et la librairie `shapely`). Conservez-le : c'est la seule trace de la façon dont
  la carte a été fabriquée. Voir `tools/README.md`.
- **`feuilles-sources-google/`** : sauvegardes Excel de départ. À garder dans
  votre Drive, inutile sur GitHub (déjà ignoré par `.gitignore`).

---

## 7. (Optionnel) Mise en ligne avec Git en ligne de commande

Si vous êtes à l'aise avec un terminal :

```bash
cd "chemin/vers/github-pages"
git init
git add .
git commit -m "Site Ressources EUSP — version initiale"
git branch -M main
git remote add origin https://github.com/VOTRE-NOM/ressources-eusp.git
git push -u origin main
```

Le dépôt a déjà été initialisé localement (`git init` + premier commit) et un
`.gitignore` correct est en place : il vous reste à ajouter le `remote` et à
`git push`.

---

## 8. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Le workflow échoue avec « HTML reçu au lieu de CSV » | La feuille n'est pas partagée « lecteur par lien », ou mauvais ID | Reprenez §3.4 et §4 |
| Une section ne change pas | `sheet_id` encore en `TODO`, ou onglet mal nommé | Vérifiez `sync/config.json` et les noms d'onglets |
| Le site ne se met pas à jour après édition | La synchro est quotidienne | Relancez le workflow à la main (§5) |
| Page Pages introuvable (404) | Pages pas encore activé / branche erronée | Reprenez §2 |
