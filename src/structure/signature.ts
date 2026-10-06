import { cloneDeep } from 'lodash'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { conditionalBody, contractSectionCommon, id, richText } from './common'
import { conditional } from './conditional'

export const signatureParty = z.object({
  id:  id(),
  $if: conditional().optional(),

  /** Who signs, like "Producent" or "Opdrachtnemer". */
  label: z.string().min(1).max(255).nullable().default(null),

  /** Shown below the signature, typically the name and capacity of the signatory. */
  details: richText(),
})

/**
 * Where the parties sign the contract. How they sign (on paper or electronically) is up to the contract.
 */
export const signatureSection = z.object({
  ...contractSectionCommon,
  type:      z.literal('signature').default('signature'),
  preamble:  conditionalBody().optional(),
  postamble: conditionalBody().optional(),
  parties:   z.array(signatureParty).default([]),
})

export type SignatureParty = z.output<typeof signatureParty>
export type SignatureSection = z.output<typeof signatureSection>

export namespace SignatureParty {

  export function empty(): SignatureParty {
    return signatureParty.parse({details: null})
  }

  export function clone(party: SignatureParty, overrides: Partial<SignatureParty> = {}): SignatureParty {
    return {
      ...cloneDeep(party),
      id: nanoid(12),
      ...overrides,
    }
  }

}
