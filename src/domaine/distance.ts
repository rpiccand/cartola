/**
 * Distance de Damerau-Levenshtein (variante « distance d'édition restreinte »,
 * dite d'Optimal String Alignment).
 *
 * Implémentée ici plutôt qu'importée, pour trois raisons :
 * — le paquet reste sans dépendance et ses tests s'exécutent partout ;
 * — la variante OSA suffit et est plus rapide que la variante non restreinte ;
 * — les transpositions comptent, parce qu'inverser deux lettres est
 *   l'erreur d'orthographe la plus fréquente en apprentissage de vocabulaire.
 */
export function distanceEdition(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const A = Array.from(a)
  const B = Array.from(b)
  const n = A.length
  const m = B.length

  let avantPrecedent = new Array<number>(m + 1).fill(0)
  let precedent = new Array<number>(m + 1)
  let courant = new Array<number>(m + 1)

  for (let j = 0; j <= m; j++) precedent[j] = j

  for (let i = 1; i <= n; i++) {
    courant[0] = i
    for (let j = 1; j <= m; j++) {
      const cout = A[i - 1] === B[j - 1] ? 0 : 1
      let valeur = Math.min(
        courant[j - 1] + 1, // insertion
        precedent[j] + 1, // suppression
        precedent[j - 1] + cout, // substitution
      )
      if (i > 1 && j > 1 && A[i - 1] === B[j - 2] && A[i - 2] === B[j - 1]) {
        valeur = Math.min(valeur, avantPrecedent[j - 2] + 1) // transposition
      }
      courant[j] = valeur
    }
    avantPrecedent = precedent
    precedent = courant
    courant = new Array<number>(m + 1)
  }

  return precedent[m]
}

/**
 * Nombre de fautes tolérées pour une réponse attendue de longueur donnée.
 *
 * Le cahier des charges parle d'une distance normalisée ≤ 0,2, soit environ
 * une faute pour cinq caractères. Appliqué littéralement, cela donnerait zéro
 * tolérance en dessous de cinq caractères — un « der » saisi « dre » serait
 * refusé, ce qui est absurde. On accorde donc une faute dès quatre caractères.
 *
 * En dessous de quatre caractères, aucune tolérance : sur des mots aussi
 * courts, une lettre change le mot (« il » / « el », « der » / « den »).
 */
export function fautesTolerees(longueurAttendue: number): number {
  if (longueurAttendue < 4) return 0
  return Math.max(1, Math.floor(longueurAttendue * 0.2))
}
