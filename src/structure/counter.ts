import { z } from 'zod'
import { CounterStyle, counterStyleSuffix, formatCounterStyle, isCounterStyle } from './counter-styles'

export const counter = z.object({
  /**
   * The marker format. The counter is inserted at a `{style}` placeholder (any CSS counter style, e.g.
   * `{lower-greek}.`), or else at the last `1`, `a`, `A`, `i` or `I` (e.g. `(a)` or `Artikel 1`).
   */
  marker: z.string().max(50).default('1.'),
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

export function findMarkerPlaceholder(marker: string): MarkerPlaceholder | null {
  for (const match of marker.matchAll(/\{([a-z-]+)\}/g)) {
    if (isCounterStyle(match[1])) {
      return {start: match.index, length: match[0].length, style: match[1]}
    }
  }

  for (let index = marker.length - 1; index >= 0; index--) {
    const style = SHORTHANDS[marker[index]]
    if (style != null) {
      return {start: index, length: 1, style}
    }
  }

  return null
}

/**
 * The default marker for a counter style, using a shorthand where available.
 */
export function counterStyleMarker(style: CounterStyle) {
  const shorthand = Object.entries(SHORTHANDS).find(([, it]) => it === style)?.[0]
  return `${shorthand ?? `{${style}}`}${counterStyleSuffix(style)}`
}

export interface MarkerPlaceholder {
  start:  number
  length: number
  style:  CounterStyle
}

const SHORTHANDS: Record<string, CounterStyle | undefined> = {
  '1': 'decimal',
  'a': 'lower-alpha',
  'A': 'upper-alpha',
  'i': 'lower-roman',
  'I': 'upper-roman',
}
