'use client'

import { useEffect, useState } from 'react'
import type { LangueInterface } from '@/domaine'
import type { Messages } from '@/i18n/messages'

/**
 * Test de compatibilité de l'appareil.
 *
 * Ce n'est pas un gadget : le parc des écoles suisses comporte des appareils
 * de six à huit ans, et la seule façon honnête de savoir si la cible tient est
 * d'ouvrir cette page sur les plus anciens d'entre eux.
 *
 * Les fonctionnalités testées sont celles qui délimitent la cible. Les
 * assertions arrière en expression régulière, en particulier, sont apparues
 * dans Safari 16.4 exactement : c'est le meilleur discriminant disponible.
 */

interface Verif {
  readonly cle: string
  readonly nom: string
  readonly depuis: string
  readonly essai: () => boolean
}

const VERIFS: readonly Verif[] = [
  {
    cle: 'lookbehind',
    nom: 'Assertions arrière (expressions régulières)',
    depuis: 'Safari 16.4',
    essai: () => {
      try {
        // Construite dynamiquement : une syntaxe non reconnue ferait échouer
        // l'analyse du fichier entier sur les navigateurs anciens.
        return new RegExp('(?<=a)b').test('ab')
      } catch {
        return false
      }
    },
  },
  {
    cle: 'has',
    nom: 'Sélecteur CSS :has()',
    depuis: 'Safari 15.4',
    essai: () => typeof CSS !== 'undefined' && CSS.supports('selector(:has(a))'),
  },
  {
    cle: 'grid',
    nom: 'Grille CSS et clamp()',
    depuis: 'Safari 13.1',
    essai: () =>
      typeof CSS !== 'undefined' &&
      CSS.supports('display', 'grid') &&
      CSS.supports('width', 'clamp(1rem, 2vw, 3rem)'),
  },
  {
    cle: 'variables',
    nom: 'Variables CSS',
    depuis: 'Safari 9.1',
    essai: () => typeof CSS !== 'undefined' && CSS.supports('--x', '0'),
  },
  {
    cle: 'hasOwn',
    nom: 'Object.hasOwn',
    depuis: 'Safari 15.4',
    essai: () => typeof Object.hasOwn === 'function',
  },
  {
    cle: 'at',
    nom: 'Array.prototype.at',
    depuis: 'Safari 15.4',
    essai: () => typeof Array.prototype.at === 'function',
  },
  {
    cle: 'clone',
    nom: 'structuredClone',
    depuis: 'Safari 15.4',
    essai: () => typeof structuredClone === 'function',
  },
  {
    cle: 'intl',
    nom: 'Formats suisses (Intl, de-CH)',
    depuis: 'Safari 14',
    essai: () => {
      try {
        return new Intl.NumberFormat('de-CH').format(1234).length > 0
      } catch {
        return false
      }
    },
  },
  {
    cle: 'normalize',
    nom: 'Normalisation Unicode (NFC)',
    depuis: 'Safari 10',
    essai: () => 'é'.normalize('NFC') === 'é',
  },
  {
    cle: 'localeCompare',
    nom: 'Comparaison locale accentuée',
    depuis: 'Safari 10',
    essai: () => 'é'.localeCompare('e', 'fr', { sensitivity: 'base' }) === 0,
  },
  {
    cle: 'stockage',
    nom: 'Stockage local disponible',
    depuis: '—',
    essai: () => {
      try {
        window.localStorage.setItem('cartula.sonde', '1')
        window.localStorage.removeItem('cartula.sonde')
        return true
      } catch {
        return false
      }
    },
  },
]

export function Compatibilite({
  langue,
  messages,
}: {
  langue: LangueInterface
  messages: Messages
}) {
  const m = messages
  const [resultats, setResultats] = useState<Record<string, boolean> | null>(null)
  const [contexte, setContexte] = useState<readonly [string, string][]>([])

  useEffect(() => {
    const r: Record<string, boolean> = {}
    for (const v of VERIFS) {
      try {
        r[v.cle] = v.essai()
      } catch {
        r[v.cle] = false
      }
    }
    setResultats(r)
    setContexte([
      ['Écran', `${window.screen.width} × ${window.screen.height}`],
      ['Fenêtre', `${window.innerWidth} × ${window.innerHeight}`],
      ['Densité', String(window.devicePixelRatio)],
      ['Langues', navigator.languages.join(', ')],
      ['Agent', navigator.userAgent],
    ])
  }, [])

  if (resultats === null) return <p className="doux petit">…</p>

  const echecs = VERIFS.filter((v) => !resultats[v.cle])
  const ok = echecs.length === 0

  return (
    <>
      <h1>{m.appareil.titre}</h1>
      <p className="doux">{m.appareil.intro}</p>

      <div className={ok ? 'encadre encadre-info' : 'encadre encadre-attention'}>
        <p style={{ margin: 0, fontWeight: 600 }}>
          {ok ? m.appareil.dansLaCible : m.appareil.horsCible}
        </p>
        {ok ? null : (
          <p className="petit" style={{ margin: '0.35rem 0 0' }}>
            {echecs.map((e) => e.nom).join(' · ')}
          </p>
        )}
      </div>

      <h2>{m.appareil.detail}</h2>
      <div className="carte-bloc">
        <div className="tableau-enveloppe">
          <table>
            <tbody>
              {VERIFS.map((v) => (
                <tr key={v.cle}>
                  <td>{v.nom}</td>
                  <td className="tres-petit doux mono">{v.depuis}</td>
                  <td>
                    <span
                      className={resultats[v.cle] ? 'etiquette et-vert' : 'etiquette et-rouge'}
                    >
                      {resultats[v.cle] ? 'oui' : 'non'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="carte-bloc">
        <div className="tableau-enveloppe">
          <table>
            <tbody>
              {contexte.map(([k, v]) => (
                <tr key={k}>
                  <td className="doux">{k}</td>
                  <td className="mono tres-petit" style={{ wordBreak: 'break-word' }}>
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tres-petit doux" style={{ margin: '0.5rem 0 0' }}>
          {langue === 'de-CH'
            ? 'Diese Angaben bleiben auf dem Geraet.'
            : langue === 'it-CH'
              ? 'Queste informazioni restano sul dispositivo.'
              : "Ces informations restent sur l'appareil : rien n'est transmis."}
        </p>
      </div>
    </>
  )
}
