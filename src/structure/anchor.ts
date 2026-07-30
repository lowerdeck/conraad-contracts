import { z } from 'zod'

export function $anchor<T extends z.ZodType<any>>(base: T): z.ZodType<Anchor<z.output<T>>> {
  return z.union([
    z.intersection(
      z.object({
        $anchor: z.string().max(255),
      }),
      base,
    ),
    base,
  ])
}


export type Anchor<T> = {
  $anchor?: string
} & T

export namespace Anchor {
  export function is<T>(value: T | Anchor<T>): value is Anchor<T> {
    return typeof value === 'object' && value !== null && '$anchor' in value
  }
}