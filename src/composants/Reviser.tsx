'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LangueInterface } from '@/domaine'
import type { Messages } from '@/i18n/messages'
import { enregistrerReponse, type CarteLocale, type JeuLocal } from '@/donnees/stockage'
import { melanger } from './melanger'

/**
 * Mode révision : feuilleter et trier.
 *
 * « Je sais » compte comme un rappel libre — l'élève s'est prononcé avant de
 * retourner la carte. C'est la raison pour laquelle ce mode fait progresser
 * vers la maîtrise, alors que le choix multiple de l'apprentissage n'y suffit
 * jamais.
 */
export function Reviser({
  jeu,
  langue,
  messages,
}: {
  jeu: JeuLocal
  langue: LangueInterface
  messages: Messages
}) {
  const m = messages
  const [file, setFile] = useState<readonly CarteLocale[] | null>(null)
  const [i, setI] = useState(0)
  const [retournee, setRetournee] = useState(false)
  const [aRevoir, setARevoir] = useState<CarteLocale[]>([])

  useEffect(() => {
    setFile(melanger(jeu.cartes))
  }, [jeu])

  if (file === null) return <p className="doux petit">…</p>

  const carte = file[i]

  if (carte === undefined) {
    return (
      <div className="carte-bloc" style={{ textAlign: 'center' }}>
        <h2>{m.etude.termine}</h2>
        <p className="doux">
          {file.length} {m.jeux.cartes} · {aRevoir.length} {m.etude.aRevoir.toLowerCase()}
        </p>
        <div className="pile" style={{ justifyContent: 'center' }}>
          {aRevoir.length > 0 ? (
            <button
              type="button"
              className="bouton bouton-principal"
              onClick={() => {
                setFile(melanger(aRevoir))
                setARevoir([])
                setI(0)
                setRetournee(false)
              }}
            >
              {m.etude.aRevoir} ({aRevoir.length})
            </button>
          ) : null}
          <button
            type="button"
            className="bouton"
            onClick={() => {
              setFile(melanger(jeu.cartes))
              setARevoir([])
              setI(0)
              setRetournee(false)
            }}
          >
            {m.etude.recommencer}
          </button>
          <Link className="bouton" href={`/${langue}/jeu/${jeu.id}`}>
            {m.jeu.retour}
          </Link>
        </div>
      </div>
    )
  }

  function trier(su: boolean) {
    const c = carte as CarteLocale
    enregistrerReponse(jeu.id, c.id, su, true)
    if (!su) setARevoir((a) => [...a, c])
    setRetournee(false)
    setI((x) => x + 1)
  }

  return (
    <>
      <p className="petit doux">
        {i + 1} {m.etude.sur} {file.length}
      </p>

      <button
        type="button"
        className={retournee ? 'face face-verso' : 'face'}
        style={{ width: '100%' }}
        onClick={() => setRetournee((r) => !r)}
        lang={retournee ? jeu.langueVerso : jeu.langueRecto}
      >
        {retournee ? carte.verso : carte.recto}
      </button>

      <div className="pile" style={{ marginTop: '1rem', justifyContent: 'center' }}>
        <button type="button" className="bouton bouton-rouge" onClick={() => trier(false)}>
          {m.etude.aRevoir}
        </button>
        <button type="button" className="bouton bouton-vert" onClick={() => trier(true)}>
          {m.etude.jeSais}
        </button>
      </div>
    </>
  )
}
