import { notFound } from 'next/navigation'
import type { LangueInterface } from '@/domaine'
import { messagesDe } from '@/i18n/messages'
import { Etude, type Mode } from '@/composants/Etude'

const MODES: readonly Mode[] = ['reviser', 'apprendre', 'associer', 'blast']

export const dynamicParams = true

export function generateStaticParams(): { id: string; mode: string }[] {
  return []
}

export default async function PageMode({
  params,
}: {
  params: Promise<{ langue: string; id: string; mode: string }>
}) {
  const { langue, id, mode } = await params
  if (!(MODES as readonly string[]).includes(mode)) notFound()
  const l = langue as LangueInterface
  return <Etude jeuId={id} mode={mode as Mode} langue={l} messages={messagesDe(l)} />
}
