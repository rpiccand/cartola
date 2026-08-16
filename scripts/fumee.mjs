#!/usr/bin/env node
/**
 * Test de fumée de la vitrine.
 *
 * Quinze vérifications sur l'application réellement servie, pas sur le code.
 * Ce que ce script protège, ce sont les promesses que la vitrine fait à un
 * enseignant : le jeu de référence s'exécute vraiment dans la page, l'import
 * n'écarte rien en silence, deux rappels libres corrects mènent à la maîtrise,
 * et l'interface allemande ne contient pas de `ß`.
 *
 * Playwright n'est pas une dépendance du projet — la vitrine doit rester
 * installable en trente secondes. Pour lancer ce script :
 *
 *   npm run build && npm start &
 *   npm install --no-save playwright@1.56.0 && npx playwright install chromium
 *   node scripts/fumee.mjs
 *
 * Variable d'environnement : BASE (défaut http://127.0.0.1:3000).
 */
import { chromium } from 'playwright'

const B = process.env.BASE ?? 'http://127.0.0.1:3000'

const nav = await chromium.launch()
const page = await (await nav.newContext({ viewport: { width: 390, height: 844 } })).newPage()

const erreurs = []
page.on('pageerror', (e) => erreurs.push(String(e)))
page.on('console', (c) => (c.type() === 'error' ? erreurs.push(c.text()) : undefined))

let fautes = 0
const ok = (nom, condition) => {
  if (!condition) fautes += 1
  console.log(`${condition ? 'ok  ' : 'FAUX'} ${nom}`)
}

// 1 — le correcteur et son jeu de référence tournent dans la page
await page.goto(`${B}/fr-CH/correcteur`, { waitUntil: 'networkidle' })
const taux = await page.locator('.etiquette', { hasText: 'concordance' }).first().innerText()
ok(`jeu de référence exécuté : ${taux}`, taux.includes('100'))
const verdict = await page.locator('.encadre .etiquette').first().innerText()
ok(`« die Strasse » pour « die Straße » → ${verdict}`, verdict === 'Accepté')

// 2 — l'import devine le format et motive chaque rejet
await page.goto(`${B}/fr-CH/creer`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /Quizlet/ }).click()
const fmt = await page.locator('.etiquette', { hasText: 'Format détecté' }).innerText()
ok(`format deviné : ${fmt}`, fmt.includes('quizlet-tabulation'))
const reprises = await page.locator('.etiquette', { hasText: 'cartes reprises' }).innerText()
ok(`cartes reprises : ${reprises}`, reprises.startsWith('6'))
const ecartees = await page.locator('.etiquette', { hasText: 'écartées' }).innerText()
ok(`lignes écartées avec motif : ${ecartees}`, ecartees.startsWith('2'))

// 3 — enregistrement
await page.locator('#titre').fill('Test allemand')
await page.getByRole('button', { name: 'Enregistrer ce jeu' }).click()
await page.waitForURL(/\/jeu\//)
ok('jeu enregistré puis ouvert', /\/fr-CH\/jeu\/jeu-/.test(page.url()))

// 4 — une carte neuve est posée en reconnaissance, pas en rappel libre
await page.getByRole('link', { name: 'Apprentissage' }).click()
await page.waitForSelector('.tuile, #rep')
const options = await page.locator('.tuile').count()
ok(`première question en reconnaissance (${options} options)`, options === 4)

// 5 — deux rappels libres corrects consécutifs valent maîtrise, pas un seul
await page.goto(`${B}/fr-CH/jeu/demo-sciences/reviser`, { waitUntil: 'networkidle' })
for (let i = 0; i < 8; i += 1) await page.getByRole('button', { name: 'Je sais' }).click()
await page.goto(`${B}/fr-CH/jeu/demo-sciences`, { waitUntil: 'networkidle' })
ok('un seul rappel : aucune carte maîtrisée', (await page.locator('.etiquette.et-vert').count()) === 0)
await page.goto(`${B}/fr-CH/jeu/demo-sciences/reviser`, { waitUntil: 'networkidle' })
for (let i = 0; i < 8; i += 1) await page.getByRole('button', { name: 'Je sais' }).click()
await page.goto(`${B}/fr-CH/jeu/demo-sciences`, { waitUntil: 'networkidle' })
ok('deux rappels : huit cartes maîtrisées', (await page.locator('.etiquette.et-vert').count()) === 8)

// 6 — grille d'association
await page.goto(`${B}/fr-CH/jeu/demo-italien/associer`, { waitUntil: 'networkidle' })
ok('grille de six paires', (await page.locator('.tuile').count()) === 12)

// 7 — test d'appareil
await page.goto(`${B}/fr-CH/appareil`, { waitUntil: 'networkidle' })
const cible = await page.locator('.encadre p').first().innerText()
ok(`appareil : ${cible}`, cible.includes('dans la cible'))

// 8 — la bascule de langue conserve la page, et de-CH n'a pas de ß
await page.goto(`${B}/fr-CH/correcteur`, { waitUntil: 'networkidle' })
await page.locator('.langues a', { hasText: 'de' }).click()
await page.waitForURL(/de-CH\/correcteur/)
ok('bascule de langue sans perdre la page', page.url().endsWith('/de-CH/correcteur'))
ok('attribut lang correct', (await page.locator('html').getAttribute('lang')) === 'de-CH')
const texteDe = await page.locator('body').innerText()
ok('aucun ß dans l’interface de-CH', !texteDe.includes('ß'))

ok(`aucune erreur de console (${erreurs.length})`, erreurs.length === 0)
if (erreurs.length > 0) console.error(erreurs.slice(0, 5))

await nav.close()
process.exit(fautes > 0 ? 1 : 0)
