import { z } from 'zod'
import { $anchor, Anchor } from './anchor'
import { contractSectionCommon } from './common'
import { $if, If } from './conditional'
import { $, Dynamic } from './dynamic'

export function listItem(level: number): z.ZodType<ListItem> {
  return z.object({
    text: z.string(),
    ...(level < 6 && {
      items: z.array($if($($anchor(listItem(level + 1))))).optional(),
    }),
  }) as z.ZodType<ListItem>
}

export const listSection = z.object({
  ...contractSectionCommon,
  type:       z.literal('list'),
  preamble:   $if(z.string()).optional(),
  postamble:  $if(z.string()).optional(),
  list_style: z.enum(['ordered', 'unordered']).default('ordered'),
  items:      z.array($if($($anchor(listItem(1))))),
})

export type ListSection = z.output<typeof listSection>

export interface ListItem {
  text: string
  items?: If<Dynamic<Anchor<ListItem>>>[]
}