import { z } from 'zod'

const variableCommon = z.object({
  name:         z.string().max(64).min(1),
  label:        z.string().max(64).min(1),
  instructions: z.string().max(1024).min(1).optional(),
})

export const choiceOption = z.object({
  value: z.string().max(255),
  label: z.string().max(255),
})

export const textVariable = z.object({
  type:    z.literal('text'),
  default: z.string().optional(),

  min_length: z.int().nonnegative().optional(),
  max_length: z.int().nonnegative().optional(),
}).extend(variableCommon.shape)

export const numberVariable = z.object({
  type:    z.literal('number'),
  default: z.number().optional(),

  integer: z.boolean().default(false),
  min:     z.number().optional(),
  max:     z.number().optional(),
}).extend(variableCommon.shape)

export const booleanVariable = z.object({
  type:    z.literal('boolean'),
  default: z.boolean().optional(),
}).extend(variableCommon.shape)

export const choiceVariable = z.object({
  type:    z.literal('choice'),
  default: z.string().optional(),
  options: z.array(choiceOption).default([]),
})
  .extend(variableCommon.shape)
  .refine(variable => {
    if (variable.default !== undefined) {
      return variable.options.some(it => it.value === variable.default)
    } else {
      return true
    }
  }, "Default value must be one of the options")

export const variable = z.discriminatedUnion('type', [
  textVariable,
  numberVariable,
  booleanVariable,
  choiceVariable,
])

export type Variable = z.output<typeof variable>
export type TextVariable = z.output<typeof textVariable>
export type NumberVariable = z.output<typeof numberVariable>
export type BooleanVariable = z.output<typeof booleanVariable>
export type ChoiceVariable = z.output<typeof choiceVariable>
export type ChoiceOption = z.output<typeof choiceOption>
