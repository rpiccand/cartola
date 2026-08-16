'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LANGUES_INTERFACE, type LangueInterface } from '@/domaine'
import { MESSAGES, type Messages } from '@/i18n/messages'

const ONGLETS = [
  { chemin: '', cle: 'accueil' },
  { chemin: '/creer', cle: 'creer' },
  { chemin: '/jeux', cle: 'jeux' },
  { chemin: '/correcteur', cle: 'correcteur' },
  { chemin: '/appareil', cle: 'appareil' },
] as const

export function Entete({ langue, messages }: { langue: LangueInterface; messages: Messages }) {
  const chemin = usePathname() ?? `/${langue}`
  const reste = chemin.replace(`/${langue}`, '') || ''

  return (
    <header className="entete">
      <div className="entete-interieur">
        <Link className="marque" href={`/${langue}`}>
          cartula<span>.</span>
        </Link>

        <nav className="nav" aria-label={messages.nav.accueil}>
          {ONGLETS.map((o) => {
            const href = `/${langue}${o.chemin}`
            const actif = o.chemin === '' ? reste === '' : reste.startsWith(o.chemin)
            return (
              <Link key={o.cle} href={href} aria-current={actif ? 'page' : undefined}>
                {messages.nav[o.cle]}
              </Link>
            )
          })}
        </nav>

        <div className="langues" role="group" aria-label={messages.langue.changer}>
          {LANGUES_INTERFACE.map((l) => (
            <Link key={l} href={`/${l}${reste}`} aria-current={l === langue ? 'true' : undefined}>
              {l.slice(0, 2)}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
