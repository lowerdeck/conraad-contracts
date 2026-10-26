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
 * contract, so it has no conditions or interpolations.
 */
export const contractAddition = z.discriminatedUnion('type', [
  z.object({type: z.literal('section'), anchor: additionAnchor, item: contractSection}),
  z.object({type: z.literal('list-item'), anchor: additionAnchor, item: listItem(1)}),
  z.object({type: z.literal('definition'), anchor: additionAnchor, item: definitionListItem}),
  z.object({type: z.literal('party'), anchor: additionAnchor, item: signatureParty}),
])

export type AdditionAnchor = z.output<typeof additionAnchor>
export type ContractAddition = z.output<typeof contractAddition>
export type ContractAdditionType = ContractAddition['type']
