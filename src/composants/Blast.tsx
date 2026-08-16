'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { REGLES, type LangueInterface } from '@/domaine'
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
 * Le recto s'affiche en haut, quatre bulles flottent en dessous, l'élève
 * clique celle qui porte la bonne traduction et le canon tire dessus.
 *
 * Trois partis pris, tous discutables et tous délibérés :
 *
 * 1. **Ce n'est PAS du rappel libre.** Choisir parmi quatre, c'est
 *    reconnaître, pas se souvenir. Les réponses partent donc en
 *    `rappelLibre: false`, exactement comme le choix multiple de
 *    l'apprentissage : le blast fait sortir une carte de « non commencé » et
 *    la ramène « en cours » sur une erreur, mais ne peut jamais accorder la
 *    maîtrise à lui seul. C'est `appliquerReponse` du domaine qui porte cette
 *    règle, pas ce composant.
 * 2. **Une erreur montre la bonne réponse.** La bulle cliquée vire au rouge et
 *    la bonne bulle éclate en vert au même instant : sans cela, l'élève paie
 *    une vie sans rien apprendre du tour qu'il vient de perdre.
 * 3. **Le mouvement réduit n'est pas un mouvement lent.** Sous
 *    `prefers-reduced-motion`, les bulles ne bougent pas, le boulet ne
 *    voyage pas, et le jeu reste entièrement jouable — seul le flash de
 *    couleur, qui porte le verdict, est conservé.
 *
 * L'animation passe par des écritures directes de `style.transform` depuis une
 * boucle `requestAnimationFrame`, jamais par un état React : soixante rendus
 * par seconde condamneraient les téléphones les plus anciens du parc, qui sont
 * précisément la cible annoncée.
 */

type Phase = 'attente' | 'visee' | 'tir' | 'rate' | 'verdict' | 'termine'

interface Bulle {
  readonly cle: string
  readonly texte: string
  readonly correcte: boolean
  x: number
  y: number
  vx: number
  vy: number
  largeur: number
  hauteur: number
}

/** Hauteur réservée au canon au bas de l'arène, en pixels. */
const ZONE_CANON = 64
/** Durée du vol du boulet, en millisecondes. */
const VOL_MS = 260
/** Durée d'affichage du verdict avant la question suivante. */
const VERDICT_MS = 900
/** Le canon repose à la verticale quand il ne vise rien. */
const ANGLE_REPOS = 0
/** Butée de rotation du fût, en degrés de part et d'autre de la verticale. */
const ANGLE_MAXIMUM = 82
/** Pause d'un essai raté avant de rendre la main, en millisecondes. */
const RATE_MS = 550

/**
 * Angle du fût pour viser un point de l'arène, mesuré depuis la verticale et
 * dans le sens horaire — c'est ainsi que le fût est dessiné, pointe en haut.
 *
 * La butée empêche le canon de se retourner vers le bas quand le pointeur
 * passe sous sa bouche : un canon pointé vers le sol tirerait vers le hors-jeu.
 */
function angleVers(arene: HTMLDivElement, cibleX: number, cibleY: number): number {
  const departX = arene.clientWidth / 2
  const departY = arene.clientHeight - ZONE_CANON / 2
  const brut = (Math.atan2(cibleX - departX, departY - cibleY) * 180) / Math.PI
  return Math.min(ANGLE_MAXIMUM, Math.max(-ANGLE_MAXIMUM, brut))
}

function vitesse(niveau: number): number {
  return Math.min(
    REGLES.BLAST_VITESSE_MAXIMUM_PX_S,
    REGLES.BLAST_VITESSE_INITIALE_PX_S + (niveau - 1) * REGLES.BLAST_ACCELERATION_PX_S,
  )
}

/**
 * File de la partie : les cartes les moins avancées d'abord, mélangées.
 * Épuisée, elle est reconstruite — une partie n'a pas de fin, seules les vies
 * l'arrêtent.
 */
function fileDeCartes(jeu: JeuLocal): CarteLocale[] {
  const progression = progressionDe(jeu.id)
  const rang = (c: CarteLocale) => {
    const e = progression[c.id]?.etat ?? 'non_commence'
    return e === 'maitrise' ? 2 : e === 'en_cours' ? 1 : 0
  }
  return melanger(jeu.cartes).sort((a, b) => rang(a) - rang(b))
}

/**
 * Les quatre propositions : la bonne, plus trois leurres pris sur d'autres
 * cartes du même jeu. Des leurres tirés du jeu lui-même sont plausibles, donc
 * discriminants — un leurre absurde ne teste rien.
 */
function options(jeu: JeuLocal, carte: CarteLocale): { texte: string; correcte: boolean }[] {
  const leurres = melanger(jeu.cartes.filter((c) => c.id !== carte.id && c.verso !== carte.verso))
    .slice(0, REGLES.BLAST_OPTIONS_PAR_QUESTION - 1)
    .map((c) => ({ texte: c.verso, correcte: false }))
  return melanger([{ texte: carte.verso, correcte: true }, ...leurres])
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
  const [bulles, setBulles] = useState<readonly Bulle[]>([])
  /** Bulles fausses déjà crevées sur la question en cours. */
  const [eclatees, setEclatees] = useState<readonly string[]>([])
  const [score, setScore] = useState(0)
  const [reussies, setReussies] = useState(0)
  // `REGLES` est figé par `as const` : sans annotation, l'état serait typé au
  // littéral 3 et le décrément refuserait de compiler.
  const [vies, setVies] = useState<number>(REGLES.BLAST_VIES)
  const [record, setRecord] = useState<number | undefined>(undefined)
  const [reduit, setReduit] = useState(false)

  const file = useRef<CarteLocale[]>([])
  const curseur = useRef(0)
  const refArene = useRef<HTMLDivElement>(null)
  const refCanon = useRef<HTMLDivElement>(null)
  const refBoulet = useRef<HTMLDivElement>(null)
  const refBulles = useRef(new Map<string, HTMLButtonElement>())
  /** Position vivante des bulles, hors React : la boucle d'animation écrit ici. */
  const etatBulles = useRef<Bulle[]>([])
  /**
   * La question a-t-elle déjà été jugée ?
   *
   * Depuis qu'un essai raté laisse rejouer, une carte finit toujours par être
   * trouvée. Seul le PREMIER essai est enregistré : sans cela, il suffirait de
   * crever les bulles une à une pour qu'une carte inconnue soit consignée
   * correcte, et la progression mentirait.
   */
  const premierEssaiFait = useRef(false)

  const niveau = Math.floor(reussies / REGLES.BLAST_CARTES_PAR_NIVEAU) + 1

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

  const lancerQuestion = useCallback(() => {
    if (jeu.cartes.length === 0) return
    if (curseur.current >= file.current.length) {
      file.current = fileDeCartes(jeu)
      curseur.current = 0
    }
    const suivante = file.current[curseur.current]
    if (suivante === undefined) return
    curseur.current += 1

    const v = vitesse(Math.floor(reussies / REGLES.BLAST_CARTES_PAR_NIVEAU) + 1)
    const neuves = options(jeu, suivante).map((o, k) => {
      // Direction initiale répartie sur les quatre diagonales : deux bulles
      // lancées au même cap se suivraient tout le tour sans jamais se croiser.
      const angle = (Math.PI / 4) * (1 + 2 * k)
      return {
        cle: `${suivante.id}-${k}`,
        texte: o.texte,
        correcte: o.correcte,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        largeur: 0,
        hauteur: 0,
      }
    })

    etatBulles.current = neuves
    refBulles.current.clear()
    premierEssaiFait.current = false
    setCarte(suivante)
    setBulles(neuves)
    setEclatees([])
    setPhase('visee')
  }, [jeu, reussies])

  // ── Placement initial, une fois les bulles mesurables ────────────────────
  // Dépend des bulles et NON de la phase : une erreur ramène en « visée », et
  // sur `phase` cet effet redistribuerait les bulles au hasard à chaque essai
  // raté — le joueur perdrait de vue celles qu'il vient d'éliminer.
  useEffect(() => {
    const arene = refArene.current
    if (arene === null) return
    // Le canon repart à la verticale à chaque question : laissé pointé sur la
    // bulle du tour précédent, il désignerait une cible qui n'existe plus.
    if (refCanon.current !== null) refCanon.current.style.transform = `rotate(${ANGLE_REPOS}deg)`

    const largeur = arene.clientWidth
    const hauteur = arene.clientHeight - ZONE_CANON

    etatBulles.current.forEach((b, k) => {
      const el = refBulles.current.get(b.cle)
      if (el === undefined) return
      b.largeur = el.offsetWidth
      b.hauteur = el.offsetHeight
      // Une bulle par quadrant : un tirage purement aléatoire les empile.
      const colonne = k % 2
      const ligne = Math.floor(k / 2)
      const caseL = Math.max(0, largeur / 2 - b.largeur)
      const caseH = Math.max(0, hauteur / 2 - b.hauteur)
      b.x = colonne * (largeur / 2) + Math.random() * caseL
      b.y = ligne * (hauteur / 2) + Math.random() * caseH
      el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`
    })
  }, [bulles])

  // ── Le canon suit le pointeur ────────────────────────────────────────────
  // L'angle est écrit directement dans le style, coalescé par
  // `requestAnimationFrame` : un `pointermove` peut arriver bien plus souvent
  // qu'une image, et un rendu React par mouvement de souris achèverait les
  // téléphones les plus anciens du parc.
  useEffect(() => {
    if (phase === 'attente' || phase === 'termine') return
    const arene = refArene.current
    if (arene === null) return

    let vise: { x: number; y: number } | null = null
    let image = 0

    const appliquer = () => {
      image = 0
      const canon = refCanon.current
      if (canon === null || vise === null) return
      canon.style.transform = `rotate(${angleVers(arene, vise.x, vise.y).toFixed(1)}deg)`
    }

    const suivre = (e: PointerEvent) => {
      const cadre = arene.getBoundingClientRect()
      vise = { x: e.clientX - cadre.left, y: e.clientY - cadre.top }
      if (image === 0) image = requestAnimationFrame(appliquer)
    }

    arene.addEventListener('pointermove', suivre)
    return () => {
      arene.removeEventListener('pointermove', suivre)
      if (image !== 0) cancelAnimationFrame(image)
    }
  }, [phase])

  // ── Rotation de l'écran ──────────────────────────────────────────────────
  // En mouvement normal, la boucle d'animation raccroche les bulles au cadre
  // à l'image suivante. En mouvement réduit il n'y a pas de boucle : sans ce
  // rattrapage, un téléphone tourné en portrait laisserait une bulle hors de
  // l'arène, donc hors d'atteinte, jusqu'à la question suivante.
  useEffect(() => {
    const recadrer = () => {
      const arene = refArene.current
      if (arene === null) return
      const maxLargeur = arene.clientWidth
      const maxHauteur = arene.clientHeight - ZONE_CANON
      for (const b of etatBulles.current) {
        const el = refBulles.current.get(b.cle)
        if (el === undefined) continue
        b.x = Math.min(Math.max(0, b.x), Math.max(0, maxLargeur - b.largeur))
        b.y = Math.min(Math.max(0, b.y), Math.max(0, maxHauteur - b.hauteur))
        el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`
      }
    }
    window.addEventListener('resize', recadrer)
    return () => window.removeEventListener('resize', recadrer)
  }, [])

  // ── Flottement des bulles ────────────────────────────────────────────────
  useEffect(() => {
    // Le vol du boulet fige les bulles : un boulet qui poursuit une cible
    // mobile rate visiblement son coup alors que le verdict, lui, est déjà pris.
    if (phase !== 'visee' || reduit) return
    const arene = refArene.current
    if (arene === null) return

    let dernier = performance.now()
    let image = 0
    let vivant = true

    const pas = (t: number) => {
      if (!vivant) return
      // Onglet en arrière-plan : requestAnimationFrame gèle, et sans ce
      // plafond les bulles feraient un bond de plusieurs secondes au retour.
      const dt = Math.min(t - dernier, 100) / 1000
      dernier = t
      const largeur = arene.clientWidth
      const hauteur = arene.clientHeight - ZONE_CANON

      for (const b of etatBulles.current) {
        const el = refBulles.current.get(b.cle)
        if (el === undefined) continue
        b.x += b.vx * dt
        b.y += b.vy * dt
        const maxX = Math.max(0, largeur - b.largeur)
        const maxY = Math.max(0, hauteur - b.hauteur)
        if (b.x <= 0) {
          b.x = 0
          b.vx = Math.abs(b.vx)
        } else if (b.x >= maxX) {
          b.x = maxX
          b.vx = -Math.abs(b.vx)
        }
        if (b.y <= 0) {
          b.y = 0
          b.vy = Math.abs(b.vy)
        } else if (b.y >= maxY) {
          b.y = maxY
          b.vy = -Math.abs(b.vy)
        }
        el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`
      }
      image = requestAnimationFrame(pas)
    }

    image = requestAnimationFrame(pas)
    return () => {
      vivant = false
      cancelAnimationFrame(image)
    }
  }, [phase, bulles, reduit])

  const conclure = useCallback(
    (b: Bulle) => {
      if (carte !== null && !premierEssaiFait.current) {
        premierEssaiFait.current = true
        // Reconnaissance, jamais rappel libre : voir le parti pris 1 en tête
        // de fichier. C'est le domaine qui refuse la maîtrise, pas cet appel.
        enregistrerReponse(jeu.id, carte.id, b.correcte, false)
      }
      if (b.correcte) {
        setScore((s) => s + REGLES.BLAST_POINTS_PAR_CARTE * niveau)
        setReussies((n) => n + 1)
        setPhase('verdict')
        return
      }
      // La bulle fausse reste crevée et la question continue : c'est le seul
      // moyen d'arriver à voir la bonne réponse, puisque rien ne la révèle.
      setEclatees((e) => [...e, b.cle])
      setVies((v) => v - 1)
      setPhase('rate')
    },
    [carte, jeu, niveau],
  )

  function tirer(b: Bulle) {
    if (phase !== 'visee' || eclatees.includes(b.cle)) return
    const arene = refArene.current
    const canon = refCanon.current
    const boulet = refBoulet.current
    if (arene === null) return

    // Le canon vise le centre de la bulle depuis la bouche, au bas de l'arène.
    // Le pointeur y est déjà, mais le viser explicitement couvre le tactile,
    // où aucun `pointermove` ne précède le tir.
    const vivante = etatBulles.current.find((x) => x.cle === b.cle) ?? b
    const departX = arene.clientWidth / 2
    const departY = arene.clientHeight - ZONE_CANON / 2
    const cibleX = vivante.x + vivante.largeur / 2
    const cibleY = vivante.y + vivante.hauteur / 2
    if (canon !== null) {
      canon.style.transform = `rotate(${angleVers(arene, cibleX, cibleY).toFixed(1)}deg)`
    }

    if (reduit || boulet === null) {
      conclure(vivante)
      return
    }

    setPhase('tir')
    boulet.style.opacity = '1'
    boulet.style.transform = `translate(${departX.toFixed(1)}px, ${departY.toFixed(1)}px)`

    const debut = performance.now()
    const voler = (t: number) => {
      const p = Math.min(1, (t - debut) / VOL_MS)
      const x = departX + (cibleX - departX) * p
      const y = departY + (cibleY - departY) * p
      boulet.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
      if (p < 1) {
        requestAnimationFrame(voler)
        return
      }
      boulet.style.opacity = '0'
      conclure(vivante)
    }
    requestAnimationFrame(voler)
  }

  const terminer = useCallback(() => {
    enregistrerScore(jeu.id, score)
    setRecord(meilleurScore(jeu.id))
    setPhase('termine')
  }, [jeu, score])

  // ── Après une bonne réponse : question suivante ──────────────────────────
  useEffect(() => {
    if (phase !== 'verdict') return
    const id = window.setTimeout(lancerQuestion, VERDICT_MS)
    return () => window.clearTimeout(id)
  }, [phase, lancerQuestion])

  // ── Après un essai raté : on rend la main sur la MÊME question ───────────
  useEffect(() => {
    if (phase !== 'rate') return
    const id = window.setTimeout(() => {
      if (vies <= 0) {
        terminer()
        return
      }
      setPhase('visee')
    }, RATE_MS)
    return () => window.clearTimeout(id)
  }, [phase, vies, terminer])

  function demarrer() {
    file.current = fileDeCartes(jeu)
    curseur.current = 0
    setScore(0)
    setReussies(0)
    setVies(REGLES.BLAST_VIES)
    if (refCanon.current !== null) refCanon.current.style.transform = `rotate(${ANGLE_REPOS}deg)`
    lancerQuestion()
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
          {REGLES.BLAST_CARTES_PAR_NIVEAU} {m.blast.reussies}
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
          {reussies} {m.blast.reussies} · {m.blast.niveau} {niveau}
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

  const verdictRendu = phase === 'verdict'

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

      {/* Pas de libellé au-dessus du mot : c'est le recto à traduire, pas une
          réponse, et l'écran d'attente a déjà énoncé la règle. */}
      <div className="blast-enonce" aria-live="polite">
        <p lang={jeu.langueRecto} className="blast-mot">
          {carte?.recto}
        </p>
      </div>

      <div className="blast-arene" ref={refArene}>
        {bulles.map((b) => {
          // Une bulle fausse reste rouge et hors jeu jusqu'à la question
          // suivante : c'est la trace de ce qui a déjà été éliminé.
          const crevee = eclatees.includes(b.cle)
          let classe = 'blast-bulle'
          if (crevee) classe = 'blast-bulle blast-bulle-fausse'
          else if (verdictRendu && b.correcte) classe = 'blast-bulle blast-bulle-juste'
          return (
            <button
              key={b.cle}
              type="button"
              className={classe}
              lang={jeu.langueVerso}
              disabled={crevee || phase !== 'visee'}
              ref={(el) => {
                if (el === null) refBulles.current.delete(b.cle)
                else refBulles.current.set(b.cle, el)
              }}
              onClick={() => tirer(b)}
            >
              {b.texte}
            </button>
          )
        })}

        <div className="blast-boulet" ref={refBoulet} aria-hidden="true" />

        <div className="blast-canon" role="img" aria-label={m.blast.canon}>
          <div className="blast-canon-fut" ref={refCanon} />
          <div className="blast-canon-socle" />
        </div>
      </div>
    </>
  )
}
