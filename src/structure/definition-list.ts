import { z } from 'zod'
import { anchor, conditionalBody, contractSectionCommon, expression } from './common'

export const definitionListItem = z.object({
  $if:     expression().optional(),
  $anchor: anchor().optional(),
  term:    z.string().max(255),
  body:    z.string(),
})

export const definitionListSection = z.object({
  ...contractSectionCommon,
  type:      z.literal('definition-list'),
  preamble:  conditionalBody().optional(),
  postamble: conditionalBody().optional(),
  items:     z.array(definitionListItem),
})

export type DefinitionListSection = z.output<typeof definitionListSection>
export type DefinitionListItem = z.output<typeof definitionListItem>