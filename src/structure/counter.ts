import { z } from 'zod'
import {
  CounterStyle,
  counterStyleForPlaceholder,
  counterStylePlaceholder,
  counterStyleSuffix,
  formatCounterStyle,
} from './counter-styles'

export const counter = z.object({
  /**
   * The marker format. The counter is inserted at a placeholder, which is how its style writes 1: `{1}.`, `({a})`,
   * `{あ}、`, etc. Without braces, the last `1`, `a`, `A`, `i` or `I` is used (e.g. `(a)` or `Artikel 1`).
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
  for (const match of marker.matchAll(/\{([^{}]+)\}/g)) {
    const style = counterStyleForPlaceholder(match[1])
    if (style != null) {
      return {start: match.index, length: match[0].length, style}
    }
  }

  for (let index = marker.length - 1; index >= 0; index--) {
    if (!BARE_PLACEHOLDERS.includes(marker[index])) { continue }

    const style = counterStyleForPlaceholder(marker[index])
    if (style != null) {
      return {start: index, length: 1, style}
    }
  }

  return null
}

/**
 * The default marker for a counter style, e.g. `1.` or `{あ}、`.
 */
export function counterStyleMarker(style: CounterStyle) {
  const placeholder = counterStylePlaceholder(style)
  const bare = BARE_PLACEHOLDERS.includes(placeholder)
  return `${bare ? placeholder : `{${placeholder}}`}${counterStyleSuffix(style)}`
}

export interface MarkerPlaceholder {
  start:  number
  length: number
  style:  CounterStyle
}

const BARE_PLACEHOLDERS = ['1', 'a', 'A', 'i', 'I']
