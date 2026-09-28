import { z } from 'zod'
import { Numbering, numbering } from './structure/numbering'

/**
 * Organisation wide contract settings. These serve as the defaults for new contract templates.
 */
export const contractSettings = z.object({
  numberings: z.array(numbering).default(() => Numbering.defaults()),
})

export type ContractSettings = z.output<typeof contractSettings>
