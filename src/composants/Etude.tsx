'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LangueInterface } from '@/domaine'
import type { Messages } from '@/i18n/messages'
import { obtenirJeu, type JeuLocal } from '@/donnees/stockage'
import { Reviser } from './Reviser'
import { Apprendre } from './Apprendre'
import { Associer } from './Associer'
import { Blast } from './Blast'

export type Mode = 'reviser' | 'apprendre' | 'associer' | 'blast'

const TITRE_MODE: Record<Mode, (m: Messages) => string> = {
  reviser: (m) => m.jeu.reviser,
  apprendre: (m) => m.jeu.apprendre,
  associer: (m) => m.jeu.associer,
  blast: (m) => m.jeu.blast,
}

export function Etude({
  jeuId,
  mode,
  langue,
  messages,
}: {
  jeuId: string
  mode: Mode
  langue: LangueInterface
  messages: Messages
}) {
  const m = messages
  const [jeu, setJeu] = useState<JeuLocal | null | undefined>(undefined)

  useEffect(() => {
    setJeu(obtenirJeu(jeuId) ?? null)
  }, [jeuId])

  if (jeu === undefined) return <p className="doux petit">…</p>
  if (jeu === null)
    return (
      <>
        <p className="doux">{m.jeux.aucun}</p>
        <Link className="bouton" href={`/${langue}/jeux`}>
          {m.jeu.retour}
        </Link>
      </>
    )

  const titreMode = TITRE_MODE[mode](m)

  return (
    <>
      <div className="entre" style={{ marginBottom: '0.75rem' }}>
        <div>
          <p className="tres-petit doux" style={{ margin: 0 }}>
            {jeu.titre}
          </p>
          <h1 style={{ fontSize: '1.3rem', margin: 0 }}>{titreMode}</h1>
        </div>
        <Link className="bouton bouton-discret" href={`/${langue}/jeu/${jeu.id}`}>
          {m.jeu.retour}
        </Link>
      </div>

      {mode === 'reviser' ? <Reviser jeu={jeu} langue={langue} messages={m} /> : null}
      {mode === 'apprendre' ? <Apprendre jeu={jeu} langue={langue} messages={m} /> : null}
      {mode === 'associer' ? <Associer jeu={jeu} langue={langue} messages={m} /> : null}
      {mode === 'blast' ? <Blast jeu={jeu} langue={langue} messages={m} /> : null}

      <div className="encadre encadre-info" style={{ marginTop: '1.5rem' }}>
        <p className="tres-petit" style={{ margin: 0 }}>
          <strong>{m.audio.titre}.</strong> {m.audio.texte}
        </p>
      </div>
    </>
  )
}
