import { cloneDeep } from 'lodash'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { conditionalBody, contractSectionCommon, id } from './common'
import { conditional } from './conditional'

/**
 * An appendix that belongs to contracts drawn up from the template. The template's appendices are one ordered list,
 * which determines their numbers. An appendix is either:
 *
 * - a document that has to be supplied per contract (`contract`);
 * - a document attached to the template, for static appendices (`document`);
 * - or a section of the template, for appendices whose text depends on the form (`section`).
 */
export const appendix = z.object({
  id:   id(),
  name: z.string().max(255),
  $if:  conditional().optional(),
  type: appendixType().default('contract'),

  /** The ID of the section that makes up the appendix. */
  section: z.string().max(32).nullable().default(null),

  /** The ID of the document attached to the template. */
  document: z.string().max(36).nullable().default(null),
})

/**
 * A generated list of the contract's appendices, with their numbers.
 */
export const appendicesSection = z.object({
  ...contractSectionCommon,
  type:      z.literal('appendices').default('appendices'),
  preamble:  conditionalBody().optional(),
  postamble: conditionalBody().optional(),
})

export function appendixType() {
  return z.enum(['contract', 'document', 'section'])
}

export type Appendix = z.output<typeof appendix>
export type AppendixType = z.output<ReturnType<typeof appendixType>>
export type AppendicesSection = z.output<typeof appendicesSection>

export namespace Appendix {

  export function empty(): Appendix {
    return appendix.parse({name: ''})
  }

  export function clone(item: Appendix, overrides: Partial<Appendix> = {}): Appendix {
    return {
      ...cloneDeep(item),
      id: nanoid(12),
      ...overrides,
    }
  }

}
