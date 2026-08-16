import Link from 'next/link'
import type { LangueInterface } from '@/domaine'
import { messagesDe } from '@/i18n/messages'
import { JEUX_DEMO } from '@/donnees/demonstration'
import { CAS_REFERENCE } from '@/domaine'

export default async function Accueil({ params }: { params: Promise<{ langue: string }> }) {
  const { langue } = await params
  const l = langue as LangueInterface
  const m = messagesDe(l)

  return (
    <>
      <div className="encadre encadre-attention">
        <p className="petit" style={{ margin: 0 }}>
          {m.accueil.avertissement}
        </p>
      </div>

      <h1>{m.accueil.titre}</h1>
      <p className="doux" style={{ fontSize: '1.05rem', maxWidth: '38rem' }}>
        {m.accueil.accroche}
      </p>

      <div className="pile" style={{ margin: '1.25rem 0 2rem' }}>
        <Link className="bouton bouton-principal" href={`/${l}/creer`}>
          {m.accueil.commencer}
        </Link>
        <Link className="bouton" href={`/${l}/jeux`}>
          {m.nav.jeux}
        </Link>
      </div>

      <h2>{m.accueil.demonstration}</h2>
      <div className="grille grille-3">
        {JEUX_DEMO.map((j) => (
          <Link
            key={j.id}
            href={`/${l}/jeu/${j.id}`}
            className="carte-bloc"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <span className="etiquette et-neutre">{j.matiere}</span>
            <h3 style={{ marginTop: '0.5rem' }}>{j.titre}</h3>
            <p className="petit doux" style={{ margin: 0 }}>
              {j.cartes.length} {m.jeux.cartes}
            </p>
          </Link>
        ))}
      </div>

      <h2 style={{ marginTop: '2rem' }}>{m.correcteur.reference}</h2>
      <div className="carte-bloc">
        <p className="petit doux">{m.correcteur.referenceIntro}</p>
        <div className="pile">
          <span className="etiquette et-accent">{CAS_REFERENCE.length} cas</span>
          <Link className="bouton" href={`/${l}/correcteur`}>
            {m.correcteur.voirCas}
          </Link>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem' }}>{m.audio.titre}</h2>
      <div className="encadre encadre-info">
        <p className="petit" style={{ margin: 0 }}>
          {m.audio.texte}
        </p>
      </div>
    </>
  )
}
