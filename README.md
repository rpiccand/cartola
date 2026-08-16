# cartula — vitrine de prototypage

Application web autonome, déployable sur Vercel en quelques minutes, qui fait
tourner **le vrai moteur** du prototype `cartula` dans un navigateur.

> `cartula` est un **nom de code**.

---

## Ce que c'est — et ce que ce n'est pas

Cette vitrine est **jetable**. Elle sert à montrer, à des enseignants et à des
directions d'établissement, ce que fait le produit — sans attendre
l'hébergement suisse, sans base de données, sans compte, sans secret.

Ce n'est **pas** le prototype. Le prototype est le dépôt `cartula` : monorepo
pnpm, PostgreSQL 18 auto-hébergé en Suisse, authentification, sessions
collectives, synthèse vocale pré-générée. Voir `docs/cahier-des-charges-prototype.md`.

**Ce qui est authentique ici**, parce que recopié tel quel depuis le dépôt
principal par `scripts/sync-domaine.mjs` :

| Ce qu'on démontre | D'où ça vient |
|---|---|
| Le correcteur déterministe (tolérance, ligatures, `ß` suisse, articles, réponses multiples) | `packages/grading` |
| **Les 125 cas de référence, exécutés dans la page** | `packages/grading/src/reference/cas.ts` |
| La détection de format et la reprise d'un export Quizlet, avec rejets motivés | `packages/import` |
| La règle de maîtrise (deux rappels libres corrects consécutifs) | `packages/domain/src/regles.ts` |
| Les seuils de gestion (manche de 7, grille de 6 paires, pénalité de 1 s) | `packages/domain/src/regles.ts` |
| La cible navigateur, testable sur l'appareil de l'élève | page **Appareil** |

**Ce qui est absent, et pourquoi.**

| Absent | Raison |
|---|---|
| Base de données, comptes, authentification | Rien à héberger, rien à sécuriser, aucun secret à déployer. Tout vit dans le `localStorage`. |
| Sessions collectives temps réel | Vercel n'entretient pas de connexion WebSocket durable. C'est précisément pourquoi le prototype a besoin d'une machine dès la troisième semaine. |
| **Synthèse vocale** | Le prototype pré-génère l'audio côté serveur avec Piper. L'API `speechSynthesis` du navigateur est absente des navigateurs intégrés d'Android et bascule silencieusement en anglais sur Chrome : un audio de mauvaise qualité donnerait une fausse idée du produit. Une note visible le dit à l'écran. |
| Tailwind 4 | Une feuille CSS écrite à la main rend la cible navigateur vérifiable à l'œil, sans chaîne de compilation. |
| `next-intl` | Un objet TypeScript typé suffit ici. La structure est identique, la migration sera mécanique. |
| Espace enseignant, classes, devoirs | Hors du scénario de démonstration du §2. |

---

## Déployer sur Vercel

1. Créer un dépôt GitHub et y pousser ce dossier.
2. Sur Vercel : **Add New → Project → Import** le dépôt.
3. Ne rien configurer. Pas de variable d'environnement, pas de commande de
   build personnalisée, pas de base à provisionner. Next.js est détecté.
4. **Deploy.**

Il n'y a **aucun secret à saisir**, pour une raison de fond : cette
application n'en a pas.

### Ce que Vercel voit passer

Rien qui vienne d'un élève. Aucun contenu saisi ne quitte le navigateur : ni
les jeux créés, ni les réponses, ni la progression. Les journaux de la
plateforme contiennent des URL de pages statiques et rien d'autre.

C'est la condition qui rend ce déploiement compatible avec la règle §2.1 de
`CLAUDE.md` (« aucune donnée d'élève ne sort de Suisse ») et avec les quatre
conditions de `decisions/0009`. **La bascule vers l'hébergeur suisse a lieu
avant la signature du premier établissement pilote**, pas après.

---

## En local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # construction de production
npm run check:types
```

Node 20.9 ou plus récent.

---

## Structure

```
src/app/[langue]/          Les routes. La langue est le premier segment de l'URL,
                           donc <html lang> vit dans [langue]/layout.tsx — il n'y a
                           volontairement pas de app/layout.tsx.
src/composants/            L'interface.
src/domaine/               ⚠️ RECOPIÉ. Ne pas éditer ici.
src/donnees/               Persistance localStorage + jeux de démonstration synthétiques.
src/i18n/messages.ts       fr-CH, de-CH, it-CH.
scripts/sync-domaine.mjs   Recopie le domaine depuis le dépôt principal.
```

### Resynchroniser le domaine

```bash
node scripts/sync-domaine.mjs ../cartula
```

Le script recopie treize fichiers et réécrit les imports. **Modifier
`src/domaine/` à la main est inutile** : la modification serait perdue à la
prochaine synchronisation, et la vitrine cesserait de prouver quoi que ce soit
sur le vrai moteur.

---

## Trois contraintes tenues même ici

**Cible navigateur.** `chrome 111, edge 111, firefox 128, safari 16.4,
ios_saf 16.4` — tout appareil Apple de 2017 ou postérieur. Le `browserslist`
de `package.json` la fixe pour la compilation. La page **Appareil** la teste
sur l'appareil réel : ouvrez-la sur les plus vieux téléphones du parc.

**`de-CH` n'est pas `de-DE`.** Le caractère `ß` est proscrit de l'interface
allemande — il n'est ni sur les claviers suisses, ni enseigné dans les écoles
suisses. Il reste autorisé dans le **contenu** des cartes : le jeu de
démonstration d'allemand contient `die Straße`, et le correcteur accepte
`die Strasse`.

**Portabilité.** `output: 'standalone'` est conservé, aucun paquet `@vercel/*`,
aucun `runtime = 'edge'`, aucun `next/og`. Cette application se construit en
image Docker et se déploie ailleurs — c'est exactement ce que vérifie la porte
`check:portabilite` du dépôt principal.

---

## Licence

Propriétaire. Voir avec le responsable du projet.
