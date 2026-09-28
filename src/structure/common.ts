import { nanoid } from 'nanoid'
import { z } from 'zod'
import { conditional } from './conditional'

export const contractSectionCommon = {
  id:   id(),
  name: z.string().max(255),

  /**
   * The ID of the numbering the section is numbered in, if any.
   */
  numbering: z.string().max(32).nullable().optional(),

  $if: conditional().optional(),
}

export function id(size: number = 12) {
  return z.string().min(1).max(32).default(() => nanoid(size))
}

export function identifier() {
  return z.string().max(64)
}

export function expression() {
  return z.string().max(1024)
}

export function richText() {
  return z.any()
}

export function body() {
  return z.object({
    text: richText(),
  })
}

export function conditionalBody() {
  return z.object({
    $if:  conditional().optional(),
    text: richText(),
  })
}

export type ConditionalBody = z.output<ReturnType<typeof conditionalBody>>
export type Identifier = string
export type Expression = string
export type RichText = z.output<ReturnType<typeof richText>>