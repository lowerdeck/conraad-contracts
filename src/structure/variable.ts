import { z } from 'zod'
import { expression } from './common'

const variableCommon = z.object({
  name:     z.string().max(64).min(1),
  title:    z.string().max(64).min(1),
  subtitle: z.string().max(1024).min(1).optional(),
})

export const choiceOption = z.object({
  value: z.string().max(255),
  label: z.string().max(255),
})

export const textVariable = z.object({
  type:    z.literal('text'),
  default: z.string().optional(),
  input:   z.enum(['input', 'textarea']).optional(),

  min_length: z.int().nonnegative().optional(),
  max_length: z.int().nonnegative().optional(),
}).extend(variableCommon.shape)

export const numberVariable = z.object({
  type:    z.literal('number'),
  default: z.number().optional(),
  input:   z.enum(['input', 'slider']).optional(),

  integer: z.boolean().default(false),
  min:     z.number().optional(),
  max:     z.number().optional(),
}).extend(variableCommon.shape)

export const currencyVariable = z.object({
  type:    z.literal('currency'),
  default: z.number().optional(),
  input:   z.enum(['input', 'slider']).optional(),

  /** An ISO 4217 code. */
  currency: z.string().length(3).default('EUR'),
  decimals: z.boolean().default(true),
  min:      z.number().optional(),
  max:      z.number().optional(),
}).extend(variableCommon.shape)

export const booleanVariable = z.object({
  type:    z.literal('boolean'),
  default: z.boolean().optional(),
  input:   z.enum(['switch', 'select']).optional(),
}).extend(variableCommon.shape)

// Stored as an ISO date, without a time.
export const dateVariable = z.object({
  type:    z.literal('date'),
  default: z.string().optional(),
}).extend(variableCommon.shape)

export const choiceVariable = z.object({
  type:    z.literal('choice'),
  default: z.string().optional(),
  input:   z.enum(['select', 'radio']).optional(),
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

export const calculatedVariable = z.object({
  type:       z.literal('calculated'),
  expression: expression(),
}).extend(variableCommon.shape)

// Anything that is filled in on the form, as opposed to calculated.
export const inputVariable = z.discriminatedUnion('type', [
  textVariable,
  numberVariable,
  currencyVariable,
  booleanVariable,
  dateVariable,
  choiceVariable,
])

export type Variable = InputVariable | CalculatedVariable
export type TextVariable = z.output<typeof textVariable>
export type NumberVariable = z.output<typeof numberVariable>
export type CurrencyVariable = z.output<typeof currencyVariable>
export type DateVariable = z.output<typeof dateVariable>
export type BooleanVariable = z.output<typeof booleanVariable>
export type ChoiceVariable = z.output<typeof choiceVariable>
export type ChoiceOption = z.output<typeof choiceOption>
export type CalculatedVariable = z.output<typeof calculatedVariable>
export type InputVariable = z.output<typeof inputVariable>
