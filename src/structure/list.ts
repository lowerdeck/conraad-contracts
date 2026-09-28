import { cloneDeep } from 'lodash'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { conditionalBody, contractSectionCommon, id } from './common'
import { Conditional, conditional } from './conditional'

export function listItem(level: number): z.ZodType<ListItem> {
  return z.object({
    id:   id(),
    $if:  conditional().optional(),
    text: z.string(),
    ...(level < 6 && {
      items: z.array(listItem(level + 1)).optional(),
    }),
  }) as z.ZodType<ListItem>
}

export const listSection = z.object({
  ...contractSectionCommon,
  type:      z.literal('list'),
  preamble:  conditionalBody().optional(),
  postamble: conditionalBody().optional(),
  items:     z.array(listItem(1)).default([]),
})

export type ListSection = z.output<typeof listSection>

export interface ListItem {
  id: string
  $if?: Conditional
  text: string
  items: ListItem[]
}

export namespace ListItem {

  export function empty(): ListItem {
    return listItem(1).parse({
      text: '',
    })
  }

  export function clone(item: ListItem, overrides: Partial<ListItem> = {}) {
    return {
      ...cloneDeep(item),
      id: nanoid(12),
      ...overrides,
    }
  }

}