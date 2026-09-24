import { z } from 'zod'
import { listSection, ListStyle } from './list'
import { textSection } from './text'
import { definitionListSection } from './definition-list'
import { nanoid } from 'nanoid'

// @index
export * from './common'
export * from './definition-list'
export * from './list'
export * from './text'
export * from './variable'
// /index

export const contractSection = z.discriminatedUnion('type', [
  textSection,
  listSection,
  definitionListSection ,
])

export type ContractSection = z.output<typeof contractSection>

export namespace ContractSection {

  export function empty(type: ContractSection['type']): ContractSection {
    const common = {
      id:   nanoid(12),
      name: '',
    }

    switch (type) {
    case 'text':
      return {...common, type, body: ''}
    case 'list':
      return {...common, type, list_style: ListStyle.Numbers, items: []}
    case 'definition-list':
      return {...common, type, items: []}
    }
  }

  
}