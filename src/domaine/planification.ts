import type { EtatMaitrise, Identifiant } from './entites'
import type { NoteRevision } from './journal'

/**
 * Interface de planification, indépendante du moteur.
 *
 * Le palier A utilise `PlanificateurSimple` (règle de maîtrise à deux succès
 * consécutifs, EF-P.86). Le palier B branche ts-fsrs derrière la MÊME
 * interface, sans reprise des données : les états ne changent pas, seule la
 * planification apparaît.
 *
 * C'est ce découplage qui permet de livrer le palier A sans attendre FSRS,
 * puis de basculer sans réécrire les appelants.
 */
export interface EtatPlanification {
  readonly carteId: Identifiant
  readonly etat: EtatMaitrise
  readonly succesConsecutifs: number
  readonly stabilite: number | null
  readonly difficulte: number | null
  readonly echeance: Date | null
  readonly revisions: number
}

export interface Planificateur {
  readonly nom: string
  etatInitial(carteId: Identifiant): EtatPlanification
  appliquer(
    etat: EtatPlanification,
    note: NoteRevision,
    maintenant: Date,
    rappelLibre: boolean,
  ): EtatPlanification
  /** Cartes échues à la date donnée, triées de la plus en retard à la moins. */
  fileDuJour(
    etats: readonly EtatPlanification[],
    maintenant: Date,
    plafond: number,
  ): readonly EtatPlanification[]
}

const SUCCES_CONSECUTIFS_POUR_MAITRISE = 2

/** Intervalles du palier A, en jours. Volontairement grossiers et lisibles. */
const INTERVALLES_JOURS = [0, 1, 3, 7, 16, 35]

const JOUR_MS = 86_400_000

/**
 * Planificateur du palier A.
 *
 * Pas de modèle, pas de paramètre à entraîner : une progression d'intervalles
 * fixes et une règle de maîtrise explicable en une phrase à un enseignant.
 * Il produit néanmoins un journal complet, ce qui permettra d'entraîner FSRS
 * sur les données du pilote.
 */
export class PlanificateurSimple implements Planificateur {
  readonly nom = 'simple'

  etatInitial(carteId: Identifiant): EtatPlanification {
    return {
      carteId,
      etat: 'non_commence',
      succesConsecutifs: 0,
      stabilite: null,
      difficulte: null,
      echeance: null,
      revisions: 0,
    }
  }

  appliquer(
    etat: EtatPlanification,
    note: NoteRevision,
    maintenant: Date,
    rappelLibre: boolean,
  ): EtatPlanification {
    const correct = note >= 3
    const revisions = etat.revisions + 1

    if (!correct) {
      return {
        ...etat,
        etat: 'en_cours',
        succesConsecutifs: 0,
        echeance: new Date(maintenant.getTime() + INTERVALLES_JOURS[1] * JOUR_MS),
        revisions,
      }
    }

    // Reconnaître n'est pas se souvenir : un choix multiple réussi fait
    // progresser mais ne suffit jamais à déclarer une carte maîtrisée.
    const succes = rappelLibre ? etat.succesConsecutifs + 1 : etat.succesConsecutifs
    const palier = Math.min(succes + 1, INTERVALLES_JOURS.length - 1)

    return {
      ...etat,
      etat: succes >= SUCCES_CONSECUTIFS_POUR_MAITRISE ? 'maitrise' : 'en_cours',
      succesConsecutifs: succes,
      echeance: new Date(maintenant.getTime() + INTERVALLES_JOURS[palier] * JOUR_MS),
      revisions,
    }
  }

  fileDuJour(
    etats: readonly EtatPlanification[],
    maintenant: Date,
    plafond: number,
  ): readonly EtatPlanification[] {
    return etats
      .filter((e) => e.echeance !== null && e.echeance.getTime() <= maintenant.getTime())
      .sort((a, b) => (a.echeance?.getTime() ?? 0) - (b.echeance?.getTime() ?? 0))
      .slice(0, plafond)
  }
}

/**
 * Palier B — à implémenter en branchant `ts-fsrs` derrière cette même interface.
 *
 * Points d'attention consignés d'avance :
 * — `ts-fsrs` expose `stability` et `difficulty` : les mapper sur les champs
 *   du même nom, qui existent déjà dans `EtatPlanification` ET dans le journal ;
 * — la conversion de fuseau horaire est une source d'erreurs connue : tout
 *   stocker en UTC, n'appliquer `Europe/Zurich` qu'à l'affichage ;
 * — ne pas réimplémenter FSRS : `ts-fsrs` est publié par l'organisation qui
 *   développe FSRS pour Anki.
 */
export const PLANIFICATEUR_PALIER_B_A_FAIRE = 'ts-fsrs' as const
