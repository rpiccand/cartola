'use client'

import { useMemo, useState } from 'react'
import {
  CAS_REFERENCE,
  corriger,
  type CasReference,
  type LangueContenu,
  type LangueInterface,
  type NiveauCorrection,
} from '@/domaine'
import type { Messages } from '@/i18n/messages'
import { Differentiel } from './Differentiel'

const LANGUES: readonly LangueContenu[] = ['fr', 'de', 'it', 'autre']

interface Resultat {
  readonly cas: CasReference
  readonly obtenu: boolean
  readonly concorde: boolean
}

function executerReference(): readonly Resultat[] {
  return CAS_REFERENCE.map((cas) => {
    const v = corriger(cas.saisie, cas.attendu, {
      niveau: cas.niveau,
      langue: cas.langue,
      reponsesAlternatives: cas.alternatives,
      reponsesMultiples: cas.multiples,
    })
    return { cas, obtenu: v.correct, concorde: v.correct === cas.correct }
  })
}

export function Correcteur({
  langue,
  messages,
}: {
  langue: LangueInterface
  messages: Messages
}) {
  const m = messages
  const [attendu, setAttendu] = useState('die Straße')
  const [saisie, setSaisie] = useState('die Strasse')
  const [alternatives, setAlternatives] = useState('')
  const [langueCarte, setLangueCarte] = useState<LangueContenu>('de')
  const [niveau, setNiveau] = useState<NiveauCorrection>('tolerant')
  const [tousLesCas, setTousLesCas] = useState(false)

  const verdict = useMemo(
    () =>
      corriger(saisie, attendu, {
        niveau,
        langue: langueCarte,
        reponsesAlternatives: alternatives
          .split('/')
          .map((x) => x.trim())
          .filter((x) => x.length > 0),
      }),
    [saisie, attendu, alternatives, niveau, langueCarte],
  )

  // Le jeu de référence est exécuté ici, dans la page, à chaque chargement.
  // Ce n'est pas un rapport de test recopié : c'est le moteur lui-même.
  const resultats = useMemo(executerReference, [])
  const concordants = resultats.filter((r) => r.concorde).length
  const taux = Math.round((concordants / resultats.length) * 1000) / 10
  const divergents = resultats.filter((r) => !r.concorde)
  const affiches = tousLesCas ? resultats : divergents

  return (
    <>
      <h1>{m.correcteur.titre}</h1>
      <p className="doux">{m.correcteur.intro}</p>

      <div className="carte-bloc">
        <div className="grille grille-2">
          <div className="champ">
            <label htmlFor="att">{m.correcteur.attendu}</label>
            <input
              id="att"
              type="text"
              value={attendu}
              lang={langueCarte === 'autre' ? undefined : langueCarte}
              onChange={(e) => setAttendu(e.target.value)}
            />
          </div>
          <div className="champ">
            <label htmlFor="sai">{m.correcteur.saisie}</label>
            <input
              id="sai"
              type="text"
              value={saisie}
              lang={langueCarte === 'autre' ? undefined : langueCarte}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setSaisie(e.target.value)}
            />
          </div>
        </div>

        <div className="grille grille-3">
          <div className="champ">
            <label htmlFor="lc">{m.correcteur.langueCarte}</label>
            <select
              id="lc"
              value={langueCarte}
              onChange={(e) => setLangueCarte(e.target.value as LangueContenu)}
            >
              {LANGUES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
          <div className="champ">
            <label htmlFor="niv">{m.correcteur.niveau}</label>
            <select
              id="niv"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value as NiveauCorrection)}
            >
              <option value="tolerant">{m.correcteur.tolerant}</option>
              <option value="strict">{m.correcteur.strict}</option>
            </select>
          </div>
          <div className="champ">
            <label htmlFor="alt">
              {m.correcteur.alternatives}{' '}
              <span className="tres-petit doux">({m.correcteur.alternativesAide})</span>
            </label>
            <input
              id="alt"
              type="text"
              value={alternatives}
              onChange={(e) => setAlternatives(e.target.value)}
            />
          </div>
        </div>

        <div className={verdict.correct ? 'encadre' : 'encadre encadre-attention'}>
          <div className="pile">
            <span className={verdict.correct ? 'etiquette et-vert' : 'etiquette et-rouge'}>
              {verdict.correct ? m.etude.accepte : m.etude.refuse}
            </span>
            <span className="etiquette et-neutre">{verdict.motif}</span>
            <span className="etiquette et-neutre">{verdict.niveauApplique}</span>
            <span className="tres-petit doux mono">
              distance {verdict.distance} · tolérance {verdict.toleranceAppliquee}
            </span>
          </div>
          <p style={{ margin: '0.6rem 0 0' }}>
            <Differentiel segments={verdict.differentiel} />
          </p>
          {niveau === 'tolerant' && verdict.niveauApplique === 'strict' ? (
            <p className="tres-petit doux" style={{ margin: '0.5rem 0 0' }}>
              La tolérance n'existe qu'en français, allemand et italien : une distance d'édition sur
              une formule ou une écriture non latine n'aurait pas de sens (EF-P.95).
            </p>
          ) : null}
        </div>
      </div>

      <h2>{m.correcteur.reference}</h2>
      <p className="doux petit">{m.correcteur.referenceIntro}</p>

      <div className="carte-bloc">
        <div className="entre">
          <div className="pile">
            <span className={taux >= 95 ? 'etiquette et-vert' : 'etiquette et-rouge'}>
              {taux} % {m.correcteur.concordance}
            </span>
            <span className="petit doux">
              {concordants} / {resultats.length}
            </span>
          </div>
          <button
            type="button"
            className="bouton bouton-discret"
            onClick={() => setTousLesCas((x) => !x)}
          >
            {tousLesCas ? '−' : '+'} {m.correcteur.voirCas}
          </button>
        </div>

        {affiches.length === 0 ? (
          <p className="petit doux" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
            {langue === 'de-CH'
              ? 'Keine Abweichung.'
              : langue === 'it-CH'
                ? 'Nessuna divergenza.'
                : 'Aucune divergence.'}
          </p>
        ) : (
          <div className="tableau-enveloppe" style={{ marginTop: '0.75rem' }}>
            <table>
              <thead>
                <tr>
                  <th>id</th>
                  <th>lg</th>
                  <th>niv.</th>
                  <th>{m.correcteur.attendu}</th>
                  <th>{m.correcteur.saisie}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {affiches.map((r) => (
                  <tr key={r.cas.id}>
                    <td className="mono tres-petit doux">{r.cas.id}</td>
                    <td className="mono tres-petit">{r.cas.langue}</td>
                    <td className="mono tres-petit">{r.cas.niveau.slice(0, 3)}</td>
                    <td lang={r.cas.langue === 'autre' ? undefined : r.cas.langue}>
                      {r.cas.attendu}
                    </td>
                    <td lang={r.cas.langue === 'autre' ? undefined : r.cas.langue}>
                      {r.cas.saisie}
                    </td>
                    <td>
                      <span
                        className={r.concorde ? 'etiquette et-vert' : 'etiquette et-rouge'}
                        title={r.cas.note}
                      >
                        {r.obtenu ? m.etude.accepte : m.etude.refuse}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
