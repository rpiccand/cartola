'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LangueInterface } from '@/domaine'
import type { Messages } from '@/i18n/messages'
import { compter, listerJeux, supprimerJeu, type Compteurs, type JeuLocal } from '@/donnees/stockage'
import { Jauge } from './Jauge'

export function ListeJeux({ langue, messages }: { langue: LangueInterface; messages: Messages }) {
  const m = messages
  // Le stockage n'existe qu'au navigateur : on ne lit qu'après le montage,
  // sinon le rendu serveur et le rendu client divergent.
  const [jeux, setJeux] = useState<readonly JeuLocal[] | null>(null)

  useEffect(() => {
    setJeux(listerJeux())
  }, [])

  if (jeux === null) return <p className="doux petit">…</p>

  return (
    <>
      <div className="entre">
        <h1>{m.jeux.titre}</h1>
        <Link className="bouton bouton-principal" href={`/${langue}/creer`}>
          {m.accueil.commencer}
        </Link>
      </div>

      {jeux.length === 0 ? (
        <p className="doux">{m.jeux.aucun}</p>
      ) : (
        <div className="grille grille-2">
          {jeux.map((j) => {
            const c: Compteurs = compter(j)
            return (
              <div key={j.id} className="carte-bloc">
                <div className="pile" style={{ marginBottom: '0.35rem' }}>
                  {j.matiere ? <span className="etiquette et-neutre">{j.matiere}</span> : null}
                  {j.demonstration ? (
                    <span className="etiquette et-accent">démo</span>
                  ) : null}
                </div>
                <h3>{j.titre}</h3>
                <p className="petit doux">
                  {c.total} {m.jeux.cartes} · {c.maitrise} {m.maitrise.maitrise.toLowerCase()}
                </p>
                <Jauge compteurs={c} />
                <div className="pile" style={{ marginTop: '0.75rem' }}>
                  <Link className="bouton" href={`/${langue}/jeu/${j.id}`}>
                    {m.jeux.ouvrir}
                  </Link>
                  {j.demonstration ? null : (
                    <button
                      type="button"
                      className="bouton bouton-discret"
                      onClick={() => {
                        supprimerJeu(j.id)
                        setJeux(listerJeux())
                      }}
                    >
                      {m.jeux.supprimer}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
