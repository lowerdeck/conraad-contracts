import { z } from 'zod'

export function $optional<T extends z.ZodType<any>>(base: T) {
  return z.intersection(
    z.object({
      $optional: z.string().max(255),
    }),
    base,
  )
}

export function $switch<T extends z.ZodType<any>>(base: T) {
  return z.object({
    $switch: z.string().max(255),
  }).catchall(base)
}

export function $<T extends z.ZodType<any>>(base: T) {
  return z.union([
    base,
    $optional(base),
    $switch(base),
  ])
}

export type Switch<T> = z.output<ReturnType<typeof $switch<z.ZodType<T>>>>
export type Optional<T> = z.output<ReturnType<typeof $optional<z.ZodType<T>>>>
export type Dynamic<T> = z.output<ReturnType<typeof $<z.ZodType<T>>>>