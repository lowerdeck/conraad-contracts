import { z } from 'zod'

export const contractSectionCommon = {
  id:      z.uuid(),
  title:   z.string().max(255),
  counter: z.string().optional(),
  $if:     expression().optional(),
}

export function expression() {
  return z.string().max(255)
}

export function anchor() {
  return z.string().max(255)
}

export function body() {
  return z.object({
    text: z.string(),
  })
}

export function conditionalBody() {
  return z.object({
    $if:  expression(),
    text: z.string(),
  })
}