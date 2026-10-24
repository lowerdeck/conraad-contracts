import { Form, FormField } from './form'
import { InputVariable } from './variable'

/**
 * Checks the values filled in on a form: required fields must have a value, and values must respect their field's
 * validation. Fields of a fieldset that is switched off are left out. Values that are absent fall back to their
 * field's default.
 */
export function validateFormValues(form: Form, values: Record<string, unknown>): FormValueIssue[] {
  const issues: FormValueIssue[] = []

  for (const fieldset of form.fieldsets) {
    if (fieldset.toggle != null && resolveValue(fieldset.toggle, values) !== true) { continue }

    for (const field of fieldset.fields) {
      const issue = validateField(field, resolveValue(field.variable, values))
      if (issue != null) {
        issues.push(issue)
      }
    }
  }

  return issues
}

export interface FormValueIssue {
  /** The name of the field's variable. */
  name:    string
  code:    FormValueIssueCode
  params?: {minimum?: number, maximum?: number}
}

export type FormValueIssueCode = 'required' | 'too_short' | 'too_long' | 'below_minimum' | 'above_maximum' | 'invalid_value'

function resolveValue(variable: InputVariable, values: Record<string, unknown>): unknown {
  if (variable.name in values) { return values[variable.name] }
  return variable.default ?? null
}

function validateField(field: FormField, value: unknown): FormValueIssue | null {
  const {variable} = field
  const issue = (code: FormValueIssueCode, params?: FormValueIssue['params']): FormValueIssue => ({name: variable.name, code, params})

  if (isEmpty(variable, value)) {
    return field.optional ? null : issue('required')
  }

  switch (variable.type) {
  case 'text':
    if (typeof value !== 'string') { return issue('invalid_value') }
    if (variable.min_length != null && value.length < variable.min_length) { return issue('too_short', {minimum: variable.min_length}) }
    if (variable.max_length != null && value.length > variable.max_length) { return issue('too_long', {maximum: variable.max_length}) }
    return null

  case 'number':
  case 'currency':
    if (typeof value !== 'number' || !Number.isFinite(value)) { return issue('invalid_value') }
    if (variable.type === 'number' && variable.integer && !Number.isInteger(value)) { return issue('invalid_value') }
    if (variable.min != null && value < variable.min) { return issue('below_minimum', {minimum: variable.min}) }
    if (variable.max != null && value > variable.max) { return issue('above_maximum', {maximum: variable.max}) }
    return null

  // Only a switch gets here without a value, which counts as off.
  case 'boolean':
    return value == null || typeof value === 'boolean' ? null : issue('invalid_value')

  case 'date':
    return typeof value === 'string' && isoDate.test(value) && !Number.isNaN(Date.parse(value)) ? null : issue('invalid_value')

  case 'choice':
    return variable.options.some(it => it.value === value) ? null : issue('invalid_value')
  }
}

// A switch is off rather than empty, so it always has a value.
function isEmpty(variable: InputVariable, value: unknown) {
  if (variable.type === 'boolean' && variable.input !== 'select') { return false }
  if (value == null) { return true }
  return typeof value === 'string' && value.trim() === ''
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/
