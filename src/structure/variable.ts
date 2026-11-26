import { z } from 'zod'
import { expression } from './common'
import { Conditional, conditional } from './conditional'

const variableCommon = z.object({
  name:     z.string().max(64).min(1),
  title:    z.string().max(64).min(1),
  subtitle: z.string().max(1024).min(1).optional(),
})

// What's chosen is stored as it's shown.
export const choiceOption = z.object({
  value: z.string().min(1).max(255),

  /** When the option may be chosen at all, like only for some projects. */
  $if: conditional().optional(),
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

// The items of a repeating fieldset, each an object with the values of its fields.
export const arrayVariable = z.object({
  type: z.literal('array'),
  min:  z.int().nonnegative().optional(),
  max:  z.int().positive().optional(),
}).extend(variableCommon.shape)

// The items of a repeating fieldset by key, each an object with the values of its fields. Only the keys that are
// filled in have an item, in the order of the keys. Keys are stored as they're shown, so they're referred to like
// `rates["Nog een"]` when they aren't names.
export const mapVariable = z.object({
  type: z.literal('map'),
  keys: z.array(choiceOption).default([]),
}).extend(variableCommon.shape)

// What the items of a repeating fieldset are stored in.
export const collectionVariable = z.discriminatedUnion('type', [arrayVariable, mapVariable])

// Anything that is filled in on the form, as opposed to calculated.
export const inputVariable = z.discriminatedUnion('type', [
  textVariable,
  numberVariable,
  currencyVariable,
  booleanVariable,
  dateVariable,
  choiceVariable,
])

export type Variable = InputVariable | CalculatedVariable | RepeatVariable
export type TextVariable = z.output<typeof textVariable>
export type NumberVariable = z.output<typeof numberVariable>
export type CurrencyVariable = z.output<typeof currencyVariable>
export type DateVariable = z.output<typeof dateVariable>
export type BooleanVariable = z.output<typeof booleanVariable>
export type ChoiceVariable = z.output<typeof choiceVariable>
export type ChoiceOption = z.output<typeof choiceOption>
export type CalculatedVariable = z.output<typeof calculatedVariable>
export type InputVariable = z.output<typeof inputVariable>
export type ArrayVariable = z.output<typeof arrayVariable>
export type MapVariable = z.output<typeof mapVariable>
export type CollectionVariable = z.output<typeof collectionVariable>

/** The variable of a repeating fieldset, along with the variables of its fields, which each item has. */
export type RepeatVariable = CollectionVariable & {
  fields: InputVariable[]
}

export namespace RepeatVariable {

  /**
   * What's known of an item of a repeating fieldset where it's in scope: its fields, and for a map, its key.
   */
  export function itemFields(variable: RepeatVariable): InputVariable[] {
    if (variable.type === 'array') { return variable.fields }
    return [...variable.fields, ...mapItemFields]
  }

}

const mapItemFields: InputVariable[] = [
  {type: 'text', name: '$key', title: 'Keuze'},
]

export namespace ChoiceOption {

  /** The options that may be chosen, of which the conditions hold. */
  export function applicable(options: ChoiceOption[], applies: (conditional: Conditional | undefined) => boolean): ChoiceOption[] {
    return options.filter(it => applies(it.$if))
  }

}
