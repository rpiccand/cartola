'use client'

import {
  appliquerReponse,
  ETAT_INITIAL,
  type EtatCarteApprenant,
  type LangueContenu,
} from '@/domaine'
import { JEUX_DEMO } from './demonstration'

/**
 * Persistance locale.
 *
 * Cette vitrine n'a **pas de serveur, pas de base, pas de compte**. Tout vit
 * dans le `localStorage` du navigateur. Ce n'est pas une simplification
 * paresseuse, c'est une propriété : une vitrine sans stockage distant ne peut
 * pas fuiter de données d'élève, et se déploie sans le moindre secret.
 *
 * Le prototype, lui, persiste côté serveur en PostgreSQL auto-hébergé en
 * Suisse. La forme des données ci-dessous est délibérément proche du schéma
 * réel pour que la reprise soit mécanique — à ceci près que le journal de
 * révision complet (durée, état avant/après, cohorte) n'est pas tenu ici.
 */

const CLE = 'cartula.vitrine.v1'

export interface CarteLocale {
  readonly id: string
  readonly recto: string
  readonly verso: string
  readonly alternatives: readonly string[]
}

export interface JeuLocal {
  readonly id: string
  readonly titre: string
  readonly matiere?: string
  readonly langueRecto: LangueContenu
  readonly langueVerso: LangueContenu
  readonly cartes: readonly CarteLocale[]
  readonly creeLe: string
  readonly demonstration: boolean
}

export interface Etat {
  readonly version: 1
  readonly jeux: readonly JeuLocal[]
  /** jeuId → carteId → état de maîtrise. */
  readonly progression: Record<string, Record<string, EtatCarteApprenant>>
  /** jeuId → meilleur temps du mode association, en millisecondes. */
  readonly meilleursTemps: Record<string, number>
  /** jeuId → meilleur score du mode blast, en points. */
  readonly meilleursScores: Record<string, number>
}

const VIDE: Etat = { version: 1, jeux: [], progression: {}, meilleursTemps: {}, meilleursScores: {} }

function jeuxDemoLocaux(): JeuLocal[] {
  return JEUX_DEMO.map((j) => ({
    id: j.id,
    titre: j.titre,
    matiere: j.matiere,
    langueRecto: j.langueRecto,
    langueVerso: j.langueVerso,
    demonstration: true,
    creeLe: '2026-01-01T00:00:00.000Z',
    cartes: j.cartes.map((c, i) => ({
      id: `${j.id}-${i + 1}`,
      recto: c.recto,
      verso: c.verso,
      alternatives: c.alternatives ?? [],
    })),
  }))
}

function disponible(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage != null
  } catch {
    // Safari en navigation privée sur iOS 16 lève sur l'accès lui-même.
    return false
  }
}

export function lire(): Etat {
  if (!disponible()) return { ...VIDE, jeux: jeuxDemoLocaux() }
  try {
    const brut = window.localStorage.getItem(CLE)
    if (brut === null) {
      const initial: Etat = { ...VIDE, jeux: jeuxDemoLocaux() }
      ecrire(initial)
      return initial
    }
    const lu = JSON.parse(brut) as Partial<Etat>
    return {
      version: 1,
      jeux: Array.isArray(lu.jeux) ? lu.jeux : jeuxDemoLocaux(),
      progression: lu.progression ?? {},
      meilleursTemps: lu.meilleursTemps ?? {},
      // Absent des états écrits avant le mode blast : un `??` suffit, la
      // version du format n'a pas besoin de bouger pour un champ additif.
      meilleursScores: lu.meilleursScores ?? {},
    }
  } catch {
    // Un stockage corrompu ne doit jamais empêcher la page de s'afficher.
    return { ...VIDE, jeux: jeuxDemoLocaux() }
  }
}

export function ecrire(etat: Etat): void {
  if (!disponible()) return
  try {
    window.localStorage.setItem(CLE, JSON.stringify(etat))
  } catch {
    // Quota dépassé : on perd la persistance, pas la session en cours.
  }
}

export function listerJeux(): readonly JeuLocal[] {
  return lire().jeux
}

export function obtenirJeu(id: string): JeuLocal | undefined {
  return lire().jeux.find((j) => j.id === id)
}

export function ajouterJeu(jeu: Omit<JeuLocal, 'id' | 'creeLe' | 'demonstration'>): JeuLocal {
  const etat = lire()
  const cree: JeuLocal = {
    ...jeu,
    id: `jeu-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    creeLe: new Date().toISOString(),
    demonstration: false,
  }
  ecrire({ ...etat, jeux: [cree, ...etat.jeux] })
  return cree
}

export function supprimerJeu(id: string): void {
  const etat = lire()
  const progression = { ...etat.progression }
  const meilleursTemps = { ...etat.meilleursTemps }
  const meilleursScores = { ...etat.meilleursScores }
  delete progression[id]
  delete meilleursTemps[id]
  delete meilleursScores[id]
  ecrire({
    ...etat,
    jeux: etat.jeux.filter((j) => j.id !== id),
    progression,
    meilleursTemps,
    meilleursScores,
  })
}

export function progressionDe(jeuId: string): Record<string, EtatCarteApprenant> {
  return lire().progression[jeuId] ?? {}
}

export function etatCarte(jeuId: string, carteId: string): EtatCarteApprenant {
  return progressionDe(jeuId)[carteId] ?? ETAT_INITIAL
}

/**
 * Enregistre une réponse et fait progresser l'état de maîtrise.
 *
 * `rappelLibre` n'est pas un détail : reconnaître une bonne réponse parmi
 * quatre ne prouve pas qu'on s'en souvient. La règle du palier A n'accorde la
 * maîtrise qu'après deux rappels libres corrects consécutifs — c'est
 * `appliquerReponse` du domaine qui la porte, pas cette couche.
 */
export function enregistrerReponse(
  jeuId: string,
  carteId: string,
  correct: boolean,
  rappelLibre: boolean,
): EtatCarteApprenant {
  const etat = lire()
  const duJeu = etat.progression[jeuId] ?? {}
  const avant = duJeu[carteId] ?? ETAT_INITIAL
  const apres = appliquerReponse(avant, correct, rappelLibre)
  ecrire({
    ...etat,
    progression: { ...etat.progression, [jeuId]: { ...duJeu, [carteId]: apres } },
  })
  return apres
}

export function reinitialiserProgression(jeuId: string): void {
  const etat = lire()
  const progression = { ...etat.progression }
  delete progression[jeuId]
  ecrire({ ...etat, progression })
}

export function meilleurTemps(jeuId: string): number | undefined {
  return lire().meilleursTemps[jeuId]
}

export function enregistrerTemps(jeuId: string, ms: number): void {
  const etat = lire()
  const actuel = etat.meilleursTemps[jeuId]
  if (actuel !== undefined && actuel <= ms) return
  ecrire({ ...etat, meilleursTemps: { ...etat.meilleursTemps, [jeuId]: ms } })
}

export function meilleurScore(jeuId: string): number | undefined {
  return lire().meilleursScores[jeuId]
}

export function enregistrerScore(jeuId: string, points: number): void {
  const etat = lire()
  const actuel = etat.meilleursScores[jeuId]
  if (actuel !== undefined && actuel >= points) return
  ecrire({ ...etat, meilleursScores: { ...etat.meilleursScores, [jeuId]: points } })
}

export interface Compteurs {
  readonly total: number
  readonly maitrise: number
  readonly enCours: number
  readonly nonCommence: number
}

export function compter(jeu: JeuLocal): Compteurs {
  const progression = progressionDe(jeu.id)
  let maitrise = 0
  let enCours = 0
  for (const carte of jeu.cartes) {
    const e = progression[carte.id]?.etat ?? 'non_commence'
    if (e === 'maitrise') maitrise += 1
    else if (e === 'en_cours') enCours += 1
  }
  return {
    total: jeu.cartes.length,
    maitrise,
    enCours,
    nonCommence: jeu.cartes.length - maitrise - enCours,
  }
}
