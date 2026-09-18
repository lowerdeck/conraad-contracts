import { z } from 'zod'

export const variableCommon = {
  name:  z.string().max(255),
  label: z.string().max(255),
}

export const choiceOption = z.object({
  value: z.string().max(255),
  label: z.string().max(255),
})

export const textVariable = z.object({...variableCommon, type: z.literal('text'), default: z.string().optional()})
export const numberVariable = z.object({...variableCommon, type: z.literal('number'), default: z.number().optional()})
export const booleanVariable = z.object({...variableCommon, type: z.literal('boolean'), default: z.boolean().optional()})
export const choiceVariable = z.object({
  ...variableCommon,
  type:    z.literal('choice'),
  options: z.array(choiceOption).default([]),
  default: z.string().optional(),
})

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
