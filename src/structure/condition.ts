import { z } from 'zod'

export const conditionSource = z.discriminatedUnion('kind', [
  z.object({kind: z.literal('variable'), name: z.string().max(255)}),
  z.object({kind: z.literal('assignment'), field: z.enum(['role'])}),
])

export const conditionOperator = z.enum([
  'equals',
  'not_equals',
  'is_true',
  'is_false',
  'is_set',
  'is_not_set',
])

export const condition = z.object({
  source:   conditionSource,
  operator: conditionOperator,
  value:    z.union([z.string(), z.number(), z.boolean()]).optional(),
})

export type Condition = z.output<typeof condition>
export type ConditionSource = z.output<typeof conditionSource>
export type ConditionOperator = z.output<typeof conditionOperator>
