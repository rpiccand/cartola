import type { Mode } from '@/composants/Etude'

/**
 * Consignes des modes d'étude, dans la langue de l'élève.
 *
 * Séparées de `messages.ts` pour une raison de fond : la langue de l'INTERFACE
 * et la langue de la CONSIGNE ne sont pas la même chose et ne suivent pas les
 * mêmes règles. L'interface est celle de l'établissement — trois langues
 * nationales, choisies dans l'URL, partagées par toute la classe. La consigne
 * est celle de l'élève : elle le suit d'un appareil à l'autre, ne change pas
 * l'adresse de la page, et couvre des langues que l'interface ne parlera
 * jamais.
 *
 * ⚠️ Ces traductions n'ont PAS été relues par des locuteurs natifs. Elles
 * démontrent le mécanisme ; elles doivent passer par une relecture avant
 * qu'un établissement ne les mette sous les yeux d'un élève.
 *
 * Aucun seuil chiffré dans ces textes — ni « sept cartes », ni « trois vies ».
 * Les nombres vivent dans `REGLES` et sont affichés à côté, dans la langue de
 * l'interface : les recopier ici en neuf langues garantirait qu'ils deviendront
 * faux le jour où un seuil bouge.
 */

export const LANGUES_CONSIGNE = [
  { code: 'fr-CH', nom: 'Français' },
  { code: 'de-CH', nom: 'Deutsch' },
  { code: 'it-CH', nom: 'Italiano' },
  { code: 'en', nom: 'English' },
  { code: 'pt', nom: 'Português' },
  { code: 'sq', nom: 'Shqip' },
  { code: 'es', nom: 'Español' },
  { code: 'tr', nom: 'Türkçe' },
  { code: 'uk', nom: 'Українська' },
] as const

export type LangueConsigne = (typeof LANGUES_CONSIGNE)[number]['code']

export function estLangueConsigne(valeur: string): valeur is LangueConsigne {
  return LANGUES_CONSIGNE.some((l) => l.code === valeur)
}

export function nomDeLangue(code: LangueConsigne): string {
  return LANGUES_CONSIGNE.find((l) => l.code === code)?.nom ?? code
}

export type Consignes = Record<Mode, string>

const CONSIGNES: Record<LangueConsigne, Consignes> = {
  'fr-CH': {
    reviser:
      "Une carte s'affiche. Dites la réponse dans votre tête, puis retournez la carte pour vérifier. Répondez « Je sais » ou « À revoir » : les cartes à revoir vous seront représentées à la fin.",
    apprendre:
      "Répondez aux questions de la manche. Tant qu'une carte est nouvelle pour vous, choisissez la bonne réponse parmi plusieurs ; ensuite, écrivez-la vous-même. Écrire compte davantage que reconnaître.",
    associer:
      'Reliez chaque mot à sa traduction en touchant les deux cases. Le chronomètre tourne et chaque erreur ajoute du temps : essayez de battre votre meilleur temps.',
    blast:
      "Des bulles flottent dans l'arène et le mot à traduire s'affiche en haut. L'arrosoir suit votre souris : cliquez sur la bulle qui répond, une goutte part l'éclater et un mot nouveau prend sa place. Une erreur coûte une vie. La série s'arrête quand le temps est écoulé ou quand vous n'avez plus de vie.",
  },
  // ⚠️ de-CH : pas de `ß`, et transcription `ae oe ue` comme dans tout le reste
  // de l'interface allemande de cette vitrine.
  'de-CH': {
    reviser:
      'Eine Karte erscheint. Sagen Sie die Antwort im Kopf, drehen Sie dann die Karte um und pruefen Sie. Antworten Sie mit «Weiss ich» oder «Nochmals»: die Karten zum Nochmals-Anschauen kommen am Ende zurueck.',
    apprendre:
      'Beantworten Sie die Fragen der Runde. Solange eine Karte neu fuer Sie ist, waehlen Sie die richtige Antwort aus mehreren aus; danach schreiben Sie sie selbst. Schreiben zaehlt mehr als Wiedererkennen.',
    associer:
      'Verbinden Sie jedes Wort mit seiner Uebersetzung, indem Sie beide Felder antippen. Die Uhr laeuft, und jeder Fehler kostet zusaetzliche Zeit: versuchen Sie, Ihre Bestzeit zu schlagen.',
    blast:
      'Blasen schweben im Feld, oben steht das Wort zum Uebersetzen. Die Giesskanne folgt Ihrer Maus: Klicken Sie auf die Blase, die passt, ein Tropfen laesst sie zerplatzen und ein neues Wort nimmt ihren Platz ein. Ein Fehler kostet ein Leben. Die Runde endet, wenn die Zeit abgelaufen ist oder Sie kein Leben mehr haben.',
  },
  'it-CH': {
    reviser:
      'Appare una carta. Dite la risposta nella vostra testa, poi girate la carta per verificare. Rispondete «Lo so» oppure «Da rivedere»: le carte da rivedere torneranno alla fine.',
    apprendre:
      'Rispondete alle domande del turno. Finché una carta è nuova per voi, scegliete la risposta giusta fra diverse; poi scrivetela voi stessi. Scrivere conta più che riconoscere.',
    associer:
      'Collegate ogni parola alla sua traduzione toccando le due caselle. Il cronometro scorre e ogni errore aggiunge tempo: provate a battere il vostro miglior tempo.',
    blast:
      "Delle bolle fluttuano nell'area e la parola da tradurre appare in alto. L'annaffiatoio segue il vostro mouse: cliccate sulla bolla che risponde, una goccia la fa scoppiare e una parola nuova prende il suo posto. Un errore costa una vita. La serie finisce quando il tempo è scaduto o quando non avete più vite.",
  },
  en: {
    reviser:
      'A card appears. Say the answer in your head, then flip the card to check. Answer "I know it" or "Review again": the cards you set aside come back at the end.',
    apprendre:
      'Answer the questions in the round. While a card is still new to you, pick the right answer from several; after that, write it yourself. Writing counts for more than recognising.',
    associer:
      'Match each word to its translation by tapping both tiles. The clock is running and every mistake adds time: try to beat your best time.',
    blast:
      'Bubbles drift across the field and the word to translate appears at the top. The watering nozzle follows your mouse: click the bubble that answers, a drop flies out and bursts it, and a new word takes its place. A mistake costs a life. The round ends when time runs out or when you have no lives left.',
  },
  pt: {
    reviser:
      'Aparece um cartão. Diga a resposta na sua cabeça e depois vire o cartão para verificar. Responda «Eu sei» ou «Rever»: os cartões a rever voltam no fim.',
    apprendre:
      'Responda às perguntas da ronda. Enquanto um cartão for novo para si, escolha a resposta certa entre várias; depois, escreva-a você mesmo. Escrever conta mais do que reconhecer.',
    associer:
      'Ligue cada palavra à sua tradução tocando nas duas casas. O cronómetro corre e cada erro acrescenta tempo: tente bater o seu melhor tempo.',
    blast:
      'Bolhas flutuam no campo e a palavra a traduzir aparece em cima. O regador segue o seu rato: clique na bolha que responde, uma gota sai e rebenta-a, e uma palavra nova ocupa o lugar. Um erro custa uma vida. A série acaba quando o tempo termina ou quando fica sem vidas.',
  },
  sq: {
    reviser:
      'Shfaqet një kartë. Thojeni përgjigjen me mend, pastaj kthejeni kartën për ta kontrolluar. Përgjigjuni «E di» ose «Për ta rishikuar»: kartat për rishikim kthehen në fund.',
    apprendre:
      'Përgjigjuni pyetjeve të raundit. Sa kohë që një kartë është e re për ju, zgjidhni përgjigjen e saktë ndër disa; më pas shkruajeni vetë. Të shkruarit vlen më shumë se të njohurit.',
    associer:
      'Lidhni çdo fjalë me përkthimin e saj duke prekur të dyja kutitë. Kronometri ecën dhe çdo gabim shton kohë: provoni ta thyeni kohën tuaj më të mirë.',
    blast:
      'Flluska notojnë në fushë dhe fjala për t’u përkthyer shfaqet lart. Ujitësja ndjek miun tuaj: klikoni mbi flluskën që përgjigjet, një pikë uji del dhe e plas, dhe një fjalë e re zë vendin e saj. Një gabim kushton një jetë. Seria mbaron kur koha skadon ose kur nuk ju mbeten jetë.',
  },
  es: {
    reviser:
      'Aparece una tarjeta. Diga la respuesta en su cabeza y luego gire la tarjeta para comprobarla. Responda «Lo sé» o «Repasar»: las tarjetas para repasar vuelven al final.',
    apprendre:
      'Responda a las preguntas de la ronda. Mientras una tarjeta sea nueva para usted, elija la respuesta correcta entre varias; después, escríbala usted mismo. Escribir cuenta más que reconocer.',
    associer:
      'Una cada palabra con su traducción tocando las dos casillas. El cronómetro corre y cada error añade tiempo: intente batir su mejor tiempo.',
    blast:
      'Unas burbujas flotan en el campo y la palabra que hay que traducir aparece arriba. La regadera sigue su ratón: haga clic en la burbuja que responde, sale una gota que la revienta y una palabra nueva ocupa su lugar. Un error cuesta una vida. La serie termina cuando se acaba el tiempo o cuando se queda sin vidas.',
  },
  tr: {
    reviser:
      'Bir kart görünür. Cevabı içinizden söyleyin, sonra kartı çevirip kontrol edin. «Biliyorum» ya da «Tekrar bakılacak» yanıtını verin: tekrar bakılacak kartlar sonda geri gelir.',
    apprendre:
      'Turdaki soruları yanıtlayın. Bir kart sizin için yeniyken doğru cevabı birkaç seçenek arasından seçin; sonrasında kendiniz yazın. Yazmak, tanımaktan daha çok sayılır.',
    associer:
      'Her kelimeyi çevirisiyle eşleştirmek için iki kutuya da dokunun. Kronometre işliyor ve her hata süre ekliyor: en iyi derecenizi geçmeye çalışın.',
    blast:
      'Alanda baloncuklar süzülür ve çevrilecek kelime yukarıda görünür. Sulama başlığı farenizi izler: cevabı taşıyan baloncuğa tıklayın, bir damla çıkıp onu patlatır ve yerine yeni bir kelime gelir. Bir hata bir can götürür. Tur, süre dolduğunda ya da caniniz kalmadığında biter.',
  },
  uk: {
    reviser:
      'З’являється картка. Скажіть відповідь подумки, потім переверніть картку й перевірте. Відповідайте «Знаю» або «Повторити»: картки на повторення повернуться наприкінці.',
    apprendre:
      'Відповідайте на запитання раунду. Поки картка для вас нова, обирайте правильну відповідь із кількох; далі пишіть її самі. Написати важить більше, ніж упізнати.',
    associer:
      "З'єднайте кожне слово з його перекладом, торкнувшись обох клітинок. Час іде, і кожна помилка додає секунди: спробуйте побити свій найкращий час.",
    blast:
      'Бульбашки плавають на полі, а слово для перекладу з’являється вгорі. Лійка стежить за вашою мишкою: натисніть на бульбашку з відповіддю, крапля вилітає й розбиває її, а нове слово стає на її місце. Помилка коштує життя. Серія завершується, коли вичерпано час або життя.',
  },
}

export function consigneDe(langue: LangueConsigne, mode: Mode): string {
  return CONSIGNES[langue][mode]
}
