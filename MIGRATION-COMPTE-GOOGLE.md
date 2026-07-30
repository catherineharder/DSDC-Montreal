# Déménager les feuilles vers le compte du projet — marche à suivre

Objectif : que les feuilles Google qui alimentent le site n'appartiennent plus à
un compte personnel, mais au compte du projet **dsdc.drsp@gmail.com**, dont
l'identifiant pourra être remis aux personnes qui éditent le contenu.

À faire une seule fois. Comptez 20 minutes.

> **Le point important** : *transférer la propriété* d'une feuille **conserve son
> identifiant**. C'est ce qui fait que rien n'est à changer dans le code. Si vous
> faites plutôt « Créer une copie », l'identifiant change et le site cesse de se
> synchroniser jusqu'à ce qu'on répare la configuration. **Transférez, ne copiez
> pas.**

---

## Ce qu'il y a à déménager

| Feuille | Identifiant (dans l'URL) |
|---|---|
| Glossaire.xlsx | `1RRaZ4SMFaWm3m78ypPufWrClJymn4y7n` |
| Concertations.xlsx | `1dDpLbIMQCE9OoCvnZNVQc0R8gkmydV8I` |
| Tables_de_quartier.xlsx | `11P0JPIxhEmf3EFvXxVx2z_NYmQ-oNo7u` |
| Ressources.xlsx | *à créer* (étape 3) |
| Deputes.xlsx | *à créer* (étape 3) |

---

## Étape 1 — Transférer les trois feuilles existantes

Pour **chacune** des trois feuilles, connecté·e à **votre compte personnel** :

1. Ouvrez la feuille.
2. Bouton **Partager** (en haut à droite).
3. Dans le champ, tapez **dsdc.drsp@gmail.com**, choisissez le rôle **Éditeur**,
   puis **Envoyer**. Décochez « Informer les personnes » si vous préférez.
4. Rouvrez **Partager**. `dsdc.drsp@gmail.com` apparaît maintenant dans la liste.
5. Cliquez le menu déroulant à côté de son nom → **Transférer la propriété**.
6. Confirmez (**Envoyer l'invitation**).

Puis, connecté·e à **dsdc.drsp@gmail.com** :

7. Ouvrez la boîte de réception : un courriel « Invitation à devenir
   propriétaire » attend pour chaque feuille. Cliquez **Accepter** dans chacun.

> Tant que l'invitation n'est pas acceptée, le transfert n'est pas effectif.
> Vérifiez les trois.

Après acceptation, votre compte personnel reste **Éditeur** sur les feuilles :
vous pouvez continuer à travailler dedans. Si vous voulez vous retirer
complètement, faites-le **depuis le compte du projet** (Partager → votre adresse
→ Supprimer), une fois que tout est vérifié.

---

## Étape 2 — Vérifier le partage « lecteur par lien »

Le site lit les feuilles **sans mot de passe ni clé d'API** : il faut donc que
chacune reste lisible par lien. Le transfert de propriété **peut réinitialiser
ce réglage** — c'est la panne la plus courante après un déménagement.

Pour chacune des feuilles, depuis **dsdc.drsp@gmail.com** :

1. **Partager** → section **Accès général**.
2. Choisir **Tout le monde disposant du lien**.
3. Rôle à droite : **Lecteur** (surtout pas Éditeur : le lien serait public en
   écriture).
4. **Terminé**.

---

## Étape 3 — Créer les deux nouvelles feuilles

Deux fichiers sont prêts à la racine du dossier du projet :
**`Ressources.xlsx`** (vos 32 sources) et **`Deputes.xlsx`** (les 27
circonscriptions, avec le parti, le nom et le courriel actuels). Chacun contient
un onglet « Mode d'emploi » qui voyage avec la feuille.

Pour **chacun des deux**, connecté·e à **dsdc.drsp@gmail.com** :

1. Allez sur [drive.google.com](https://drive.google.com).
2. **Nouveau** → **Importer un fichier**, et choisissez le fichier.
3. Une fois importé, ouvrez-le : **Fichier → Enregistrer au format Google
   Sheets**. (Si le fichier s'ouvre déjà comme une feuille Google, passez.)
4. Gardez le nom du document tel quel : **Ressources.xlsx** / **Deputes.xlsx**.
5. Vérifiez le nom de l'onglet du bas — exactement **`Ressources`** pour l'un,
   **`Deputes`** pour l'autre (majuscule, sans accent, sans espace). C'est par
   ce nom que la synchronisation trouve les données.
6. **Partager** → **Accès général** → **Tout le monde disposant du lien** →
   **Lecteur**.
7. Copiez l'**identifiant** dans la barre d'adresse — c'est la longue chaîne
   entre `/d/` et `/edit` :

   `https://docs.google.com/spreadsheets/d/` **`1AbC…XYZ`** `/edit`

8. Envoyez-moi les deux identifiants (ou collez-les vous-même, voir l'étape 4).

---

## Étape 4 — Brancher les deux feuilles dans le site

Deux valeurs à renseigner. Si vous préférez, donnez-moi l'identifiant et je le
fais ; sinon :

**a)** `sync/config.json` : remplacez les deux lignes qui commencent par `TODO`
par les identifiants correspondants.

```json
"deputes":    { "sheet_id": "TODO_coller_ID_feuille_Deputes",    … }
"ressources": { "sheet_id": "TODO_coller_ID_feuille_Ressources", … }
```

Tant qu'une valeur commence par `TODO`, la source est simplement ignorée par la
synchronisation — rien ne casse, la section garde son contenu actuel.

**b)** `assets/js/app.js`, dans `EDIT_SHEETS` : remplacez

```js
ressources: "",
```

par l'URL complète :

```js
ressources: "https://docs.google.com/spreadsheets/d/1AbC…XYZ/edit",
```

C'est ce qui fait apparaître le petit crayon ✎ à côté du titre « Ressources »
sur le site. Tant que la valeur est vide, il n'y a simplement pas de crayon —
rien ne casse.

Puis enregistrez, et poussez les changements sur GitHub.

---

## Étape 5 — Tester avant de partir

1. Sur GitHub, onglet **Actions** → **Synchronisation du site depuis Google
   Sheets** → **Run workflow**.
2. Attendez 1 à 2 minutes. Le journal doit afficher une ligne par source :

   ```
   [ok]   acronymes.html — …
   [ok]   assets/data/concertations.data.js — … 16 définitions, 5 postures
   [ok]   assets/data/tables-quartier.members.js — …
   [ok]   assets/data/ressources.data.js — 32 sources, 0 page(s) couverture
   ```

3. Rechargez le site : l'onglet **Ressources** doit toujours afficher 32 fiches.
4. Test réel : dans la feuille Ressources, ajoutez une ligne bidon, relancez le
   workflow, vérifiez qu'elle apparaît — puis supprimez-la et relancez.

**Si une source échoue** avec « inaccessible (HTML reçu au lieu de CSV) », c'est
l'étape 2 qui a sauté sur cette feuille : le partage « lecteur par lien » n'est
pas actif. Refaites-la.

---

## Étape 6 — Donner l'accès aux personnes qui éditent

Deux façons, au choix :

- **Partager le mot de passe du compte** `dsdc.drsp@gmail.com`. Simple, mais
  tout le monde édite sous la même identité : l'historique des révisions ne dit
  plus qui a fait quoi. Activez au minimum la validation en deux étapes avec
  **votre** numéro, sinon Google bloquera les connexions depuis de nouveaux
  appareils.
- **Ajouter chaque personne en Éditeur** sur les quatre feuilles, depuis le
  compte du projet. Un peu plus de gestes au départ, mais chacun garde son nom
  dans l'historique, et on retire un accès sans changer de mot de passe.

La seconde est préférable si plus de deux personnes touchent au contenu.

---

## Ce qui n'est **pas** à changer

Pour éviter les fausses pistes :

- **Les identifiants des trois feuilles existantes** ne bougent pas — donc ni
  `sync/config.json`, ni `assets/js/app.js`, ni `acronymes.html` (le crayon du
  glossaire y est écrit en dur) ne sont à toucher pour elles.
- **Le dépôt GitHub** reste sur votre compte : il n'a aucun lien avec le compte
  Google.
- **Le nom de domaine** `dsdcmontreal.ca` est indépendant.
