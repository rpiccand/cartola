import type { NextConfig } from 'next'

/**
 * Vitrine de prototypage — voir README.
 *
 * `output: 'standalone'` est conservé même ici : c'est le test de portabilité
 * du dépôt principal. Si cette application se construit en image Docker, elle
 * se déploie ailleurs que sur la plateforme où elle est développée
 * (`decisions/0009`).
 *
 * Le `browserslist` de package.json fixe la cible à Safari 16.4, soit tout
 * appareil Apple de 2017 ou postérieur.
 */
const onVercel = process.env.VERCEL === '1'

const config: NextConfig = {
  ...(onVercel ? {} : { output: 'standalone' }),
  reactStrictMode: true,
  poweredByHeader: false,

  // La langue est le premier segment de l'URL : la racine renvoie vers la
  // langue par défaut. Redirection permanente assumée — l'URL sans langue
  // n'existe pas dans ce produit.
  async redirects() {
    return [{ source: '/', destination: '/fr-CH', permanent: false }]
  },

  async headers() {
    return [
      {
        source: '/:chemin*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          // Vitrine de démonstration : elle n'a rien à faire dans un index.
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
}

export default config
