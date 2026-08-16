import type { LangueInterface } from '@/domaine'

/**
 * Messages d'interface.
 *
 * Le prototype utilisera `next-intl` avec des fichiers ICU séparés ; ici, un
 * simple objet typé suffit et évite une couche de configuration. La structure
 * est identique, la migration sera mécanique.
 *
 * ⚠️ `de-CH` : le caractère `ß` est proscrit dans l'interface. La Suisse ne
 * l'utilise pas, il n'est pas sur les claviers suisses et il n'est pas
 * enseigné dans les écoles suisses. Il reste autorisé dans le CONTENU des
 * cartes — une carte d'allemand peut légitimement en contenir un.
 */
export interface Messages {
  langue: { nom: string; changer: string }
  nav: { accueil: string; creer: string; jeux: string; correcteur: string; appareil: string }
  accueil: {
    titre: string
    accroche: string
    commencer: string
    demonstration: string
    avertissement: string
  }
  creer: {
    titre: string
    intro: string
    coller: string
    exemples: string
    format: string
    confiance: string
    cartes: string
    ecartees: string
    rienEnSilence: string
    titreJeu: string
    langueRecto: string
    langueVerso: string
    recto: string
    verso: string
    enregistrer: string
    vide: string
  }
  jeux: { titre: string; aucun: string; cartes: string; supprimer: string; ouvrir: string }
  jeu: {
    reviser: string
    reviserDesc: string
    apprendre: string
    apprendreDesc: string
    associer: string
    associerDesc: string
    blast: string
    blastDesc: string
    maitrise: string
    reinitialiser: string
    retour: string
  }
  blast: {
    intro: string
    demarrer: string
    niveau: string
    score: string
    meilleurScore: string
    vies: string
    reussies: string
    partieTerminee: string
    /** Nom accessible du canon, annoncé aux lecteurs d'écran. */
    canon: string
  }
  etude: {
    jeSais: string
    aRevoir: string
    jeNeSaisPas: string
    reponseCorrecte: string
    verifier: string
    suivant: string
    votreReponse: string
    termine: string
    recommencer: string
    manche: string
    sur: string
    accepte: string
    refuse: string
    attendu: string
    temps: string
    meilleurTemps: string
    paires: string
  }
  maitrise: { non_commence: string; en_cours: string; maitrise: string }
  correcteur: {
    titre: string
    intro: string
    langueCarte: string
    niveau: string
    tolerant: string
    strict: string
    attendu: string
    alternatives: string
    alternativesAide: string
    saisie: string
    reference: string
    referenceIntro: string
    concordance: string
    voirCas: string
  }
  appareil: { titre: string; intro: string; dansLaCible: string; horsCible: string; detail: string }
  audio: { titre: string; texte: string }
}

const FR: Messages = {
  langue: { nom: 'Français', changer: 'Langue' },
  nav: { accueil: 'Accueil', creer: 'Créer', jeux: 'Mes jeux', correcteur: 'Correcteur', appareil: 'Appareil' },
  accueil: {
    titre: 'Apprendre avec des cartes',
    accroche:
      "Collez votre liste de vocabulaire, et révisez. Rien à installer, rien à configurer.",
    commencer: 'Créer un jeu de cartes',
    demonstration: 'Ou essayez un jeu de démonstration',
    avertissement:
      "Vitrine de prototypage. Tout reste sur cet appareil : rien n'est envoyé nulle part, rien n'est conservé sur un serveur.",
  },
  creer: {
    titre: 'Créer un jeu',
    intro:
      "Collez un export Quizlet, un extrait de tableur ou n'importe quelle liste. Le format est deviné.",
    coller: 'Collez votre contenu',
    exemples: 'Exemples à essayer',
    format: 'Format détecté',
    confiance: 'confiance',
    cartes: 'cartes reprises',
    ecartees: 'lignes écartées, avec leur motif',
    rienEnSilence:
      "Rien n'est écarté en silence : vous voyez ce qui manque et pouvez corriger avant d'enregistrer.",
    titreJeu: 'Titre du jeu',
    langueRecto: 'Langue du recto',
    langueVerso: 'Langue du verso',
    recto: 'Recto',
    verso: 'Verso',
    enregistrer: 'Enregistrer ce jeu',
    vide: 'Collez du contenu pour voir l’aperçu.',
  },
  jeux: { titre: 'Mes jeux', aucun: "Aucun jeu pour l'instant.", cartes: 'cartes', supprimer: 'Supprimer', ouvrir: 'Ouvrir' },
  jeu: {
    reviser: 'Révision',
    reviserDesc: 'Feuilleter les cartes et les trier',
    apprendre: 'Apprentissage',
    apprendreDesc: 'Questions adaptées à ce que vous savez déjà',
    associer: 'Association',
    associerDesc: 'Relier les paires contre le chronomètre',
    blast: 'Blast',
    blastDesc: 'Tirer sur la bulle qui porte la bonne traduction',
    maitrise: 'Maîtrise',
    reinitialiser: 'Réinitialiser la progression',
    retour: 'Retour',
  },
  blast: {
    intro:
      "Vingt secondes pour placer le plus de réponses possible. Cinq bulles flottent et rebondissent l'une sur l'autre, le mot à traduire s'affiche en haut, le canon suit votre souris : cliquez sur la bulle qui répond, il tire dessus. Juste, elle éclate et cède la place à un mot neuf ; les autres restent, et la question suivante porte sur l'une d'elles. Faux, la bulle vire au rouge, coûte une vie, et vous rejouez sur la même question jusqu'à trouver. Trois vies.",
    demarrer: 'Démarrer',
    niveau: 'Niveau',
    score: 'Score',
    meilleurScore: 'Meilleur score',
    vies: 'Vies',
    reussies: 'bonnes réponses',
    partieTerminee: 'Partie terminée',
    canon: 'Canon',
  },
  etude: {
    jeSais: 'Je sais',
    aRevoir: 'À revoir',
    jeNeSaisPas: 'Je ne sais pas',
    reponseCorrecte: 'Ma réponse était correcte',
    verifier: 'Vérifier',
    suivant: 'Suivant',
    votreReponse: 'Votre réponse',
    termine: 'Terminé',
    recommencer: 'Recommencer',
    manche: 'Manche',
    sur: 'sur',
    accepte: 'Accepté',
    refuse: 'Refusé',
    attendu: 'Attendu',
    temps: 'Temps',
    meilleurTemps: 'Meilleur temps',
    paires: 'paires',
  },
  maitrise: { non_commence: 'Non commencé', en_cours: 'En cours', maitrise: 'Maîtrisé' },
  correcteur: {
    titre: 'Correcteur',
    intro:
      "Le moteur de correction du prototype. Tapez une réponse d'élève et voyez le verdict, le différentiel et la tolérance appliquée.",
    langueCarte: 'Langue de la carte',
    niveau: 'Niveau de correction',
    tolerant: 'Tolérant',
    strict: 'Strict',
    attendu: 'Réponse attendue',
    alternatives: 'Réponses alternatives acceptées',
    alternativesAide: 'séparées par une barre oblique',
    saisie: "Réponse de l'élève",
    reference: 'Jeu de référence',
    referenceIntro:
      "Les cas qui définissent le comportement du correcteur, exécutés à l'instant dans cette page. C'est la spécification : si un verdict vous paraît faux, c'est ce fichier qu'il faut discuter, pas le code.",
    concordance: 'de concordance',
    voirCas: 'Voir tous les cas',
  },
  appareil: {
    titre: 'Cet appareil passe-t-il la cible ?',
    intro:
      'Cible : Safari 16.4, Chrome 111, Firefox 128 — soit tout appareil Apple de 2017 ou postérieur. Ouvrez cette page sur les appareils les plus anciens de votre parc.',
    dansLaCible: 'Cet appareil est dans la cible.',
    horsCible: 'Cet appareil est hors cible.',
    detail: 'Détail des fonctionnalités testées',
  },
  audio: {
    titre: 'Audio absent de cette vitrine',
    texte:
      "Le prototype pré-génère les fichiers audio côté serveur, parce que la synthèse vocale du navigateur est absente des navigateurs intégrés d'Android et bascule silencieusement en anglais sur Chrome. Cette vitrine n'ayant pas de serveur, elle n'a pas d'audio — plutôt qu'un audio de mauvaise qualité qui donnerait une fausse idée du produit.",
  },
}

const DE: Messages = {
  langue: { nom: 'Deutsch', changer: 'Sprache' },
  nav: { accueil: 'Start', creer: 'Erstellen', jeux: 'Meine Sets', correcteur: 'Korrektur', appareil: 'Geraet' },
  accueil: {
    titre: 'Mit Karten lernen',
    accroche: 'Wortschatzliste einfuegen und lernen. Nichts zu installieren, nichts einzurichten.',
    commencer: 'Kartenset erstellen',
    demonstration: 'Oder ein Beispielset ausprobieren',
    avertissement:
      'Prototyp-Schaufenster. Alles bleibt auf diesem Geraet: nichts wird irgendwohin gesendet, nichts auf einem Server gespeichert.',
  },
  creer: {
    titre: 'Set erstellen',
    intro:
      'Fuegen Sie einen Quizlet-Export, einen Tabellenausschnitt oder eine beliebige Liste ein. Das Format wird erkannt.',
    coller: 'Inhalt einfuegen',
    exemples: 'Beispiele zum Ausprobieren',
    format: 'Erkanntes Format',
    confiance: 'Sicherheit',
    cartes: 'uebernommene Karten',
    ecartees: 'verworfene Zeilen, mit Begruendung',
    rienEnSilence:
      'Nichts wird stillschweigend verworfen: Sie sehen, was fehlt, und koennen vor dem Speichern korrigieren.',
    titreJeu: 'Titel des Sets',
    langueRecto: 'Sprache Vorderseite',
    langueVerso: 'Sprache Rueckseite',
    recto: 'Vorderseite',
    verso: 'Rueckseite',
    enregistrer: 'Set speichern',
    vide: 'Fuegen Sie Inhalt ein, um die Vorschau zu sehen.',
  },
  jeux: { titre: 'Meine Sets', aucun: 'Noch keine Sets.', cartes: 'Karten', supprimer: 'Loeschen', ouvrir: 'Oeffnen' },
  jeu: {
    reviser: 'Durchgehen',
    reviserDesc: 'Karten durchblaettern und sortieren',
    apprendre: 'Lernen',
    apprendreDesc: 'Fragen, angepasst an Ihren Stand',
    associer: 'Zuordnen',
    associerDesc: 'Paare gegen die Uhr verbinden',
    blast: 'Blast',
    blastDesc: 'Auf die Blase mit der richtigen Uebersetzung schiessen',
    maitrise: 'Beherrschung',
    reinitialiser: 'Fortschritt zuruecksetzen',
    retour: 'Zurueck',
  },
  blast: {
    intro:
      'Zwanzig Sekunden fuer moeglichst viele Treffer. Fuenf Blasen schweben und prallen voneinander ab, das Wort steht oben, die Kanone folgt Ihrer Maus: Klicken Sie auf die Blase, die passt, sie schiesst darauf. Richtig, die Blase platzt und macht einem neuen Wort Platz; die anderen bleiben, und die naechste Frage betrifft eine davon. Falsch, die Blase wird rot, kostet ein Leben, und Sie spielen dieselbe Frage weiter, bis Sie die richtige finden. Drei Leben.',
    demarrer: 'Starten',
    niveau: 'Stufe',
    score: 'Punkte',
    meilleurScore: 'Bestwert',
    vies: 'Leben',
    reussies: 'richtige Antworten',
    partieTerminee: 'Spiel vorbei',
    canon: 'Kanone',
  },
  etude: {
    jeSais: 'Weiss ich',
    aRevoir: 'Nochmals',
    jeNeSaisPas: 'Weiss ich nicht',
    reponseCorrecte: 'Meine Antwort war richtig',
    verifier: 'Pruefen',
    suivant: 'Weiter',
    votreReponse: 'Ihre Antwort',
    termine: 'Fertig',
    recommencer: 'Nochmals',
    manche: 'Runde',
    sur: 'von',
    accepte: 'Richtig',
    refuse: 'Falsch',
    attendu: 'Erwartet',
    temps: 'Zeit',
    meilleurTemps: 'Bestzeit',
    paires: 'Paare',
  },
  maitrise: { non_commence: 'Nicht begonnen', en_cours: 'In Arbeit', maitrise: 'Beherrscht' },
  correcteur: {
    titre: 'Korrektur',
    intro:
      'Die Korrektur-Engine des Prototyps. Geben Sie eine Schuelerantwort ein und sehen Sie Urteil, Differenz und angewandte Toleranz.',
    langueCarte: 'Sprache der Karte',
    niveau: 'Korrekturstufe',
    tolerant: 'Tolerant',
    strict: 'Streng',
    attendu: 'Erwartete Antwort',
    alternatives: 'Akzeptierte Alternativantworten',
    alternativesAide: 'durch Schraegstrich getrennt',
    saisie: 'Antwort der Schuelerin oder des Schuelers',
    reference: 'Referenzfaelle',
    referenceIntro:
      'Die Faelle, die das Verhalten der Korrektur definieren, hier direkt ausgefuehrt. Das ist die Spezifikation: Wenn ein Urteil falsch erscheint, ist diese Datei zu diskutieren, nicht der Code.',
    concordance: 'Uebereinstimmung',
    voirCas: 'Alle Faelle anzeigen',
  },
  appareil: {
    titre: 'Erfuellt dieses Geraet die Zielvorgabe?',
    intro:
      'Ziel: Safari 16.4, Chrome 111, Firefox 128 — also jedes Apple-Geraet ab 2017. Oeffnen Sie diese Seite auf den aeltesten Geraeten Ihres Bestands.',
    dansLaCible: 'Dieses Geraet erfuellt die Zielvorgabe.',
    horsCible: 'Dieses Geraet erfuellt die Zielvorgabe nicht.',
    detail: 'Geprueft im Einzelnen',
  },
  audio: {
    titre: 'Kein Ton in diesem Schaufenster',
    texte:
      'Der Prototyp erzeugt Audiodateien serverseitig im Voraus, weil die Sprachausgabe des Browsers in Android-WebViews fehlt und in Chrome stillschweigend auf Englisch wechselt. Dieses Schaufenster hat keinen Server, also keinen Ton — lieber gar keinen als schlechten.',
  },
}

const IT: Messages = {
  langue: { nom: 'Italiano', changer: 'Lingua' },
  nav: { accueil: 'Inizio', creer: 'Creare', jeux: 'I miei set', correcteur: 'Correttore', appareil: 'Dispositivo' },
  accueil: {
    titre: 'Imparare con le carte',
    accroche: 'Incollate la vostra lista di vocaboli e ripassate. Niente da installare, niente da configurare.',
    commencer: 'Creare un set di carte',
    demonstration: 'Oppure provate un set di esempio',
    avertissement:
      'Vetrina di prototipazione. Tutto resta su questo dispositivo: niente viene inviato altrove, niente conservato su un server.',
  },
  creer: {
    titre: 'Creare un set',
    intro:
      'Incollate un export di Quizlet, un estratto di foglio di calcolo o una lista qualsiasi. Il formato viene riconosciuto.',
    coller: 'Incollate il contenuto',
    exemples: 'Esempi da provare',
    format: 'Formato riconosciuto',
    confiance: 'affidabilità',
    cartes: 'carte importate',
    ecartees: 'righe scartate, con il motivo',
    rienEnSilence:
      'Niente viene scartato in silenzio: vedete cosa manca e potete correggere prima di salvare.',
    titreJeu: 'Titolo del set',
    langueRecto: 'Lingua del fronte',
    langueVerso: 'Lingua del retro',
    recto: 'Fronte',
    verso: 'Retro',
    enregistrer: 'Salvare il set',
    vide: 'Incollate del contenuto per vedere l’anteprima.',
  },
  jeux: { titre: 'I miei set', aucun: 'Ancora nessun set.', cartes: 'carte', supprimer: 'Eliminare', ouvrir: 'Aprire' },
  jeu: {
    reviser: 'Ripasso',
    reviserDesc: 'Sfogliare le carte e ordinarle',
    apprendre: 'Apprendimento',
    apprendreDesc: 'Domande adattate a ciò che sapete già',
    associer: 'Abbinamento',
    associerDesc: 'Collegare le coppie contro il tempo',
    blast: 'Blast',
    blastDesc: 'Sparare alla bolla con la traduzione giusta',
    maitrise: 'Padronanza',
    reinitialiser: 'Azzerare i progressi',
    retour: 'Indietro',
  },
  blast: {
    intro:
      'Venti secondi per piazzare più risposte possibile. Cinque bolle fluttuano e rimbalzano una sull\'altra, la parola da tradurre appare in alto, il cannone segue il vostro mouse: cliccate sulla bolla che risponde, il cannone le spara addosso. Giusta, scoppia e lascia il posto a una parola nuova; le altre restano, e la domanda seguente riguarda una di loro. Sbagliata, la bolla diventa rossa, costa una vita, e riprovate sulla stessa domanda finché non la trovate. Tre vite.',
    demarrer: 'Iniziare',
    niveau: 'Livello',
    score: 'Punteggio',
    meilleurScore: 'Miglior punteggio',
    vies: 'Vite',
    reussies: 'risposte corrette',
    partieTerminee: 'Partita finita',
    canon: 'Cannone',
  },
  etude: {
    jeSais: 'Lo so',
    aRevoir: 'Da rivedere',
    jeNeSaisPas: 'Non lo so',
    reponseCorrecte: 'La mia risposta era corretta',
    verifier: 'Verificare',
    suivant: 'Avanti',
    votreReponse: 'La vostra risposta',
    termine: 'Finito',
    recommencer: 'Ricominciare',
    manche: 'Turno',
    sur: 'di',
    accepte: 'Accettato',
    refuse: 'Rifiutato',
    attendu: 'Atteso',
    temps: 'Tempo',
    meilleurTemps: 'Miglior tempo',
    paires: 'coppie',
  },
  maitrise: { non_commence: 'Non iniziato', en_cours: 'In corso', maitrise: 'Acquisito' },
  correcteur: {
    titre: 'Correttore',
    intro:
      "Il motore di correzione del prototipo. Digitate una risposta e vedete il verdetto, la differenza e la tolleranza applicata.",
    langueCarte: 'Lingua della carta',
    niveau: 'Livello di correzione',
    tolerant: 'Tollerante',
    strict: 'Rigoroso',
    attendu: 'Risposta attesa',
    alternatives: 'Risposte alternative accettate',
    alternativesAide: 'separate da una barra',
    saisie: "Risposta dell'allievo",
    reference: 'Casi di riferimento',
    referenceIntro:
      "I casi che definiscono il comportamento del correttore, eseguiti qui in tempo reale. È la specifica: se un verdetto vi sembra sbagliato, è questo file da discutere, non il codice.",
    concordance: 'di concordanza',
    voirCas: 'Vedere tutti i casi',
  },
  appareil: {
    titre: 'Questo dispositivo rientra nell’obiettivo?',
    intro:
      'Obiettivo: Safari 16.4, Chrome 111, Firefox 128 — ossia ogni dispositivo Apple dal 2017 in poi. Aprite questa pagina sui dispositivi più vecchi del vostro parco.',
    dansLaCible: 'Questo dispositivo rientra nell’obiettivo.',
    horsCible: 'Questo dispositivo non rientra nell’obiettivo.',
    detail: 'Dettaglio delle funzionalità testate',
  },
  audio: {
    titre: 'Audio assente da questa vetrina',
    texte:
      "Il prototipo pre-genera i file audio sul server, perché la sintesi vocale del browser è assente dai browser integrati di Android e passa silenziosamente all'inglese su Chrome. Questa vetrina non ha server, quindi non ha audio — meglio nessun audio che un audio scadente.",
  },
}

export const MESSAGES: Record<LangueInterface, Messages> = {
  'fr-CH': FR,
  'de-CH': DE,
  'it-CH': IT,
}

export function messagesDe(langue: string): Messages {
  return MESSAGES[langue as LangueInterface] ?? FR
}
