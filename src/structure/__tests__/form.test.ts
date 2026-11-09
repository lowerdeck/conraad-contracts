import { describe, expect, it } from 'vitest'
import { Form, formFieldset, FormSide } from '../form'

describe('Form.pages', () => {

  it('starts a new page at each fieldset that asks for one', () => {
    const form: Form = {
      fieldsets:  [fieldset('a', true), fieldset('b'), fieldset('c', true), fieldset('d')],
      calculated: [],
    }
    expect(Form.pages(form, 'producer').map(page => page.map(it => it.id))).toEqual([['a', 'b'], ['c', 'd']])
  })

  it('always puts the first fieldset on the first page', () => {
    const form: Form = {fieldsets: [fieldset('a'), fieldset('b')], calculated: []}
    expect(Form.pages(form, 'producer').map(page => page.map(it => it.id))).toEqual([['a', 'b']])
  })

  it('only has the fieldsets of the side', () => {
    const form: Form = {fieldsets: [fieldset('a'), fieldset('b', false, 'contractor'), fieldset('c', true)], calculated: []}
    expect(Form.pages(form, 'producer').map(page => page.map(it => it.id))).toEqual([['a'], ['c']])
    expect(Form.pages(form, 'contractor').map(page => page.map(it => it.id))).toEqual([['b']])
  })

  it('has no pages without fieldsets', () => {
    expect(Form.pages(Form.empty(), 'producer')).toEqual([])
  })

})

function fieldset(id: string, newPage?: boolean, side?: FormSide) {
  return formFieldset.parse({id, new_page: newPage, side})
}
