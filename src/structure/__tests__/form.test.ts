import { describe, expect, it } from 'vitest'
import { Form, formFieldset } from '../form'

describe('Form.pages', () => {

  it('starts a new page at each fieldset that asks for one', () => {
    const form: Form = {
      fieldsets:  [fieldset('a', true), fieldset('b'), fieldset('c', true), fieldset('d')],
      calculated: [],
    }
    expect(Form.pages(form).map(page => page.map(it => it.id))).toEqual([['a', 'b'], ['c', 'd']])
  })

  it('always puts the first fieldset on the first page', () => {
    const form: Form = {fieldsets: [fieldset('a'), fieldset('b')], calculated: []}
    expect(Form.pages(form).map(page => page.map(it => it.id))).toEqual([['a', 'b']])
  })

  it('has no pages without fieldsets', () => {
    expect(Form.pages(Form.empty())).toEqual([])
  })

})

function fieldset(id: string, newPage?: boolean) {
  return formFieldset.parse({id, new_page: newPage})
}
