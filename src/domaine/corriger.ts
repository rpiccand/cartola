import type { LangueContenu } from './langues'
import { distanceEdition, fautesTolerees } from './distance'
import { differentiel, type Segment } from './differentiel'
import { normaliser, type NiveauCorrection } from './normalisation'

export type { NiveauCorrection, Segment }

/**
 * Langues pour lesquelles le niveau tolérant est disponible.
 *
 * Ailleurs — écritures non latines, contenus numériques ou symboliques —
 * seul le niveau strict s'applique : une tolérance de distance d'édition
 * sur une formule chimique ou un idéogramme n'aurait aucun sens. Voir EF-P.95.
 */
const LANGUES_TOLERANTES: readonly LangueContenu[] = ['fr', 'de', 'it']

/** Séparateurs reconnus dans une réponse attendue contenant plusieurs éléments. */
const SEPARATEURS_MULTIPLES = /[,;/]/u

export interface OptionsCorrection {
  readonly niveau: NiveauCorrection
  readonly langue: LangueContenu
  /**
   * Réponses alternatives déclarées par l'enseignant (EF-P.34), acceptées
   * à égalité avec la réponse principale, quel que soit le niveau.
   */
  readonly reponsesAlternatives?: readonly string[]
  /**
   * Quand la réponse attendue contient plusieurs éléments séparés :
   * — `une` : un seul élément correct suffit ;
   * — `toutes` : tous les éléments sont exigés.
   * Voir EF-P.93.
   */
  readonly reponsesMultiples?: 'une' | 'toutes'
}

export type MotifVerdict =
  | 'exact'
  | 'normalise'
  | 'alternative'
  | 'tolerance'
  | 'multiple'
  | 'vide'
  | 'incorrect'

export interface Verdict {
  readonly correct: boolean
  readonly motif: MotifVerdict
  /** Distance d'édition à la meilleure correspondance, après normalisation. */
  readonly distance: number
  /** Nombre de fautes qui auraient été tolérées pour cette réponse. */
  readonly toleranceAppliquee: number
  /** Niveau réellement appliqué — peut différer du niveau demandé (EF-P.95). */
  readonly niveauApplique: NiveauCorrection
  /** Différentiel affichable, toujours calculé contre la réponse principale. */
  readonly differentiel: readonly Segment[]
}

interface Candidat {
  readonly brut: string
  readonly normalise: string
}

function preparerCandidats(
  attendu: string,
  options: OptionsCorrection,
  niveau: NiveauCorrection,
): Candidat[] {
  const bruts = [attendu, ...(options.reponsesAlternatives ?? [])]
  return bruts
    .map((brut) => ({ brut, normalise: normaliser(brut, { niveau, langue: options.langue }) }))
    .filter((c) => c.normalise.length > 0)
}

function decouperMultiples(texte: string): string[] {
  return texte
    .split(SEPARATEURS_MULTIPLES)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * Corrige une réponse libre.
 *
 * Le comportement est entièrement déterministe : mêmes entrées, même verdict,
 * toujours. C'est ce qui permet de le spécifier par un jeu de cas de référence
 * (voir `reference/cas.ts`) et de l'expliquer à un enseignant.
 */
export function corriger(saisie: string, attendu: string, options: OptionsCorrection): Verdict {
  const niveauApplique: NiveauCorrection =
    options.niveau === 'tolerant' && LANGUES_TOLERANTES.includes(options.langue)
      ? 'tolerant'
      : 'strict'

  const saisieNormalisee = normaliser(saisie, { niveau: niveauApplique, langue: options.langue })
  const candidats = preparerCandidats(attendu, options, niveauApplique)
  const principal = candidats[0]?.normalise ?? ''
  const diff = differentiel(saisieNormalisee, principal)

  if (saisieNormalisee.length === 0) {
    return {
      correct: false,
      motif: 'vide',
      distance: principal.length,
      toleranceAppliquee: 0,
      niveauApplique,
      differentiel: diff,
    }
  }

  // Réponse attendue à plusieurs éléments : traitée avant tout le reste,
  // parce que la comparaison ne porte alors pas sur la chaîne entière.
  const elementsAttendus = decouperMultiples(attendu)
  if (options.reponsesMultiples && elementsAttendus.length > 1) {
    const verdict = corrigerMultiples(
      saisie,
      elementsAttendus,
      options,
      niveauApplique,
      options.reponsesMultiples,
    )
    return { ...verdict, differentiel: diff }
  }

  if (saisie.trim() === attendu.trim()) {
    return {
      correct: true,
      motif: 'exact',
      distance: 0,
      toleranceAppliquee: fautesTolerees(principal.length),
      niveauApplique,
      differentiel: diff,
    }
  }

  let meilleureDistance = Number.POSITIVE_INFINITY
  let indexMeilleur = -1
  for (const [index, candidat] of candidats.entries()) {
    const d = distanceEdition(saisieNormalisee, candidat.normalise)
    if (d < meilleureDistance) {
      meilleureDistance = d
      indexMeilleur = index
    }
  }

  const tolerance =
    niveauApplique === 'tolerant' ? fautesTolerees(candidats[indexMeilleur]?.normalise.length ?? 0) : 0

  if (meilleureDistance === 0) {
    return {
      correct: true,
      motif: indexMeilleur === 0 ? 'normalise' : 'alternative',
      distance: 0,
      toleranceAppliquee: tolerance,
      niveauApplique,
      differentiel: diff,
    }
  }

  if (meilleureDistance <= tolerance) {
    return {
      correct: true,
      motif: 'tolerance',
      distance: meilleureDistance,
      toleranceAppliquee: tolerance,
      niveauApplique,
      differentiel: diff,
    }
  }

  return {
    correct: false,
    motif: 'incorrect',
    distance: meilleureDistance,
    toleranceAppliquee: tolerance,
    niveauApplique,
    differentiel: diff,
  }
}

function corrigerMultiples(
  saisie: string,
  elementsAttendus: readonly string[],
  options: OptionsCorrection,
  niveau: NiveauCorrection,
  mode: 'une' | 'toutes',
): Omit<Verdict, 'differentiel'> {
  const normaliserElement = (t: string): string => normaliser(t, { niveau, langue: options.langue })
  const attendus = elementsAttendus.map(normaliserElement).filter((e) => e.length > 0)
  const saisis = decouperMultiples(saisie).map(normaliserElement).filter((e) => e.length > 0)

  const correspond = (a: string, b: string): boolean => {
    const d = distanceEdition(a, b)
    if (d === 0) return true
    return niveau === 'tolerant' && d <= fautesTolerees(b.length)
  }

  const trouves = attendus.filter((attendu) => saisis.some((s) => correspond(s, attendu)))
  const suffisant = mode === 'une' ? trouves.length >= 1 : trouves.length === attendus.length
  const manquants = attendus.length - trouves.length

  return {
    correct: suffisant,
    motif: suffisant ? 'multiple' : 'incorrect',
    distance: manquants,
    toleranceAppliquee: 0,
    niveauApplique: niveau,
  }
}
