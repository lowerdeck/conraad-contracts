import { RichTextNode } from './types'

/**
 * Writes TipTap JSON as rich text markup, the inverse of `markupToRichText`. Nested lists are flattened, and anything
 * the markup can't express is left out.
 */
export function richTextToMarkup(content: RichTextNode | null | undefined): string | null {
  if (content?.content == null || content.content.length === 0) { return null }
  return content.content.map(block).filter(it => it !== '').join('\n\n')
}

// #region Blocks

function block(node: RichTextNode): string {
  switch (node.type) {
  case 'heading':
    if (node.attrs?.variant === 'title') {
      return withClasses(inline(node.content), ['title', ...alignment(node)])
    }
    return withClasses(`${'#'.repeat(node.attrs?.level ?? 1)} ${inline(node.content)}`, alignment(node))

  case 'paragraph':
    return withClasses(inline(node.content), [...node.attrs?.variant === 'small' ? ['small'] : [], ...alignment(node)])

  case 'bulletList':
  case 'orderedList':
    return listItems(node).map((text, index) => `${node.type === 'bulletList' ? '-' : `${index + 1}.`} ${text}`).join('\n')

  default:
    return inline(node.content)
  }
}

function listItems(list: RichTextNode): string[] {
  return (list.content ?? []).flatMap(item => (item.content ?? []).flatMap(child => {
    if (child.type === 'bulletList' || child.type === 'orderedList') {
      return listItems(child)
    }
    return [inline(child.content).replace(/\n/g, ' ')]
  }))
}

function alignment(node: RichTextNode): string[] {
  const align = node.attrs?.textAlign
  return typeof align === 'string' && align !== 'left' ? [align] : []
}

function withClasses(text: string, classes: string[]) {
  if (classes.length === 0) { return text }
  return `${text} {${classes.map(it => `.${it}`).join(' ')}}`
}

// #endregion

// #region Inline

function inline(nodes: RichTextNode[] | undefined): string {
  return (nodes ?? []).map(inlineNode).join('')
}

function inlineNode(node: RichTextNode): string {
  const text = inlineText(node)
  const marks = (node.marks ?? []).map(it => markSyntax[it.type]).filter(it => it != null)
  if (marks.length === 0 || text === '') { return text }

  return marks.join('') + text + [...marks].reverse().join('')
}

function inlineText(node: RichTextNode): string {
  const attrs = node.attrs ?? {}

  switch (node.type) {
  case 'text': return escape(node.text ?? '')
  case 'hardBreak': return '\n'
  case 'expression': return `{{${attrs.expression ?? ''}}}`
  case 'reference': return `{@${attrs.target ?? ''}}`
  case 'counter': return '{%counter}'
  case 'page': return `{%page_${attrs.value === 'count' ? 'count' : 'number'}}`
  case 'image': return `{%image:${[attrs.image, attrs.width, attrs.height].map(it => it ?? '').join(':')}}`
  default: return inline(node.content)
  }
}

function escape(text: string) {
  return text.replace(/[\\*_{]/g, it => `\\${it}`)
}

const markSyntax: Record<string, string | undefined> = {
  bold:      '**',
  italic:    '*',
  underline: '__',
}

// #endregion
