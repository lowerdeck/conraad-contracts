import { StringStream } from 'unicode'
import { jsep } from './jsep'

export function parseExpression(expression: string): ParsedExpression {
  const [mainRaw, filtersRaw] = preParseExpression(expression)
  const mainParsed = jsep(`(${mainRaw})`)
  const filtersParsed = filtersRaw.map(parseFilterSegment)

  return {
    mainRaw,
    mainParsed,
    filtersRaw,
    filtersParsed,
  }
}

function preParseExpression(expression: string): [string, string[]] {
  const stream = new StringStream(expression)
  const segments: string[] = []

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
    } else {
      stream.next()
    }
  }

  if (stream.current().trim() !== '') {
    segments.push(stream.current().trim())
  }

  const [main = '', ...filters] = segments
  return [main, filters]
}

export function parseFilterSegment(segment: string): ParsedFilterSegment {
  segment = segment.trim()
  const parenIdx = segment.indexOf('(')
  if (parenIdx === -1) {
    return {name: segment, argsParsed: []}
  }

  const name = segment.slice(0, parenIdx).trim()
  const callAst = jsep(`${name}${segment.slice(parenIdx)}`) as jsep.CallExpression

  return {
    name, 
    argsParsed: (callAst.arguments ?? []) as jsep.Expression[],
  }
}

export interface ParsedExpression {
  mainRaw: string
  mainParsed: jsep.Expression
  
  filtersRaw: string[]
  filtersParsed: ParsedFilterSegment[]
}

export interface ParsedFilterSegment {
  name: string
  argsParsed: jsep.Expression[]
}