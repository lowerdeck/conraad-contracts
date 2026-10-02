import { z } from 'zod'
import { id } from './common'
import { booleanVariable, calculatedVariable, inputVariable, Variable } from './variable'

export const formField = z.object({
  id:       id(),
  variable: inputVariable,

  /**
   * Shown as a little info icon with a popup for even more instructions or special cases.
   */
  instruction: z.string().max(1024).min(1).optional(),
})

export const formFieldset = z.object({
  id:       id(),
  title:    z.string().max(255).default(''),
  preamble: z.string().max(2048).min(1).optional(),
  icon:     z.string().max(64).nullable().optional(),

  /**
   * Makes the fieldset conditional: its fields are only shown when this is switched on.
   */
  toggle: booleanVariable.nullable().optional(),

  fields: z.array(formField).default([]),
})

export const formPage = z.object({
  id:        id(),
  title:     z.string().max(255).default(''),
  preamble:  z.string().max(2048).min(1).optional(),
  fieldsets: z.array(formFieldset).default([]),
})

export const form = z.object({
  pages:      z.array(formPage).default(() => [formPage.parse({})]),
  calculated: z.array(calculatedVariable).default([]),
})

export type Form = z.output<typeof form>
export type FormPage = z.output<typeof formPage>
export type FormFieldset = z.output<typeof formFieldset>
export type FormField = z.output<typeof formField>

export namespace Form {

  export function empty(): Form {
    return form.parse({})
  }

  /**
   * All variables in the form, in form order, followed by the calculated ones.
   */
  export function variables(form: Form): Variable[] {
    const result: Variable[] = []
    for (const page of form.pages) {
      for (const fieldset of page.fieldsets) {
        if (fieldset.toggle != null) {
          result.push(fieldset.toggle)
        }
        result.push(...fieldset.fields.map(it => it.variable))
      }
    }
    result.push(...form.calculated)
    return result
  }

}
