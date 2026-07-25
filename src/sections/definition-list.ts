import { z } from 'zod'
import { contractSectionCommon } from './common'
import { $if } from './conditional'
import { $ } from './dynamic'

export const definitionListItem = z.object({
  term: z.string().max(255),
  body: z.string(),
})

export const definitionListSection = z.object({
  ...contractSectionCommon,
  type:     z.literal('definition-list'),
  preamble: $if(z.string()),
  items:    z.array($if($(definitionListItem))),
})

export type DefinitionListSection = z.output<typeof definitionListSection>
export type DefinitionListItem = z.output<typeof definitionListItem>