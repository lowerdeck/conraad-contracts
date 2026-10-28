import { z } from 'zod'
import type { ContractSection } from './index'

/**
 * Where conditions that the contractor asks for go, when they don't fit in a section that is there already: as a section
 * before or after one of the template's.
 */
export const conditionsPlacement = z.object({
  position: z.enum(['before', 'after']),
  section:  z.string().max(32),
})

export type ConditionsPlacement = z.output<typeof conditionsPlacement>

export namespace ConditionsPlacement {

  /**
   * The section to add conditions next to. Without a placement, or when its section isn't in the contract, they go
   * right before the signatures, or after the last section if there are none.
   */
  export function resolve(placement: ConditionsPlacement | null | undefined, sections: ContractSection[]): ConditionsPlacement | null {
    if (placement != null && sections.some(it => it.id === placement.section)) {
      return placement
    }

    const signature = sections.find(it => it.type === 'signature')
    if (signature != null) {
      return {position: 'before', section: signature.id}
    }

    const last = sections[sections.length - 1]
    return last == null ? null : {position: 'after', section: last.id}
  }

}
