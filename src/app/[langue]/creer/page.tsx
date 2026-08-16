import type { LangueInterface } from '@/domaine'
import { messagesDe } from '@/i18n/messages'
import { Importer } from '@/composants/Importer'

export default async function PageCreer({ params }: { params: Promise<{ langue: string }> }) {
  const { langue } = await params
  const l = langue as LangueInterface
  return <Importer langue={l} messages={messagesDe(l)} />
}
