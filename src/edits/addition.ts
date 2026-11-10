import { z } from 'zod'
import { contractSection, definitionListItem, listItem, signatureParty } from '../structure'

/**
 * Where an addition goes. Rather than a single item to go before or after, it records all of its siblings at the time
 * it was added, so that it can fall back to the nearest one that is still around.
 */
export const additionAnchor = z.object({
  /** The section or list item that the addition is in, or `null` for a section of its own. */
  parent: z.string().max(32).nullable().default(null),

  /** The IDs of the siblings before the addition, nearest first. */
  after: z.array(z.string().max(32)).default([]),

  /** The IDs of the siblings after the addition, nearest first. */
  before: z.array(z.string().max(32)).default([]),
})

/**
 * A section or item that is added to a contract after it was drawn up from its template. Its text is specific to the
 * contract, so it has no interpolations.
 *
 * With `replaces`, it takes the place of the template's section or item with the same ID, as an editable copy of it.
 * It keeps that one's conditions and what's in it, and falls back to its anchor if that one is gone.
 */
export const contractAddition = z.discriminatedUnion('type', [
  z.object({type: z.literal('section'), anchor: additionAnchor, item: contractSection, replaces: z.boolean().optional()}),
  z.object({type: z.literal('list-item'), anchor: additionAnchor, item: listItem(1), replaces: z.boolean().optional()}),
  z.object({type: z.literal('definition'), anchor: additionAnchor, item: definitionListItem, replaces: z.boolean().optional()}),
  z.object({type: z.literal('party'), anchor: additionAnchor, item: signatureParty, replaces: z.boolean().optional()}),
])

export type AdditionAnchor = z.output<typeof additionAnchor>
export type ContractAddition = z.output<typeof contractAddition>
export type ContractAdditionType = ContractAddition['type']
