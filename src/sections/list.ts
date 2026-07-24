import { z } from 'zod'
import { contractSectionCommon } from './common'
import { $ } from './dynamic'

export const listItem = z.preprocess(val => {
  if (typeof val === 'string') {
    return {text: val}
  } else {
    return val
  }
}, z.object({
  text: z.string(),
}))

export const listSection = z.object({
  ...contractSectionCommon,
  type:     z.literal('list'),
  preamble: z.string(),
  items:    z.array($(listItem)),
})

export type ListSectionTemplate = z.output<typeof listSection>
export type ListItem = z.output<typeof listItem>