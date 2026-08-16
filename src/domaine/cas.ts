import type { LangueContenu } from './langues'
import type { NiveauCorrection } from './normalisation'

/**
 * Jeu de cas de référence du moteur de correction.
 *
 * CE FICHIER EST NORMATIF. Il définit le comportement attendu du correcteur.
 * Si l'implémentation diverge, c'est l'implémentation qui a tort — sauf
 * décision explicite consignée dans `decisions/`.
 *
 * Objectif de concordance : 95 % minimum (EF-P.96).
 *
 * Pour ajouter un cas : décrire le comportement attendu AVANT de toucher au
 * code, et indiquer dans `note` pourquoi ce comportement est le bon. Un cas
 * sans justification est un cas qu'on modifiera à la première difficulté.
 */
export interface CasReference {
  readonly id: string
  readonly langue: LangueContenu
  readonly niveau: NiveauCorrection
  readonly attendu: string
  readonly saisie: string
  readonly correct: boolean
  readonly alternatives?: readonly string[]
  readonly multiples?: 'une' | 'toutes'
  readonly note?: string
}

const c = (
  id: string,
  langue: LangueContenu,
  niveau: NiveauCorrection,
  attendu: string,
  saisie: string,
  correct: boolean,
  extra: Partial<CasReference> = {},
): CasReference => ({ id, langue, niveau, attendu, saisie, correct, ...extra })

export const CAS_REFERENCE: readonly CasReference[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Correspondances exactes
  // ─────────────────────────────────────────────────────────────────────────
  c('exact-fr-1', 'fr', 'tolerant', 'la maison', 'la maison', true),
  c('exact-fr-2', 'fr', 'strict', 'la maison', 'la maison', true),
  c('exact-de-1', 'de', 'tolerant', 'das Haus', 'das Haus', true),
  c('exact-de-2', 'de', 'strict', 'das Haus', 'das Haus', true),
  c('exact-it-1', 'it', 'tolerant', 'la casa', 'la casa', true),
  c('exact-it-2', 'it', 'strict', 'la casa', 'la casa', true),
  c('exact-long-fr', 'fr', 'strict', 'la Révolution française', 'la Révolution française', true),
  c('exact-chiffre', 'autre', 'strict', '1291', '1291', true),

  // ─────────────────────────────────────────────────────────────────────────
  // Casse — jamais une faute, à aucun niveau
  // ─────────────────────────────────────────────────────────────────────────
  c('casse-fr-1', 'fr', 'strict', 'la Maison', 'la maison', true, {
    note: "La casse n'est pas évaluée : l'élève apprend un mot, pas une typographie.",
  }),
  c('casse-de-1', 'de', 'strict', 'das Haus', 'das haus', true, {
    note: "Les substantifs allemands prennent une majuscule, mais la sanctionner ici punirait la saisie mobile, pas la connaissance du mot.",
  }),
  c('casse-de-2', 'de', 'tolerant', 'Der Hund', 'DER HUND', true),
  c('casse-it-1', 'it', 'strict', 'Buongiorno', 'buongiorno', true),

  // ─────────────────────────────────────────────────────────────────────────
  // Espaces
  // ─────────────────────────────────────────────────────────────────────────
  c('espace-avant', 'fr', 'strict', 'le chien', '  le chien', true),
  c('espace-apres', 'fr', 'strict', 'le chien', 'le chien   ', true),
  c('espace-double', 'fr', 'strict', 'le chien', 'le  chien', true),
  c('espace-insecable', 'fr', 'strict', 'le chien', 'le chien', true, {
    note: 'Une espace insécable produite par un clavier mobile ne doit pas faire échouer.',
  }),
  c('espace-tab', 'de', 'strict', 'das Haus', 'das\tHaus', true),

  // ─────────────────────────────────────────────────────────────────────────
  // Ponctuation finale
  // ─────────────────────────────────────────────────────────────────────────
  c('ponct-point', 'fr', 'strict', 'la maison', 'la maison.', true),
  c('ponct-exclam', 'de', 'strict', 'guten Tag', 'guten Tag!', true),
  c('ponct-multiple', 'it', 'strict', 'ciao', 'ciao...', true),
  c('ponct-interne', 'fr', 'strict', "aujourd'hui, demain", "aujourd'hui demain", false, {
    note: "La ponctuation INTERNE est signifiante et n'est pas retirée.",
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Articles définis en tête — acceptés dans les deux sens
  // ─────────────────────────────────────────────────────────────────────────
  c('article-fr-omis', 'fr', 'strict', 'la maison', 'maison', true),
  c('article-fr-ajoute', 'fr', 'strict', 'maison', 'la maison', true),
  c('article-fr-elide', 'fr', 'strict', "l'école", 'école', true),
  c('article-fr-indefini', 'fr', 'strict', 'un chien', 'chien', true),
  c('article-de-omis', 'de', 'strict', 'der Hund', 'Hund', true),
  c('article-de-ajoute', 'de', 'strict', 'Hund', 'der Hund', true),
  c('article-de-faux-genre', 'de', 'strict', 'der Hund', 'die Hund', true, {
    note: "Le genre est un objectif d'apprentissage distinct du vocabulaire. Le sanctionner ici rendrait la correction imprévisible ; l'enseignant qui veut évaluer le genre le met dans la face de la carte, pas dans l'article.",
  }),
  c('article-it-omis', 'it', 'strict', 'il cane', 'cane', true),
  c('article-it-gli', 'it', 'strict', 'gli amici', 'amici', true),
  c('article-it-elide', 'it', 'strict', "l'acqua", 'acqua', true),
  c('article-interne', 'fr', 'strict', 'le tour de la France', 'tour de la France', true, {
    note: "Seul l'article INITIAL est retiré ; ceux du milieu restent signifiants.",
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Apostrophes et tirets typographiques
  // ─────────────────────────────────────────────────────────────────────────
  c('apostrophe-courbe', 'fr', 'strict', "l'hôpital", 'l’hôpital', true, {
    note: "iOS produit une apostrophe courbe, un clavier suisse une apostrophe droite. Ce n'est pas une faute.",
  }),
  c('apostrophe-it', 'it', 'strict', "un'amica", 'un’amica', true),
  c('tiret-cadratin', 'fr', 'strict', 'week-end', 'week—end', true),

  // ─────────────────────────────────────────────────────────────────────────
  // Accents — tolérés au niveau tolérant, exigés au niveau strict
  // ─────────────────────────────────────────────────────────────────────────
  c('accent-fr-tol', 'fr', 'tolerant', 'élève', 'eleve', true),
  c('accent-fr-strict', 'fr', 'strict', 'élève', 'eleve', false, {
    note: 'Le niveau strict est celui qu\'un enseignant choisit pour évaluer l\'orthographe.',
  }),
  c('accent-fr-tol-2', 'fr', 'tolerant', 'être', 'etre', true),
  c('accent-fr-partiel', 'fr', 'strict', 'élève', 'élève', true),
  c('accent-fr-mauvais', 'fr', 'strict', 'élève', 'éléve', false),
  c('accent-fr-mauvais-tol', 'fr', 'tolerant', 'élève', 'éléve', true),
  c('accent-de-tol', 'de', 'tolerant', 'schön', 'schon', true),
  c('accent-de-strict', 'de', 'strict', 'schön', 'schon', false),
  c('accent-de-umlaut-ae', 'de', 'tolerant', 'Häuser', 'Haeuser', true, {
    note: "La transcription ae/oe/ue est une graphie allemande admise ; elle passe par la tolérance de distance.",
  }),
  c('accent-it-tol', 'it', 'tolerant', 'perché', 'perche', true),
  c('accent-it-strict', 'it', 'strict', 'perché', 'perche', false),
  c('accent-it-grave-aigu', 'it', 'strict', 'perché', 'perchè', false, {
    note: "En italien, l'accent grave ou aigu change le mot. Le niveau strict le sanctionne.",
  }),
  c('accent-it-grave-aigu-tol', 'it', 'tolerant', 'perché', 'perchè', true),

  // ─────────────────────────────────────────────────────────────────────────
  // Le ß — cas suisse
  // ─────────────────────────────────────────────────────────────────────────
  c('eszett-strasse-strict', 'de', 'strict', 'die Straße', 'die Strasse', true, {
    note: "L'orthographe suisse n'utilise pas le ß et il n'est pas sur les claviers suisses. Un élève suisse ne PEUT PAS le saisir : le refuser serait absurde.",
  }),
  c('eszett-strasse-tol', 'de', 'tolerant', 'die Straße', 'die Strasse', true),
  c('eszett-inverse', 'de', 'strict', 'die Strasse', 'die Straße', true, {
    note: "Vrai dans les deux sens : une carte suisse doit accepter une saisie d'origine allemande.",
  }),
  c('eszett-gross', 'de', 'strict', 'groß', 'gross', true),
  c('eszett-fussball', 'de', 'tolerant', 'Fußball', 'Fussball', true),
  c('eszett-heissen', 'de', 'strict', 'heißen', 'heissen', true),

  // ─────────────────────────────────────────────────────────────────────────
  // Ligatures françaises
  // ─────────────────────────────────────────────────────────────────────────
  c('ligature-soeur', 'fr', 'strict', 'la sœur', 'la soeur', true),
  c('ligature-soeur-inverse', 'fr', 'strict', 'la soeur', 'la sœur', true),
  c('ligature-oeuf', 'fr', 'tolerant', "l'œuf", 'oeuf', true),

  // ─────────────────────────────────────────────────────────────────────────
  // Fautes de frappe dans la tolérance
  // ─────────────────────────────────────────────────────────────────────────
  c('typo-fr-1', 'fr', 'tolerant', 'maison', 'maisonn', true),
  c('typo-fr-2', 'fr', 'tolerant', 'bibliothèque', 'bibliotheque', true),
  c('typo-fr-3', 'fr', 'tolerant', 'gouvernement', 'gouvernment', true),
  c('typo-de-1', 'de', 'tolerant', 'Fenster', 'Fenstre', true),
  c('typo-de-2', 'de', 'tolerant', 'Krankenhaus', 'Krankenhauss', true),
  c('typo-it-1', 'it', 'tolerant', 'biblioteca', 'bibliotecha', true),
  c('typo-it-2', 'it', 'tolerant', 'formaggio', 'formagio', true),
  c('typo-lettre-manquante', 'fr', 'tolerant', 'chocolat', 'choclat', true),
  c('typo-lettre-doublee', 'de', 'tolerant', 'Schule', 'Schulle', true),

  // ─────────────────────────────────────────────────────────────────────────
  // Transpositions — l'erreur d'orthographe la plus fréquente
  // ─────────────────────────────────────────────────────────────────────────
  c('transpo-fr-1', 'fr', 'tolerant', 'jardin', 'jadrin', true),
  c('transpo-de-1', 'de', 'tolerant', 'Garten', 'Gartne', true),
  c('transpo-it-1', 'it', 'tolerant', 'giardino', 'giardnio', true),
  c('transpo-strict', 'fr', 'strict', 'jardin', 'jadrin', false, {
    note: 'Aucune tolérance au niveau strict, y compris pour une transposition.',
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Fautes hors tolérance
  // ─────────────────────────────────────────────────────────────────────────
  c('hors-tol-fr-1', 'fr', 'tolerant', 'maison', 'maisonnette', false),
  c('hors-tol-fr-2', 'fr', 'tolerant', 'chien', 'chat', false),
  c('hors-tol-de-1', 'de', 'tolerant', 'Hund', 'Katze', false),
  c('hors-tol-it-1', 'it', 'tolerant', 'cane', 'gatto', false),
  c('hors-tol-deux-fautes', 'fr', 'tolerant', 'maison', 'moison', true, {
    note: 'Une faute sur six caractères reste dans la tolérance.',
  }),
  c('hors-tol-trois-fautes', 'fr', 'tolerant', 'maison', 'moisan', false, {
    note: 'Deux fautes sur six caractères : au-delà de la tolérance.',
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Mots courts — aucune tolérance en dessous de quatre caractères
  // ─────────────────────────────────────────────────────────────────────────
  c('court-de-der-den', 'de', 'tolerant', 'den', 'dem', false, {
    note: "Sur trois caractères, une lettre change le mot. Tolérer reviendrait à accepter n'importe quel article.",
  }),
  c('court-it-il-el', 'it', 'tolerant', 'noi', 'voi', false),
  c('court-fr-eau', 'fr', 'tolerant', 'eau', 'oau', false),
  c('court-quatre', 'fr', 'tolerant', 'chat', 'chta', true, {
    note: 'À partir de quatre caractères, une faute est tolérée.',
  }),
  c('court-exact', 'de', 'tolerant', 'ja', 'ja', true),

  // ─────────────────────────────────────────────────────────────────────────
  // Réponses alternatives déclarées par l'enseignant
  // ─────────────────────────────────────────────────────────────────────────
  c('alt-fr-1', 'fr', 'strict', 'la voiture', "l'automobile", true, {
    alternatives: ["l'automobile", 'la bagnole'],
  }),
  c('alt-fr-2', 'fr', 'strict', 'la voiture', 'la bagnole', true, {
    alternatives: ["l'automobile", 'la bagnole'],
  }),
  c('alt-fr-3', 'fr', 'strict', 'la voiture', 'le vélo', false, {
    alternatives: ["l'automobile", 'la bagnole'],
  }),
  c('alt-tolerance', 'fr', 'tolerant', 'la voiture', 'automobil', true, {
    alternatives: ["l'automobile"],
    note: 'La tolérance de distance vaut aussi pour les alternatives.',
  }),
  c('alt-de-1', 'de', 'strict', 'das Fahrrad', 'das Velo', true, {
    alternatives: ['das Velo'],
    note: "« Velo » est l'usage suisse alémanique — exactement le cas pour lequel les alternatives existent.",
  }),
  c('alt-it-1', 'it', 'strict', 'la bicicletta', 'la bici', true, { alternatives: ['la bici'] }),
  c('alt-vide-ignoree', 'fr', 'strict', 'chien', 'chien', true, { alternatives: ['', '  '] }),

  // ─────────────────────────────────────────────────────────────────────────
  // Réponses multiples
  // ─────────────────────────────────────────────────────────────────────────
  c('mult-une-premiere', 'fr', 'strict', 'bonjour, salut, coucou', 'bonjour', true, {
    multiples: 'une',
  }),
  c('mult-une-derniere', 'fr', 'strict', 'bonjour, salut, coucou', 'coucou', true, {
    multiples: 'une',
  }),
  c('mult-une-absente', 'fr', 'strict', 'bonjour, salut, coucou', 'bonsoir', false, {
    multiples: 'une',
  }),
  c('mult-toutes-completes', 'fr', 'strict', 'rouge, vert, bleu', 'rouge, vert, bleu', true, {
    multiples: 'toutes',
  }),
  c('mult-toutes-desordre', 'fr', 'strict', 'rouge, vert, bleu', 'bleu, rouge, vert', true, {
    multiples: 'toutes',
    note: "L'ordre n'est pas signifiant dans une énumération.",
  }),
  c('mult-toutes-incompletes', 'fr', 'strict', 'rouge, vert, bleu', 'rouge, vert', false, {
    multiples: 'toutes',
  }),
  c('mult-separateur-slash', 'de', 'strict', 'gross / weit', 'weit', true, { multiples: 'une' }),
  c('mult-separateur-pv', 'it', 'strict', 'grande; largo', 'largo', true, { multiples: 'une' }),
  c('mult-tolerance', 'fr', 'tolerant', 'rouge, vert, bleu', 'rouge, verte, bleu', true, {
    multiples: 'toutes',
  }),
  c('mult-non-active', 'fr', 'strict', 'bonjour, salut', 'bonjour', false, {
    note: "Sans l'option, la réponse attendue est comparée telle quelle.",
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Saisies vides ou insignifiantes
  // ─────────────────────────────────────────────────────────────────────────
  c('vide-1', 'fr', 'tolerant', 'maison', '', false),
  c('vide-2', 'fr', 'strict', 'maison', '   ', false),
  c('vide-3', 'de', 'tolerant', 'Haus', '\t\n', false),
  c('vide-ponctuation-seule', 'fr', 'strict', 'maison', '...', false),

  // ─────────────────────────────────────────────────────────────────────────
  // Langues sans niveau tolérant — repli forcé en strict (EF-P.95)
  // ─────────────────────────────────────────────────────────────────────────
  c('non-tol-chiffre', 'autre', 'tolerant', '1291', '1219', false, {
    note: "Une transposition sur une date historique n'est pas une faute de frappe, c'est une erreur.",
  }),
  c('non-tol-formule', 'autre', 'tolerant', 'H2SO4', 'H2SO5', false, {
    note: 'Aucune tolérance sur une formule chimique.',
  }),
  c('non-tol-exact', 'autre', 'strict', 'H2SO4', 'H2SO4', true),
  c('non-tol-casse', 'autre', 'strict', 'CO2', 'co2', true, {
    note: 'La casse reste non évaluée, y compris hors des trois langues.',
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Expressions et groupes de mots
  // ─────────────────────────────────────────────────────────────────────────
  c('expr-fr-1', 'fr', 'tolerant', 'avoir de la chance', 'avoir de la chance', true),
  c('expr-fr-2', 'fr', 'tolerant', 'avoir de la chance', 'avoir de la chanse', true),
  c('expr-fr-3', 'fr', 'strict', 'avoir de la chance', 'avoir de la chanse', false),
  c('expr-de-1', 'de', 'tolerant', 'Glück haben', 'Glueck haben', true),
  c('expr-it-1', 'it', 'tolerant', 'avere fortuna', 'avere fortuna', true),
  c('expr-ordre', 'fr', 'strict', 'la Seconde Guerre mondiale', 'la seconde guerre mondiale', true),
  c('expr-ordre-faux', 'fr', 'strict', 'la Seconde Guerre mondiale', 'la Guerre mondiale seconde', false),

  // ─────────────────────────────────────────────────────────────────────────
  // Définitions longues — la tolérance croît avec la longueur
  // ─────────────────────────────────────────────────────────────────────────
  c(
    'long-fr-1',
    'fr',
    'tolerant',
    'ensemble des êtres vivants d\'un milieu',
    'ensemble des etres vivants d\'un milieu',
    true,
  ),
  c(
    'long-fr-2',
    'fr',
    'tolerant',
    'ensemble des êtres vivants d\'un milieu',
    'ensemble des etres vivant dun milieux',
    true,
    { note: 'Trois écarts sur trente-sept caractères restent dans la tolérance.' },
  ),
  c(
    'long-fr-3',
    'fr',
    'tolerant',
    'ensemble des êtres vivants d\'un milieu',
    'ensemble des choses dans un endroit',
    false,
    { note: 'Une reformulation correcte est refusée : c\'est la limite assumée d\'une correction sans compréhension sémantique. L\'enseignant déclare une alternative.' },
  ),
  c(
    'long-de-1',
    'de',
    'tolerant',
    'die Hauptstadt der Schweiz',
    'die Hauptstadt der Schweitz',
    true,
  ),

  // ─────────────────────────────────────────────────────────────────────────
  // Cas particuliers de saisie mobile
  // ─────────────────────────────────────────────────────────────────────────
  c('mobile-majuscule-auto', 'fr', 'strict', 'chien', 'Chien', true, {
    note: 'Les claviers mobiles capitalisent automatiquement le premier caractère.',
  }),
  c('mobile-espace-final', 'de', 'strict', 'Hund', 'Hund ', true, {
    note: 'La barre d\'espace après un mot est un réflexe.',
  }),
  c('mobile-point-auto', 'it', 'strict', 'cane', 'Cane.', true),

  // ─────────────────────────────────────────────────────────────────────────
  // Non-régressions issues d'incidents constatés
  // (à alimenter pendant le pilote, à partir des contestations réelles)
  // ─────────────────────────────────────────────────────────────────────────
  c('nonreg-attendu-vide', 'fr', 'strict', '', 'quelque chose', false, {
    note: 'Une carte mal formée ne doit pas faire planter la correction.',
  }),
  c('nonreg-tres-long', 'fr', 'tolerant', 'a'.repeat(200), 'a'.repeat(200), true),
  c('nonreg-emoji', 'fr', 'strict', 'le soleil', 'le soleil ☀️', false, {
    note: "Un emoji ajouté n'est pas la réponse attendue, mais ne doit pas provoquer d'erreur.",
  }),
  c('nonreg-nombre-texte', 'fr', 'strict', 'quatre-vingt-dix', 'nonante', true, {
    alternatives: ['nonante'],
    note: "Le romand dit « nonante ». C'est exactement l'usage des alternatives déclarées dans un produit suisse.",
  }),
  c('nonreg-huitante', 'fr', 'strict', 'quatre-vingts', 'huitante', true, {
    alternatives: ['huitante', 'octante'],
  }),
]

export const NB_CAS = CAS_REFERENCE.length
