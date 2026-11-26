import { describe, expect, it } from 'vitest'
import { Form, formField, FormField, formFieldset, FormFieldset } from '../form'
import { validateFormValues } from '../form-validation'
import { arrayVariable, booleanVariable, inputVariable, mapVariable } from '../variable'

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

  it('checks the number of items of a repeating fieldset, and the fields of each', () => {
    const repeat = arrayVariable.parse({type: 'array', name: 'specialisms', title: 'Specialisme', min: 1, max: 2})
    const form = formOf(fieldset([field({type: 'text', name: 'text'})], {repeat}))

    expect(validateFormValues(form, {})).toEqual([{name: 'specialisms', code: 'too_few_items', params: {minimum: 1}}])
    expect(validateFormValues(form, {specialisms: [{text: 'A'}, {text: ''}, {text: 'C'}]})).toEqual([
      {name: 'specialisms', code: 'too_many_items', params: {maximum: 2}},
      {name: 'specialisms.1.text', code: 'required'},
    ])
    expect(validateFormValues(form, {specialisms: [{text: 'A'}]})).toEqual([])
  })

  it('checks the items of a map, which must be for a key that applies, and the fields of each', () => {
    const repeat = mapVariable.parse({type: 'map', name: 'rates', title: 'Tarief', keys: [
      {value: 'weekend', label: 'Weekend'},
      {value: 'night', label: 'Nacht', $if: [['shoots_at_night']]},
    ]})
    const form = formOf(fieldset([field({type: 'number', name: 'amount'})], {repeat}))
    const applies = (conditional: unknown) => conditional == null

    expect(validateFormValues(form, {})).toEqual([])
    expect(validateFormValues(form, {rates: []})).toEqual([{name: 'rates', code: 'invalid_value'}])
    expect(validateFormValues(form, {rates: {weekend: {}, night: {amount: 1}, other: {amount: 1}}}, applies)).toEqual([
      {name: 'rates.weekend.amount', code: 'required'},
      {name: 'rates.night', code: 'invalid_value'},
      {name: 'rates.other', code: 'invalid_value'},
    ])
    expect(validateFormValues(form, {rates: {night: {amount: 1}}})).toEqual([])
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


  it('leaves out the fields of a fieldset that does not apply', () => {
    const $if = [[{input: 'travel', operator: '==' as const, operand: 'true'}]]
    const form = formOf(fieldset([field({type: 'currency', name: 'rate'})], {$if}))

    expect(validateFormValues(form, {}, () => false)).toEqual([])
    expect(validateFormValues(form, {}, () => true)).toEqual([{name: 'rate', code: 'required'}])
  })

  it('only accepts choices of which the option applies, also as a default', () => {
    const options = [{value: 'a', label: 'A', $if: [['project.name == "X"']]}, {value: 'b', label: 'B'}]
    const form = formOf(fieldset([field({type: 'choice', name: 'kind', default: 'a', options})]))
    const applies = (conditional: unknown) => conditional == null

    expect(validateFormValues(form, {kind: 'a'})).toEqual([])
    expect(validateFormValues(form, {kind: 'a'}, applies)).toEqual([{name: 'kind', code: 'invalid_value'}])
    expect(validateFormValues(form, {}, applies)).toEqual([{name: 'kind', code: 'required'}])
    expect(validateFormValues(form, {kind: 'b'}, applies)).toEqual([])
  })

  it('only checks the fieldsets of the given side', () => {
    const form = formOf(
      fieldset([field({type: 'text', name: 'name'})]),
      fieldset([field({type: 'text', name: 'iban'})], {side: 'contractor'}),
    )

    expect(validateFormValues(form, {}, undefined, 'producer')).toEqual([{name: 'name', code: 'required'}])
    expect(validateFormValues(form, {}, undefined, 'contractor')).toEqual([{name: 'iban', code: 'required'}])
    expect(validateFormValues(form, {})).toHaveLength(2)
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
