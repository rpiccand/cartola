import type { LangueContenu } from './langues'

/**
 * Niveaux de correction du prototype.
 *
 * Le cahier des charges complet en prévoit trois (souple / standard / strict).
 * Le prototype n'en retient que deux, parce que le niveau « souple » du produit
 * repose sur une évaluation sémantique, exclue du périmètre. Voir EF-P.91.
 */
export type NiveauCorrection = 'tolerant' | 'strict'

/**
 * Articles définis retirés en tête de réponse, par langue.
 *
 * Un élève qui écrit « le chien » quand on attend « chien » n'a pas fait
 * d'erreur de vocabulaire. L'inverse est vrai aussi.
 */
const ARTICLES: Record<LangueContenu, readonly string[]> = {
  fr: ['le', 'la', 'les', "l'", 'un', 'une', 'des'],
  de: ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer'],
  it: ['il', 'lo', 'la', 'i', 'gli', 'le', "l'", 'un', 'uno', 'una', "un'"],
  autre: [],
}

/** Ponctuation retirée en fin de chaîne, quel que soit le niveau. */
const PONCTUATION_FINALE = /[.!?;:,…]+$/u

/**
 * Apostrophes et guillemets typographiques ramenés à leur équivalent ASCII.
 * Un clavier suisse produit ' , un clavier iOS produit ’ — ce n'est pas une faute.
 */
const APOSTROPHES = /[‘’ʼ´`]/gu
const GUILLEMETS = /[“”«»]/gu

/** Tirets de toutes sortes ramenés au tiret simple. */
const TIRETS = /[‐‑‒–—―]/gu

export interface OptionsNormalisation {
  readonly niveau: NiveauCorrection
  readonly langue: LangueContenu
}

/**
 * Équivalences orthographiques appliquées aux DEUX niveaux, parce qu'il ne
 * s'agit pas de fautes mais de graphies également correctes.
 *
 * Le ß est le cas le plus important pour un produit suisse : l'orthographe
 * suisse ne l'utilise pas, il n'est pas sur les claviers suisses et il n'est
 * pas enseigné dans les écoles suisses. Un élève ne peut donc pas le saisir,
 * et « Strasse » doit être accepté pour une carte importée portant « Straße ».
 *
 * Les ligatures françaises relèvent de la même logique : « soeur » et « sœur »
 * sont deux graphies du même mot, pas une faute.
 */
function appliquerEquivalences(texte: string, langue: LangueContenu): string {
  let t = texte
  if (langue === 'de') {
    t = t.replace(/ß/gu, 'ss')
  }
  if (langue === 'fr') {
    t = t.replace(/œ/gu, 'oe').replace(/æ/gu, 'ae')
  }
  return t
}

/**
 * Retire les diacritiques en préservant les caractères qui ne sont pas
 * de simples lettres accentuées. Appliqué au seul niveau tolérant.
 */
function retirerDiacritiques(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/gu, '').normalize('NFC')
}

function retirerArticleInitial(texte: string, langue: LangueContenu): string {
  const articles = ARTICLES[langue]
  for (const article of articles) {
    if (article.endsWith("'")) {
      if (texte.startsWith(article)) return texte.slice(article.length).trimStart()
    } else if (texte.startsWith(`${article} `)) {
      return texte.slice(article.length + 1).trimStart()
    }
  }
  return texte
}

/**
 * Normalisation commune aux deux niveaux, puis normalisation propre au niveau.
 *
 * Ordre volontaire : les substitutions typographiques d'abord, parce que
 * le retrait d'article doit voir « l'eau » et non « l’eau ».
 */
export function normaliser(texte: string, options: OptionsNormalisation): string {
  let t = texte.normalize('NFC')

  t = t.replace(APOSTROPHES, "'").replace(GUILLEMETS, '"').replace(TIRETS, '-')
  t = t.replace(/\s+/gu, ' ').trim()
  t = t.toLocaleLowerCase(options.langue === 'autre' ? 'fr' : options.langue)
  t = t.replace(PONCTUATION_FINALE, '').trim()
  t = appliquerEquivalences(t, options.langue)
  t = retirerArticleInitial(t, options.langue)

  if (options.niveau === 'tolerant') {
    t = retirerDiacritiques(t)
  }

  return t.trim()
}
