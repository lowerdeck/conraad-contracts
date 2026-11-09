import { z } from 'zod'
import { id } from './common'
import { conditional } from './conditional'
import { booleanVariable, CalculatedVariable, calculatedVariable, inputVariable, Variable } from './variable'

export const formField = z.object({
  id:       id(),
  variable: inputVariable,

  /**
   * Shown as a little info icon with a popup for even more instructions or special cases.
   */
  instruction: z.string().max(1024).min(1).optional(),

  /**
   * Fields are required, unless they're optional.
   */
  optional: z.boolean().optional(),
})

export const formFieldset = z.object({
  id:       id(),
  title:    z.string().min(1).max(255).nullable().default(null),
  preamble: z.string().max(2048).min(1).optional(),
  icon:     z.string().max(64).nullable().optional(),

  /**
   * When the fieldset applies at all, like only for some kinds of assignments. Otherwise it's left out of the form.
   */
  $if: conditional().optional(),

  /**
   * Makes the fieldset conditional: its fields are only shown when this is switched on.
   */
  toggle: booleanVariable.nullable().optional(),

  fields: z.array(formField).default([]),

  /**
   * Starts a new page of the form with this fieldset. The first fieldset always starts the first page.
   */
  new_page: z.boolean().optional(),

  /**
   * Who fills in the fieldset: the producer when drawing up the contract (the default), or the contractor when it's
   * offered to them. Each side has a form of its own, but the values end up in the same place.
   */
  side: formSide().optional(),
})

export const form = z.object({
  fieldsets:  z.array(formFieldset).default([]),
  calculated: z.array(calculatedVariable).default([]),
})

export function formSide() {
  return z.enum(['producer', 'contractor'])
}

export type Form = z.output<typeof form>
export type FormSide = z.output<ReturnType<typeof formSide>>
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
    for (const fieldset of form.fieldsets) {
      if (fieldset.toggle != null) {
        result.push(fieldset.toggle)
      }
      result.push(...fieldset.fields.map(it => it.variable))
    }
    result.push(...form.calculated)
    return result
  }

  /**
   * The fieldsets that the given side fills in.
   */
  export function fieldsetsOf(form: Form, side: FormSide): FormFieldset[] {
    return form.fieldsets.filter(it => FormFieldset.side(it) === side)
  }

  /**
   * The names of the variables that the given side fills in: its fields and the toggles of its fieldsets.
   */
  export function inputNamesOf(form: Form, side: FormSide): Set<string> {
    const names = new Set<string>()
    for (const fieldset of fieldsetsOf(form, side)) {
      if (fieldset.toggle != null) {
        names.add(fieldset.toggle.name)
      }
      fieldset.fields.forEach(it => names.add(it.variable.name))
    }
    return names
  }

  export function fieldset(form: Form, id: string): FormFieldset | null {
    return form.fieldsets.find(it => it.id === id) ?? null
  }

  /**
   * The fieldsets of a side, split into pages where they start a new page.
   */
  export function pages(form: Form, side: FormSide): FormFieldset[][] {
    const pages: FormFieldset[][] = []
    for (const fieldset of fieldsetsOf(form, side)) {
      if (pages.length === 0 || fieldset.new_page) {
        pages.push([])
      }
      pages[pages.length - 1].push(fieldset)
    }
    return pages
  }

  /**
   * Finds a variable by its name: a field, the toggle of a fieldset, or a calculated variable.
   */
  export function findVariable(form: Form, name: string): FormVariableLocation | null {
    for (const fieldset of form.fieldsets) {
      if (fieldset.toggle?.name === name) {
        return {kind: 'toggle', fieldset}
      }

      const field = fieldset.fields.find(it => it.variable.name === name)
      if (field != null) {
        return {kind: 'field', fieldset, field}
      }
    }

    const variable = form.calculated.find(it => it.name === name)
    return variable == null ? null : {kind: 'calculated', variable}
  }

}

export namespace FormFieldset {

  export function side(fieldset: FormFieldset): FormSide {
    return fieldset.side ?? 'producer'
  }

}

export type FormVariableLocation =
  | {kind: 'field', fieldset: FormFieldset, field: FormField}
  | {kind: 'toggle', fieldset: FormFieldset}
  | {kind: 'calculated', variable: CalculatedVariable}
