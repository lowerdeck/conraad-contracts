import { isPlainObject } from 'ytil'
import { z } from 'zod'

export function $anchor<T extends z.ZodObject<any>>(base: T) {
  return base.extend({
    $anchor: z.string().max(255).optional(),
  })
}


export type Anchor<T> = T & {
  $anchor?: string
}

export namespace Anchor {
  export function is<T>(value: T | Anchor<T>): value is Anchor<T> {
    return isPlainObject(value) && '$if' in value
  }
}