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

Après un changement, attendez la nuit (ou demandez à l'administrateur·rice de
« relancer la synchronisation »), puis rechargez le site.

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

C'est la plus riche : elle a **six onglets**. Chacun a un rôle précis. Vous
modifiez surtout `Partenaires`, `Comites`, `Composition` et `Definitions`.

### Onglet `Partenaires` — les cases « Partenaires » du site
Un partenaire = une ligne.

| Colonne | À mettre |
|---|---|
| **famille_key** | Le **code de famille** (voir onglet `Familles_partenaires`), ex. `min`, `mun`, `comm`… |
| **id** | Un identifiant court et unique, sans espace ni accent, ex. `mamh` |
| **ac** | Le **nom court / sigle** affiché en gras sur la case, ex. `MAMH` |
| **full** | Le nom complet (facultatif), ex. `Ministère des Affaires municipales et de l'Habitation` |
| **desc** | Une phrase de description (affichée quand on clique sur la case) |
| **rel** | Rattachement affiché entre parenthèses (facultatif), ex. `MSSS` |
| **sub** | Mettez `x` si c'est une **sous-entité** (case plus discrète) ; sinon vide |
| **match** | Mots-clés qui relient ce partenaire aux comités où il siège, séparés par `;` ex. `MAMH ; affaires municipales` |

### Onglet `Comites` — les comités
Un comité = une ligne.

| Colonne | À mettre |
|---|---|
| **id** | Identifiant court unique, ex. `trsp` |
| **fam** | Le **code de famille de comité** (voir `Familles_comites`), ex. `trsp`, `dsl`… |
| **niv** | Niveau : `strat` (stratégique), `tact` (tactique) ou `oper` (opérationnel) — fixe la couleur |
| **pal** | Palier (texte libre interne), ex. `regional` |
| **name** | Le nom court affiché sur la case |
| **full** | Le nom complet (affiché en titre de la fiche) |
| **drsp** | Rôle de la DRSP : `lead` (porteuse), `participant`, ou `absent` |
| **neu** | `x` si le comité est **nouveau** (étoile ★, < 1 an) ; sinon vide |
| **under** | « Sous » / rattachement affiché en petit sous le nom (facultatif) |
| **ina** | `x` si le comité est **inactif** ; sinon vide |
| **pp** | « Porté par » (facultatif) |
| **man** | Le mandat / la mission (facultatif, peut être long) |
| **presence_interne** | Équipes DRSP présentes, codes séparés par `;` parmi : `dir`, `eusp`, `jeun`, `pcmi`, `ecos` |
| **partenaires_lies** | Codes de partenaires liés, séparés par `;` (facultatif) |

### Onglet `Composition` — qui siège dans chaque comité
Une ligne = **un membre** d'un comité.

| Colonne | À mettre |
|---|---|
| **comite_id** | L'`id` du comité (même valeur que dans l'onglet `Comites`) |
| **secteur** | Code de secteur (couleur/regroupement), ex. `drsp`, `rss`, `mun`, `comm`… |
| **membre** | Le libellé du membre, ex. `Directions concernées des 5 CIUSSS` |

Pour ajouter un siège à un comité : nouvelle ligne avec le bon `comite_id`.

### Onglet `Definitions` — le lexique de bas de section
| Colonne | À mettre |
|---|---|
| **terme** | Le terme défini, ex. `Communauté de pratique` |
| **acronyme** | Son sigle (facultatif), ex. `CoP` |
| **definition** | La définition (le HTML simple comme `<em>…</em>` est permis) |

### Onglets `Familles_partenaires` et `Familles_comites` — les regroupements
Vous y touchez **rarement**. Ils définissent les **familles** (titres de groupes)
et leur ordre d'affichage.

- `Familles_partenaires` : `key` (code), `label` (titre affiché), `dot` (code de
  pastille de couleur).
- `Familles_comites` : `key` (code), `label` (titre affiché).

L'**ordre des lignes** dans ces deux onglets fixe l'**ordre d'affichage** des
groupes sur le site. Pour qu'un partenaire ou un comité apparaisse, son code de
famille (`famille_key` / `fam`) doit exister ici.

---

## Conseils

- **Une modification, un test** : changez peu de choses à la fois, puis vérifiez
  le site le lendemain. C'est plus facile de repérer une erreur.
- **Copiez une ligne existante** comme modèle plutôt que de partir de zéro.
- Les listes dans une cellule se séparent par un point-virgule `;`.
- Les cases à cocher se notent `x` (ou rien).
- En cas de doute, l'ancien contenu est toujours récupérable : chaque
  synchronisation est enregistrée dans l'historique GitHub.
