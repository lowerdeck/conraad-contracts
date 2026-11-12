import { describe, expect, it } from 'vitest'
import { ContractStructure, contractStructure, ListSection, TextSection, Variable } from '../../structure'
import { ContractEvaluator } from '../ContractEvaluator'
import { resolveContract } from '../resolveContract'
import { unfilledValues } from '../unfilled'

describe('resolveContract', () => {

  it('leaves out what is hidden, and drops conditions', () => {
    const result = resolve(structure({
      sections: [
        {id: 'a', type: 'text', body: null, $if: [['exclusive']]},
        {id: 'b', type: 'text', body: null, $if: [['!exclusive']]},
        {
          id:    'l',
          type:  'list',
          items: [
            {id: '1', text: null, $if: [['exclusive']]},
            {id: '2', text: null, $if: [['!exclusive']]},
          ],
        },
      ],
    }), {exclusive: true})

    expect(result.sections.map(it => it.id)).toEqual(['a', 'l'])
    expect(result.sections[0].$if).toBeUndefined()
    expect((result.sections[1] as ListSection).items.map(it => it.id)).toEqual(['1'])
  })

  it('replaces interpolations by their text', () => {
    const body = paragraph(
      expression('fee'),
      expression('missing', {empty: 'placeholder', placeholder: '…'}),
      expression('missing'),
    )
    const result = resolve(structure({
      sections: [{id: 'a', type: 'text', body}],
    }), {fee: 1500})

    expect((result.sections[0] as TextSection).body).toEqual(paragraph(
      {type: 'interpolated', attrs: {text: '€\u00a01.500,00', status: 'value'}},
      {type: 'interpolated', attrs: {text: '…', status: 'missing'}},
    ))
  })

  it('marks required values that are missing as unfilled', () => {
    const body = paragraph(
      expression('missing'),
      expression('remarks'),
      expression('legal_entity.kvk_nummer'),
      expression('legal_entity.kvk_nummer', {empty: 'placeholder'}),
    )
    const form = {fieldsets: [{fields: [
      {variable: {type: 'text', name: 'missing', title: 'Missing'}},
      {variable: {type: 'text', name: 'remarks', title: 'Remarks'}, optional: true},
    ]}]}
    const result = resolve(structure({sections: [{id: 'a', type: 'text', body}], form}), {})

    expect((result.sections[0] as TextSection).body).toEqual(paragraph(
      {type: 'interpolated', attrs: {text: 'Missing', status: 'unfilled'}},
      {type: 'interpolated', attrs: {text: 'legal_entity.kvk_nummer', status: 'unfilled'}},
      {type: 'interpolated', attrs: {text: '________', status: 'missing'}},
    ))
    expect(unfilledValues(result)).toEqual(['Missing', 'legal_entity.kvk_nummer'])
  })

  it('repeats sections and items for every item, with the item in scope', () => {
    const result = resolve(structure({
      sections: [
        {
          id:    'l',
          type:  'list',
          items: [{
            id:    'i',
            $each: {in: 'specialisms', as: 'specialism'},
            $if:   [['specialism.text != "B"']],
            text:  paragraph(expression('specialism.text')),
            items: [{id: 's', text: null}],
          }],
        },
        {id: 't', type: 'text', $each: {in: 'specialisms', as: 'specialism'}, body: null},
      ],
    }), {specialisms: [{text: 'A'}, {text: 'B'}, {text: 'C'}]})

    const list = result.sections[0] as ListSection
    expect(list.items.map(it => it.id)).toEqual(['i~0', 'i~2'])
    expect(list.items.map(it => it.items.map(sub => sub.id))).toEqual([['s~0'], ['s~2']])
    expect(list.items[1].text).toEqual(paragraph({type: 'interpolated', attrs: {text: 'C', status: 'value'}}))
    expect(result.sections.map(it => it.id)).toEqual(['l', 't~0', 't~1', 't~2'])
  })

  it('leaves out what repeats for an empty list, which is also false in a condition', () => {
    const result = resolve(structure({
      sections: [
        {id: 'a', type: 'text', body: null, $each: {in: 'specialisms', as: 'specialism'}},
        {id: 'b', type: 'text', body: null, $if: [['specialisms']]},
      ],
    }), {specialisms: []})

    expect(result.sections).toEqual([])
  })

  it('lists items with the list filter', () => {
    const body = paragraph(expression('specialisms | list("text")'))
    const result = resolve(structure({sections: [{id: 'a', type: 'text', body}]}), {specialisms: [{text: 'A'}, {text: 'B'}, {text: 'C'}]})

    expect((result.sections[0] as TextSection).body).toEqual(paragraph(
      {type: 'interpolated', attrs: {text: 'A, B en C', status: 'value'}},
    ))
  })

  it('leaves out the form and required flags', () => {
    const result = resolve(structure({
      sections: [{id: 'a', type: 'text', body: null, required: true}],
    }), {})

    expect(result.form.fieldsets).toEqual([])
    expect(result.sections[0].required).toBeUndefined()
  })

})

function resolve(structure: ContractStructure, values: Record<string, unknown>) {
  const evaluator = new ContractEvaluator({
    inputs:         {},
    variableByName: name => variables.find(it => it.name === name),
    value:          variable => values[variable.name] ?? null,
  })

  return resolveContract(structure, [], evaluator, {booleanLabels: {true: 'Ja', false: 'Nee'}})
}

const variables: Variable[] = [
  {type: 'currency', name: 'fee', title: 'Fee', currency: 'EUR', decimals: true},
  {type: 'boolean', name: 'exclusive', title: 'Exclusive'},
  {type: 'text', name: 'missing', title: 'Missing'},
  {type: 'array', name: 'specialisms', title: 'Specialisme', fields: [{type: 'text', name: 'text', title: 'Tekst'}]},
]

function structure(input: unknown): ContractStructure {
  return contractStructure.parse(input)
}

function paragraph(...content: unknown[]) {
  return {type: 'doc', content: [{type: 'paragraph', content}]}
}

function expression(expression: string, attrs: Record<string, unknown> = {}) {
  return {type: 'expression', attrs: {expression, ...attrs}}
}
