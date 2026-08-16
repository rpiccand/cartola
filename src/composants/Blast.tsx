'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { corriger, REGLES, type LangueInterface } from '@/domaine'
import type { Messages } from '@/i18n/messages'
import {
  enregistrerReponse,
  enregistrerScore,
  meilleurScore,
  progressionDe,
  type CarteLocale,
  type JeuLocal,
} from '@/donnees/stockage'
import { melanger } from './melanger'

/**
 * Mode blast (arcade).
 *
 * Les cartes tombent, l'élève tape la traduction avant que la carte n'atteigne
 * la ligne. Trois partis pris, tous discutables et tous délibérés :
 *
 * 1. **Une tentative refusée ne consomme rien.** La carte continue de tomber
 *    et l'élève peut se reprendre. Enregistrer chaque frappe refusée
 *    inonderait la progression de faux échecs pour une simple faute de frappe
 *    sous la pression du chronomètre — seule l'issue de la carte est
 *    enregistrée, une fois.
 * 2. **C'est du rappel libre.** L'élève écrit la réponse sans la reconnaître
 *    parmi d'autres : le blast fait donc progresser vers la maîtrise, au même
 *    titre que la révision, et contrairement au choix multiple de
 *    l'apprentissage. C'est `appliquerReponse` du domaine qui tranche, pas ce
 *    composant.
 * 3. **Le mouvement réduit n'est pas un mouvement lent.** Sous
 *    `prefers-reduced-motion`, la carte ne bouge pas du tout : le temps
 *    restant est porté par une jauge. Le jeu reste jouable et le
 *    chronométrage identique.
 */

type Phase = 'attente' | 'chute' | 'touchee' | 'ratee' | 'termine'

/** Marge basse, en pixels : la carte s'arrête au-dessus de la ligne, pas dessus. */
const MARGE_SOL = 6

/** Pause après une carte détruite, puis après une carte échappée. */
const PAUSE_TOUCHEE_MS = 700
const PAUSE_RATEE_MS = 1600

function dureeChute(niveau: number): number {
  return Math.max(
    REGLES.BLAST_CHUTE_MINIMUM_MS,
    REGLES.BLAST_CHUTE_INITIALE_MS - (niveau - 1) * REGLES.BLAST_ACCELERATION_MS,
  )
}

/**
 * File de la partie : les cartes les moins avancées d'abord, mélangées.
 * Épuisée, elle est reconstruite — une partie de blast n'a pas de fin, seules
 * les vies l'arrêtent.
 */
function fileDeCartes(jeu: JeuLocal): CarteLocale[] {
  const progression = progressionDe(jeu.id)
  const rang = (c: CarteLocale) => {
    const e = progression[c.id]?.etat ?? 'non_commence'
    return e === 'maitrise' ? 2 : e === 'en_cours' ? 1 : 0
  }
  return melanger(jeu.cartes).sort((a, b) => rang(a) - rang(b))
}

export function Blast({
  jeu,
  langue,
  messages,
}: {
  jeu: JeuLocal
  langue: LangueInterface
  messages: Messages
}) {
  const m = messages
  const [phase, setPhase] = useState<Phase>('attente')
  const [carte, setCarte] = useState<CarteLocale | null>(null)
  const [saisie, setSaisie] = useState('')
  const [refusee, setRefusee] = useState(false)
  const [score, setScore] = useState(0)
  const [detruites, setDetruites] = useState(0)
  // `REGLES` est figé par `as const` : sans annotation, l'état serait typé au
  // littéral 3 et le décrément refuserait de compiler.
  const [vies, setVies] = useState<number>(REGLES.BLAST_VIES)
  const [record, setRecord] = useState<number | undefined>(undefined)
  const [reduit, setReduit] = useState(false)

  const file = useRef<CarteLocale[]>([])
  const curseur = useRef(0)
  const refCiel = useRef<HTMLDivElement>(null)
  const refMeteore = useRef<HTMLDivElement>(null)
  const refJauge = useRef<HTMLDivElement>(null)
  const champ = useRef<HTMLInputElement>(null)

  const niveau = Math.floor(detruites / REGLES.BLAST_CARTES_PAR_NIVEAU) + 1

  useEffect(() => {
    setRecord(meilleurScore(jeu.id))
  }, [jeu])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduit(mq.matches)
    const ecouter = (e: MediaQueryListEvent) => setReduit(e.matches)
    mq.addEventListener('change', ecouter)
    return () => mq.removeEventListener('change', ecouter)
  }, [])

  const lancerCarte = useCallback(() => {
    if (jeu.cartes.length === 0) return
    if (curseur.current >= file.current.length) {
      file.current = fileDeCartes(jeu)
      curseur.current = 0
    }
    const suivante = file.current[curseur.current]
    if (suivante === undefined) return
    curseur.current += 1
    setCarte(suivante)
    setSaisie('')
    setRefusee(false)
    setPhase('chute')
  }, [jeu])

  // Le focus est repris ici et pas dans `lancerCarte` : au démarrage, le champ
  // n'existe pas encore au moment de l'appel — l'écran d'attente est toujours
  // à l'écran tant que `setPhase` n'a pas été rendu.
  useEffect(() => {
    if (phase === 'chute') champ.current?.focus()
  }, [phase, carte])

  const rater = useCallback(() => {
    const c = carte
    if (c === null) return
    enregistrerReponse(jeu.id, c.id, false, true)
    setVies((v) => v - 1)
    setPhase('ratee')
  }, [carte, jeu])

  // ── Chute ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'chute' || carte === null) return
    const ciel = refCiel.current
    const bloc = refMeteore.current
    const jauge = refJauge.current
    if (ciel === null || bloc === null) return

    const course = Math.max(0, ciel.clientHeight - bloc.offsetHeight - MARGE_SOL)
    const duree = dureeChute(niveau)
    bloc.style.transform = 'translateY(0px)'
    if (jauge !== null) jauge.style.width = '0%'

    let ecoule = 0
    let dernier = performance.now()
    let image = 0
    let vivant = true

    const pas = (t: number) => {
      if (!vivant) return
      // Un onglet mis en arrière-plan gèle requestAnimationFrame. Sans ce
      // plafond, le premier pas au retour vaudrait plusieurs secondes et
      // condamnerait la carte sans que l'élève ait rien vu.
      ecoule += Math.min(t - dernier, 100)
      dernier = t
      const p = Math.min(1, ecoule / duree)
      if (reduit) {
        if (jauge !== null) jauge.style.width = `${(p * 100).toFixed(1)}%`
      } else {
        bloc.style.transform = `translateY(${(p * course).toFixed(1)}px)`
      }
      if (p >= 1) {
        rater()
        return
      }
      image = requestAnimationFrame(pas)
    }

    image = requestAnimationFrame(pas)
    return () => {
      vivant = false
      cancelAnimationFrame(image)
    }
  }, [phase, carte, niveau, reduit, rater])

  // ── Entre deux cartes ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'touchee' && phase !== 'ratee') return
    const attente = phase === 'ratee' ? PAUSE_RATEE_MS : PAUSE_TOUCHEE_MS
    const id = window.setTimeout(() => {
      if (vies <= 0) {
        enregistrerScore(jeu.id, score)
        setRecord(meilleurScore(jeu.id))
        setPhase('termine')
        return
      }
      lancerCarte()
    }, attente)
    return () => window.clearTimeout(id)
  }, [phase, vies, score, jeu, lancerCarte])

  function demarrer() {
    file.current = fileDeCartes(jeu)
    curseur.current = 0
    setScore(0)
    setDetruites(0)
    setVies(REGLES.BLAST_VIES)
    lancerCarte()
  }

  function verifier() {
    if (phase !== 'chute' || carte === null) return
    const v = corriger(saisie, carte.verso, {
      niveau: 'tolerant',
      langue: jeu.langueVerso,
      reponsesAlternatives: carte.alternatives,
    })
    if (!v.correct) {
      setRefusee(true)
      return
    }
    enregistrerReponse(jeu.id, carte.id, true, true)
    setScore((s) => s + REGLES.BLAST_POINTS_PAR_CARTE * niveau)
    setDetruites((n) => n + 1)
    setSaisie('')
    setPhase('touchee')
  }

  if (phase === 'attente') {
    return (
      <div className="carte-bloc">
        <p>{m.blast.intro}</p>
        {/* Chaque nom ouvre son fragment, jamais mis en minuscules : en
            allemand, « Leben » et « Stufe » s'écrivent avec une majuscule, et
            un `toLowerCase()` sur un message d'interface les rendrait fautifs. */}
        <p className="petit doux">
          {m.blast.vies} : {REGLES.BLAST_VIES} · {m.blast.niveau} :{' '}
          {REGLES.BLAST_CARTES_PAR_NIVEAU} {m.blast.detruites}
          {record !== undefined ? (
            <>
              {' · '}
              {m.blast.meilleurScore} <strong className="mono">{record}</strong>
            </>
          ) : null}
        </p>
        <div className="pile">
          <button type="button" className="bouton bouton-principal" onClick={demarrer}>
            {m.blast.demarrer}
          </button>
          <Link className="bouton" href={`/${langue}/jeu/${jeu.id}`}>
            {m.jeu.retour}
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'termine') {
    return (
      <div className="carte-bloc" style={{ textAlign: 'center' }}>
        <h2>{m.blast.partieTerminee}</h2>
        <p className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
          {score}
        </p>
        <p className="petit doux">
          {detruites} {m.blast.detruites} · {m.blast.niveau} {niveau}
          {record !== undefined ? (
            <>
              {' · '}
              {m.blast.meilleurScore} <strong className="mono">{record}</strong>
            </>
          ) : null}
        </p>
        <div className="pile" style={{ justifyContent: 'center' }}>
          <button type="button" className="bouton bouton-principal" onClick={demarrer}>
            {m.etude.recommencer}
          </button>
          <Link className="bouton" href={`/${langue}/jeu/${jeu.id}`}>
            {m.jeu.retour}
          </Link>
        </div>
      </div>
    )
  }

  let classeBloc = 'blast-bloc'
  if (phase === 'touchee') classeBloc = 'blast-bloc blast-bloc-touche'
  else if (phase === 'ratee') classeBloc = 'blast-bloc blast-bloc-rate'

  return (
    <>
      <div className="entre">
        <p className="petit doux" style={{ margin: 0 }}>
          {m.blast.niveau} <strong>{niveau}</strong> · {m.blast.score}{' '}
          <strong className="mono">{score}</strong>
          {record !== undefined ? (
            <span className="tres-petit">
              {' '}
              · {m.blast.meilleurScore} {record}
            </span>
          ) : null}
        </p>
        <p className="petit doux" style={{ margin: 0 }}>
          {m.blast.vies} <strong>{Math.max(0, vies)}</strong>
          {/* Les pastilles doublent le chiffre, elles ne le remplacent pas :
              la couleur seule ne porte jamais une information ici. */}
          <span className="blast-vies" aria-hidden="true">
            {Array.from({ length: REGLES.BLAST_VIES }, (_, k) => (
              <span key={k} className={k < vies ? 'blast-vie' : 'blast-vie blast-vie-perdue'} />
            ))}
          </span>
        </p>
      </div>

      <div className="blast-ciel" ref={refCiel} style={{ marginTop: '0.75rem' }}>
        <div className="blast-meteore" ref={refMeteore} aria-live="polite">
          <span className={classeBloc} lang={jeu.langueRecto}>
            {carte?.recto}
          </span>
        </div>
        <div className={phase === 'ratee' ? 'blast-sol blast-sol-touche' : 'blast-sol'} />
        {reduit ? <div className="blast-compte" ref={refJauge} /> : null}
      </div>

      <form
        style={{ marginTop: '0.75rem' }}
        onSubmit={(e) => {
          e.preventDefault()
          verifier()
        }}
      >
        <div className="champ">
          <label htmlFor="blast-rep">{m.etude.votreReponse}</label>
          <input
            id="blast-rep"
            ref={champ}
            type="text"
            value={saisie}
            lang={jeu.langueVerso}
            className={refusee ? 'champ-refuse' : undefined}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            readOnly={phase !== 'chute'}
            onChange={(e) => {
              setSaisie(e.target.value)
              setRefusee(false)
            }}
          />
        </div>
        <button type="submit" className="bouton bouton-principal" disabled={phase !== 'chute'}>
          {m.etude.verifier}
        </button>
      </form>

      {phase === 'ratee' && carte !== null ? (
        <div className="encadre encadre-attention" style={{ marginTop: '0.75rem' }}>
          <span className="etiquette et-rouge">{m.blast.echappee}</span>{' '}
          <span className="petit">
            {m.etude.attendu} : <strong lang={jeu.langueVerso}>{carte.verso}</strong>
          </span>
        </div>
      ) : null}
    </>
  )
}
