import { DateTime } from 'luxon'
import { MissingValue } from '../missing-value'
import { Condition, Conditional, DateUnit } from '../structure'
import { toDateTime } from './values'

/**
 * A conditional holds alternatives (OR) of condition groups (AND). No conditional at all means always visible.
 */
export function evaluateConditional(conditional: Conditional | undefined, evaluate: ExpressionEvaluate): boolean {
  if (conditional == null || conditional.length === 0) { return true }
  return conditional.some(conditions => conditions.every(it => evaluateCondition(it, evaluate)))
}

export function evaluateCondition(condition: Condition, evaluate: ExpressionEvaluate): boolean {
  const value = (expression: string) => {
    const result = evaluate(expression)
    return result instanceof MissingValue ? null : result
  }

  try {
    if (typeof condition === 'string') {
      return !!value(condition)
    }

    const input = value(condition.input)

    switch (condition.operator) {
    case 'blank': return isBlank(input)
    case 'not-blank': return !isBlank(input)

    case 'today': return isSameDate(input, DateTime.now(), 'day')
    case 'yesterday': return isSameDate(input, DateTime.now().minus({days: 1}), 'day')
    case 'tomorrow': return isSameDate(input, DateTime.now().plus({days: 1}), 'day')
    case 'this-week': return isSameDate(input, DateTime.now(), 'week')
    case 'this-month': return isSameDate(input, DateTime.now(), 'month')
    case 'this-year': return isSameDate(input, DateTime.now(), 'year')

    case '==': return isEqual(input, value(condition.operand))
    case '!=': return !isEqual(input, value(condition.operand))
    case '>': return compare(input, value(condition.operand)) > 0
    case '>=': return compare(input, value(condition.operand)) >= 0
    case '<': return compare(input, value(condition.operand)) < 0
    case '<=': return compare(input, value(condition.operand)) <= 0

    case 'contains': return String(input ?? '').includes(String(value(condition.operand) ?? ''))
    case 'not-contains': return !String(input ?? '').includes(String(value(condition.operand) ?? ''))
    case 'starts-with': return String(input ?? '').startsWith(String(value(condition.operand) ?? ''))
    case 'ends-with': return String(input ?? '').endsWith(String(value(condition.operand) ?? ''))

    case 'between': return isBetween(input, value(condition.from), value(condition.to))
    case 'not-between': return !isBetween(input, value(condition.from), value(condition.to))

    case 'in-next': return isInRange(input, DateTime.now(), DateTime.now().plus(duration(value(condition.amount), condition.unit)))
    case 'in-last': return isInRange(input, DateTime.now().minus(duration(value(condition.amount), condition.unit)), DateTime.now())
    }
  } catch {
    // An invalid condition is never met.
    return false
  }
}

export type ExpressionEvaluate = (expression: string) => unknown

function isBlank(value: unknown) {
  if (value == null || value === '') { return true }
  if (Array.isArray(value)) { return value.length === 0 }
  return false
}

// Dates are compared by day, as that's what contracts care about.
function comparable(value: unknown, other: unknown): unknown {
  if (value instanceof DateTime) { return value.startOf('day').toMillis() }
  if (typeof value === 'string' && other instanceof DateTime) {
    return toDateTime(value)?.startOf('day').toMillis() ?? value
  }
  return value
}

function isEqual(a: unknown, b: unknown) {
  const left = comparable(a, b)
  const right = comparable(b, a)
  if (left === right) { return true }
  if (left == null || right == null) { return false }
  return String(left) === String(right)
}

function compare(a: unknown, b: unknown): number {
  const left = comparable(a, b)
  const right = comparable(b, a)
  if (left == null || right == null) { return NaN }

  if (typeof left === 'string' && typeof right === 'string') {
    return left.localeCompare(right)
  }
  return Number(left) - Number(right)
}

function isBetween(value: unknown, from: unknown, to: unknown) {
  return compare(value, from) >= 0 && compare(value, to) <= 0
}

function isSameDate(value: unknown, reference: DateTime, unit: 'day' | 'week' | 'month' | 'year') {
  const date = toDateTime(value)
  return date != null && date.hasSame(reference, unit)
}

function isInRange(value: unknown, from: DateTime, to: DateTime) {
  const date = toDateTime(value)
  if (date == null) { return false }
  return date >= from.startOf('day') && date <= to.endOf('day')
}

function duration(amount: unknown, unit: DateUnit) {
  return {[unit]: Number(amount) || 0}
}
