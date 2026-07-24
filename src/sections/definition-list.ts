import { z } from 'zod'
import { contractSectionCommon } from './common'
import { $ } from './dynamic'

export const definitionListItem = z.object({
  term: z.string().max(255),
  body: z.string(),
})

export const definitionListSection = z.object({
  ...contractSectionCommon,
  type:     z.literal('definitions'),
  preamble: z.string(),
  items:    z.array($(definitionListItem)),
})

export type DefinitionsSectionTemplate = z.output<typeof definitionListSection>
export type DefinitionListItem = z.output<typeof definitionListItem>