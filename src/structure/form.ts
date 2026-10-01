import { z } from 'zod'
import { id } from './common'
import { booleanVariable, calculatedVariable, inputVariable, Variable } from './variable'

export const formFieldset = z.object({
  id:    id(),
  title: z.string().max(255).default(''),
  icon:  z.string().max(64).nullable().optional(),

  /**
   * Makes the fieldset conditional: its fields are only shown when this is switched on.
   */
  toggle: booleanVariable.nullable().optional(),

  fields: z.array(inputVariable).default([]),
})

export const formPage = z.object({
  id:        id(),
  title:     z.string().max(255).default(''),
  fieldsets: z.array(formFieldset).default([]),
})

export const form = z.object({
  pages:      z.array(formPage).default(() => [formPage.parse({})]),
  calculated: z.array(calculatedVariable).default([]),
})

export type Form = z.output<typeof form>
export type FormPage = z.output<typeof formPage>
export type FormFieldset = z.output<typeof formFieldset>

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
        result.push(...fieldset.fields)
      }
    }
    result.push(...form.calculated)
    return result
  }

}
