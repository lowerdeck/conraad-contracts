import { z } from 'zod'
import { CounterStyle, counterStyleForPlaceholder, formatCounterStyle, isNestableCounterStyle } from './counter-styles'

export const counter = z.object({
  /**
   * The marker format. The counter is inserted at a placeholder, which is how its style writes 1: `{1}.`, `({a})`,
   * `제{1}조`, `{가}.`, etc.
   */
  marker: z.string().max(50).default('{1}.'),
  start:  z.number().default(1),
  nested: z.boolean().default(true),
})

export type Counter = z.output<typeof counter>

export function formatMarker(index: number, counter: Counter) {
  const placeholder = findMarkerPlaceholder(counter.marker)
  if (placeholder == null) { return counter.marker }

  const {start, length, style} = placeholder
  const formatted = formatCounterStyle(index + counter.start, style)
  return counter.marker.slice(0, start) + formatted + counter.marker.slice(start + length)
}

/**
 * Formats a marker nested under an already formatted parent marker: `1.` + `a.` gives `1.a.`, and `1.` + `(a)` gives
 * `1(a)`, like clause references in contracts. Any text before the placeholder is left out.
 */
export function formatNestedMarker(parent: string, index: number, counter: Counter) {
  const placeholder = findMarkerPlaceholder(counter.marker)
  const nesting = markerNesting(counter.marker)
  if (placeholder == null || nesting == null) { return formatMarker(index, counter) }

  const formatted = formatCounterStyle(index + counter.start, placeholder.style)
  if (nesting === 'period') {
    return `${parent}${formatted}.`
  } else {
    return `${parent.replace(/\.$/, '')}(${formatted})`
  }
}

/**
 * Whether a counter with marker `child` can be nested under a counter with marker `parent`. Only markers of the form
 * `{x}.` and `({x})` with a Western style can, and a `{x}.` marker cannot follow a `({x})` one.
 */
export function canNestMarkers(parent: string, child: string) {
  const parentNesting = markerNesting(parent)
  const childNesting = markerNesting(child)
  if (parentNesting == null || childNesting == null) { return false }

  return !(parentNesting === 'parens' && childNesting === 'period')
}

export function findMarkerPlaceholder(marker: string): MarkerPlaceholder | null {
  for (const match of marker.matchAll(/\{([^{}]+)\}/g)) {
    const style = counterStyleForPlaceholder(match[1])
    if (style != null) {
      return {start: match.index, length: match[0].length, style}
    }
  }
  return null
}

function markerNesting(marker: string): MarkerNesting | null {
  const placeholder = findMarkerPlaceholder(marker)
  if (placeholder == null || !isNestableCounterStyle(placeholder.style)) { return null }

  const before = marker.slice(0, placeholder.start)
  const after = marker.slice(placeholder.start + placeholder.length)
  if (after === '.') { return 'period' }
  if (after === ')' && before.endsWith('(')) { return 'parens' }
  return null
}

type MarkerNesting = 'period' | 'parens'

export interface MarkerPlaceholder {
  start:  number
  length: number
  style:  CounterStyle
}
