# Ajouter des visuels depuis Notion

Le site va chercher les images sur la page Notion **« Assets »** et les place tout
seul dans `images/assets/`, exactement comme il synchronise déjà le glossaire et
les concertations depuis Google Sheets.

## Comment ça marche pour toi (au quotidien)

1. Ouvre la page Notion **Assets**.
2. Colle ton image (logo, schéma, page couverture, etc.).
3. **Donne-lui une légende** (clic sur l'image → « Légende »). Cette légende est
   son **étiquette** — c'est elle qui décide où l'image atterrit.
4. Lance la synchro (bouton Synchro du site, ou attends la synchro de nuit).

C'est tout. L'image apparaît au bon endroit.

### Étiquettes réservées (remplissent un emplacement existant du site)

| Étiquette (légende) | Emplacement rempli |
|---|---|
| `structure-systeme-sante` | Cartes → Santé Québec → « Structure du système » |
| `developpement-des-communautes` | Accueil → section Développement des communautés |
| `assemblee-nationale` | Cartes → Circonscriptions (logo) |

Toute autre étiquette est aussi téléchargée et référencée dans le manifeste ; pour
l'afficher ailleurs, on ajoute `data-asset="ton-etiquette"` à l'endroit voulu.

## Réglage initial (une seule fois)

La page Notion est privée : le script a besoin d'un **jeton d'intégration Notion**.

1. Va sur https://www.notion.so/my-integrations → **New integration** (interne),
   nomme-la p. ex. « DSDC site », copie le **jeton secret** (`ntn_…`).
2. Ouvre la page **Assets** dans Notion → menu `•••` → **Connexions** → ajoute
   ton intégration (pour lui donner accès à la page).
3. Fournis le jeton au script via la variable d'environnement `NOTION_TOKEN` :
   - **En local** : `export NOTION_TOKEN="ntn_…"` avant de lancer la synchro.
   - **GitHub Actions** (synchro de nuit) : Settings → Secrets and variables →
     Actions → **New repository secret**, nom `NOTION_TOKEN`, valeur = le jeton ;
     puis exposer `NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}` dans le workflow.

Le `page_id` de la page Assets est déjà rempli dans `sync/config.json`.

## Lancer manuellement

```bash
export NOTION_TOKEN="ntn_…"
python3 sync/sync_all.py assets
```

Le script écrit les images dans `images/assets/` et le manifeste
`assets/data/assets-manifest.js`. Rien à éditer à la main.
