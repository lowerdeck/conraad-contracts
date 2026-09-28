/**
 * Formats a counter value in the given style. Values the style cannot express fall back to decimal.
 */
export function formatCounterStyle(value: number, style: CounterStyle): string {
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

export type CounterStyle = keyof typeof COUNTER_STYLES

export const counterStyles = () => Object.keys(COUNTER_STYLES) as CounterStyle[]

/**
 * The placeholder for a style in a marker, which is how the style writes 1: `{1}`, `{a}`, `{가}`, etc.
 */
export function counterStylePlaceholder(style: CounterStyle) {
  const definition: CounterStyleDefinition = COUNTER_STYLES[style]
  return definition.placeholder
}

export function counterStyleForPlaceholder(placeholder: string): CounterStyle | undefined {
  return STYLES_BY_PLACEHOLDER.get(placeholder)
}

/**
 * Whether the style can be combined with a parent counter, as in `1.a.` or `1(a)`.
 */
export function isNestableCounterStyle(style: CounterStyle) {
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
