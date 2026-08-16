import type { LangueContenu, LangueInterface } from '@/domaine'

/**
 * Jeux de démonstration.
 *
 * Contenu entièrement synthétique — aucune donnée réelle d'élève, nulle part,
 * jamais (CLAUDE.md §2.2). Ce sont des listes de vocabulaire scolaire banales,
 * choisies pour exercer les cas intéressants du correcteur : accents,
 * ligatures, `ß` du contenu allemand, articles initiaux, réponses multiples.
 */

export interface CarteDemo {
  readonly recto: string
  readonly verso: string
  readonly alternatives?: readonly string[]
}

export interface JeuDemo {
  readonly id: string
  readonly titre: string
  readonly matiere: string
  readonly langueRecto: LangueContenu
  readonly langueVerso: LangueContenu
  readonly cartes: readonly CarteDemo[]
}

/** Collages d'exemple proposés sur la page d'import, un par format. */
export interface ExempleCollage {
  readonly cle: string
  readonly etiquette: Record<LangueInterface, string>
  readonly contenu: string
}

const TAB = '\t'

const ALLEMAND: JeuDemo = {
  id: 'demo-allemand',
  titre: 'Allemand — la maison',
  matiere: 'Allemand',
  langueRecto: 'de',
  langueVerso: 'fr',
  cartes: [
    { recto: 'das Haus', verso: 'la maison' },
    { recto: 'die Straße', verso: 'la rue', alternatives: ['la route'] },
    { recto: 'der Schlüssel', verso: 'la clé', alternatives: ['la clef'] },
    { recto: 'das Fenster', verso: 'la fenêtre' },
    { recto: 'die Küche', verso: 'la cuisine' },
    { recto: 'der Garten', verso: 'le jardin' },
    { recto: 'das Dach', verso: 'le toit' },
    { recto: 'die Treppe', verso: "l'escalier" },
    { recto: 'der Keller', verso: 'la cave' },
    { recto: 'das Zimmer', verso: 'la chambre', alternatives: ['la pièce'] },
  ],
}

const ITALIEN: JeuDemo = {
  id: 'demo-italien',
  titre: 'Italien — au marché',
  matiere: 'Italien',
  langueRecto: 'it',
  langueVerso: 'fr',
  cartes: [
    { recto: 'il pane', verso: 'le pain' },
    { recto: 'la mela', verso: 'la pomme' },
    { recto: 'il formaggio', verso: 'le fromage' },
    { recto: "l'uovo", verso: "l'œuf" },
    { recto: 'la verdura', verso: 'le légume', alternatives: ['les légumes'] },
    { recto: 'il pesce', verso: 'le poisson' },
    { recto: 'la carne', verso: 'la viande' },
    { recto: 'il prezzo', verso: 'le prix' },
    { recto: 'la spesa', verso: 'les courses' },
    { recto: 'il mercato', verso: 'le marché' },
  ],
}

const SCIENCES: JeuDemo = {
  id: 'demo-sciences',
  titre: 'Sciences — le corps humain',
  matiere: 'Sciences de la nature',
  langueRecto: 'fr',
  langueVerso: 'fr',
  cartes: [
    { recto: 'Organe qui filtre le sang', verso: 'le rein', alternatives: ['les reins'] },
    { recto: 'Nombre de chambres du cœur', verso: 'quatre', alternatives: ['4'] },
    { recto: 'Gaz rejeté par la respiration', verso: 'le dioxyde de carbone', alternatives: ['CO2', 'gaz carbonique'] },
    { recto: 'Os le plus long du corps', verso: 'le fémur' },
    { recto: 'Organe de la digestion situé après l’estomac', verso: "l'intestin grêle" },
    { recto: 'Les trois osselets de l’oreille', verso: 'marteau, enclume, étrier' },
    { recto: 'Cellule qui transporte l’oxygène', verso: 'le globule rouge', alternatives: ['hématie', 'érythrocyte'] },
    { recto: 'Muscle qui sépare thorax et abdomen', verso: 'le diaphragme' },
  ],
}

export const JEUX_DEMO: readonly JeuDemo[] = [ALLEMAND, ITALIEN, SCIENCES]

/**
 * Exemples de collage. Le premier est un export Quizlet authentique dans sa
 * forme (tabulation entre les faces, retour à la ligne entre les cartes),
 * avec délibérément une ligne sans tabulation et un doublon : la vitrine doit
 * montrer que rien n'est écarté en silence.
 */
export const EXEMPLES_COLLAGE: readonly ExempleCollage[] = [
  {
    cle: 'quizlet',
    etiquette: {
      'fr-CH': 'Export Quizlet (tabulation)',
      'de-CH': 'Quizlet-Export (Tabulator)',
      'it-CH': 'Export Quizlet (tabulazione)',
    },
    contenu: [
      `das Haus${TAB}la maison`,
      `die Straße${TAB}la rue`,
      `der Schlüssel${TAB}la clé`,
      'die Küche',
      `das Fenster${TAB}la fenêtre`,
      `der Garten${TAB}le jardin`,
      `das Haus${TAB}la maison`,
      `das Dach${TAB}le toit`,
    ].join('\n'),
  },
  {
    cle: 'tableur',
    etiquette: {
      'fr-CH': 'Extrait de tableur (point-virgule)',
      'de-CH': 'Tabellenausschnitt (Semikolon)',
      'it-CH': 'Estratto di foglio di calcolo (punto e virgola)',
    },
    contenu: [
      'il pane;le pain',
      'la mela;la pomme',
      'il formaggio;le fromage',
      "l'uovo;l'œuf",
      'la verdura;le légume',
      'il pesce;le poisson',
    ].join('\n'),
  },
  {
    cle: 'liste',
    etiquette: {
      'fr-CH': 'Liste numérotée tapée à la main',
      'de-CH': 'Handgetippte nummerierte Liste',
      'it-CH': 'Lista numerata scritta a mano',
    },
    contenu: [
      '1. Organe qui filtre le sang : le rein',
      '2. Os le plus long du corps : le fémur',
      '3. Cellule qui transporte l’oxygène : le globule rouge',
      '4. Muscle qui sépare thorax et abdomen : le diaphragme',
      '5. Gaz rejeté par la respiration : le dioxyde de carbone',
      '6. Nombre de chambres du cœur : quatre',
    ].join('\n'),
  },
]
