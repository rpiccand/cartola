import type { LangueInterface } from '@/domaine'
import { messagesDe } from '@/i18n/messages'
import { ListeJeux } from '@/composants/ListeJeux'

export default async function PageJeux({ params }: { params: Promise<{ langue: string }> }) {
  const { langue } = await params
  const l = langue as LangueInterface
  return <ListeJeux langue={l} messages={messagesDe(l)} />
}
