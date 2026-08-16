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
 * Cinq bulles de même taille flottent et s'entrechoquent dans l'arène, chacune
 * portant la traduction d'une carte. Le recto s'affiche en haut, l'arrosoir suit
 * le pointeur, et l'élève arrose la bulle qui répond. La série dure vingt
 * secondes.
 *
 * Quatre partis pris, tous discutables et tous délibérés :
 *
 * 1. **Ce n'est PAS du rappel libre.** Choisir parmi cinq, c'est reconnaître,
 *    pas se souvenir. Les réponses partent en `rappelLibre: false`, comme le
 *    choix multiple de l'apprentissage : le blast fait progresser une carte
 *    mais ne peut jamais accorder la maîtrise à lui seul. C'est
 *    `appliquerReponse` du domaine qui porte cette règle, pas ce composant.
 * 2. **Seul le premier essai d'une question est enregistré.** Puisqu'on
 *    rejoue jusqu'à trouver, une carte finit toujours par être touchée : sans
 *    cette garde, il suffirait de crever les bulles une à une pour qu'une
 *    carte inconnue soit consignée correcte, et la progression mentirait.
 * 3. **La bulle fausse reste en jeu.** Elle porte un mot qui servira à une
 *    question suivante — la crever appauvrirait le vivier. Elle clignote en
 *    rouge, coûte une vie, et rien de plus.
 * 4. **Le mouvement réduit n'est pas un mouvement lent.** Sous
 *    `prefers-reduced-motion`, les bulles ne bougent pas, la goutte ne voyage
 *    pas — seuls le chronomètre et le flash de couleur, qui portent le jeu,
 *    sont conservés.
 *
 * L'animation, le chronomètre et l'angle de la buse écrivent directement dans le
 * DOM, jamais dans un état React : soixante rendus par seconde condamneraient
 * les téléphones les plus anciens du parc, qui sont la cible annoncée.
 */

type Phase = 'attente' | 'jeu' | 'termine'

interface Bulle {
  readonly cle: string
  readonly carte: CarteLocale
  x: number
  y: number
  vx: number
  vy: number
  /** Diamètre mesuré, en pixels. Identique pour toutes, d'où les chocs simples. */
  taille: number
  /** Fausse tant que la bulle n'a pas été mesurée et posée dans l'arène. */
  posee: boolean
}

/** Hauteur réservée à l'arrosoir au bas de l'arène, en pixels. */
const ZONE_ARROSOIR = 64
/** Durée du vol de la goutte, en millisecondes. */
const VOL_MS = 240
/** Durée du clignotement vert avant le remplacement de la bulle. */
const FLASH_JUSTE_MS = 380
/** Durée du clignotement rouge après une erreur. */
const FLASH_FAUX_MS = 520
/** La buse repose à la verticale quand elle ne vise rien. */
const ANGLE_REPOS = 0
/** Butée de rotation de la buse, en degrés de part et d'autre de la verticale. */
const ANGLE_MAXIMUM = 82
/** Le chronomètre passe en alerte sous ce seuil, en millisecondes. */
const URGENCE_MS = 5000
/** Bornes de la taille du texte d'une bulle, en pixels. */
const TEXTE_MAX = 17
const TEXTE_MIN = 9
/**
 * Part du diamètre laissée au texte. Le carré inscrit dans un cercle mesure
 * 0,707 fois son diamètre : au-delà, les coins du texte sortiraient du disque.
 */
const PART_TEXTE = 0.72

function vitesse(niveau: number): number {
  return Math.min(
    REGLES.BLAST_VITESSE_MAXIMUM_PX_S,
    REGLES.BLAST_VITESSE_INITIALE_PX_S + (niveau - 1) * REGLES.BLAST_ACCELERATION_PX_S,
  )
}

/**
 * Angle de la buse pour viser un point de l'arène, mesuré depuis la verticale
 * et dans le sens horaire — c'est ainsi que la buse est dessinée, ouverture
 * vers le haut.
 *
 * La butée l'empêche de se retourner vers le bas quand le pointeur passe sous
 * son embout : une buse pointée vers le sol arroserait le hors-jeu.
 */
function angleVers(arene: HTMLDivElement, cibleX: number, cibleY: number): number {
  const departX = arene.clientWidth / 2
  const departY = arene.clientHeight - ZONE_ARROSOIR / 2
  const brut = (Math.atan2(cibleX - departX, departY - cibleY) * 180) / Math.PI
  return Math.min(ANGLE_MAXIMUM, Math.max(-ANGLE_MAXIMUM, brut))
}

/**
 * Réduit le texte jusqu'à ce qu'il tienne dans le cercle.
 *
 * Toutes les bulles ayant la même taille, c'est le texte qui doit céder : une
 * bulle dimensionnée par son contenu trahirait la longueur de la réponse, et
 * « la bibliothèque municipale » se repérerait sans rien connaître du mot.
 */
function ajusterTexte(bulle: HTMLElement): void {
  const texte = bulle.firstElementChild
  if (!(texte instanceof HTMLElement)) return
  const dispo = bulle.clientHeight * PART_TEXTE
  // Deux débordements à surveiller, pas un : la hauteur quand le texte tient
  // sur trop de lignes, et la largeur quand un seul mot est trop long pour
  // la bulle. Ne contrôler que la hauteur laissait « la chambre » se faire
  // couper en deux au lieu de réduire la police.
  const deborde = () => texte.scrollWidth > texte.clientWidth || texte.offsetHeight > dispo
  let taille = TEXTE_MAX
  texte.style.fontSize = `${taille}px`
  while (taille > TEXTE_MIN && deborde()) {
    taille -= 1
    texte.style.fontSize = `${taille}px`
  }
}

/**
 * File des cartes : les moins avancées d'abord, mélangées. C'est elle qui
 * porte le biais pédagogique — les mots entrent dans l'arène dans cet ordre,
 * même si la question, elle, se choisit ensuite parmi les bulles présentes.
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
  const [bulles, setBulles] = useState<readonly Bulle[]>([])
  const [carte, setCarte] = useState<CarteLocale | null>(null)
  const [flash, setFlash] = useState<{ cle: string; juste: boolean } | null>(null)
  const [enVol, setEnVol] = useState(false)
  const [score, setScore] = useState(0)
  const [reussies, setReussies] = useState(0)
  // `REGLES` est figé par `as const` : sans annotation, l'état serait typé au
  // littéral 3 et le décrément refuserait de compiler.
  const [vies, setVies] = useState<number>(REGLES.BLAST_VIES)
  const [record, setRecord] = useState<number | undefined>(undefined)
  const [reduit, setReduit] = useState(false)

  const file = useRef<CarteLocale[]>([])
  const curseur = useRef(0)
  const compteurCle = useRef(0)
  const refArene = useRef<HTMLDivElement>(null)
  const refArrosoir = useRef<HTMLDivElement>(null)
  const refGoutte = useRef<HTMLDivElement>(null)
  const refChrono = useRef<HTMLDivElement>(null)
  const refChiffre = useRef<HTMLSpanElement>(null)
  const refBulles = useRef(new Map<string, HTMLButtonElement>())
  /** Position vivante des bulles, hors React : la boucle d'animation écrit ici. */
  const etatBulles = useRef<Bulle[]>([])
  /** La question en cours a-t-elle déjà été jugée ? Voir le parti pris 2. */
  const premierEssaiFait = useRef(false)
  /** Fin de la série, en temps `performance.now()`. */
  const finSerie = useRef(0)
  /** Miroirs du score et des vies, lisibles depuis les minuteries. */
  const scoreRef = useRef(0)

  const niveau = Math.floor(reussies / REGLES.BLAST_CARTES_PAR_NIVEAU) + 1

  useEffect(() => {
    setRecord(meilleurScore(jeu.id))
  }, [jeu])

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduit(mq.matches)
    const ecouter = (e: MediaQueryListEvent) => setReduit(e.matches)
    mq.addEventListener('change', ecouter)
    return () => mq.removeEventListener('change', ecouter)
  }, [])

  const terminer = useCallback(() => {
    enregistrerScore(jeu.id, scoreRef.current)
    setRecord(meilleurScore(jeu.id))
    setPhase('termine')
  }, [jeu])

  // ── Pioche ───────────────────────────────────────────────────────────────
  /**
   * Carte suivante dont le verso n'est pas déjà dans l'arène : deux bulles
   * portant le même texte rendraient une des deux « fausse » alors qu'elle
   * répond, ce qui serait indéfendable devant un élève.
   */
  const piocher = useCallback(
    (versosPresents: ReadonlySet<string>): CarteLocale | null => {
      for (let essais = 0; essais <= file.current.length; essais += 1) {
        if (curseur.current >= file.current.length) {
          file.current = fileDeCartes(jeu)
          curseur.current = 0
        }
        const c = file.current[curseur.current]
        curseur.current += 1
        if (c === undefined) return null
        if (!versosPresents.has(c.verso)) return c
      }
      return null
    },
    [jeu],
  )

  /**
   * Pose la question à partir des bulles présentes.
   *
   * C'est le renversement demandé : la question ne choisit plus ses réponses,
   * ce sont les réponses à l'écran qui décident de la question. On évite de
   * redemander la carte qu'on vient de traiter tant qu'une autre est possible.
   */
  const poserQuestion = useCallback((presentes: readonly Bulle[], eviter?: string) => {
    const possibles = presentes.filter((b) => b.carte.id !== eviter)
    const parmi = possibles.length > 0 ? possibles : presentes
    const choisie = parmi[Math.floor(Math.random() * parmi.length)]
    if (choisie === undefined) return
    premierEssaiFait.current = false
    setCarte(choisie.carte)
  }, [])

  // ── Démarrage ────────────────────────────────────────────────────────────
  function demarrer() {
    file.current = fileDeCartes(jeu)
    curseur.current = 0
    compteurCle.current = 0

    const versos = new Set<string>()
    const neuves: Bulle[] = []
    for (let k = 0; k < REGLES.BLAST_BULLES; k += 1) {
      const c = piocher(versos)
      if (c === null) break
      versos.add(c.verso)
      compteurCle.current += 1
      neuves.push({
        cle: `b${compteurCle.current}`,
        carte: c,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        taille: 0,
        posee: false,
      })
    }

    etatBulles.current = neuves
    refBulles.current.clear()
    scoreRef.current = 0
    finSerie.current = performance.now() + REGLES.BLAST_DUREE_SERIE_MS
    if (refArrosoir.current !== null) refArrosoir.current.style.transform = `rotate(${ANGLE_REPOS}deg)`
    setScore(0)
    setReussies(0)
    setVies(REGLES.BLAST_VIES)
    setFlash(null)
    setEnVol(false)
    setBulles(neuves)
    poserQuestion(neuves)
    setPhase('jeu')
  }

  // ── Mesure, texte et mise en place des bulles neuves ─────────────────────
  useEffect(() => {
    const arene = refArene.current
    if (arene === null) return
    const largeur = arene.clientWidth
    const hauteur = arene.clientHeight - ZONE_ARROSOIR

    for (const b of etatBulles.current) {
      if (b.posee) continue
      const el = refBulles.current.get(b.cle)
      if (el === undefined) continue
      b.taille = el.offsetWidth
      ajusterTexte(el)

      // Tirage par rejet : on cherche une place qui ne chevauche personne.
      // Après quarante essais on accepte la dernière — les chocs de la boucle
      // d'animation démêleront le tas en une fraction de seconde.
      const maxX = Math.max(0, largeur - b.taille)
      const maxY = Math.max(0, hauteur - b.taille)
      let x = 0
      let y = 0
      for (let essai = 0; essai < 40; essai += 1) {
        x = Math.random() * maxX
        y = Math.random() * maxY
        const libre = etatBulles.current.every((autre) => {
          if (autre === b || !autre.posee) return true
          const dx = autre.x - x
          const dy = autre.y - y
          return dx * dx + dy * dy >= b.taille * b.taille
        })
        if (libre) break
      }
      b.x = x
      b.y = y

      const v = vitesse(Math.floor(reussies / REGLES.BLAST_CARTES_PAR_NIVEAU) + 1)
      const angle = Math.random() * Math.PI * 2
      b.vx = Math.cos(angle) * v
      b.vy = Math.sin(angle) * v
      b.posee = true
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
    }
  }, [bulles, reussies])

  // ── Chronomètre de la série ──────────────────────────────────────────────
  // Une minuterie et non `requestAnimationFrame` : le temps doit s'écouler même
  // quand l'onglet passe en arrière-plan, sans quoi il suffirait de changer
  // d'onglet pour suspendre la série.
  useEffect(() => {
    if (phase !== 'jeu') return
    const battre = () => {
      const reste = Math.max(0, finSerie.current - performance.now())
      const jauge = refChrono.current
      if (jauge !== null) {
        jauge.style.width = `${((reste / REGLES.BLAST_DUREE_SERIE_MS) * 100).toFixed(1)}%`
        jauge.className =
          reste <= URGENCE_MS ? 'blast-chrono-reste blast-chrono-urgence' : 'blast-chrono-reste'
      }
      if (refChiffre.current !== null) refChiffre.current.textContent = (reste / 1000).toFixed(1)
      if (reste <= 0) terminer()
    }
    battre()
    const id = window.setInterval(battre, 100)
    return () => window.clearInterval(id)
  }, [phase, terminer])

  // ── L'arrosoir suit le pointeur ──────────────────────────────────────────
  // L'angle est écrit directement dans le style, coalescé par
  // `requestAnimationFrame` : un `pointermove` peut arriver bien plus souvent
  // qu'une image, et un rendu React par mouvement de souris achèverait les
  // téléphones les plus anciens du parc.
  useEffect(() => {
    if (phase !== 'jeu') return
    const arene = refArene.current
    if (arene === null) return

    let vise: { x: number; y: number } | null = null
    let image = 0

    const appliquer = () => {
      image = 0
      const arrosoir = refArrosoir.current
      if (arrosoir === null || vise === null) return
      arrosoir.style.transform = `rotate(${angleVers(arene, vise.x, vise.y).toFixed(1)}deg)`
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

  // ── Flottement et chocs ──────────────────────────────────────────────────
  useEffect(() => {
    // Le vol de la goutte fige les bulles : une goutte qui poursuit une cible
    // mobile rate visiblement son but alors que le verdict est déjà pris.
    if (phase !== 'jeu' || enVol || reduit) return
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
      const hauteur = arene.clientHeight - ZONE_ARROSOIR
      const vivantes = etatBulles.current

      for (const b of vivantes) {
        if (!b.posee) continue
        b.x += b.vx * dt
        b.y += b.vy * dt
        const maxX = Math.max(0, largeur - b.taille)
        const maxY = Math.max(0, hauteur - b.taille)
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
      }

      // Chocs élastiques. Toutes les bulles ayant le même diamètre, donc la
      // même masse, un choc se résout en échangeant les composantes normales
      // des vitesses — inutile de sortir la formule générale.
      for (let i = 0; i < vivantes.length; i += 1) {
        const a = vivantes[i]
        if (a === undefined || !a.posee) continue
        for (let j = i + 1; j < vivantes.length; j += 1) {
          const b = vivantes[j]
          if (b === undefined || !b.posee) continue
          const rayon = (a.taille + b.taille) / 2
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d2 = dx * dx + dy * dy
          if (d2 >= rayon * rayon || d2 === 0) continue
          const d = Math.sqrt(d2)
          const nx = dx / d
          const ny = dy / d
          // Séparation à parts égales, sinon les deux bulles restent collées
          // et se renvoient la balle à chaque image.
          const chevauchement = (rayon - d) / 2
          a.x -= nx * chevauchement
          a.y -= ny * chevauchement
          b.x += nx * chevauchement
          b.y += ny * chevauchement
          const va = a.vx * nx + a.vy * ny
          const vb = b.vx * nx + b.vy * ny
          if (va - vb <= 0) continue // elles s'éloignent déjà
          const echange = va - vb
          a.vx -= echange * nx
          a.vy -= echange * ny
          b.vx += echange * nx
          b.vy += echange * ny
        }
      }

      for (const b of vivantes) {
        const el = refBulles.current.get(b.cle)
        if (el === undefined || !b.posee) continue
        el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`
      }
      image = requestAnimationFrame(pas)
    }

    image = requestAnimationFrame(pas)
    return () => {
      vivant = false
      cancelAnimationFrame(image)
    }
  }, [phase, bulles, enVol, reduit])

  // ── Résolution d'un arrosage ─────────────────────────────────────────────
  const resoudre = useCallback(
    (b: Bulle) => {
      const juste = carte !== null && b.carte.id === carte.id
      if (carte !== null && !premierEssaiFait.current) {
        premierEssaiFait.current = true
        // Reconnaissance, jamais rappel libre : voir le parti pris 1.
        enregistrerReponse(jeu.id, carte.id, juste, false)
      }
      setFlash({ cle: b.cle, juste })
      setEnVol(false)

      if (!juste) {
        const restantes = vies - 1
        setVies(restantes)
        window.setTimeout(() => {
          setFlash(null)
          if (restantes <= 0) terminer()
        }, FLASH_FAUX_MS)
        return
      }

      setScore((s) => s + REGLES.BLAST_POINTS_PAR_CARTE * niveau)
      setReussies((n) => n + 1)
      // La bulle touchée cède la place à un mot neuf ; les quatre autres
      // restent, et la question suivante se choisit parmi elles.
      window.setTimeout(() => {
        const restantes = etatBulles.current.filter((x) => x.cle !== b.cle)
        const versos = new Set(restantes.map((x) => x.carte.verso))
        const neuve = piocher(versos)
        if (neuve !== null) {
          compteurCle.current += 1
          restantes.push({
            cle: `b${compteurCle.current}`,
            carte: neuve,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            taille: 0,
            posee: false,
          })
        }
        refBulles.current.delete(b.cle)
        etatBulles.current = restantes
        setFlash(null)
        setBulles(restantes)
        poserQuestion(restantes, b.carte.id)
      }, FLASH_JUSTE_MS)
    },
    [carte, jeu, niveau, vies, piocher, poserQuestion, terminer],
  )

  function arroser(b: Bulle) {
    if (phase !== 'jeu' || enVol || flash !== null) return
    const arene = refArene.current
    const arrosoir = refArrosoir.current
    const goutte = refGoutte.current
    if (arene === null) return

    // La buse vise le centre de la bulle. Le pointeur y est déjà, mais viser
    // explicitement couvre le tactile, où aucun `pointermove` ne précède le
    // geste.
    const vivante = etatBulles.current.find((x) => x.cle === b.cle) ?? b
    const departX = arene.clientWidth / 2
    const departY = arene.clientHeight - ZONE_ARROSOIR / 2
    const cibleX = vivante.x + vivante.taille / 2
    const cibleY = vivante.y + vivante.taille / 2
    if (arrosoir !== null) {
      arrosoir.style.transform = `rotate(${angleVers(arene, cibleX, cibleY).toFixed(1)}deg)`
    }

    if (reduit || goutte === null) {
      resoudre(vivante)
      return
    }

    setEnVol(true)
    goutte.style.opacity = '1'
    goutte.style.transform = `translate(${departX.toFixed(1)}px, ${departY.toFixed(1)}px)`

    const debut = performance.now()
    const voler = (t: number) => {
      const p = Math.min(1, (t - debut) / VOL_MS)
      const x = departX + (cibleX - departX) * p
      const y = departY + (cibleY - departY) * p
      goutte.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
      if (p < 1) {
        requestAnimationFrame(voler)
        return
      }
      goutte.style.opacity = '0'
      resoudre(vivante)
    }
    requestAnimationFrame(voler)
  }

  if (phase === 'attente') {
    return (
      <div className="carte-bloc">
        <p>{m.blast.intro}</p>
        {/* Chaque nom ouvre son fragment, jamais mis en minuscules : en
            allemand, « Leben » et « Stufe » s'écrivent avec une majuscule, et
            un `toLowerCase()` sur un message d'interface les rendrait fautifs. */}
        <p className="petit doux">
          {m.etude.temps} : {(REGLES.BLAST_DUREE_SERIE_MS / 1000).toFixed(0)} s · {m.blast.vies} :{' '}
          {REGLES.BLAST_VIES} · {m.blast.niveau} : {REGLES.BLAST_CARTES_PAR_NIVEAU}{' '}
          {m.blast.reussies}
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

  return (
    <>
      <div className="entre">
        <p className="petit doux" style={{ margin: 0 }}>
          {m.blast.niveau} <strong>{niveau}</strong> · {m.blast.score}{' '}
          <strong className="mono">{score}</strong> · {m.etude.temps}{' '}
          <strong className="mono">
            <span ref={refChiffre}>{(REGLES.BLAST_DUREE_SERIE_MS / 1000).toFixed(1)}</span> s
          </strong>
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

      <div className="blast-chrono" aria-hidden="true">
        <div className="blast-chrono-reste" ref={refChrono} />
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
          let classe = 'blast-bulle'
          if (flash?.cle === b.cle) {
            classe = flash.juste ? 'blast-bulle blast-bulle-juste' : 'blast-bulle blast-bulle-fausse'
          }
          return (
            <button
              key={b.cle}
              type="button"
              className={classe}
              lang={jeu.langueVerso}
              disabled={enVol || flash !== null}
              ref={(el) => {
                if (el === null) refBulles.current.delete(b.cle)
                else refBulles.current.set(b.cle, el)
              }}
              onClick={() => arroser(b)}
            >
              <span className="blast-bulle-texte">{b.carte.verso}</span>
            </button>
          )
        })}

        <div className="blast-goutte" ref={refGoutte} aria-hidden="true">
          <div className="blast-goutte-forme" />
        </div>

        <div className="blast-arrosoir" role="img" aria-label={m.blast.arrosoir}>
          <div className="blast-arrosoir-col" ref={refArrosoir} />
          <div className="blast-arrosoir-socle" />
        </div>
      </div>
    </>
  )
}
