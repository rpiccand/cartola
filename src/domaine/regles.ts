import type { EtatMaitrise } from './entites'

/**
 * Règles de gestion transverses, issues du §3.3 du cahier des charges complet
 * et du §4 du cahier des charges du prototype.
 *
 * Rassemblées ici pour qu'un seuil ne soit jamais codé en dur au fond d'un
 * composant, où personne ne le retrouvera au moment de le justifier à un
 * enseignant.
 */
export const REGLES = {
  /** RG-00.01 — un jeu publié contient au minimum deux cartes. */
  CARTES_MINIMUM_PUBLICATION: 2,
  /** EF-P.51 / EF-P.13 — minimum requis pour une session collective ou le mode association. */
  CARTES_MINIMUM_SESSION_LIVE: 6,
  /** EF-P.13 — taille d'une grille d'association. */
  PAIRES_PAR_GRILLE_ASSOCIATION: 6,
  /** EF-P.13 — pénalité de temps par erreur, en millisecondes. */
  PENALITE_ASSOCIATION_MS: 1000,
  /** EF-P.12 — taille d'une manche d'apprentissage adaptatif. */
  ITEMS_PAR_MANCHE: 7,
  /**
   * Mode blast (arcade). Ces neuf seuils sont nés de la vitrine et n'ont pas
   * encore de numéro d'exigence : ils doivent être portés au cahier des
   * charges, et à `packages/domain/src/regles.ts` du dépôt principal, avant la
   * prochaine exécution de `scripts/sync-domaine.mjs` — sans quoi ils seront
   * écrasés et le mode blast cessera de compiler.
   */
  /** Bulles présentes dans l'arène. Une seule répond à la question posée. */
  BLAST_BULLES: 5,
  /** Cartes minimum pour lancer une partie : il en faut une par bulle. */
  CARTES_MINIMUM_BLAST: 5,
  /** Durée d'une série, en millisecondes. Le chronomètre borne la partie. */
  BLAST_DUREE_SERIE_MS: 20000,
  /** Vies d'une partie. */
  BLAST_VIES: 3,
  /** Vitesse d'une bulle au niveau 1, en pixels par seconde. */
  BLAST_VITESSE_INITIALE_PX_S: 34,
  /** Ajouté à la vitesse des bulles à chaque niveau franchi. */
  BLAST_ACCELERATION_PX_S: 10,
  /** Plafond de vitesse : au-delà, viser relève du hasard et non de la mémoire. */
  BLAST_VITESSE_MAXIMUM_PX_S: 110,
  /** Bonnes réponses pour franchir un niveau. */
  BLAST_CARTES_PAR_NIVEAU: 5,
  /** Points d'une bulle touchée juste, multipliés par le niveau courant. */
  BLAST_POINTS_PAR_CARTE: 10,
  /** ET-P.13 — participants simultanés soutenus par une session collective. */
  PARTICIPANTS_MAX_SESSION_LIVE: 35,
  /** EF-P.05 — un participant peut appartenir à plusieurs classes. */
  CLASSES_MAX_PAR_PARTICIPANT: 20,
  /** RG-00.03 — durée de rétention en corbeille avant effacement définitif. */
  CORBEILLE_JOURS: 30,
  /** ET-P.35 — suppression des données pilotes après la fin de l'expérimentation. */
  RETENTION_PILOTE_JOURS: 90,
} as const

/**
 * Règle de maîtrise du palier A, en attendant la répétition espacée (EF-P.86).
 *
 * Une carte passe « en cours » à la première réponse et « maîtrisée » après
 * deux réponses correctes consécutives EN RAPPEL LIBRE — un choix multiple
 * réussi ne suffit pas, parce que reconnaître n'est pas se souvenir.
 * Une erreur la ramène « en cours ».
 *
 * Cette règle est remplacée par le moteur FSRS au palier B, sans reprise des
 * données : les états restent les mêmes, seule la planification change.
 */
export const SUCCES_CONSECUTIFS_POUR_MAITRISE = 2

export interface EtatCarteApprenant {
  readonly etat: EtatMaitrise
  readonly succesConsecutifs: number
}

export const ETAT_INITIAL: EtatCarteApprenant = { etat: 'non_commence', succesConsecutifs: 0 }

export function appliquerReponse(
  etatCourant: EtatCarteApprenant,
  correct: boolean,
  rappelLibre: boolean,
): EtatCarteApprenant {
  if (!correct) {
    return { etat: 'en_cours', succesConsecutifs: 0 }
  }
  if (!rappelLibre) {
    // Une bonne réponse en reconnaissance fait progresser sans jamais suffire
    // à la maîtrise.
    return {
      etat: etatCourant.etat === 'maitrise' ? 'maitrise' : 'en_cours',
      succesConsecutifs: etatCourant.succesConsecutifs,
    }
  }
  const succes = etatCourant.succesConsecutifs + 1
  return {
    etat: succes >= SUCCES_CONSECUTIFS_POUR_MAITRISE ? 'maitrise' : 'en_cours',
    succesConsecutifs: succes,
  }
}
