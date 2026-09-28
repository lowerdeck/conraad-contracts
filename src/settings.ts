import { z } from 'zod'
import { numberings } from './structure/numbering'

/**
 * Organisation wide contract settings. These serve as the defaults for new contract templates.
 */
export const contractSettings = z.object({
  numberings: numberings.default(() => numberings.parse({})),
})

export type ContractSettings = z.output<typeof contractSettings>
