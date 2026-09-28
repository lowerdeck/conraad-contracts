import { z } from 'zod'
import { richText } from './common'

export const headerFooter = z.object({
  body:       richText(),
  first_page: z.boolean().default(true),
})

export type HeaderFooter = z.output<typeof headerFooter>
