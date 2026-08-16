import type { Compteurs } from '@/donnees/stockage'

/**
 * Barre de progression. La largeur porte l'information, la couleur la
 * redouble — jamais l'inverse : le `title` et le `aria-label` disent la même
 * chose en toutes lettres.
 */
export function Jauge({ compteurs }: { compteurs: Compteurs }) {
  const { total, maitrise, enCours } = compteurs
  const pc = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))
  return (
    <div
      className="jauge"
      role="img"
      aria-label={`${maitrise} / ${total}`}
      title={`${maitrise} / ${total}`}
    >
      <div className="jauge-maitrise" style={{ width: `${pc(maitrise)}%` }} />
      <div className="jauge-en-cours" style={{ width: `${pc(enCours)}%` }} />
    </div>
  )
}
