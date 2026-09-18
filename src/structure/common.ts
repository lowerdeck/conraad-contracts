import { z } from 'zod'
import { calculation } from './calculations'
import { condition } from './condition'
import { input } from './input'

export const contractSectionCommon = {
  name:         z.string().max(255),
  title:        z.string().max(255),
  counter:      z.string().optional(),
  render_title: z.boolean().default(true),
  condition:    condition.optional(),
  inputs:       z.record(z.string(), input).default({}),
  calculated:   z.record(z.string(), calculation).default({}),
}