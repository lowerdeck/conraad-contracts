import { z } from 'zod'
import { listSection } from './list'
import { textSection } from './text'
import { definitionListSection } from './definition-list'

// @index
export * from './anchor'
export * from './calculations'
export * from './common'
export * from './condition'
export * from './conditional'
export * from './definition-list'
export * from './input'
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
