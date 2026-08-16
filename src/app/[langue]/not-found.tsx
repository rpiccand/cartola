import Link from 'next/link'

export default function Introuvable() {
  return (
    <>
      <h1>404</h1>
      <p className="doux">Cette page n&apos;existe pas.</p>
      <Link className="bouton" href="/fr-CH">
        Accueil
      </Link>
    </>
  )
}
