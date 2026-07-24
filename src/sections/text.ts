import { z } from 'zod'
import { contractSectionCommon } from './common'
import { $ } from './dynamic'

export const textSection = z.object({
  ...contractSectionCommon,
  type: z.literal('text'),
  body: $(z.string()),
})

export type TextSection = z.output<typeof textSection>