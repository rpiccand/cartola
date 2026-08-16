/** Langues de contenu pour lesquelles la correction dispose de règles propres. */
export type LangueContenu = 'fr' | 'de' | 'it' | 'autre'

/** Langues d'interface du prototype. Variantes suisses, jamais `de-DE`. */
export type LangueInterface = 'fr-CH' | 'de-CH' | 'it-CH'

export const LANGUES_INTERFACE: readonly LangueInterface[] = ['fr-CH', 'de-CH', 'it-CH']
export const LANGUE_INTERFACE_DEFAUT: LangueInterface = 'fr-CH'

/** Langue de contenu correspondant à une langue d'interface. */
export function langueContenuDe(langue: LangueInterface): LangueContenu {
  return langue.slice(0, 2) as LangueContenu
}
