import { isPlainObject } from 'ytil'
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

export type Conditional<T> = {
  $if: string
  then: T
  else?: T
}
export type If<T> = Conditional<T> | T

export namespace Conditional {
  export function is<T>(value: If<T>): value is Conditional<T> {
    return isPlainObject(value) && '$if' in value && 'then' in value
  }
}