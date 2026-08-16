import type { LangueInterface } from '@/domaine'
import { messagesDe } from '@/i18n/messages'
import { Compatibilite } from '@/composants/Compatibilite'

export default async function PageAppareil({ params }: { params: Promise<{ langue: string }> }) {
  const { langue } = await params
  const l = langue as LangueInterface
  return <Compatibilite langue={l} messages={messagesDe(l)} />
}
