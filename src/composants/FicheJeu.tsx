'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { REGLES, type EtatMaitrise, type LangueInterface } from '@/domaine'
import type { Messages } from '@/i18n/messages'
import {
  compter,
  obtenirJeu,
  progressionDe,
  reinitialiserProgression,
  type Compteurs,
  type JeuLocal,
} from '@/donnees/stockage'
import { Jauge } from './Jauge'

const CLASSE_ETAT: Record<EtatMaitrise, string> = {
  non_commence: 'etiquette et-neutre',
  en_cours: 'etiquette et-ambre',
  maitrise: 'etiquette et-vert',
}

export function FicheJeu({
  jeuId,
  langue,
  messages,
}: {
  jeuId: string
  langue: LangueInterface
  messages: Messages
}) {
  const m = messages
  const [jeu, setJeu] = useState<JeuLocal | null | undefined>(undefined)
  const [compteurs, setCompteurs] = useState<Compteurs | null>(null)
  const [etats, setEtats] = useState<Record<string, EtatMaitrise>>({})

  const rafraichir = useCallback(() => {
    const j = obtenirJeu(jeuId) ?? null
    setJeu(j)
    if (j === null) return
    setCompteurs(compter(j))
    const p = progressionDe(j.id)
    const e: Record<string, EtatMaitrise> = {}
    for (const c of j.cartes) e[c.id] = p[c.id]?.etat ?? 'non_commence'
    setEtats(e)
  }, [jeuId])

  useEffect(rafraichir, [rafraichir])

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

  // Le minimum n'est pas le même partout : une grille d'association demande
  // six paires, une partie de blast se contente de quatre cartes puisqu'elle
  // les fait défiler une à une.
  const modes = [
    { cle: 'reviser', titre: m.jeu.reviser, desc: m.jeu.reviserDesc, minimum: 0 },
    { cle: 'apprendre', titre: m.jeu.apprendre, desc: m.jeu.apprendreDesc, minimum: 0 },
    {
      cle: 'associer',
      titre: m.jeu.associer,
      desc: m.jeu.associerDesc,
      minimum: REGLES.CARTES_MINIMUM_SESSION_LIVE,
    },
    {
      cle: 'blast',
      titre: m.jeu.blast,
      desc: m.jeu.blastDesc,
      minimum: REGLES.CARTES_MINIMUM_BLAST,
    },
  ] as const

  return (
    <>
      <div className="pile" style={{ marginBottom: '0.35rem' }}>
        {jeu.matiere ? <span className="etiquette et-neutre">{jeu.matiere}</span> : null}
        <span className="etiquette et-accent">
          {jeu.cartes.length} {m.jeux.cartes}
        </span>
      </div>
      <h1>{jeu.titre}</h1>

      {compteurs ? (
        <div className="carte-bloc">
          <div className="entre" style={{ marginBottom: '0.5rem' }}>
            <span className="petit doux">{m.jeu.maitrise}</span>
            <span className="petit">
              <strong>
                {compteurs.maitrise} / {compteurs.total}
              </strong>
            </span>
          </div>
          <Jauge compteurs={compteurs} />
        </div>
      ) : null}

      <div className="grille grille-4">
        {modes.map((mo) =>
          jeu.cartes.length >= mo.minimum ? (
            <Link
              key={mo.cle}
              href={`/${langue}/jeu/${jeu.id}/${mo.cle}`}
              className="carte-bloc"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <h3>{mo.titre}</h3>
              <p className="petit doux" style={{ margin: 0 }}>
                {mo.desc}
              </p>
            </Link>
          ) : (
            <div key={mo.cle} className="carte-bloc" style={{ opacity: 0.5 }}>
              <h3>{mo.titre}</h3>
              <p className="petit doux" style={{ margin: 0 }}>
                {mo.minimum} {m.jeux.cartes} minimum
              </p>
            </div>
          ),
        )}
      </div>

      <div className="carte-bloc">
        <div className="tableau-enveloppe">
          <table>
            <tbody>
              {jeu.cartes.map((c) => (
                <tr key={c.id}>
                  <td lang={jeu.langueRecto}>{c.recto}</td>
                  <td lang={jeu.langueVerso}>
                    {c.verso}
                    {c.alternatives.length > 0 ? (
                      <span className="tres-petit doux"> · {c.alternatives.join(' / ')}</span>
                    ) : null}
                  </td>
                  <td>
                    <span className={CLASSE_ETAT[etats[c.id] ?? 'non_commence']}>
                      {m.maitrise[etats[c.id] ?? 'non_commence']}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pile">
        <Link className="bouton" href={`/${langue}/jeux`}>
          {m.jeu.retour}
        </Link>
        <button
          type="button"
          className="bouton bouton-discret"
          onClick={() => {
            reinitialiserProgression(jeu.id)
            rafraichir()
          }}
        >
          {m.jeu.reinitialiser}
        </button>
      </div>
    </>
  )
}
