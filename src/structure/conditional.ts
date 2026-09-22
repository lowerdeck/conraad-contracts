import { isPlainObject } from 'ytil'
import { z } from 'zod'

export function $conditional<T extends z.ZodType<any>>(base: T) {
  return z.union([
    base,
    z.object({
      $if:  z.string().max(255),
      then: base,
      else: base.optional(),
    }),
  ])
}

export type IfThen<T> = {
  $if: string
  then: T
  else?: T
}
export type Conditional<T> = IfThen<T> | T

export namespace Conditional {
  export function isIfThen<T>(value: Conditional<T>): value is IfThen<T> {
    return isPlainObject(value) && '$if' in value && 'then' in value
  }
}