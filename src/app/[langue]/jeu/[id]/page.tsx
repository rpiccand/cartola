import type { LangueInterface } from '@/domaine'
import { messagesDe } from '@/i18n/messages'
import { FicheJeu } from '@/composants/FicheJeu'

export const dynamicParams = true

export function generateStaticParams(): { id: string }[] {
  // Les jeux vivent dans le navigateur : aucune page ne peut être pré-rendue
  // par identifiant. La liste vide, avec `dynamicParams`, produit une page
  // rendue à la demande côté client.
  return []
}

export default async function PageJeu({
  params,
}: {
  params: Promise<{ langue: string; id: string }>
}) {
  const { langue, id } = await params
  const l = langue as LangueInterface
  return <FicheJeu jeuId={id} langue={l} messages={messagesDe(l)} />
}
