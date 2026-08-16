import type { Segment } from '@/domaine'

/**
 * Affichage du différentiel (EF-P.94).
 *
 * La couleur ne porte jamais l'information seule : ce qui manque est souligné,
 * ce qui est en trop est barré. Un élève daltonien lit la même chose.
 */
export function Differentiel({ segments }: { segments: readonly Segment[] }) {
  return (
    <span className="mono">
      {segments.map((s, i) => {
        if (s.type === 'identique') return <span key={i}>{s.valeur}</span>
        if (s.type === 'ajoute')
          return (
            <span key={i} className="diff-manquant">
              {s.valeur}
            </span>
          )
        return (
          <span key={i} className="diff-superflu">
            {s.valeur}
          </span>
        )
      })}
    </span>
  )
}
