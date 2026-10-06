import { z } from 'zod'
import { appendicesSection, appendix } from './appendix'
import { listSection } from './list'
import { textSection } from './text'
import { definitionListSection } from './definition-list'
import { form } from './form'
import { headerFooter } from './header-footer'
import { numberings } from './numbering'
import { signatureSection } from './signature'

// @index
export * from './appendix'
export * from './common'
export * from './conditional'
export * from './definition-list'
export * from './form'
export * from './header-footer'
export * from './list'
export * from './numbering'
export * from './signature'
export * from './text'
export * from './variable'
// /index

// #region Section

export const contractSection = z.discriminatedUnion('type', [
  textSection,
  listSection,
  definitionListSection,
  appendicesSection,
  signatureSection,
])

export type ContractSection = z.output<typeof contractSection>

export namespace ContractSection {

  export function empty(type: ContractSection['type'], name: string): ContractSection {
    switch (type) {
    case 'text':
      return textSection.parse({name})
    case 'list':
      return listSection.parse({name})
    case 'definition-list':
      return definitionListSection.parse({name})
    case 'appendices':
      return appendicesSection.parse({name})
    case 'signature':
      return signatureSection.parse({name})
    }
  }

}

// #endregion

// #region Structure

export const contractStructure = z.object({
  sections:   z.array(contractSection).default([]),
  numberings: numberings.default({}),
  form:       form.default(() => form.parse({})),
  header:     headerFooter.optional(),
  footer:     headerFooter.optional(),

  appendices: z.array(appendix).default([]),

  /** The ID of the numbering that numbers the appendices, of which only the first level is used. */
  appendix_numbering: z.string().max(32).nullable().optional(),
})

export type ContractStructure = z.output<typeof contractStructure>


// #endregion