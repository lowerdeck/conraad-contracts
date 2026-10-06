import { cloneDeep } from 'lodash'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { conditionalBody, contractSectionCommon, id, RichText, richText } from './common'
import { Conditional, conditional } from './conditional'

export function listItem(level: number): z.ZodType<ListItem> {
  return z.object({
    id:   id(),
    $if:  conditional().optional(),
    text: richText(),
    ...(level < 6 && {
      items: z.array(listItem(level + 1)).optional(),
    }),
  }) as z.ZodType<ListItem>
}

export const listSection = z.object({
  ...contractSectionCommon,
  type:      z.literal('list').default('list'),
  preamble:  conditionalBody().optional(),
  postamble: conditionalBody().optional(),
  items:     z.array(listItem(1)).default([]),
})

export type ListSection = z.output<typeof listSection>

export interface ListItem {
  id: string
  $if?: Conditional
  text: RichText
  items: ListItem[]
}

export namespace ListItem {

  export function empty(): ListItem {
    return listItem(1).parse({
      text: null,
    })
  }

  export function clone(item: ListItem, overrides: Partial<ListItem> = {}) {
    return {
      ...cloneDeep(item),
      id: nanoid(12),
      ...overrides,
    }
  }

  /**
   * The items in document order, with their level (1 for top-level items).
   */
  export function flatten(items: ListItem[], level: number = 1): FlatListItem[] {
    return items.flatMap(item => [
      {item, level},
      ...flatten(item.items ?? [], level + 1),
    ])
  }

  /**
   * Nests flat items by their level. An item can only be one level deeper than the one before it.
   */
  export function nest(flat: FlatListItem[]): ListItem[] {
    const root: ListItem[] = []
    const stack: ListItem[][] = [root]

    for (const {item, level} of flat) {
      const depth = Math.max(1, Math.min(level, stack.length, maxListLevel))
      stack.length = depth

      const node: ListItem = {...item, items: []}
      stack[depth - 1].push(node)
      stack.push(node.items)
    }

    return root
  }

  /**
   * The index just past the flat item at the given index and its sub-items.
   */
  export function subtreeEnd(flat: FlatListItem[], index: number): number {
    const {level} = flat[index]
    let end = index + 1
    while (end < flat.length && flat[end].level > level) {
      end += 1
    }
    return end
  }

}

export interface FlatListItem {
  item:  ListItem
  level: number
}

export const maxListLevel = 6