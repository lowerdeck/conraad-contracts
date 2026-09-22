import { z } from 'zod'

export const contractSectionCommon = {
  id:      z.uuid(),
  title:   z.string().max(255),
  counter: z.string().optional(),
}

export function body() {
  return z.object({
    text: z.string(),
  })
}