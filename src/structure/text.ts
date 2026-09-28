import { z } from 'zod'
import { contractSectionCommon, richText } from './common'

export const textSection = z.object({
  ...contractSectionCommon,
  type: z.literal('text'),
  body: richText(),
})

export type TextSection = z.output<typeof textSection>