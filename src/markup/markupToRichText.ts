import { RichText } from '../structure'
import { RichTextNode } from './types'

/**
 * Converts rich text markup, as written by Claude, into the TipTap JSON the editor uses. Returns `null` for empty
 * text, as the editor does.
 *
 * References (`{@key}`) and images (`{%image:key:width:height}`) refer to IDs as they are, unless a resolver maps
 * their keys. Anything that doesn't resolve is reported through `warn`, and left out.
 */
export function markupToRichText(markup: string | null | undefined, resolver: MarkupResolver = {}): RichText | null {
  if (markup == null) { return null }

  const blocks = markup
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n/)
    .map(it => it.replace(/^\n+|\s+$/g, ''))
    .filter(it => it.trim() !== '')
    .map(it => convertBlock(it, resolver))

  if (blocks.length === 0) { return null }
  return {type: 'doc', content: blocks}
}

export interface MarkupResolver {
  reference?(key: string): string | null
  image?(key: string, width: number | null, height: number | null): ImageAttributes | null
  warn?(message: string): void
}

export interface ImageAttributes {
  image:  string
  width:  number | null
  height: number | null
}

// #region Blocks

function convertBlock(block: string, resolver: MarkupResolver): RichTextNode {
  const {text, classes} = extractClasses(block)
  const lines = text.split('\n')

  if (lines.every(line => bulletPattern.test(line))) {
    return list('bulletList', lines.map(line => line.replace(bulletPattern, '')), resolver)
  }
  if (lines.every(line => orderedPattern.test(line))) {
    return list('orderedList', lines.map(line => line.replace(orderedPattern, '')), resolver)
  }

  const headingMatch = text.match(/^(#{1,3})\s+/)
  const content = inline(headingMatch == null ? text : text.slice(headingMatch[0].length), resolver)

  const attrs: Record<string, unknown> = {}
  const align = classes.find(it => alignments.includes(it))
  if (align != null) {
    attrs.textAlign = align
  }

  if (classes.includes('title')) {
    return node('heading', {...attrs, level: 1, variant: 'title'}, content)
  } else if (headingMatch != null) {
    return node('heading', {...attrs, level: headingMatch[1].length}, content)
  } else if (classes.includes('small')) {
    return node('paragraph', {...attrs, variant: 'small'}, content)
  } else {
    return node('paragraph', attrs, content)
  }
}

function list(type: 'bulletList' | 'orderedList', items: string[], resolver: MarkupResolver): RichTextNode {
  return {
    type,
    content: items.map(item => ({
      type:    'listItem',
      content: [node('paragraph', {}, inline(item, resolver))],
    })),
  }
}

function extractClasses(block: string) {
  const match = block.match(/\s*\{((?:\.[a-z]+\s*)+)\}\s*$/)
  if (match == null) { return {text: block, classes: []} }

  const classes = match[1].split(/\s+/).filter(Boolean).map(it => it.slice(1))
  return {text: block.slice(0, match.index), classes}
}

function node(type: string, attrs: Record<string, unknown>, content: RichTextNode[]): RichTextNode {
  return {
    type,
    ...(Object.keys(attrs).length > 0 && {attrs}),
    ...(content.length > 0 && {content}),
  }
}

const bulletPattern = /^\s*[-•]\s+/
const orderedPattern = /^\s*\d+[.)]\s+/
const alignments = ['left', 'center', 'right', 'justify']

// #endregion

// #region Inline

function inline(text: string, resolver: MarkupResolver): RichTextNode[] {
  const result: RichTextNode[] = []
  const marks = new Set<MarkType>()
  let buffer = ''

  const flush = () => {
    if (buffer === '') { return }
    result.push(textNode(buffer, marks))
    buffer = ''
  }

  const push = (node: RichTextNode | null, fallback: string) => {
    if (node == null) {
      buffer += fallback
    } else {
      flush()
      result.push(marks.size > 0 ? {...node, marks: markList(marks)} : node)
    }
  }

  const toggle = (mark: MarkType) => {
    flush()
    if (marks.has(mark)) {
      marks.delete(mark)
    } else {
      marks.add(mark)
    }
  }

  let index = 0
  while (index < text.length) {
    const rest = text.slice(index)

    if (rest[0] === '\\' && rest.length > 1) {
      buffer += rest[1]
      index += 2
      continue
    }

    if (rest[0] === '\n') {
      push({type: 'hardBreak'}, '')
      index += 1
      continue
    }

    const token = rest.match(tokenPattern)
    if (token != null) {
      push(convertToken(token[0], resolver), token[0])
      index += token[0].length
      continue
    }

    if (rest.startsWith('**')) {
      toggle('bold')
      index += 2
    } else if (rest.startsWith('__')) {
      toggle('underline')
      index += 2
    } else if (rest[0] === '*') {
      toggle('italic')
      index += 1
    } else {
      buffer += rest[0]
      index += 1
    }
  }

  flush()
  return result
}

function convertToken(token: string, resolver: MarkupResolver): RichTextNode | null {
  if (token.startsWith('{{')) {
    const expression = token.slice(2, -2).trim()
    if (expression === '') { return null }
    return {type: 'expression', attrs: {expression}}
  }

  if (token.startsWith('{@')) {
    const key = token.slice(2, -1).trim()
    const target = resolver.reference == null ? key : resolver.reference(key)
    if (target == null) {
      resolver.warn?.(`Verwijzing naar onbekende sectie "${key}"`)
      return null
    }
    return {type: 'reference', attrs: {target}}
  }

  const [name, ...args] = token.slice(2, -1).split(':').map(it => it.trim())
  switch (name) {
  case 'counter':
    return {type: 'counter'}
  case 'page_number':
    return {type: 'page', attrs: {value: 'number'}}
  case 'page_count':
    return {type: 'page', attrs: {value: 'count'}}
  case 'image': {
    const key = args[0] ?? ''
    const width = dimension(args[1])
    const height = dimension(args[2])
    const attrs = resolver.image == null ? (key === '' ? null : {image: key, width, height}) : resolver.image(key, width, height)
    if (attrs == null) {
      resolver.warn?.(`Afbeelding "${key}" kon niet worden geplaatst`)
      return {type: 'text', text: ' '}
    }
    return {type: 'image', attrs: {...attrs, alt: null}}
  }
  default:
    return null
  }
}

function dimension(value: string | undefined) {
  const number = value == null ? NaN : Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function textNode(text: string, marks: Set<MarkType>): RichTextNode {
  return marks.size > 0 ? {type: 'text', text, marks: markList(marks)} : {type: 'text', text}
}

function markList(marks: Set<MarkType>) {
  return markOrder.filter(it => marks.has(it)).map(type => ({type}))
}

type MarkType = 'bold' | 'italic' | 'underline'
const markOrder: MarkType[] = ['bold', 'italic', 'underline']

const tokenPattern = /^(\{\{[^{}]*\}\}|\{@[^{}]+\}|\{%[a-z_]+(?::[^{}]*)?\})/

// #endregion
