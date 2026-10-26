import { z } from 'zod'

/**
 * A section or item of the template that is removed from a contract drawn up from it.
 */
export const contractRemoval = z.object({
  type:   z.literal('removal'),
  target: z.string().max(32),
})

export type ContractRemoval = z.output<typeof contractRemoval>
