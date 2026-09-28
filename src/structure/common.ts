import { nanoid } from 'nanoid'
import { z } from 'zod'
import { conditional } from './conditional'
import { numberingName } from './numbering'

export const contractSectionCommon = {
  id:   id(),
  name: z.string().max(255),

  /**
   * The name of the numbering the section is numbered in, if any.
   */
  numbering: numberingName().nullable().optional(),

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

export function body() {
  return z.object({
    text: z.string(),
  })
}

export function conditionalBody() {
  return z.object({
    $if:  conditional().optional(),
    text: z.string(),
  })
}

export type ConditionalBody = z.output<ReturnType<typeof conditionalBody>>
export type Identifier = string
export type Expression = string