'use client'

import { useEffect, useState } from 'react'
import type { LangueInterface } from '@/domaine'
import {
  consigneDe,
  nomDeLangue,
  type LangueConsigne,
} from '@/i18n/consignes'
import type { Messages } from '@/i18n/messages'
import { abonnerLangueConsigne, langueConsigne } from '@/donnees/stockage'
import type { Mode } from './Etude'

/**
 * Consigne d'un mode, dans la langue de l'interface et, si l'élève en a choisi
 * une, dans la sienne.
 *
 * Deux onglets plutôt que deux paragraphes empilés : la consigne de l'élève
 * allophone ne doit pas être reléguée sous celle de la classe, et empiler deux
 * pavés au-dessus d'une activité chronométrée mangerait tout l'écran d'un
 * téléphone.
 */
export function Consignes({
  mode,
  langue,
  messages,
}: {
  mode: Mode
  langue: LangueInterface
  messages: Messages
}) {
  const [seconde, setSeconde] = useState<LangueConsigne | undefined>(undefined)
  const [active, setActive] = useState<LangueConsigne>(langue)

  useEffect(() => {
    const relire = () => setSeconde(langueConsigne())
    relire()
    return abonnerLangueConsigne(relire)
  }, [])

  // La langue de l'élève peut être celle de l'interface : deux onglets
  // identiques n'apprendraient rien à personne.
  const langues: LangueConsigne[] =
    seconde === undefined || seconde === langue ? [langue] : [langue, seconde]

  // Si l'élève abandonne sa langue alors qu'il en lisait l'onglet, on retombe
  // sur celle de l'interface plutôt que d'afficher un panneau vide.
  const courante = langues.includes(active) ? active : langue

  return (
    <section className="consigne" aria-label={messages.consignes.titre}>
      {langues.length > 1 ? (
        <div className="consigne-onglets" role="tablist" aria-label={messages.consignes.titre}>
          {langues.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              id={`consigne-onglet-${l}`}
              aria-selected={l === courante}
              aria-controls={`consigne-panneau-${l}`}
              // Un seul onglet reste atteignable au clavier : les flèches
              // circulent entre eux, comme l'attend le motif ARIA.
              tabIndex={l === courante ? 0 : -1}
              className={l === courante ? 'consigne-onglet consigne-onglet-actif' : 'consigne-onglet'}
              lang={l}
              onClick={() => setActive(l)}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                e.preventDefault()
                const i = langues.indexOf(l)
                const pas = e.key === 'ArrowRight' ? 1 : -1
                const suivante = langues[(i + pas + langues.length) % langues.length]
                if (suivante === undefined) return
                setActive(suivante)
                document.getElementById(`consigne-onglet-${suivante}`)?.focus()
              }}
            >
              {nomDeLangue(l)}
            </button>
          ))}
        </div>
      ) : null}

      <div
        role={langues.length > 1 ? 'tabpanel' : undefined}
        id={`consigne-panneau-${courante}`}
        aria-labelledby={langues.length > 1 ? `consigne-onglet-${courante}` : undefined}
        tabIndex={langues.length > 1 ? 0 : undefined}
        className="consigne-texte"
        lang={courante}
      >
        {consigneDe(courante, mode)}
      </div>
    </section>
  )
}
