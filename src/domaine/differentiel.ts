/** Un segment du différentiel affiché à l'élève. */
export interface Segment {
  readonly type: 'identique' | 'ajoute' | 'retire'
  readonly valeur: string
}

/**
 * Différentiel caractère par caractère entre la saisie et la réponse attendue,
 * pour l'affichage exigé par EF-P.94.
 *
 * Algorithme : plus longue sous-séquence commune, puis remontée. Suffisant
 * pour des chaînes de quelques dizaines de caractères, ce qui est le cas ici
 * (une face de carte, pas un paragraphe). Implémenté sans dépendance pour que
 * le paquet reste testable sans installation.
 *
 * L'orientation est « de la saisie vers l'attendu » : `retire` marque ce que
 * l'élève a écrit en trop, `ajoute` ce qui lui manque.
 */
export function differentiel(saisie: string, attendu: string): Segment[] {
  const A = Array.from(saisie)
  const B = Array.from(attendu)
  const n = A.length
  const m = B.length

  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = A[i] === B[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const segments: Segment[] = []
  const pousser = (type: Segment['type'], caractere: string): void => {
    const dernier = segments[segments.length - 1]
    if (dernier && dernier.type === type) {
      segments[segments.length - 1] = { type, valeur: dernier.valeur + caractere }
    } else {
      segments.push({ type, valeur: caractere })
    }
  }

  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      pousser('identique', A[i])
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      pousser('retire', A[i])
      i++
    } else {
      pousser('ajoute', B[j])
      j++
    }
  }
  while (i < n) pousser('retire', A[i++])
  while (j < m) pousser('ajoute', B[j++])

  return segments
}
