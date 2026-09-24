import { nanoid } from 'nanoid'
import { z } from 'zod'

export const contractSectionCommon = {
  id:      id(),
  name:    z.string().max(255),
  counter: z.string().optional(),
  $if:     expression().optional(),
}

export function id() {
  return z.string().min(1).max(32).default(nanoid)
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
    $if:  expression().optional(),
    text: z.string(),
  })
}