import type { LangueInterface } from '@/domaine'
import { messagesDe } from '@/i18n/messages'
import { Correcteur } from '@/composants/Correcteur'

export default async function PageCorrecteur({ params }: { params: Promise<{ langue: string }> }) {
  const { langue } = await params
  const l = langue as LangueInterface
  return <Correcteur langue={l} messages={messagesDe(l)} />
}
