import { DateTime } from 'luxon'
import { errorMessage } from 'ytil'
import { Evaluator } from '../evaluator'
import { parseExpression } from '../expressions'
import { MissingValue } from '../missing-value'
import { Conditional, Variable } from '../structure'
import { evaluateConditional } from './conditions'
import { formatCurrency, formatDate, toDateTime } from './values'

/**
 * Evaluates the expressions and conditions of a contract, against the values filled in on its form and the inputs
 * that are known from its assignment. Values are read through the delegate as they're needed.
 */
export class ContractEvaluator {

  constructor(
    private readonly delegate: ContractEvaluatorDelegate,
    private readonly options: ContractEvaluatorOptions = {},
  ) {}

  private readonly evaluator = new Evaluator({
    resolveVariable: name => this.resolveVariable(name),
    runFilter:       (name, value) => this.runFilter(name, value),
    autoFilter:      value => value instanceof DateTime ? 'date' : undefined,
  })

  // Guards against calculated variables that (indirectly) refer to themselves.
  private resolving = new Set<string>()

  public evaluate(expression: string): unknown {
    return this.evaluator.evaluateExpression(expression)
  }

  public interpolate(expression: string): InterpolationResult {
    try {
      const result = this.evaluate(expression)
      if (result instanceof MissingValue || result == null || result === '') {
        return {type: 'missing', expression}
      }

      return {type: 'value', value: this.formatForVariable(expression, result) ?? result}
    } catch (error) {
      return {type: 'error', expression, message: errorMessage(error)}
    }
  }

  public isVisible(conditional: Conditional | undefined): boolean {
    return evaluateConditional(conditional, expression => this.evaluate(expression))
  }

  private resolveVariable(name: string): unknown {
    const {inputs} = this.delegate
    if (name in inputs) {
      return inputs[name]
    }

    const variable = this.delegate.variableByName(name)
    if (variable == null) { return undefined }

    if (variable.type === 'calculated') {
      if (this.resolving.has(name)) {
        throw new Error(`Circular reference: ${name}`)
      }

      this.resolving.add(name)
      try {
        const result = this.evaluator.evaluateExpression(variable.expression)
        return result instanceof MissingValue ? null : result
      } finally {
        this.resolving.delete(name)
      }
    }

    const value = this.delegate.value(variable)
    if (variable.type === 'date' && typeof value === 'string') {
      return DateTime.fromISO(value)
    }
    return value
  }

  // A plain reference to a choice variable shows the label of the chosen option rather than its value, and one to
  // a currency variable shows the amount in its currency.
  private formatForVariable(expression: string, value: unknown): string | null {
    const {mainRaw, filtersRaw} = parseExpression(expression)
    if (filtersRaw.length > 0) { return null }

    const variable = this.delegate.variableByName(mainRaw)
    switch (variable?.type) {
    case 'choice':
      return variable.options.find(it => it.value === value)?.label ?? null
    case 'currency':
      return typeof value === 'number' ? formatCurrency(value, variable, this.options.locale) : null
    default:
      return null
    }
  }

  private runFilter(name: string, value: unknown): unknown {
    switch (name) {
    case 'date': {
      const date = toDateTime(value)
      return date == null ? value : formatDate(date, this.options.locale)
    }
    case 'upper': return String(value).toUpperCase()
    case 'lower': return String(value).toLowerCase()
    default: throw new Error(`Unknown filter: ${name}`)
    }
  }

}

/**
 * The value filled in for a variable, or else its default.
 */
export function variableValue(variable: Variable, values: Record<string, unknown>): unknown {
  if (variable.name in values) {
    return values[variable.name]
  }
  return 'default' in variable ? variable.default ?? null : null
}

export interface ContractEvaluatorDelegate {
  /** The objects that are known from the assignment, by their root, like `contractor`. */
  readonly inputs: Record<string, unknown>

  variableByName(name: string): Variable | undefined

  /** The value filled in for an input variable, or its default. */
  value(variable: Variable): unknown
}

export interface ContractEvaluatorOptions {
  locale?: string
}

export type InterpolationResult =
  | {type: 'value', value: unknown}
  | {type: 'missing', expression: string}
  | {type: 'error', expression: string, message: string}
