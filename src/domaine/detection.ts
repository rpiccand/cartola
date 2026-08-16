/**
 * Détection automatique du format d'un contenu collé.
 *
 * C'est le geste le plus important du produit (EF-P.32) : un enseignant colle
 * ce qu'il a sous la main et cela doit marcher. On ne lui demande jamais de
 * déclarer d'où vient son texte — on le devine, on montre un aperçu, et on
 * laisse un sélecteur manuel en repli.
 */
export type FormatDetecte =
  | 'quizlet-tabulation'
  | 'point-virgule'
  | 'deux-points'
  | 'tiret'
  | 'virgule'
  | 'paragraphes'
  | 'inconnu'

export interface SeparateursDetectes {
  readonly format: FormatDetecte
  readonly separateurFaces: string | RegExp
  readonly separateurCartes: 'ligne' | 'double-ligne'
  /** Part des lignes non vides qui se découpent en exactement deux champs. */
  readonly confiance: number
  /** Le contenu se présente sous forme de liste numérotée. */
  readonly listeNumerotee: boolean
}

interface Candidat {
  readonly format: FormatDetecte
  readonly separateurFaces: string | RegExp
}

/**
 * Ordre volontaire : la tabulation d'abord, parce que c'est ce que produisent
 * l'export Quizlet et tout collage depuis un tableur, et parce qu'elle est la
 * moins ambiguë. La virgule en dernier, parce qu'elle apparaît aussi à
 * l'intérieur des définitions.
 */
const CANDIDATS: readonly Candidat[] = [
  { format: 'quizlet-tabulation', separateurFaces: '\t' },
  { format: 'point-virgule', separateurFaces: ';' },
  { format: 'deux-points', separateurFaces: ' : ' },
  { format: 'tiret', separateurFaces: / [-–—] / },
  { format: 'virgule', separateurFaces: ',' },
]

const LIGNE_NUMEROTEE = /^\s*\d+[.)]\s+/u

export function lignesUtiles(texte: string): string[] {
  return texte
    .split(/\r?\n/u)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

function decoupeEnDeux(ligne: string, separateur: string | RegExp): boolean {
  const parts = ligne.split(separateur as string)
  if (parts.length < 2) return false
  return parts[0].trim().length > 0 && parts.slice(1).join('').trim().length > 0
}

const INCONNU: SeparateursDetectes = {
  format: 'inconnu',
  separateurFaces: '\t',
  separateurCartes: 'ligne',
  confiance: 0,
  listeNumerotee: false,
}

export function detecterFormat(texte: string): SeparateursDetectes {
  const lignes = lignesUtiles(texte)
  if (lignes.length === 0) return INCONNU

  const listeNumerotee =
    lignes.filter((l) => LIGNE_NUMEROTEE.test(l)).length / lignes.length > 0.6

  let meilleur = INCONNU
  for (const candidat of CANDIDATS) {
    const confiance =
      lignes.filter((l) => decoupeEnDeux(l, candidat.separateurFaces)).length / lignes.length
    if (confiance > meilleur.confiance) {
      meilleur = {
        format: candidat.format,
        separateurFaces: candidat.separateurFaces,
        separateurCartes: 'ligne',
        confiance,
        listeNumerotee,
      }
    }
  }

  // Forme courante d'un copier-coller depuis une page web : un terme, un saut
  // de ligne, sa définition, puis une ligne vide.
  if (meilleur.confiance < 0.5 && /\n\s*\n/u.test(texte)) {
    const blocs = texte.split(/\n\s*\n/u).filter((b) => b.trim().length > 0)
    const paires =
      blocs.filter((b) => lignesUtiles(b).length === 2).length / Math.max(blocs.length, 1)
    if (paires > 0.6) {
      return {
        format: 'paragraphes',
        separateurFaces: '\n',
        separateurCartes: 'double-ligne',
        confiance: paires,
        listeNumerotee,
      }
    }
  }

  return meilleur
}
