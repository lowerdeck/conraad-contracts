import { isPlainObject } from 'ytil'
import { z } from 'zod'

export function $conditional<T extends z.ZodObject<any>>(base: T) {
  return base.extend({
    $if: z.string().max(255).optional(),
  })
}

export type Conditional<T> = T & {
  $if?: string
}

export namespace Conditional {
  export function is<T>(value: T | Conditional<T>): value is Conditional<T> {
    return isPlainObject(value) && '$if' in value
  }
}