import type { EtatMaitrise, Identifiant, ModeEtude } from './entites'

/**
 * Journal de révision.
 *
 * ⚠️ CE SCHÉMA EST IRRATTRAPABLE A POSTERIORI.
 *
 * Il alimente deux choses qu'on ne peut pas reconstituer après coup :
 * — l'entraînement des paramètres FSRS sur les données réelles du pilote,
 *   via `@open-spaced-repetition/binding` ;
 * — la mesure de l'hypothèse H7 (effet de la répétition espacée sur la
 *   rétention à J+7).
 *
 * Une session de pilote enregistrée sans `etatAvant`, `etatApres` ou `dureeMs`
 * est perdue pour ces deux usages. Ne jamais rendre ces champs optionnels,
 * ne jamais les retirer « pour simplifier ».
 */
export interface EntreeJournal {
  readonly participantId: Identifiant
  readonly carteId: Identifiant
  readonly mode: ModeEtude
  /** Note FSRS : 1 encore, 2 difficile, 3 correct, 4 facile. */
  readonly note: NoteRevision
  readonly etatAvant: EtatMaitrise
  readonly etatApres: EtatMaitrise
  /** Latence de réponse. Un item répondu en 8 s n'est pas su comme un item répondu en 1 s. */
  readonly dureeMs: number
  /** Stabilité et difficulté FSRS avant la révision, nulles pour une carte neuve. */
  readonly stabiliteAvant: number | null
  readonly difficulteAvant: number | null
  readonly horodatage: Date
  /** Cohorte d'expérimentation, pour la mesure de H7 (ET-P.57). */
  readonly cohorte: 'planning' | 'libre' | null
}

export type NoteRevision = 1 | 2 | 3 | 4

export const NOTES: Readonly<Record<'encore' | 'difficile' | 'correct' | 'facile', NoteRevision>> = {
  encore: 1,
  difficile: 2,
  correct: 3,
  facile: 4,
}

/**
 * Traduit un verdict binaire de correction en note FSRS.
 *
 * La latence sert de proxy de l'effort : une bonne réponse très rapide vaut
 * « facile », une bonne réponse laborieuse vaut « difficile ». Les seuils sont
 * volontairement grossiers — ils seront recalibrés sur les données du pilote,
 * ce qui est précisément la raison pour laquelle `dureeMs` est enregistrée.
 */
export function noteDepuisVerdict(correct: boolean, dureeMs: number): NoteRevision {
  if (!correct) return NOTES.encore
  if (dureeMs < 3000) return NOTES.facile
  if (dureeMs < 10_000) return NOTES.correct
  return NOTES.difficile
}
