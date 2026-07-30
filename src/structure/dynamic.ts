import { objectEntries } from 'ytil'
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

export type Switch<T> = {
  $switch: string
} & {
  [key: string]: T
}

export type Optional<T> = {
  $optional: string
} & T

export type Dynamic<T> = Switch<T> | Optional<T> | T

export namespace Dynamic {
  export function variants<T>(value: Dynamic<T>): T[] {
    if (Switch.is(value)) {
      return Switch.variants(value)
    } else {
      return [value]
    }
  } 
}

export namespace Switch {
  export function is<T>(value: Dynamic<T>): value is Switch<T> {
    return typeof value === 'object' && value !== null && '$switch' in value
  }

  export function variants<T>(value: Switch<T>): T[] {
    const variants: T[] = []
    for (const [key, variant] of objectEntries(value)) {
      if (key === '$switch') { continue }
      variants.push(variant)
    }
    return variants
  }
}

export namespace Optional {
  export function is<T>(value: Dynamic<T>): value is Optional<T> {
    return typeof value === 'object' && value !== null && '$optional' in value
  }
}