'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { importer, langueContenuDe, type LangueContenu, type LangueInterface } from '@/domaine'
import type { Messages } from '@/i18n/messages'
import { EXEMPLES_COLLAGE } from '@/donnees/demonstration'
import { ajouterJeu } from '@/donnees/stockage'

const LANGUES_CONTENU: readonly LangueContenu[] = ['fr', 'de', 'it', 'autre']

const NOM_LANGUE: Record<LangueContenu, string> = {
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  autre: '—',
}

const MOTIF: Record<string, Record<LangueInterface, string>> = {
  'un-seul-champ': {
    'fr-CH': 'un seul champ sur la ligne',
    'de-CH': 'nur ein Feld in der Zeile',
    'it-CH': 'un solo campo nella riga',
  },
  'recto-vide': {
    'fr-CH': 'recto vide',
    'de-CH': 'Vorderseite leer',
    'it-CH': 'fronte vuoto',
  },
  'verso-vide': {
    'fr-CH': 'verso vide',
    'de-CH': 'Rueckseite leer',
    'it-CH': 'retro vuoto',
  },
  doublon: {
    'fr-CH': 'doublon',
    'de-CH': 'Duplikat',
    'it-CH': 'duplicato',
  },
  'trop-longue': {
    'fr-CH': 'ligne trop longue',
    'de-CH': 'Zeile zu lang',
    'it-CH': 'riga troppo lunga',
  },
}

export function Importer({ langue, messages }: { langue: LangueInterface; messages: Messages }) {
  const m = messages
  const router = useRouter()
  const [texte, setTexte] = useState('')
  const [titre, setTitre] = useState('')
  const [langueRecto, setLangueRecto] = useState<LangueContenu>('de')
  const [langueVerso, setLangueVerso] = useState<LangueContenu>(langueContenuDe(langue))

  // Le rapport est recalculé à chaque frappe : l'enseignant voit le format
  // deviné et les lignes écartées avant de décider, pas après.
  const rapport = useMemo(() => (texte.trim() === '' ? null : importer(texte)), [texte])

  function enregistrer() {
    if (rapport === null || rapport.cartes.length === 0) return
    const jeu = ajouterJeu({
      titre: titre.trim() === '' ? new Date().toLocaleDateString('fr-CH') : titre.trim(),
      langueRecto,
      langueVerso,
      cartes: rapport.cartes.map((c, i) => ({
        id: `c-${i + 1}`,
        recto: c.recto,
        verso: c.verso,
        alternatives: [],
      })),
    })
    router.push(`/${langue}/jeu/${jeu.id}`)
  }

  return (
    <>
      <h1>{m.creer.titre}</h1>
      <p className="doux">{m.creer.intro}</p>

      <div className="carte-bloc">
        <div className="champ">
          <label htmlFor="collage">{m.creer.coller}</label>
          <textarea
            id="collage"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        <div className="pile tres-petit">
          <span className="doux">{m.creer.exemples} :</span>
          {EXEMPLES_COLLAGE.map((ex) => (
            <button
              key={ex.cle}
              type="button"
              className="bouton bouton-discret"
              onClick={() => setTexte(ex.contenu)}
            >
              {ex.etiquette[langue]}
            </button>
          ))}
        </div>
      </div>

      {rapport === null ? (
        <p className="doux petit">{m.creer.vide}</p>
      ) : (
        <>
          <div className="carte-bloc">
            <div className="entre">
              <div className="pile">
                <span className="etiquette et-accent">
                  {m.creer.format} : {rapport.format.format}
                </span>
                <span className="petit doux">
                  {Math.round(rapport.format.confiance * 100)} % {m.creer.confiance}
                </span>
              </div>
              <div className="pile">
                <span className="etiquette et-vert">
                  {rapport.cartes.length} {m.creer.cartes}
                </span>
                {rapport.rejets.length > 0 ? (
                  <span className="etiquette et-ambre">
                    {rapport.rejets.length} {m.creer.ecartees}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {rapport.rejets.length > 0 ? (
            <div className="encadre encadre-attention">
              <p className="petit" style={{ marginBottom: '0.5rem' }}>
                <strong>{m.creer.rienEnSilence}</strong>
              </p>
              <div className="tableau-enveloppe">
                <table>
                  <tbody>
                    {rapport.rejets.map((r) => (
                      <tr key={`${r.ligne}-${r.motif}`}>
                        <td className="doux mono">{r.ligne}</td>
                        <td>{r.contenu}</td>
                        <td>
                          <span className="etiquette et-ambre">
                            {MOTIF[r.motif]?.[langue] ?? r.motif}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="carte-bloc">
            <div className="tableau-enveloppe">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{m.creer.recto}</th>
                    <th>{m.creer.verso}</th>
                  </tr>
                </thead>
                <tbody>
                  {rapport.cartes.slice(0, 30).map((c) => (
                    <tr key={c.ligneSource}>
                      <td className="doux mono">{c.ligneSource}</td>
                      <td>{c.recto}</td>
                      <td>{c.verso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="carte-bloc">
            <div className="champ">
              <label htmlFor="titre">{m.creer.titreJeu}</label>
              <input
                id="titre"
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
              />
            </div>
            <div className="grille grille-2">
              <div className="champ">
                <label htmlFor="lr">{m.creer.langueRecto}</label>
                <select
                  id="lr"
                  value={langueRecto}
                  onChange={(e) => setLangueRecto(e.target.value as LangueContenu)}
                >
                  {LANGUES_CONTENU.map((x) => (
                    <option key={x} value={x}>
                      {NOM_LANGUE[x]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="champ">
                <label htmlFor="lv">{m.creer.langueVerso}</label>
                <select
                  id="lv"
                  value={langueVerso}
                  onChange={(e) => setLangueVerso(e.target.value as LangueContenu)}
                >
                  {LANGUES_CONTENU.map((x) => (
                    <option key={x} value={x}>
                      {NOM_LANGUE[x]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              className="bouton bouton-principal"
              onClick={enregistrer}
              disabled={rapport.cartes.length === 0}
            >
              {m.creer.enregistrer}
            </button>
          </div>
        </>
      )}
    </>
  )
}
