import { DateTime } from 'luxon'
import { errorMessage } from 'ytil'
import { EmploymentType, isEmploymentType } from '../employment-type'
import { Evaluator } from '../evaluator'
import { parseExpression } from '../expressions'
import { MissingValue } from '../missing-value'
import { Conditional, Each, InputVariable, Variable } from '../structure'
import { evaluateConditional } from './conditions'
import { formatCurrency, formatDate, formatList, toDateTime } from './values'

/**
 * Evaluates the expressions and conditions of a contract, against the values filled in on its form and the inputs
 * that are known from its assignment. Values are read through the delegate as they're needed.
 */
export class ContractEvaluator {

  constructor(
    private readonly delegate: ContractEvaluatorDelegate,
    private readonly options: ContractEvaluatorOptions = {},
    private readonly scope: Record<string, InputVariable[]> = {},
  ) {}

  private readonly evaluator = new Evaluator({
    resolveVariable: name => this.resolveVariable(name),
    runFilter:       (name, value, args) => this.runFilter(name, value, args),
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

  /** How the contractor works, which decides how the parties section describes them. */
  public employmentType(): EmploymentType | null {
    try {
      const value = this.evaluate('contractor.profile.employment_type')
      return isEmploymentType(value) ? value : null
    } catch {
      return null
    }
  }

  public isVisible(conditional: Conditional | undefined): boolean {
    return evaluateConditional(conditional, expression => this.evaluate(expression))
  }

  /**
   * An evaluator for every repetition of something that repeats, with its item in scope. Without `$each`, it's just
   * this one.
   */
  public instances(each: Each | undefined): ContractEvaluator[] {
    if (each == null) { return [this] }

    let items: unknown
    try {
      items = this.evaluate(each.in)
    } catch {
      return []
    }
    if (!Array.isArray(items)) { return [] }

    const repeat = this.variableByPath(each.in)
    const fields = repeat?.type === 'array' && 'fields' in repeat ? repeat.fields : []
    return items.map(item => this.scoped(each.as, itemValue(item, fields), fields))
  }

  private scoped(name: string, item: unknown, fields: InputVariable[]): ContractEvaluator {
    const delegate: ContractEvaluatorDelegate = {
      inputs:         {...this.delegate.inputs, [name]: item},
      variableByName: it => this.delegate.variableByName(it),
      value:          it => this.delegate.value(it),
    }
    return new ContractEvaluator(delegate, this.options, {...this.scope, [name]: fields})
  }

  // A variable by its name, or a field of an item in scope by its path, like `specialism.name`.
  private variableByPath(path: string): Variable | undefined {
    const [root, ...rest] = path.split('.')
    const fields = this.scope[root]
    if (fields != null && rest.length === 1) {
      return fields.find(it => it.name === rest[0])
    }
    return fields == null ? this.delegate.variableByName(path) : undefined
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

    const variable = this.variableByPath(mainRaw)
    switch (variable?.type) {
    case 'choice':
      return variable.options.find(it => it.value === value)?.label ?? null
    case 'currency':
      return typeof value === 'number' ? formatCurrency(value, variable, this.options.locale) : null
    default:
      return null
    }
  }

  private runFilter(name: string, value: unknown, args: unknown[]): unknown {
    switch (name) {
    case 'date': {
      const date = toDateTime(value)
      return date == null ? value : formatDate(date, this.options.locale)
    }
    case 'upper': return String(value).toUpperCase()
    case 'lower': return String(value).toLowerCase()
    case 'list': return formatList(value, args[0], args[1], this.options.locale)
    default: throw new Error(`Unknown filter: ${name}`)
    }
  }

}

/** The filters that may follow an expression, like `start_date | date`. */
export const contractFilters = ['date', 'upper', 'lower', 'list']

/**
 * The value filled in for a variable, or else its default.
 */
export function variableValue(variable: Variable, values: Record<string, unknown>): unknown {
  if (variable.name in values) {
    return values[variable.name]
  }
  return 'default' in variable ? variable.default ?? null : null
}

// Dates of an item are stored as ISO dates, like those of the form.
function itemValue(item: unknown, fields: InputVariable[]): unknown {
  if (item == null || typeof item !== 'object') { return item }

  const result: Record<string, unknown> = {...item}
  for (const field of fields) {
    if (field.type === 'date' && typeof result[field.name] === 'string') {
      result[field.name] = DateTime.fromISO(result[field.name] as string)
    }
  }
  return result
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
