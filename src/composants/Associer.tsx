'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { REGLES, type LangueInterface } from '@/domaine'
import type { Messages } from '@/i18n/messages'
import { enregistrerReponse, enregistrerTemps, meilleurTemps, type JeuLocal } from '@/donnees/stockage'
import { melanger } from './melanger'

interface Tuile {
  readonly cle: string
  readonly carteId: string
  readonly texte: string
  readonly cote: 'recto' | 'verso'
}

function formaterTemps(ms: number): string {
  const s = ms / 1000
  return `${s.toFixed(1)} s`
}

/**
 * Mode association (EF-P.13).
 *
 * Le chronomètre inclut une pénalité fixe par erreur plutôt qu'une pause :
 * une pause punit deux fois — elle coûte du temps et casse le rythme, ce qui
 * décourage les élèves les plus lents, précisément ceux qu'on veut garder.
 */
export function Associer({
  jeu,
  langue,
  messages,
}: {
  jeu: JeuLocal
  langue: LangueInterface
  messages: Messages
}) {
  const m = messages
  const [tuiles, setTuiles] = useState<readonly Tuile[] | null>(null)
  const [appariees, setAppariees] = useState<readonly string[]>([])
  const [choisie, setChoisie] = useState<Tuile | null>(null)
  const [fausse, setFausse] = useState<string | null>(null)
  const [erreurs, setErreurs] = useState(0)
  const [debut, setDebut] = useState(0)
  const [ecoule, setEcoule] = useState(0)
  const [fini, setFini] = useState<number | null>(null)
  const [record, setRecord] = useState<number | undefined>(undefined)
  const [tour, setTour] = useState(0)

  useEffect(() => {
    const paires = melanger(jeu.cartes).slice(0, REGLES.PAIRES_PAR_GRILLE_ASSOCIATION)
    const t: Tuile[] = []
    for (const c of paires) {
      t.push({ cle: `${c.id}-r`, carteId: c.id, texte: c.recto, cote: 'recto' })
      t.push({ cle: `${c.id}-v`, carteId: c.id, texte: c.verso, cote: 'verso' })
    }
    setTuiles(melanger(t))
    setAppariees([])
    setChoisie(null)
    setFausse(null)
    setErreurs(0)
    setFini(null)
    setDebut(Date.now())
    setEcoule(0)
    setRecord(meilleurTemps(jeu.id))
  }, [jeu, tour])

  useEffect(() => {
    if (fini !== null || debut === 0) return
    const id = window.setInterval(() => setEcoule(Date.now() - debut), 100)
    return () => window.clearInterval(id)
  }, [debut, fini])

  if (tuiles === null) return <p className="doux petit">…</p>

  const total = tuiles.length / 2

  function cliquer(t: Tuile) {
    if (fini !== null || appariees.includes(t.carteId)) return
    if (choisie === null) {
      setChoisie(t)
      return
    }
    if (choisie.cle === t.cle) {
      setChoisie(null)
      return
    }
    if (choisie.carteId === t.carteId && choisie.cote !== t.cote) {
      const restantes = [...appariees, t.carteId]
      setAppariees(restantes)
      setChoisie(null)
      enregistrerReponse(jeu.id, t.carteId, true, false)
      if (restantes.length === total) {
        const ms = Date.now() - debut + erreurs * REGLES.PENALITE_ASSOCIATION_MS
        setFini(ms)
        enregistrerTemps(jeu.id, ms)
      }
      return
    }
    setErreurs((e) => e + 1)
    setFausse(t.cle)
    enregistrerReponse(jeu.id, t.carteId, false, false)
    window.setTimeout(() => {
      setFausse(null)
      setChoisie(null)
    }, 500)
  }

  const affiche = fini ?? ecoule + erreurs * REGLES.PENALITE_ASSOCIATION_MS

  return (
    <>
      <div className="entre">
        <p className="petit doux" style={{ margin: 0 }}>
          {m.etude.temps} : <strong className="mono">{formaterTemps(affiche)}</strong>
          {erreurs > 0 ? (
            <span className="tres-petit"> (+{erreurs} × 1 s)</span>
          ) : null}
        </p>
        <p className="petit doux" style={{ margin: 0 }}>
          {appariees.length} / {total} {m.etude.paires}
          {record !== undefined ? (
            <span className="tres-petit">
              {' '}
              · {m.etude.meilleurTemps} {formaterTemps(record)}
            </span>
          ) : null}
        </p>
      </div>

      <div className="tuiles" style={{ marginTop: '0.75rem' }}>
        {tuiles.map((t) => {
          const partie = appariees.includes(t.carteId)
          let classe = 'tuile'
          if (partie) classe = 'tuile tuile-partie'
          else if (t.cle === fausse) classe = 'tuile tuile-fausse'
          else if (choisie?.cle === t.cle) classe = 'tuile tuile-choisie'
          return (
            <button
              key={t.cle}
              type="button"
              className={classe}
              disabled={partie}
              lang={t.cote === 'recto' ? jeu.langueRecto : jeu.langueVerso}
              onClick={() => cliquer(t)}
            >
              {t.texte}
            </button>
          )
        })}
      </div>

      {fini !== null ? (
        <div className="carte-bloc" style={{ marginTop: '1rem', textAlign: 'center' }}>
          <h2>{m.etude.termine}</h2>
          <p className="mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>
            {formaterTemps(fini)}
          </p>
          <div className="pile" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="bouton bouton-principal"
              onClick={() => setTour((x) => x + 1)}
            >
              {m.etude.recommencer}
            </button>
            <Link className="bouton" href={`/${langue}/jeu/${jeu.id}`}>
              {m.jeu.retour}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  )
}
