import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LANGUES_INTERFACE, type LangueInterface } from '@/domaine'
import { messagesDe } from '@/i18n/messages'
import { Entete } from '@/composants/Entete'
import '../global.css'

/**
 * Racine de l'application.
 *
 * Il n'y a délibérément pas de `app/layout.tsx` : la langue est le premier
 * segment de l'URL, donc c'est ici que se trouve la balise `<html lang>`.
 * C'est le motif d'internationalisation documenté par Next.js, et celui que
 * `next-intl` reprendra dans le prototype.
 */

export const metadata: Metadata = {
  title: 'cartula — vitrine de prototypage',
  description:
    "Vitrine de prototypage d'une plateforme d'apprentissage par cartes mémoire pour les écoles publiques suisses.",
  robots: { index: false, follow: false },
}

export function generateStaticParams(): { langue: string }[] {
  return LANGUES_INTERFACE.map((langue) => ({ langue }))
}

export default async function RacineLangue({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ langue: string }>
}) {
  const { langue } = await params
  if (!(LANGUES_INTERFACE as readonly string[]).includes(langue)) notFound()

  const l = langue as LangueInterface
  const m = messagesDe(l)

  return (
    <html lang={l}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <a className="saut" href="#contenu">
          {l === 'de-CH' ? 'Zum Inhalt' : l === 'it-CH' ? 'Vai al contenuto' : 'Aller au contenu'}
        </a>
        <Entete langue={l} messages={m} />
        <main id="contenu" className="page">
          {children}
        </main>
        <footer className="pied">
          <p>
            <strong>cartula</strong> — nom de code, vitrine de prototypage. Aucune donnée n'est
            envoyée à un serveur : tout est conservé dans ce navigateur.
          </p>
        </footer>
      </body>
    </html>
  )
}
