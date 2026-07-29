import { z } from 'zod'

export function $anchor<T extends z.ZodType<any>>(base: T) {
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


export type Anchor<T> = z.output<ReturnType<typeof $anchor<z.ZodType<T>>>>