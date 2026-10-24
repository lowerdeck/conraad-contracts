import { describe, expect, it } from 'vitest'
import { Form, formField, FormField, formFieldset, FormFieldset } from '../form'
import { validateFormValues } from '../form-validation'
import { booleanVariable, inputVariable } from '../variable'

describe('validateFormValues', () => {

  it('requires fields, unless they are optional', () => {
    const form = formOf(fieldset([
      field({type: 'text', name: 'name'}),
      field({type: 'text', name: 'remarks'}, {optional: true}),
    ]))

    expect(validateFormValues(form, {})).toEqual([{name: 'name', code: 'required'}])
    expect(validateFormValues(form, {name: '  '})).toEqual([{name: 'name', code: 'required'}])
    expect(validateFormValues(form, {name: 'Jan'})).toEqual([])
  })

  it('uses defaults for values that are absent', () => {
    const form = formOf(fieldset([field({type: 'number', name: 'days', default: 5})]))
    expect(validateFormValues(form, {})).toEqual([])
    expect(validateFormValues(form, {days: null})).toEqual([{name: 'days', code: 'required'}])
  })

  it('leaves out the fields of a fieldset that is switched off', () => {
    const toggle = booleanVariable.parse({type: 'boolean', name: 'travel', title: 'Reiskosten'})
    const form = formOf(fieldset([field({type: 'currency', name: 'rate'})], {toggle}))

    expect(validateFormValues(form, {})).toEqual([])
    expect(validateFormValues(form, {travel: true})).toEqual([{name: 'rate', code: 'required'}])
  })

  it('counts a switch that is not set as off, but requires a yes/no select', () => {
    const form = formOf(fieldset([
      field({type: 'boolean', name: 'switch'}),
      field({type: 'boolean', name: 'select', input: 'select'}),
    ]))
    expect(validateFormValues(form, {})).toEqual([{name: 'select', code: 'required'}])
  })

  it('checks the validation of fields', () => {
    const form = formOf(fieldset([
      field({type: 'number', name: 'share', integer: true, min: 0, max: 100}),
      field({type: 'text', name: 'code', min_length: 6}),
      field({type: 'choice', name: 'kind', options: [{value: 'a', label: 'A'}]}),
      field({type: 'date', name: 'start'}),
    ]))

    expect(validateFormValues(form, {share: 120, code: 'abc', kind: 'b', start: 'gisteren'})).toEqual([
      {name: 'share', code: 'above_maximum', params: {maximum: 100}},
      {name: 'code', code: 'too_short', params: {minimum: 6}},
      {name: 'kind', code: 'invalid_value'},
      {name: 'start', code: 'invalid_value'},
    ])
    expect(validateFormValues(form, {share: 50, code: 'abcdef', kind: 'a', start: '2026-01-31'})).toEqual([])
  })

})

function formOf(...fieldsets: FormFieldset[]): Form {
  return {fieldsets, calculated: []}
}

function fieldset(fields: FormField[], overrides: Partial<FormFieldset> = {}): FormFieldset {
  return {...formFieldset.parse({}), fields, ...overrides}
}

function field(variable: Record<string, unknown>, overrides: Partial<FormField> = {}): FormField {
  return {...formField.parse({variable: inputVariable.parse({title: 'Veld', ...variable})}), ...overrides}
}
