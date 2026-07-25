import { z } from 'zod'
import { contractSectionCommon } from './common'
import { $if } from './conditional'
import { $ } from './dynamic'

export const textSection = z.object({
  ...contractSectionCommon,
  type: z.literal('text'),
  body: $if($(z.string())),
})

export type TextSection = z.output<typeof textSection>