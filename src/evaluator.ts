import { Property } from '@jsep-plugin/object'
import { SpreadElement } from '@jsep-plugin/spread'
import { StringStream } from 'unicode'
import { errorMessage, isFunction } from 'ytil'
import { blacklist, global, jsep } from './jsep'
import { MissingValue } from './missing-value'

// Type declarations for jsep plugin types
interface ObjectExpression extends jsep.Expression {
	type: 'ObjectExpression';
  properties: Array<SpreadElement | Property>
}

export class Evaluator {

  private readonly options: Required<EvaluatorOptions>

  constructor(
    private readonly delegate: EvaluatorDelegate,
    options: EvaluatorOptions = {},
  ) {
    this.options = {
      maxLen:         options.maxLen ?? 10_000,
      maxDepth:       options.maxDepth ?? 200,
      maxNodes:       options.maxNodes ?? 5_000,
      nullSafeMember: options.nullSafeMember ?? true,
    }
  }

  // #region Interface

  public evaluateText(markdown: string): string {
    return markdown.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        const result = this.delegate.evaluateExpression != null
          ? this.delegate.evaluateExpression(expression, this)
          : this.evaluateExpression(expression)

        return result == null ? '' : String(result)
      } catch (error) {
        const message = errorMessage(error)
        throw new EvaluatorError(message, expression, error)
      }
    }).replace(/\{\@(.+?)(?:\s+(.+?))?\s*\}/g, (match, name, args) => {
      if (this.delegate.evaluateDirective == null) { return match }
      const value = this.delegate.evaluateDirective(name, args)
      return value == null ? '' : String(value)
    })
  }

  public evaluateExpression(expression: string): unknown {
    expression = expression.trim()
    if (expression === '') { return null }

    if (expression.length > this.options.maxLen) {
      throw new Error(`Expression too long (>${this.options.maxLen})`)
    }

    try {
      const [mainExpr, filterSegments, requiredLabel] = this.preParseExpression(expression)
      const ast = jsep(`(${mainExpr})`)

      // Validate + gather node count/depth
      const stats = {nodes: 0}
      this.validate(ast, stats, 0)

      let result: unknown = this.evaluateNode(ast, 0)
      if (result == null && requiredLabel != null) {
        return new MissingValue(mainExpr, requiredLabel)
      }

      if (filterSegments.length === 0) {
        const autoFilter = this.delegate.autoFilter(result)
        if (autoFilter != null) {
          filterSegments.push(autoFilter)
        }
      }

      for (const filterSegment of filterSegments) {
        const {name, argAsts} = this.parseFilterSegment(filterSegment)
        for (const argAst of argAsts) {
          this.validate(argAst, stats, 0)
        }
        const args = argAsts.map(argAst => this.evaluateNode(argAst, 0))
        result = this.delegate.runFilter(name, result, args)
      }

      return result
    } catch (error) {
      const message = errorMessage(error)
      throw new EvaluatorError(message, expression, error)
    }
  }

  // #endregion

  // #region Filters

  private preParseExpression(expression: string): [string, string[], string | null] {
    const stream = new StringStream(expression)
    const segments: string[] = []
    let requiredLabel: string | null = null
    
    let depth = 0

    stream.markStart()

    while (!stream.eos) {
      const ch = stream.peek()
      if (ch === '(' || ch === '[' || ch === '{') {
        depth++
        stream.next()
      } else if (ch === ')' || ch === ']' || ch === '}') {
        depth--
        stream.next()
      } else if (ch === '"' || ch === "'") {
        stream.next() // opening quote
        while (!stream.eos && stream.peek() !== ch) {
          if (stream.peek() === '\\') { stream.next() } // skip escape
          stream.next()
        }
        stream.next() // closing quote
      } else if (ch === '|' && depth === 0) {
        if (stream.peek(2) === '||') {
          stream.next(2)
        } else {
          segments.push(stream.current().trim())
          stream.next()
          stream.markStart()
        }
      } else if (ch === '!' && depth === 0 && stream.peek(2) !== '!!') {
        if (stream.current().trim() !== '') {
          segments.push(stream.current().trim())
        }

        stream.next()
        stream.markStart()
        stream.eatUntilEos()
        requiredLabel = stream.current().trim()
      } else {
        stream.next()
      }
    }

    if (stream.current().trim() !== '') {
      segments.push(stream.current().trim())
    }

    const [expr = '', ...filters] = segments
    return [expr, filters, requiredLabel]
  }

  private parseFilterSegment(segment: string): {name: string, argAsts: jsep.Expression[]} {
    segment = segment.trim()
    const parenIdx = segment.indexOf('(')
    if (parenIdx === -1) {
      return {name: segment, argAsts: []}
    }

    const name = segment.slice(0, parenIdx).trim()
    const callAst = jsep(`${name}${segment.slice(parenIdx)}`) as jsep.CallExpression
    return {name, argAsts: (callAst.arguments ?? []) as jsep.Expression[]}
  }

  // #endregion

  // #region Validation

  private validate(
    node: jsep.Expression,
    stats: {nodes: number},
    depth: number,
  ): void {
    if (depth > this.options.maxDepth) {
      throw new Error('Expression too deep')
    }
    stats.nodes++
    if (stats.nodes > this.options.maxNodes) {
      throw new Error('Expression too complex')
    }

    switch (node.type) {
    case 'Literal': case 'Identifier': {
      return
    }

    case 'UnaryExpression': {
      const expr = node as jsep.UnaryExpression
      if (!['+', '-', '!'].includes(expr.operator)) {
        throw new Error(`Unary operator not allowed: ${expr.operator}`)
      }
      return this.validate(expr.argument, stats, depth + 1)
    }

    case 'BinaryExpression': case 'LogicalExpression': {
      const expr = node as jsep.BinaryExpression
      const op = node.operator as string
      const allowed = new Set([
        '+', '-', '*', '/', '%', '**',
        '==', '!=', '===', '!==',
        '<', '<=', '>', '>=',
        '&&', '||',
        '??',
      ])
      if (!allowed.has(op)) {
        throw new Error(`Operator not allowed: ${op}`)
      }
      this.validate(expr.left, stats, depth + 1)
      this.validate(expr.right, stats, depth + 1)
      return
    }

    case 'ConditionalExpression': {
      const expr = node as jsep.ConditionalExpression
      this.validate(expr.test, stats, depth + 1)
      this.validate(expr.consequent, stats, depth + 1)
      this.validate(expr.alternate, stats, depth + 1)
      return
    }

    case 'MemberExpression': {
      const expr = node as jsep.MemberExpression
      if (expr.computed) {
        throw new Error('Computed member access not allowed')
      }

      const prop = expr.property?.name
      if (typeof prop !== 'string') {
        throw new Error('Invalid member property')
      }
      if (blacklist.has(prop)) {
        throw new Error(`Forbidden property: ${prop}`)
      }

      this.validate(expr.object, stats, depth + 1)
      return
    }

    case 'CallExpression': {
      const expr = node as jsep.CallExpression

      if (expr.callee?.type !== 'Identifier') {
        throw new Error('Only global function calls are allowed (no obj.method())')
      }

      const name = expr.callee.name
      if (typeof name !== 'string') {
        throw new Error(`Function not allowed: ${name}`)
      }

      const fn = this.delegate.resolveVariable(name) ?? global[name]
      if (!isFunction(fn)) {
        throw new Error(`Function not found: ${name}`)
      }

      for (const arg of expr.arguments ?? []) {
        this.validate(arg, stats, depth + 1)
      }
      return
    }

    case 'ArrayExpression': {
      const expr = node as jsep.ArrayExpression
      for (const element of expr.elements ?? []) {
        if (element !== null) {
          this.validate(element, stats, depth + 1)
        }
      }
      return
    }

    case 'ObjectExpression': {
      const expr = node as ObjectExpression
      for (const prop of expr.properties ?? []) {
        if (prop.type === 'SpreadElement') {
          this.validate(prop.argument, stats, depth + 1)
        } else {
          // Validate property key if it's computed
          if (prop.computed && prop.key) {
            this.validate(prop.key, stats, depth + 1)
          }
          // Validate property value
          if (prop.value) {
            this.validate(prop.value, stats, depth + 1)
          }
        }
      }
      return
    }

    case 'ThisExpression':
    case 'NewExpression':
    case 'AssignmentExpression':
    case 'UpdateExpression':
    case 'SequenceExpression':
      throw new Error(`Syntax not allowed: ${node.type}`)

    default:
      throw new Error(`Unsupported syntax: ${node.type}`)
    }
  }

  // #endregion

  // #region Evaluation

  private evaluateNode(node: jsep.Expression, depth: number): any {
    if (depth > this.options.maxDepth) {
      throw new Error('Expression too deep')
    }

    switch (node.type) {
    case 'Literal':
      return node.value

    case 'Identifier': {
      const expr = node as jsep.Identifier
      const value = this.delegate.resolveVariable(expr.name)
      if (value !== undefined) { return value }
      if (expr.name in global) { return global[expr.name] }
      return undefined
    }

    case 'UnaryExpression': {
      const expr = node as jsep.UnaryExpression

      const v = this.evaluateNode(expr.argument, depth + 1)
      switch (node.operator) {
      case '!': return !v
      case '+': return +v
      case '-': return -v
      default: throw new Error(`Bad unary op: ${node.operator}`)
      }
    }

    case 'LogicalExpression': case 'BinaryExpression': {
      const expr = node as jsep.BinaryExpression
      const left = this.evaluateNode(expr.left, depth + 1)

      // For logical expressions, don't evaluate right until we need to.
      if (expr.operator === '&&') {
        return left && this.evaluateNode(expr.right, depth + 1)
      }
      if (expr.operator === '||') {
        return left || this.evaluateNode(expr.right, depth + 1)
      }
      if (expr.operator === '??') {
        return left ?? this.evaluateNode(expr.right, depth + 1)
      }

      // Other operators, please do.
      const right = this.evaluateNode(expr.right, depth + 1) 
      switch (expr.operator) {
      case '+': return left + right
      case '-': return left - right
      case '*': return left * right
      case '/': return left / right
      case '%': return left % right
      case '**': return left ** right
      case '==': return left == right
      case '!=': return left != right
      case '===': return left === right
      case '!==': return left !== right
      case '<': return left < right
      case '<=': return left <= right
      case '>': return left > right
      case '>=': return left >= right
      default: throw new Error(`Bad binary op: ${node.operator}`)
      }
    }

    case 'ConditionalExpression': {
      const expr = node as jsep.ConditionalExpression
      const test = this.evaluateNode(expr.test, depth + 1)
      return test
        ? this.evaluateNode(expr.consequent, depth + 1)
        : this.evaluateNode(expr.alternate, depth + 1)
    }

    case 'MemberExpression': {
      const expr = node as jsep.MemberExpression

      const obj = this.evaluateNode(expr.object, depth + 1)
      const prop = expr.property.name as string

      if (blacklist.has(prop)) {
        throw new Error(`Forbidden property: ${prop}`)
      }

      if (obj === null || obj === undefined) {
        if (this.options.nullSafeMember) { return undefined }
        throw new Error(`Cannot read property '${prop}' of ${obj}`)
      }
      return (obj as any)[prop]
    }

    case 'CallExpression': {
      const expr = node as jsep.CallExpression
      const name = expr.callee.name as string
      const fn = this.delegate.resolveVariable(name) ?? global[name]
      if (!isFunction(fn)) {
        throw new Error(`Unknown function: ${name}`)
      }

      const args = (expr.arguments ?? []).map((a: any) =>
        this.evaluateNode(a, depth + 1),
      )
      return fn(...args)
    }

    case 'ArrayExpression': {
      const expr = node as jsep.ArrayExpression
      return (expr.elements ?? []).map(element =>
        element !== null ? this.evaluateNode(element, depth + 1) : null,
      )
    }

    case 'ObjectExpression': {
      const expr = node as ObjectExpression
      const result: Record<string, any> = {}
      
      for (const prop of expr.properties ?? []) {
        if (prop.type === 'SpreadElement') {
          Object.assign(result, this.evaluateNode(prop.argument, depth + 1))
        } else {
        // Get the property key
          let key: string
          if (prop.computed && prop.key) {
          // Computed property like {[expr]: value}
            key = String(this.evaluateNode(prop.key, depth + 1))
          } else if (prop.key?.type === 'Identifier') {
          // Regular property like {foo: value}
            key = prop.key.name as string
          } else if (prop.key?.type === 'Literal') {
          // Quoted property like {"foo": value}
            key = String(prop.key.value)
          } else {
            throw new Error('Invalid object property key')
          }

          // Get the property value
          if (prop.value) {
            result[key] = this.evaluateNode(prop.value, depth + 1)
          }
        }
      }
      
      return result
    }

    default:
      throw new Error(`Unsupported syntax: ${node.type}`)
    }
  }

  // #endregion

}

export interface EvaluatorOptions {
  maxLen?: number
  maxDepth?: number
  maxNodes?: number
  nullSafeMember?: boolean
}

export interface EvaluatorDelegate {
  evaluateExpression?: (expression: string, evaluator: Evaluator) => unknown,
  evaluateDirective?: (name: string, args: string) => unknown,
  resolveVariable: (name: string) => unknown,
  runFilter: (name: string, value: unknown, args: unknown[]) => unknown,
  autoFilter: (value: unknown) => string | undefined,
}

export class EvaluatorError extends Error {

  constructor(
    message: string,
    public readonly expression: string,
    cause?: unknown,
  ) {
    super(`Error while evaluating expression (${expression}): ${message}`, {cause})
  }


}