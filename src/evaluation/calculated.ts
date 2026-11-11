import { errorMessage } from 'ytil'
import { Evaluator } from '../evaluator'
import { ParsedExpression } from '../expressions'
import { contractInputs } from '../inputs'
import { global, jsep } from '../jsep'
import { CalculatedVariable, Form, InputVariable, Variable } from '../structure'
import { contractFilters } from './ContractEvaluator'

/**
 * What's wrong with the expression of a calculated variable, if anything.
 */
export function calculatedVariableError(variable: CalculatedVariable, form: Form): ExpressionError | null {
  const variables = Form.variables(form)

  const error = expressionError(variable.expression, variables)
  if (error != null) { return error }

  if (dependsOn(variable.expression, variable.name, variables, new Set())) {
    return {code: 'circular'}
  }
  return null
}

/**
 * Whether the expression parses, may be evaluated, and refers only to what exists: the given variables, the items in
 * scope (by the name they're known by, with their fields), the contract inputs and the math functions and constants.
 */
export function expressionError(expression: string, variables: Variable[], scope: ExpressionScope = {}): ExpressionError | null {
  expression = expression.trim()
  if (expression === '') { return {code: 'empty'} }

  let parsed: ParsedExpression
  try {
    parsed = validator.parse(expression)
  } catch (error) {
    return {code: 'syntax', message: errorMessage(error)}
  }

  for (const {name} of parsed.filtersParsed) {
    if (!contractFilters.includes(name)) {
      return {code: 'unknown_filter', name}
    }
  }

  for (const reference of expressionReferences(parsed)) {
    if (!isKnownReference(reference, variables, scope)) {
      return {code: 'unknown_name', name: reference}
    }
  }

  return null
}

/**
 * The names and property paths the expression refers to, like `day_rate` or `contractor.user.full_name`.
 */
export function expressionReferences(parsed: ParsedExpression): string[] {
  const result: string[] = []
  const nodes = [parsed.mainParsed, ...parsed.filtersParsed.flatMap(it => it.argsParsed)]
  for (const node of nodes) {
    collectReferences(node, result)
  }
  return result
}

function collectReferences(node: jsep.Expression | null | undefined, result: string[]) {
  if (node == null) { return }

  const path = memberPath(node)
  if (path != null) {
    result.push(path)
    return
  }

  switch (node.type) {
  case 'MemberExpression':
    collectReferences((node as jsep.MemberExpression).object, result)
    return
  case 'CallExpression':
    // The callee is checked to be a global function when parsing.
    for (const arg of (node as jsep.CallExpression).arguments) {
      collectReferences(arg, result)
    }
    return
  case 'ObjectExpression':
    for (const prop of (node.properties as jsep.Expression[] | undefined) ?? []) {
      if (prop.type === 'SpreadElement') {
        collectReferences(prop.argument as jsep.Expression, result)
      } else {
        if (prop.computed) { collectReferences(prop.key as jsep.Expression, result) }
        collectReferences(prop.value as jsep.Expression, result)
      }
    }
    return
  default:
    for (const key of ['argument', 'left', 'right', 'test', 'consequent', 'alternate'] as const) {
      collectReferences(node[key] as jsep.Expression | undefined, result)
    }
    for (const element of (node.elements as jsep.Expression[] | undefined) ?? []) {
      collectReferences(element, result)
    }
  }
}

// The dotted path of an identifier, or of a chain of properties of one.
function memberPath(node: jsep.Expression): string | null {
  if (node.type === 'Identifier') {
    return (node as jsep.Identifier).name
  }
  if (node.type === 'MemberExpression') {
    const expr = node as jsep.MemberExpression
    const object = memberPath(expr.object)
    const prop = expr.property?.name
    if (object == null || expr.computed || typeof prop !== 'string') { return null }
    return `${object}.${prop}`
  }
  return null
}

function isKnownReference(reference: string, variables: Variable[], scope: ExpressionScope): boolean {
  const [root, ...rest] = reference.split('.')
  if (root in scope) {
    return rest.length === 0 || (rest.length <= 2 && scope[root].some(it => it.name === rest[0]))
  }
  if (variables.some(it => it.name === root)) { return true }
  if (root in global) { return rest.length === 0 }

  const input = contractInputs.find(it => it.root === root)
  if (input == null) { return false }
  if (rest.length === 0) { return true }

  // Either an object along the way, like `contractor.user`, or a property of a known value, like `assignment.start_date.year`.
  const path = rest.join('.')
  return input.properties.some(it => it.path === path || it.path.startsWith(`${path}.`) || path.startsWith(`${it.path}.`))
}

function dependsOn(expression: string, name: string, variables: Variable[], visited: Set<string>): boolean {
  let parsed: ParsedExpression
  try {
    parsed = validator.parse(expression.trim())
  } catch {
    return false
  }

  for (const reference of expressionReferences(parsed)) {
    const root = reference.split('.')[0]
    if (root === name) { return true }
    if (visited.has(root)) { continue }
    visited.add(root)

    const variable = variables.find(it => it.name === root)
    if (variable?.type === 'calculated' && dependsOn(variable.expression, name, variables, visited)) {
      return true
    }
  }
  return false
}

// Only checks expressions, so it never resolves anything: functions are then only found among the globals.
const validator = new Evaluator({
  resolveVariable: () => undefined,
  runFilter:       value => value,
  autoFilter:      () => undefined,
})

/** The fields of the items in scope, by the name they're known by. */
export type ExpressionScope = Record<string, InputVariable[]>

export type ExpressionError =
  | {code: 'empty'}
  | {code: 'syntax', message: string}
  | {code: 'unknown_name', name: string}
  | {code: 'unknown_filter', name: string}
  | {code: 'circular'}
