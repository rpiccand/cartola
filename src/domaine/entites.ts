import type { LangueContenu, LangueInterface } from './langues'

/**
 * Entités du domaine. Types purs, sans dépendance à la base de données ni au
 * transport. Le schéma Drizzle de `packages/db` s'aligne sur ces types, pas
 * l'inverse.
 */

export type Identifiant = string

// ─────────────────────────────────────────────────────────────────────────────
// Contenu
// ─────────────────────────────────────────────────────────────────────────────

export interface Face {
  readonly texte: string
  readonly langue: LangueContenu
  readonly imageUrl?: string
  /** Fichier audio pré-généré (packages/tts). Jamais l'API du navigateur. */
  readonly audioUrl?: string
}

export interface Carte {
  readonly id: Identifiant
  readonly jeuId: Identifiant
  readonly rang: number
  readonly recto: Face
  readonly verso: Face
  /** Réponses acceptées à égalité avec le verso, déclarées par l'enseignant. */
  readonly reponsesAlternatives: readonly string[]
}

export type VisibiliteJeu = 'prive' | 'classes'

export interface Jeu {
  readonly id: Identifiant
  readonly titre: string
  readonly matiere?: string
  readonly proprietaireId: Identifiant
  readonly visibilite: VisibiliteJeu
  readonly partageEtablissement: boolean
  readonly creeLe: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// Classe et participants
// ─────────────────────────────────────────────────────────────────────────────

export type EtatClasse = 'active' | 'archivee'

export interface Classe {
  readonly id: Identifiant
  readonly nom: string
  readonly matiere?: string
  readonly niveau?: string
  readonly enseignantId: Identifiant
  readonly codeAcces: CodeAcces
  readonly etat: EtatClasse
  readonly creeLe: Date
}

/**
 * Un participant n'est PAS un compte. C'est un pseudonyme rattaché à une
 * classe et à un appareil. Aucune donnée personnelle au-delà de ce que
 * l'élève a lui-même saisi. Voir §6.6 du cahier des charges.
 */
export interface Participant {
  readonly id: Identifiant
  readonly classeId: Identifiant
  readonly pseudonyme: string
  /** Rattachement optionnel à un compte élève créé après coup (palier B). */
  readonly compteEleveId?: Identifiant
  readonly rejointLe: Date
  readonly derniereActivite?: Date
}

export interface Enseignant {
  readonly id: Identifiant
  readonly courriel: string
  readonly nomAffiche: string
  readonly langueInterface: LangueInterface
  readonly etablissementId?: Identifiant
  readonly verifieLe?: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// Étude
// ─────────────────────────────────────────────────────────────────────────────

export type ModeEtude = 'revision' | 'apprentissage' | 'association' | 'test' | 'dictee'

export type EtatMaitrise = 'non_commence' | 'en_cours' | 'maitrise'

/**
 * Une réponse enregistrée.
 *
 * ATTENTION — les champs `etatAvant`, `etatApres` et `dureeMs` alimentent
 * l'entraînement ultérieur des paramètres FSRS sur données réelles et la
 * mesure de l'hypothèse H7. Ils sont IRRATTRAPABLES a posteriori : une session
 * enregistrée sans eux est perdue. Ne jamais les rendre optionnels.
 */
export interface Reponse {
  readonly id: Identifiant
  readonly participantId: Identifiant
  readonly carteId: Identifiant
  readonly mode: ModeEtude
  readonly saisie: string
  readonly correct: boolean
  readonly niveauCorrection: 'tolerant' | 'strict'
  /** L'élève a forcé la validation via « ma réponse était correcte » (EF-P.16). */
  readonly conteste: boolean
  readonly dureeMs: number
  readonly etatAvant: EtatMaitrise
  readonly etatApres: EtatMaitrise
  readonly horodatage: Date
}

export interface Devoir {
  readonly id: Identifiant
  readonly classeId: Identifiant
  readonly jeuId: Identifiant
  readonly mode: ModeEtude
  readonly debutLe: Date
  readonly finLe: Date
  /** Pourcentage de cartes à maîtriser pour que le devoir soit réputé fait. */
  readonly objectifMaitrise: number
}

export type ModeSessionLive = 'equipes' | 'individuel' | 'formative'
export type EtatSessionLive = 'attente' | 'en_cours' | 'terminee'

export interface SessionLive {
  readonly id: Identifiant
  readonly enseignantId: Identifiant
  readonly jeuId: Identifiant
  readonly mode: ModeSessionLive
  readonly codeAcces: CodeAcces
  readonly etat: EtatSessionLive
  readonly nbQuestions: number
  readonly demarreeLe?: Date
  readonly termineeLe?: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// Code d'accès
// ─────────────────────────────────────────────────────────────────────────────

export type CodeAcces = string & { readonly __marque: 'CodeAcces' }
