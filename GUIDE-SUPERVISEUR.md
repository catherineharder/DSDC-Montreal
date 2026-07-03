# Guide d'édition du contenu — pour la mise à jour courante

Bienvenue. Ce site présente l'écosystème de la santé publique (Glossaire,
Concertations, Tables de quartier, cartes). **Vous n'avez jamais besoin de
toucher au code.** Tout le contenu modifiable vit dans **trois feuilles Google**.
Vous y faites vos changements ; le site se met à jour **automatiquement chaque
nuit**.

Les trois feuilles (partagées avec vous) :

| Feuille | Ce qu'elle contrôle |
|---|---|
| **Glossaire — site** | La liste des acronymes |
| **Tables de quartier — site** | Les membres de chaque table de quartier |
| **Concertations — site** | Les partenaires, comités et définitions |

> **Règle d'or** : on ajoute / modifie / supprime des **lignes**. On ne change
> **jamais la première ligne** (les en-têtes de colonnes) ni les **noms des
> onglets**. Si une colonne ne vous concerne pas, laissez-la vide.

**Raccourci** : sur le site, chaque section modifiable affiche un petit
**crayon** ✎ à côté de son titre (Glossaire, Concertations, panneau des Tables
de quartier). Cliquer le crayon ouvre directement la bonne feuille Google.
Sans accès en écriture, la feuille s'ouvre en lecture seule (avec possibilité
de demander l'accès).

Après un changement, attendez la nuit, puis rechargez le site. Pour voir vos
changements tout de suite : cliquez l'icône de **synchronisation** ↻ à droite
de la barre de navigation (réservée aux personnes ayant accès au dépôt GitHub),
puis « Run workflow » ; le site est régénéré en 1 à 2 minutes.

---

## 1. Glossaire — feuille « Glossaire — site », onglet `Acronymes`

Trois colonnes :

| Colonne | À mettre |
|---|---|
| **Acronyme** | Le sigle, ex. `CIUSSS` |
| **Signification** | La forme longue, ex. `Centre intégré universitaire de santé et de services sociaux` |
| **Source** | Facultatif (non affiché pour l'instant) |

- **Ajouter un acronyme** : nouvelle ligne, remplissez Acronyme + Signification.
- L'ordre des lignes n'a pas d'importance : le site **classe tout par ordre
  alphabétique** et regroupe par lettre automatiquement.
- Pas de doublons inutiles ; un acronyme par ligne.

---

## 2. Tables de quartier — feuille « Tables de quartier — site », onglet `Membres`

Une ligne = **un organisme membre** d'une table de quartier.

| Colonne | À mettre |
|---|---|
| **ID-table** | Code de la table, ex. `T01` (gardez le même pour toutes les lignes d'une même table) |
| **table-de-quartier** | Le **nom exact** de la table, ex. `CDC Centre-Sud` |
| **ID-org** | Code interne de l'organisme (facultatif, pour votre suivi) |
| **organisme** | Le nom de l'organisme membre |
| **category** | La catégorie d'appartenance, ex. `Membres actifs`, `Partenaires`… |

- **Ajouter un membre** : nouvelle ligne avec le bon nom de table dans
  `table-de-quartier`, le nom de l'organisme, et sa catégorie.
- **Le lien Google Maps est généré tout seul** à partir du nom de l'organisme :
  vous n'avez **aucune adresse à saisir**.
- ⚠️ **Le nom dans `table-de-quartier` doit correspondre exactement** à une des 32
  tables connues du site (mêmes accents, mêmes traits d'union). Si le nom ne
  correspond à aucune table, la ligne est simplement ignorée (le reste du site
  n'est pas affecté). En cas de doute, copiez le nom d'une ligne existante de la
  même table.
- Les catégories servent de sous-titres dans la fiche de chaque table ; vous
  pouvez en créer de nouvelles, elles apparaîtront telles quelles.

> La **carte** des tables (le dessin des territoires) n'est **pas** dans cette
> feuille : c'est un fond cartographique fixe. Cette feuille ne gère que **qui est
> membre de quoi**.

---

## 3. Concertations — feuille « Concertations — site »

Elle a **quatre onglets** : `Partenaires`, `Comites`, `Composition`,
`Definitions`. Les familles (groupes) ne sont plus un onglet à part : elles se
déduisent automatiquement des colonnes `famille` / `groupe`.

### Onglet `Partenaires` — les cases « Partenaires »
Un partenaire = une ligne.

| Colonne | À mettre |
|---|---|
| **ID-par** | Identifiant court et unique, sans espace ni accent, ex. `mamh`. **C'est lui qui relie un partenaire aux comités** (voir `Composition`). |
| **acronym** | Le sigle affiché en gras sur la case, ex. `MAMH` |
| **partenaire** | Le **nom complet**, ex. `Ministère des Affaires municipales et de l'Habitation` |
| **famille** | Le **nom de la famille** (regroupe et colore les cases), ex. `Ministères`, `Communautaire`… |
| **parent** | Organisme parent, affiché entre parenthèses (facultatif), ex. `MSSS` |

> Les **familles connues** (et leurs couleurs) : `Ministères`, `Réseau de la santé (RSSS)`,
> `Métropolitain et municipal`, `Instituts, observatoires et chaires`,
> `Universités et centres de recherche`, `Philanthropie`, `Communautaire`,
> `Autres partenaires`. Une **nouvelle** famille s'affiche, mais en couleur neutre
> tant que sa couleur n'a pas été ajoutée dans le code (demandez à l'administrateur·rice).

### Onglet `Comites` — les comités
Un comité = une ligne.

| Colonne | À mettre |
|---|---|
| **ID-com** | Identifiant court unique, ex. `trsp`. Sert à relier la composition (voir `Composition`). |
| **acronym** | Le sigle affiché en gras sur la case, ex. `TRSP` |
| **comite** | Le **nom complet** (titre de la fiche), ex. `Table régionale de santé publique` |
| **groupe** | Le **nom du regroupement** (sous-titre de section), ex. `Gouvernance régionale` |
| **parent** | Instance / comité de rattachement, affiché en petit sous le nom (facultatif) |
| **niveau** | `stratégique`, `tactique` ou `opérationnel` — fixe la couleur de la case |
| **DRSP-coord** | `x` si la DRSP est **coordonnatrice** (pastille noire) ; sinon vide |
| **nouveau** | `x` si le comité est **nouveau** (étoile ★, < 1 an) ; sinon vide |
| **mandat** | Le mandat / la mission (peut être long) |

### Onglet `Composition` — qui siège dans chaque comité
Une ligne = **un membre** d'un comité.

| Colonne | À mettre |
|---|---|
| **ID-com** | L'`ID-com` du comité (même valeur que dans l'onglet `Comites`) |
| **comite** | Le nom du comité (pour vous repérer ; non affiché) |
| **ID-mem** | Si ce membre est aussi un **partenaire**, mettez son `ID-par`. Le site crée alors automatiquement le lien « présent dans les comités ». Sinon, laissez vide. |
| **membre** | Le libellé du membre, ex. `Directions concernées des 5 CIUSSS` |
| **categorie** | Rôle affiché entre parenthèses après le nom : `porteur`, `DRSP`, ou vide. **Le `porteur` apparaît toujours en premier, puis les `DRSP`, puis le reste.** Ex. : `MAMH (porteur)`, `EUSP (DRSP)`. |

Pour ajouter un siège : nouvelle ligne avec le bon `ID-com`. Pour qu'un partenaire
soit listé sur sa propre fiche comme « présent dans » un comité, renseignez
`ID-mem` avec son `ID-par`.

### Onglet `Definitions` — le lexique de bas de section
| Colonne | À mettre |
|---|---|
| **terme** | Le terme défini, ex. `Communauté de pratique` |
| **acronym** | Son sigle (facultatif), ex. `CoP` |
| **definition** | La définition (le HTML simple comme `<em>…</em>` est permis) |

> L'**ordre des lignes** des onglets `Partenaires` et `Comites` fixe l'ordre
> d'affichage ; les familles/groupes apparaissent dans l'ordre de leur première
> occurrence.

---

## Conseils

- **Une modification, un test** : changez peu de choses à la fois, puis vérifiez
  le site le lendemain. C'est plus facile de repérer une erreur.
- **Copiez une ligne existante** comme modèle plutôt que de partir de zéro.
- Les listes dans une cellule se séparent par un point-virgule `;`.
- Les cases à cocher se notent `x` (ou rien).
- En cas de doute, l'ancien contenu est toujours récupérable : chaque
  synchronisation est enregistrée dans l'historique GitHub.
