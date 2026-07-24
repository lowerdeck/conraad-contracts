import { z } from 'zod'

export function $switch<T extends z.ZodType<any>>(base: T) {
  return z.object({
    $switch: z.string().max(255),
  }).catchall(base)
}

export function $if<T extends z.ZodType<any>>(base: T) {
  return z.object({
    $if:  z.string().max(255),
    then: z.union([base, $switch(base)]),
    else: z.union([base, $switch(base)]).optional(),
  })
}

export function $<T extends z.ZodType<any>>(base: T) {
  return z.union([
    base,
    $switch(base),
    $if(base),
  ])
}

export type Switch<T> = z.output<ReturnType<typeof $switch<z.ZodType<T>>>>
export type If<T> = z.output<ReturnType<typeof $if<z.ZodType<T>>>>
export type Dynamic<T> = z.output<ReturnType<typeof $<z.ZodType<T>>>>