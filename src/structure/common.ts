import { z } from 'zod'

export const contractSectionCommon = {
  name:         z.string().max(255),
  title:        z.string().max(255),
  counter:      z.boolean().default(false),
  render_title: z.boolean().default(true),
}