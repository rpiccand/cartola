'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  corriger,
  REGLES,
  type LangueInterface,
  type Verdict,
} from '@/domaine'
import type { Messages } from '@/i18n/messages'
import {
  compter,
  enregistrerReponse,
  progressionDe,
  type CarteLocale,
  type JeuLocal,
} from '@/donnees/stockage'
import { melanger } from './melanger'
import { Differentiel } from './Differentiel'
import { Jauge } from './Jauge'

type Question =
  | { readonly genre: 'choix'; readonly carte: CarteLocale; readonly options: readonly string[] }
  | { readonly genre: 'saisie'; readonly carte: CarteLocale }

/**
 * Construit une manche.
 *
 * Priorité aux cartes les moins avancées, puis choix du genre de question par
 * l'état : reconnaissance tant que la carte est neuve, rappel libre ensuite.
 * C'est l'unique endroit où cette progression est décidée — la règle de
 * maîtrise elle-même vit dans le domaine.
 */
function construireManche(jeu: JeuLocal): Question[] {
  const progression = progressionDe(jeu.id)
  const rang = (c: CarteLocale) => {
    const e = progression[c.id]?.etat ?? 'non_commence'
    return e === 'maitrise' ? 2 : e === 'en_cours' ? 1 : 0
  }
  const candidates = melanger(jeu.cartes)
    .slice()
    .sort((a, b) => rang(a) - rang(b))
    .slice(0, REGLES.ITEMS_PAR_MANCHE)

  return candidates.map((carte) => {
    const etat = progression[carte.id]?.etat ?? 'non_commence'
    if (etat !== 'non_commence' || jeu.cartes.length < 4) {
      return { genre: 'saisie', carte }
    }
    const leurres = melanger(jeu.cartes.filter((c) => c.id !== carte.id))
      .slice(0, 3)
      .map((c) => c.verso)
    return { genre: 'choix', carte, options: melanger([carte.verso, ...leurres]) }
  })
}

export function Apprendre({
  jeu,
  langue,
  messages,
}: {
  jeu: JeuLocal
  langue: LangueInterface
  messages: Messages
}) {
  const m = messages
  const [manche, setManche] = useState<readonly Question[] | null>(null)
  const [i, setI] = useState(0)
  const [saisie, setSaisie] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [choisi, setChoisi] = useState<string | null>(null)
  const [tour, setTour] = useState(0)
  const champ = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setManche(construireManche(jeu))
    setI(0)
    setSaisie('')
    setVerdict(null)
    setChoisi(null)
  }, [jeu, tour])

  const compteurs = useMemo(() => compter(jeu), [jeu, tour, i])

  if (manche === null) return <p className="doux petit">…</p>

  const q = manche[i]

  if (q === undefined) {
    return (
      <div className="carte-bloc" style={{ textAlign: 'center' }}>
        <h2>{m.etude.termine}</h2>
        <p className="doux petit">
          {compteurs.maitrise} / {compteurs.total} {m.maitrise.maitrise.toLowerCase()}
        </p>
        <Jauge compteurs={compteurs} />
        <div className="pile" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            className="bouton bouton-principal"
            onClick={() => setTour((t) => t + 1)}
          >
            {m.etude.manche} {tour + 2}
          </button>
          <Link className="bouton" href={`/${langue}/jeu/${jeu.id}`}>
            {m.jeu.retour}
          </Link>
        </div>
      </div>
    )
  }

  function suivant() {
    setVerdict(null)
    setChoisi(null)
    setSaisie('')
    setI((x) => x + 1)
    // Le champ garde le focus : sur téléphone, le clavier ne se referme pas
    // entre deux cartes, ce qui évite un saut de mise en page à chaque item.
    window.setTimeout(() => champ.current?.focus(), 0)
  }

  function repondreChoix(option: string) {
    if (choisi !== null) return
    const correct = option === q.carte.verso
    setChoisi(option)
    // Reconnaissance : ne mène jamais à la maîtrise (règle du domaine).
    enregistrerReponse(jeu.id, q.carte.id, correct, false)
  }

  function verifier() {
    if (verdict !== null) return
    const v = corriger(saisie, q.carte.verso, {
      niveau: 'tolerant',
      langue: jeu.langueVerso,
      reponsesAlternatives: q.carte.alternatives,
    })
    setVerdict(v)
    enregistrerReponse(jeu.id, q.carte.id, v.correct, true)
  }

  function contester() {
    if (verdict === null || verdict.correct) return
    setVerdict({ ...verdict, correct: true, motif: 'exact' })
    enregistrerReponse(jeu.id, q.carte.id, true, true)
  }

  return (
    <>
      <div className="entre">
        <p className="petit doux" style={{ margin: 0 }}>
          {m.etude.manche} {tour + 1} · {i + 1} {m.etude.sur} {manche.length}
        </p>
        <p className="petit doux" style={{ margin: 0 }}>
          {compteurs.maitrise} / {compteurs.total} {m.maitrise.maitrise.toLowerCase()}
        </p>
      </div>
      <Jauge compteurs={compteurs} />

      <div className="carte-bloc" style={{ marginTop: '1rem' }}>
        <p className="tres-petit doux" style={{ marginBottom: '0.25rem' }}>
          {q.genre === 'choix' ? m.jeu.associerDesc : m.etude.votreReponse}
        </p>
        <p
          lang={jeu.langueRecto}
          style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1rem' }}
        >
          {q.carte.recto}
        </p>

        {q.genre === 'choix' ? (
          <div className="choix">
            {q.options.map((o) => {
              let classe = 'tuile'
              if (choisi !== null) {
                if (o === q.carte.verso) classe = 'tuile tuile-juste'
                else if (o === choisi) classe = 'tuile tuile-fausse'
              }
              return (
                <button
                  key={o}
                  type="button"
                  className={classe}
                  lang={jeu.langueVerso}
                  onClick={() => repondreChoix(o)}
                >
                  {o}
                </button>
              )
            })}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (verdict === null) verifier()
              else suivant()
            }}
          >
            <div className="champ">
              <label htmlFor="rep">{m.etude.votreReponse}</label>
              <input
                id="rep"
                ref={champ}
                type="text"
                value={saisie}
                lang={jeu.langueVerso}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                readOnly={verdict !== null}
                onChange={(e) => setSaisie(e.target.value)}
              />
            </div>
            {verdict === null ? (
              <button type="submit" className="bouton bouton-principal">
                {m.etude.verifier}
              </button>
            ) : null}
          </form>
        )}

        {verdict !== null ? (
          <div
            className={verdict.correct ? 'encadre' : 'encadre encadre-attention'}
            style={{ marginTop: '1rem' }}
          >
            <div className="pile">
              <span className={verdict.correct ? 'etiquette et-vert' : 'etiquette et-rouge'}>
                {verdict.correct ? m.etude.accepte : m.etude.refuse}
              </span>
              <span className="tres-petit doux mono">
                {verdict.motif} · {verdict.niveauApplique} · {verdict.distance}/
                {verdict.toleranceAppliquee}
              </span>
            </div>
            {verdict.correct ? null : (
              <>
                <p className="petit" style={{ margin: '0.5rem 0 0.25rem' }}>
                  {m.etude.attendu} : <strong lang={jeu.langueVerso}>{q.carte.verso}</strong>
                </p>
                <p style={{ margin: '0 0 0.5rem' }}>
                  <Differentiel segments={verdict.differentiel} />
                </p>
                <button type="button" className="bouton bouton-discret" onClick={contester}>
                  {m.etude.reponseCorrecte}
                </button>
              </>
            )}
          </div>
        ) : null}

        {verdict !== null || choisi !== null ? (
          <div className="pile" style={{ marginTop: '1rem' }}>
            <button type="button" className="bouton bouton-principal" onClick={suivant}>
              {m.etude.suivant}
            </button>
          </div>
        ) : null}
      </div>
    </>
  )
}
