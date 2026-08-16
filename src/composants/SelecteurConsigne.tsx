'use client'

import { useEffect, useState } from 'react'
import { estLangueConsigne, LANGUES_CONSIGNE, type LangueConsigne } from '@/i18n/consignes'
import type { Messages } from '@/i18n/messages'
import { abonnerLangueConsigne, definirLangueConsigne, langueConsigne } from '@/donnees/stockage'

/**
 * Choix de la deuxième langue des consignes.
 *
 * Volontairement séparé du sélecteur de langue de l'interface, qui est une
 * rangée de liens changeant l'URL. Celui-ci ne navigue pas : il écrit une
 * préférence dans le `localStorage`. Les deux choix sont indépendants — un
 * établissement romand garde son interface en français pendant qu'un élève
 * lit les consignes en portugais.
 */
export function SelecteurConsigne({ messages }: { messages: Messages }) {
  const [choix, setChoix] = useState<LangueConsigne | ''>('')
  const [monte, setMonte] = useState(false)

  // Le `localStorage` n'existe pas au rendu serveur. Lire la préférence dans un
  // effet évite que le balisage rendu par le serveur ne diffère de celui du
  // navigateur, ce qui déclencherait un avertissement d'hydratation.
  useEffect(() => {
    const relire = () => setChoix(langueConsigne() ?? '')
    relire()
    setMonte(true)
    return abonnerLangueConsigne(relire)
  }, [])

  return (
    <div className="consigne-choix">
      <label htmlFor="langue-consigne">{messages.consignes.langue}</label>
      <select
        id="langue-consigne"
        value={choix}
        disabled={!monte}
        onChange={(e) => {
          const v = e.target.value
          const langue = estLangueConsigne(v) ? v : undefined
          setChoix(langue ?? '')
          definirLangueConsigne(langue)
        }}
      >
        <option value="">{messages.consignes.aucune}</option>
        {LANGUES_CONSIGNE.map((l) => (
          // Chaque langue est écrite dans sa propre langue : un élève qui ne
          // lit pas encore le français doit pouvoir reconnaître la sienne.
          <option key={l.code} value={l.code} lang={l.code}>
            {l.nom}
          </option>
        ))}
      </select>
    </div>
  )
}
