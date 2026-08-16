import type { CodeAcces } from './entites'

/**
 * Alphabet des codes d'accès de classe et de session.
 *
 * Retirés volontairement, parce qu'ils se confondent deux à deux :
 * 0/O/Q, 1/I/L, 2/Z, 5/S, 8/B, U/V.
 *
 * Un code est lu à voix haute par l'enseignant, recopié depuis le fond de la
 * salle et saisi sur un clavier de téléphone par des élèves de douze ans.
 * Chaque confusion possible est une main levée et trente secondes perdues —
 * or l'hypothèse H2 se mesure en minutes.
 *
 * Le parti pris est de supprimer l'ambiguïté à la SOURCE plutôt que de
 * deviner l'intention à la saisie : une correction automatique qui se trompe
 * envoie l'élève dans une autre classe, ce qui est pire que de lui redemander
 * le code.
 */
const ALPHABET = 'ACDEFGHJKMNPRTWXY3467'
const LONGUEUR = 6

/**
 * Substitutions appliquées à la saisie. Uniquement les cas où le caractère
 * saisi n'appartient PAS à l'alphabet et n'a qu'un seul sosie qui, lui, en
 * fait partie. Aucune ambiguïté possible, donc aucun risque d'erreur.
 */
const SOSIES: Record<string, string> = {
  I: 'J',
  L: 'J',
  '1': 'J',
  '0': 'D',
  O: 'D',
  Q: 'D',
  S: '3',
  '5': '3',
  Z: '3',
  '2': '3',
  B: '6',
  '8': '6',
  U: 'W',
  V: 'W',
}

/** Génère un code d'accès. `aleatoire` est injecté pour rendre les tests déterministes. */
export function genererCodeAcces(aleatoire: () => number = Math.random): CodeAcces {
  let code = ''
  for (let i = 0; i < LONGUEUR; i++) {
    code += ALPHABET[Math.floor(aleatoire() * ALPHABET.length)]
  }
  return code as CodeAcces
}

/** Normalise une saisie : majuscules, séparateurs retirés, sosies rattrapés. */
export function normaliserCodeAcces(saisie: string): string {
  return Array.from(saisie.toUpperCase().replace(/[\s\-_.]/gu, ''))
    .map((caractere) => SOSIES[caractere] ?? caractere)
    .join('')
}

export function estCodeAccesValide(saisie: string): boolean {
  const normalise = normaliserCodeAcces(saisie)
  if (normalise.length !== LONGUEUR) return false
  return Array.from(normalise).every((caractere) => ALPHABET.includes(caractere))
}

export const CODE_ACCES = { ALPHABET, LONGUEUR, SOSIES } as const
