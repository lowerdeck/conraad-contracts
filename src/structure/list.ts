import { cloneDeep } from 'lodash'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { conditionalBody, contractSectionCommon, expression, id, identifier } from './common'

export function listItem(level: number): z.ZodType<ListItem> {
  return z.object({
    id:   id(),
    $if:  expression().optional(),
    text: z.string(),
    ...(level < 6 && {
      items: z.array(listItem(level + 1)).default([]),
    }),
  }) as z.ZodType<ListItem>
}

export enum ListStyle {
  None = 'none',
  Numbers = 'numbers',
  Roman = 'roman',
  Alpha = 'alpha',
  Bullets = 'bullets'
}

export const listSection = z.object({
  ...contractSectionCommon,
  type:       z.literal('list'),
  preamble:   conditionalBody().optional(),
  postamble:  conditionalBody().optional(),
  list_style: z.enum(ListStyle).default(ListStyle.Numbers),
  counter:    identifier().optional(),
  items:      z.array(listItem(1)).default([]),
})

export type ListSection = z.output<typeof listSection>

export interface ListItem {
  id: string
  $if?: string
  text: string
  items: ListItem[]
}

export namespace ListItem {

  export function empty(): ListItem {
    return {
      id:    nanoid(12),
      text:  '',
      items: [],
    }
  }

  export function clone(item: ListItem, overrides: Partial<ListItem> = {}) {
    return {
      ...cloneDeep(item),
      id: nanoid(12),
      ...overrides,
    }
  }

}