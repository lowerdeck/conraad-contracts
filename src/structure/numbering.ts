import { isEqual } from 'lodash'
import { z } from 'zod'

/**
 * A numbering system, like the one for articles or for appendices. Sections are numbered at the first level, the items
 * of list sections at the levels below it.
 */
export const numbering = z.object({
  /**
   * The levels, from the top down. Levels beyond the last one use the last one.
   */
  levels: z.array(z.object({
    marker: z.string().max(50),

    /**
     * Whether to combine the marker with that of the level above, as in `1.1.` or `1(a)`. Only has effect if the
     * markers allow it, see `canNestMarkers`.
     */
    nested: z.boolean().default(true),
  })).min(1),
})

export type Numbering = z.output<typeof numbering>
export type NumberingLevel = Numbering['levels'][number]

/**
 * A numbering as configured in a template or the organisation's settings. Sections refer to it by ID.
 */
export const namedNumbering = numbering.extend({
  id:   z.string().min(1).max(32),
  name: z.string().min(1).max(64),
})

export type NamedNumbering = z.output<typeof namedNumbering>

export const numberings = z.array(namedNumbering)
export type Numberings = z.output<typeof numberings>

export namespace Numbering {

  export function level(numbering: Numbering, depth: number): NumberingLevel {
    return numbering.levels[Math.min(depth, numbering.levels.length - 1)]
  }

  /**
   * Formats the number at the given path of (1-based) values, one per level. E.g. `[1, 2, 1]` gives `1.2.a.` for
   * the default article numbering.
   */
  export function format(numbering: Numbering, path: number[]): string {
    let result = ''
    let parentMarker: string | null = null

    for (const [depth, value] of path.entries()) {
      const {marker, nested} = level(numbering, depth)
      const nest = parentMarker != null && nested && canNestMarkers(parentMarker, marker)

      result = nest ? formatNestedMarker(result, marker, value) : formatMarker(marker, value)
      parentMarker = marker
    }

    return result
  }

  export function fromPreset(preset: NumberingPreset): Numbering {
    return {levels: PRESETS[preset]()}
  }

  /**
   * The preset the numbering is structurally equal to, if any.
   */
  export function preset(numbering: Numbering): NumberingPreset | undefined {
    return numberingPresets.find(preset => isEqual(PRESETS[preset](), numbering.levels))
  }

  // Their IDs are never shown, so these can be fixed. Numberings added later get a random ID.
  export function defaults(): Numberings {
    return [
      {id: 'article', name: 'Artikelen', ...fromPreset('article')},
      {id: 'appendix', name: 'Bijlagen', ...fromPreset('appendix')},
    ]
  }

}

// #region Presets

export const numberingPresets = ['article', 'appendix', 'legal', 'chinese', 'japanese', 'korean'] as const
export type NumberingPreset = typeof numberingPresets[number]

// The CJK presets follow the usual structure of contracts there, with each level written on its own.
const PRESETS: Record<NumberingPreset, () => NumberingLevel[]> = {
  article: () => [
    {marker: '{1}.', nested: true},
    {marker: '{1}.', nested: true},
    {marker: '{a}.', nested: true},
  ],
  // Only in Dutch for now.
  appendix: () => [
    {marker: 'Bijlage {A}', nested: true},
    {marker: '{1}.', nested: true},
    {marker: '{1}.', nested: true},
    {marker: '{a}.', nested: true},
  ],
  legal: () => [
    {marker: '{1}.', nested: true},
    {marker: '({a})', nested: true},
    {marker: '({i})', nested: true},
  ],
  // 条 → 款 → 项 → 目
  chinese: () => [
    {marker: '第{一}条', nested: false},
    {marker: '（{一}）', nested: false},
    {marker: '{1}.', nested: false},
    {marker: '（{1}）', nested: false},
  ],
  // 条 → 項 → 号 → 細目
  japanese: () => [
    {marker: '第{1}条', nested: false},
    {marker: '{1}', nested: false},
    {marker: '（{1}）', nested: false},
    {marker: '{ア}', nested: false},
  ],
  // 조 → 항 → 호 → 목
  korean: () => [
    {marker: '제{1}조', nested: false},
    {marker: '{①}', nested: false},
    {marker: '{1}.', nested: false},
    {marker: '{가}.', nested: false},
  ],
}

// #endregion

// #region Markers

/**
 * Formats a marker for the given (1-based) value. The value is inserted at the marker's placeholder, which is how its
 * style writes 1: `{1}.`, `({a})`, `제{1}조`, `{가}.`, etc.
 */
export function formatMarker(marker: string, value: number) {
  const placeholder = findMarkerPlaceholder(marker)
  if (placeholder == null) { return marker }

  const {start, length, style} = placeholder
  return marker.slice(0, start) + formatCounterStyle(value, style) + marker.slice(start + length)
}

/**
 * Formats a marker nested under an already formatted parent marker: `1.` + `a.` gives `1.a.`, and `1.` + `(a)` gives
 * `1(a)`, like clause references in contracts. Any text before the placeholder is left out.
 */
function formatNestedMarker(parent: string, marker: string, value: number) {
  const placeholder = findMarkerPlaceholder(marker)
  const nesting = markerNesting(marker)
  if (placeholder == null || nesting == null) { return formatMarker(marker, value) }

  const formatted = formatCounterStyle(value, placeholder.style)
  if (nesting === 'period') {
    return `${parent}${formatted}.`
  } else {
    return `${parent.replace(/\.$/, '')}(${formatted})`
  }
}

/**
 * Whether marker `child` can be nested under marker `parent`. Only markers of the form `{x}.` and `({x})` with a
 * Western style can, and a `{x}.` marker cannot follow a `({x})` one.
 */
export function canNestMarkers(parent: string, child: string) {
  const parentNesting = markerNesting(parent)
  const childNesting = markerNesting(child)
  if (parentNesting == null || childNesting == null) { return false }

  return !(parentNesting === 'parens' && childNesting === 'period')
}

function findMarkerPlaceholder(marker: string): MarkerPlaceholder | null {
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

interface MarkerPlaceholder {
  start:  number
  length: number
  style:  CounterStyle
}

// #endregion

// #region Counter styles

/**
 * Formats a counter value in the given style. Values the style cannot express fall back to decimal.
 */
function formatCounterStyle(value: number, style: CounterStyle): string {
  const definition: CounterStyleDefinition = COUNTER_STYLES[style]
  if (value < 1 || value > definition.max) {
    return String(value)
  }

  switch (definition.system) {
  case 'numeric': return String(value)
  case 'alphabetic': return alphabetic(value, definition.symbols)
  case 'additive': return additive(value, definition.symbols)
  case 'fixed': return definition.symbols[value - 1]
  case 'chinese': return chinese(value)
  }
}

type CounterStyle = keyof typeof COUNTER_STYLES

const counterStyles = () => Object.keys(COUNTER_STYLES) as CounterStyle[]

/**
 * The placeholder for a style in a marker, which is how the style writes 1: `{1}`, `{a}`, `{가}`, etc.
 */
function counterStylePlaceholder(style: CounterStyle) {
  const definition: CounterStyleDefinition = COUNTER_STYLES[style]
  return definition.placeholder
}

function counterStyleForPlaceholder(placeholder: string): CounterStyle | undefined {
  return STYLES_BY_PLACEHOLDER.get(placeholder)
}

/**
 * Whether the style can be combined with a parent counter, as in `1.a.` or `1(a)`.
 */
function isNestableCounterStyle(style: CounterStyle) {
  const definition: CounterStyleDefinition = COUNTER_STYLES[style]
  return definition.nestable === true
}

function alphabetic(value: number, symbols: string[]) {
  let result = ''
  while (value > 0) {
    value -= 1
    result = symbols[value % symbols.length] + result
    value = Math.floor(value / symbols.length)
  }
  return result
}

function additive(value: number, symbols: Array<[number, string]>) {
  let result = ''
  for (const [weight, symbol] of symbols) {
    while (value >= weight) {
      result += symbol
      value -= weight
    }
  }
  return result
}

// Chinese numerals as written in everyday use: 十一, 一百零五, 一千零一十.
function chinese(value: number) {
  const digits = String(value).split('').map(Number)
  let result = ''
  let pendingZero = false

  for (const [index, digit] of digits.entries()) {
    const position = digits.length - index - 1
    if (digit === 0) {
      pendingZero = true
      continue
    }

    if (pendingZero) {
      result += CHINESE_DIGITS[0]
    }
    pendingZero = false

    // 10-19 are written as 十, 十一, ... rather than 一十, 一十一, ...
    const omitOne = digit === 1 && position === 1 && digits.length === 2
    result += (omitOne ? '' : CHINESE_DIGITS[digit]) + (position > 0 ? CHINESE_MARKERS[position - 1] : '')
  }

  return result
}

type CounterStyleDefinition = {
  placeholder: string
  max:         number
  nestable?:   boolean
} & (
  | {system: 'numeric' | 'chinese', symbols?: never}
  | {system: 'alphabetic' | 'fixed', symbols: string[]}
  | {system: 'additive', symbols: Array<[number, string]>}
)

const CHINESE_DIGITS = chars('零一二三四五六七八九')
const CHINESE_MARKERS = chars('十百千')

function chars(symbols: string) {
  return Array.from(symbols)
}

function codePoints(from: number, to: number) {
  return Array.from({length: to - from + 1}, (_, index) => String.fromCodePoint(from + index))
}

const ROMAN: Array<[number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

// Greek numerals, as used for enumeration in modern Greek (6 = στ, 11 = ια).
const GREEK: Array<[number, string]> = [
  [900, 'ϡ'], [800, 'ω'], [700, 'ψ'], [600, 'χ'], [500, 'φ'], [400, 'υ'], [300, 'τ'], [200, 'σ'], [100, 'ρ'],
  [90, 'ϟ'], [80, 'π'], [70, 'ο'], [60, 'ξ'], [50, 'ν'], [40, 'μ'], [30, 'λ'], [20, 'κ'], [10, 'ι'],
  [9, 'θ'], [8, 'η'], [7, 'ζ'], [6, 'στ'], [5, 'ε'], [4, 'δ'], [3, 'γ'], [2, 'β'], [1, 'α'],
]

// ① through ㊿, which are spread over three Unicode ranges.
const CIRCLED = [
  ...codePoints(0x2460, 0x2473),
  ...codePoints(0x3251, 0x325F),
  ...codePoints(0x32B1, 0x32BF),
]

// Placeholders must be unique, as they identify the style in a marker. CJK styles are not nestable, as each level is
// written on its own there (e.g. 第1条 → 1 → (1) → ア).
const COUNTER_STYLES = {
  'decimal':        {placeholder: '1', nestable: true, system: 'numeric', max: Infinity},
  'lower-alpha':    {placeholder: 'a', nestable: true, system: 'alphabetic', max: Infinity, symbols: chars('abcdefghijklmnopqrstuvwxyz')},
  'upper-alpha':    {placeholder: 'A', nestable: true, system: 'alphabetic', max: Infinity, symbols: chars('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
  'lower-roman':    {placeholder: 'i', nestable: true, system: 'additive', max: 3999, symbols: ROMAN.map(([weight, symbol]) => [weight, symbol.toLowerCase()])},
  'upper-roman':    {placeholder: 'I', nestable: true, system: 'additive', max: 3999, symbols: ROMAN},
  'greek':          {placeholder: 'α', nestable: true, system: 'additive', max: 999, symbols: GREEK},
  'circled':        {placeholder: '①', system: 'fixed', max: CIRCLED.length, symbols: CIRCLED},
  'chinese':        {placeholder: '一', system: 'chinese', max: 9999},
  'katakana':       {placeholder: 'ア', system: 'alphabetic', max: Infinity, symbols: chars('アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン')},
  'katakana-iroha': {placeholder: 'イ', system: 'alphabetic', max: Infinity, symbols: chars('イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセス')},
  'hangul':         {placeholder: '가', system: 'alphabetic', max: Infinity, symbols: chars('가나다라마바사아자차카타파하')},
} satisfies Record<string, CounterStyleDefinition>

const STYLES_BY_PLACEHOLDER = new Map(
  counterStyles().map(style => [counterStylePlaceholder(style), style]),
)

// #endregion
