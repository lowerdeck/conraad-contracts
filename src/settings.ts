import { z } from 'zod'
import { Numbering, numberings } from './structure/numbering'

/**
 * Organisation wide contract settings. These serve as the defaults for new contract templates.
 */
export const contractSettings = z.object({
  numberings: numberings.default(() => Numbering.defaults()),
})

export type ContractSettings = z.output<typeof contractSettings>
