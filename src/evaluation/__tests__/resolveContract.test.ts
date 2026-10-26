import { describe, expect, it } from 'vitest'
import { ContractStructure, contractStructure, ListSection, TextSection, Variable } from '../../structure'
import { ContractEvaluator } from '../ContractEvaluator'
import { resolveContract } from '../resolveContract'

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
