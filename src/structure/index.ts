import { z } from 'zod'
import { listSection } from './list'
import { textSection } from './text'
import { definitionListSection } from './definition-list'
import { form } from './form'
import { headerFooter } from './header-footer'
import { numberings } from './numbering'

// @index
export * from './common'
export * from './conditional'
export * from './definition-list'
export * from './form'
export * from './header-footer'
export * from './list'
export * from './numbering'
export * from './text'
export * from './variable'
// /index

// #region Section

export const contractSection = z.discriminatedUnion('type', [
  textSection,
  listSection,
  definitionListSection ,
])

export type ContractSection = z.output<typeof contractSection>

export namespace ContractSection {

  export function empty(type: ContractSection['type']): ContractSection {
    switch (type) {
    case 'text':
      return textSection.parse({})
    case 'list':
      return listSection.parse({})
    case 'definition-list':
      return definitionListSection.parse({})
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
})

export type ContractStructure = z.output<typeof contractStructure>


// #endregion