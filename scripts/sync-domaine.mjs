#!/usr/bin/env node
/**
 * Recopie les sources de domaine depuis le dépôt principal.
 *
 * La vitrine n'a pas de code métier propre : elle exécute exactement le même
 * correcteur, le même import et le même planificateur que le prototype. Sans
 * cette contrainte, la vitrine dériverait en quelques jours et ne prouverait
 * plus rien.
 *
 *   node scripts/sync-domaine.mjs ../cartula
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, basename } from 'node:path'

const SOURCE = process.argv[2] ?? '../cartula'
const DEST = 'src/domaine'

const FICHIERS = [
  'packages/domain/src/langues.ts',
  'packages/domain/src/entites.ts',
  'packages/domain/src/regles.ts',
  'packages/domain/src/code-acces.ts',
  'packages/grading/src/normalisation.ts',
  'packages/grading/src/distance.ts',
  'packages/grading/src/differentiel.ts',
  'packages/grading/src/corriger.ts',
  'packages/grading/src/reference/cas.ts',
  'packages/import/src/detection.ts',
  'packages/import/src/importer.ts',
  'packages/srs/src/journal.ts',
  'packages/srs/src/planification.ts',
]

await mkdir(DEST, { recursive: true })
for (const chemin of FICHIERS) {
  const contenu = await readFile(join(SOURCE, chemin), 'utf8')
  // Les paquets sont à plat ici : on remet les imports au même niveau et on
  // retire les extensions .ts, que le bundler ne veut pas voir.
  const adapte = contenu
    .replace(/from\s+['"]@cartula\/domain['"]/g, "from './entites'")
    .replace(/from\s+['"]\.\.\/([^'"]+)\.ts['"]/g, "from './$1'")
    .replace(/from\s+['"]\.\/([^'"]+)\.ts['"]/g, "from './$1'")
  await writeFile(join(DEST, basename(chemin)), adapte)
}
console.log(`${FICHIERS.length} fichiers de domaine synchronisés depuis ${SOURCE}`)
