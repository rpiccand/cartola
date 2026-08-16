/**
 * Point d'entrée du domaine.
 *
 * ⚠️ Les fichiers de ce dossier sont RECOPIÉS depuis le dépôt principal par
 * `scripts/sync-domaine.mjs`. Ne les éditez pas ici : la modification serait
 * perdue à la prochaine synchronisation, et la vitrine cesserait de prouver
 * quoi que ce soit sur le vrai moteur.
 */
export * from './langues'
export * from './entites'
export * from './regles'
export * from './code-acces'
export * from './corriger'
export * from './normalisation'
export * from './distance'
export * from './differentiel'
export * from './detection'
export * from './importer'
export * from './journal'
export * from './planification'
export { CAS_REFERENCE, type CasReference } from './cas'
