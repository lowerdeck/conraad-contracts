import { nanoid } from 'nanoid'
import { z } from 'zod'
import { conditionalBody, contractSectionCommon, expression, id } from './common'

export const definitionListItem = z.object({
  id:   id(),
  $if:  expression().optional(),
  term: z.string().max(255),
  body: z.string(),
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

export namespace DefinitionListItem {

  export function empty(): DefinitionListItem {
    return {
      id:   nanoid(8),
      term: '',
      body: '',
    }
  }

}