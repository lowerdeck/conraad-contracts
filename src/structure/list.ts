import { z } from 'zod'
import { anchor, conditionalBody, contractSectionCommon, expression } from './common'

export function listItem(level: number): z.ZodType<ListItem> {
  return z.object({
    $if:     expression().optional(),
    $anchor: anchor().optional(),
    text:    z.string(),
    ...(level < 6 && {
      items: z.array(listItem(level + 1)).optional(),
    }),
  }) as z.ZodType<ListItem>
}

export const listSection = z.object({
  ...contractSectionCommon,
  type:       z.literal('list'),
  preamble:   conditionalBody().optional(),
  postamble:  conditionalBody().optional(),
  list_style: z.enum(['ordered', 'unordered']).default('ordered'),
  items:      z.array(listItem(1)),
})

export type ListSection = z.output<typeof listSection>

export interface ListItem {
  $if?: string
  $anchor?: string
  text: string
  items?: ListItem[]
}