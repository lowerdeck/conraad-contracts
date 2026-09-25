import { z } from 'zod'
import { expression, identifier } from './common'

export function conditional() {
  return z.array(conditions())
}

export function conditions() {
  return z.array(condition())
}

export function condition() {
  return z.union([
    unaryCondition(),
    binaryCondition(),
    rangeCondition(),
    relativeCondition(),
    customCondition(),
  ])
}

export function unaryCondition() {
  return z.object({
    input:    identifier(),
    operator: unaryOperator(),
  })
}

export function binaryCondition() {
  return z.object({
    input:    identifier(),
    operator: binaryOperator(),
    operand:  expression(),
  })
}

export function rangeCondition() {
  return z.object({
    input:    identifier(),
    operator: rangeOperator(),
    from:     expression(),
    to:       expression(),
  })
}

export function relativeCondition() {
  return z.object({
    input:    identifier(),
    operator: relativeOperator(),
    amount:   expression(),
    unit:     dateUnit(),
  })
}

export function customCondition() {
  return expression()
}

export function unaryOperator() {
  return z.enum([
    'blank',
    'not-blank',

    // Dates
    'today',
    'yesterday',
    'tomorrow',
    'this-week',
    'this-month',
    'this-year',
  ])
}

export function binaryOperator() {
  return z.enum([
    // Numbers & dates
    '==',
    '!=',
    '>',
    '>=',
    '<',
    '<=',

    // Text
    'contains',
    'not-contains',
    'starts-with',
    'ends-with',
  ])
}

export function rangeOperator() {
  return z.enum([
    'between',
    'not-between',
  ])
}

export function relativeOperator() {
  return z.enum([
    'in-next',
    'in-last',
  ])
}

export function dateUnit() {
  return z.enum([
    'days',
    'weeks',
    'months',
    'years',
  ])
}

export type Conditional = z.output<ReturnType<typeof conditional>>
export type Conditions = z.output<ReturnType<typeof conditions>>
export type Condition = z.output<ReturnType<typeof condition>>
export type UnaryCondition = z.output<ReturnType<typeof unaryCondition>>
export type BinaryCondition = z.output<ReturnType<typeof binaryCondition>>
export type RangeCondition = z.output<ReturnType<typeof rangeCondition>>
export type RelativeCondition = z.output<ReturnType<typeof relativeCondition>>
export type CustomCondition = z.output<ReturnType<typeof customCondition>>
export type UnaryOperator = z.output<ReturnType<typeof unaryOperator>>
export type BinaryOperator = z.output<ReturnType<typeof binaryOperator>>
export type RangeOperator = z.output<ReturnType<typeof rangeOperator>>
export type RelativeOperator = z.output<ReturnType<typeof relativeOperator>>
export type DateUnit = z.output<ReturnType<typeof dateUnit>>