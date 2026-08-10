import { z } from 'zod'

export const validation = z.object({
  rule:    z.string().max(255),
  message: z.string().max(255),
})

const inputCommon = {
  label:    z.string().max(255),
  validate: z.array(validation).default([]),
}

export const textInput = z.object({
  type:       z.literal('text'),
  min_length: z.number().optional(),
  max_length: z.number().optional(),
  pattern:    z.string().optional(),
  default:    z.string(),
  ...inputCommon,
})

export const numberInput = z.object({
  type:    z.literal('number'),
  min:     z.number().optional(),
  max:     z.number().optional(),
  step:    z.number().optional(),
  default: z.number(),
  ...inputCommon,
})

export const input = z.discriminatedUnion('type', [
  textInput,
  numberInput,
])

export type Input = z.output<typeof input>
export type Validation = z.output<typeof validation>