/**
 * Mélange de Fisher–Yates.
 *
 * Toujours appelé depuis un effet côté client : appelé pendant le rendu, il
 * ferait diverger le rendu serveur et le rendu navigateur.
 */
export function melanger<T>(source: readonly T[]): T[] {
  const t = [...source]
  for (let i = t.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const x = t[i] as T
    t[i] = t[j] as T
    t[j] = x
  }
  return t
}
