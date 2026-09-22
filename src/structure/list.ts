import { z } from 'zod'
import { $anchor, Anchor } from './anchor'
import { contractSectionCommon } from './common'
import { $conditional, Conditional } from './conditional'

export function listItem(level: number): z.ZodType<ListItem> {
  return z.object({
    text: z.string(),
    ...(level < 6 && {
      items: z.array($conditional($anchor(listItem(level + 1)))).optional(),
    }),
  }) as z.ZodType<ListItem>
}

export const listSection = z.object({
  ...contractSectionCommon,
  type:       z.literal('list'),
  preamble:   $conditional(z.string()).optional(),
  postamble:  $conditional(z.string()).optional(),
  list_style: z.enum(['ordered', 'unordered']).default('ordered'),
  items:      z.array($conditional($anchor(listItem(1)))),
})

export type ListSection = z.output<typeof listSection>

export interface ListItem {
  text: string
  items?: Conditional<Anchor<ListItem>>[]
}