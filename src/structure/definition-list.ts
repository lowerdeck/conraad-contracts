import { z } from 'zod'
import { $anchor } from './anchor'
import { contractSectionCommon } from './common'
import { $conditional } from './conditional'

export const definitionListItem = z.object({
  term: z.string().max(255),
  body: z.string(),
})

export const definitionListSection = z.object({
  ...contractSectionCommon,
  type:      z.literal('definition-list'),
  preamble:  $conditional(z.string()).optional(),
  postamble: $conditional(z.string()).optional(),
  items:     z.array($conditional($anchor(definitionListItem))),
})

export type DefinitionListSection = z.output<typeof definitionListSection>
export type DefinitionListItem = z.output<typeof definitionListItem>