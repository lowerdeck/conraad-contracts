import { z } from 'zod'
import { listSection } from './list'
import { textSection } from './text'
import { definitionListSection } from './definition-list'
import { counter } from './counter'
import { identifier } from './common'

// @index
export * from './common'
export * from './conditional'
export * from './counter'
export * from './counter-styles'
export * from './definition-list'
export * from './list'
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
  sections: z.array(contractSection).default([]),
  counters: z.record(identifier(), counter).default({}),
})

export type ContractStructure = z.output<typeof contractStructure>


// #endregion