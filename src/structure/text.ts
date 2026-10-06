import { z } from 'zod'
import { contractSectionCommon, richText } from './common'

export const textSection = z.object({
  ...contractSectionCommon,
  type: z.literal('text').default('text'),
  body: richText().default(null),
})

export type TextSection = z.output<typeof textSection>