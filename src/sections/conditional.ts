import { z } from 'zod'

export function $if<T extends z.ZodType<any>>(base: T) {
  return z.union([
    z.object({
      $if:  z.string().max(255),
      then: base,
      else: base.optional(),
    }),
    base,
  ])
}

export type If<T> = z.output<ReturnType<typeof $if<z.ZodType<T>>>>