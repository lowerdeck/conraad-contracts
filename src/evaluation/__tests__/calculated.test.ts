import { describe, expect, it } from 'vitest'
import { CalculatedVariable, form, Form } from '../../structure'
import { calculatedVariableError } from '../calculated'

describe('calculatedVariableError', () => {

  it('accepts a valid expression', () => {
    expect(error('day_rate * shooting_days')).toBeNull()
    expect(error('round(day_rate * 1.21) | upper')).toBeNull()
    expect(error('production.title')).toBeNull()
    expect(error('contractor.user')).toBeNull()
    expect(error('assignment.start_date.year')).toBeNull()
  })

  it('rejects an empty expression', () => {
    expect(error('  ')).toEqual({code: 'empty'})
  })

  it('rejects invalid syntax', () => {
    expect(error('day_rate * shooting_days +')).toMatchObject({code: 'syntax'})
    expect(error('day_rate shooting_days')).toMatchObject({code: 'syntax'})
    expect(error('day_rate = 3')).toMatchObject({code: 'syntax'})
    expect(error('day_rate["x"]')).toMatchObject({code: 'syntax'})
    expect(error('unknown_fn(day_rate)')).toMatchObject({code: 'syntax'})
  })

  it('rejects unknown names', () => {
    expect(error('day_rate * onbekend')).toEqual({code: 'unknown_name', name: 'onbekend'})
    expect(error('production.budget')).toEqual({code: 'unknown_name', name: 'production.budget'})
    expect(error('max(day_rate, other)')).toEqual({code: 'unknown_name', name: 'other'})
  })

  it('rejects unknown filters', () => {
    expect(error('day_rate | money')).toEqual({code: 'unknown_filter', name: 'money'})
  })

  it('rejects circular references', () => {
    const f = testForm([
      calculated('a', 'b + 1'),
      calculated('b', 'a * 2'),
      calculated('c', 'b'),
    ])
    expect(calculatedVariableError(f.calculated[0], f)).toEqual({code: 'circular'})
    expect(calculatedVariableError(f.calculated[1], f)).toEqual({code: 'circular'})
    expect(calculatedVariableError(f.calculated[2], f)).toBeNull()
    expect(error('total + 1', 'total')).toEqual({code: 'circular'})
  })

})

function error(expression: string, name = 'total') {
  const f = testForm([calculated(name, expression)])
  return calculatedVariableError(f.calculated[0], f)
}

function testForm(calculatedVariables: CalculatedVariable[]): Form {
  return form.parse({
    fieldsets: [{
      id:     'f',
      title:  'Tarief',
      fields: [
        {id: '1', variable: {type: 'currency', name: 'day_rate', title: 'Dagtarief', currency: 'EUR'}},
        {id: '2', variable: {type: 'number', name: 'shooting_days', title: 'Draaidagen'}},
      ],
    }],
    calculated: calculatedVariables,
  })
}

function calculated(name: string, expression: string): CalculatedVariable {
  return {type: 'calculated', name, title: name, expression} as CalculatedVariable
}
