/**
 * Formats a counter value in one of a selection of the predefined CSS counter styles (CSS Counter Styles Level 3).
 * Values outside a style's range fall back to `decimal`, like CSS does.
 */
export function formatCounterStyle(value: number, style: CounterStyle): string {
  const definition: CounterStyleDefinition = COUNTER_STYLES[style]
  if (value < definition.range[0] || value > definition.range[1]) {
    return String(value)
  }

  const formatted = formatWith(value, definition)
  if (formatted == null) { return String(value) }

  const padded = definition.pad == null ? formatted : formatted.padStart(definition.pad.length, definition.pad.symbol)
  return value < 0 ? `${definition.negative ?? '-'}${padded}` : padded
}

export type CounterStyle = keyof typeof COUNTER_STYLES

export const counterStyles = () => Object.keys(COUNTER_STYLES) as CounterStyle[]

/**
 * The placeholder for a style in a marker, which is how the style writes 1: `{1}`, `{a}`, `{あ}`, etc.
 */
export function counterStylePlaceholder(style: CounterStyle) {
  const definition: CounterStyleDefinition = COUNTER_STYLES[style]
  return definition.placeholder
}

export function counterStyleForPlaceholder(placeholder: string): CounterStyle | undefined {
  return STYLES_BY_PLACEHOLDER.get(placeholder)
}

export function counterStyleSuffix(style: CounterStyle) {
  const definition: CounterStyleDefinition = COUNTER_STYLES[style]
  return definition.suffix ?? '.'
}

function formatWith(value: number, definition: CounterStyleDefinition): string | null {
  switch (definition.system) {
  case 'numeric': return numeric(Math.abs(value), definition.symbols)
  case 'alphabetic': return alphabetic(value, definition.symbols)
  case 'additive': return additive(Math.abs(value), definition.symbols)
  case 'chinese': return chinese(Math.abs(value), definition.symbols)
  }
}

function numeric(value: number, symbols: string[]) {
  if (value === 0) { return symbols[0] }

  let result = ''
  while (value > 0) {
    result = symbols[value % symbols.length] + result
    value = Math.floor(value / symbols.length)
  }
  return result
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
  if (value === 0) {
    return symbols.find(([weight]) => weight === 0)?.[1] ?? null
  }

  let result = ''
  for (const [weight, symbol] of symbols) {
    if (weight === 0) { continue }
    while (value >= weight) {
      result += symbol
      value -= weight
    }
  }
  return value === 0 ? result : null
}

// CSS Counter Styles 3, §7.1.2 "Chinese": digits with 十/百/千 markers, collapsing zeros.
function chinese(value: number, spec: ChineseSymbols) {
  if (value === 0) { return spec.digits[0] }

  const digits = String(value).split('').map(Number)
  let result = ''
  let pendingZero = false

  for (const [index, digit] of digits.entries()) {
    const position = digits.length - index - 1
    if (digit === 0) {
      pendingZero = true
      continue
    }

    if (pendingZero && result !== '') {
      result += spec.digits[0]
    }
    pendingZero = false

    // Informal styles write 10-19 as 十, 十一, ... instead of 一十, 一十一, ...
    const omitOne = spec.informal && digit === 1 && position === 1 && digits.length === 2
    result += (omitOne ? '' : spec.digits[digit]) + (position > 0 ? spec.markers[position - 1] : '')
  }

  return result
}

type CounterStyleDefinition = {
  placeholder: string
  range:       [number, number]
  suffix?:     string
  negative?:   string
  pad?:        {length: number, symbol: string}
} & (
  | {system: 'numeric' | 'alphabetic', symbols: string[]}
  | {system: 'additive', symbols: Array<[number, string]>}
  | {system: 'chinese', symbols: ChineseSymbols}
)

interface ChineseSymbols {
  digits:   string[]
  markers:  string[]
  informal: boolean
}

const INFINITE: [number, number] = [-Infinity, Infinity]
const POSITIVE: [number, number] = [1, Infinity]

function chars(symbols: string) {
  return Array.from(symbols)
}

const ROMAN: Array<[number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

function cjkAdditive(
  digits: string,
  thousand: string,
  hundred: string,
  ten: string,
  zero: string,
): Array<[number, string]> {
  // `digits` lists 1 through 9.
  const list = chars(digits)

  const symbols: Array<[number, string]> = []
  for (const [weight, marker] of [[1000, thousand], [100, hundred], [10, ten]] as const) {
    for (let digit = 9; digit >= 1; digit--) {
      symbols.push([digit * weight, list[digit - 1] + marker])
    }
  }
  for (let digit = 9; digit >= 1; digit--) {
    symbols.push([digit, list[digit - 1]])
  }
  symbols.push([0, zero])
  return symbols
}

// Only styles that write 1 differently are included, so that the placeholder identifies the style.
const COUNTER_STYLES = {
  'decimal':              {placeholder: '1', system: 'numeric', range: INFINITE, symbols: chars('0123456789')},
  'decimal-leading-zero': {placeholder: '01', system: 'numeric', range: INFINITE, symbols: chars('0123456789'), pad: {length: 2, symbol: '0'}},
  'lower-alpha':          {placeholder: 'a', system: 'alphabetic', range: POSITIVE, symbols: chars('abcdefghijklmnopqrstuvwxyz')},
  'upper-alpha':          {placeholder: 'A', system: 'alphabetic', range: POSITIVE, symbols: chars('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
  'lower-roman':          {placeholder: 'i', system: 'additive', range: [1, 3999], symbols: ROMAN.map(([weight, symbol]) => [weight, symbol.toLowerCase()])},
  'upper-roman':          {placeholder: 'I', system: 'additive', range: [1, 3999], symbols: ROMAN},

  'hiragana':              {placeholder: 'あ', system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわゐゑをん')},
  'hiragana-iroha':        {placeholder: 'い', system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす')},
  'katakana':              {placeholder: 'ア', system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヰヱヲン')},
  'katakana-iroha':        {placeholder: 'イ', system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセス')},
  'cjk-earthly-branch':    {placeholder: '子', system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('子丑寅卯辰巳午未申酉戌亥')},
  'cjk-heavenly-stem':     {placeholder: '甲', system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('甲乙丙丁戊己庚辛壬癸')},
  'japanese-formal':       {placeholder: '壱', system: 'additive', range: [-9999, 9999], suffix: '、', negative: 'マイナス', symbols: cjkAdditive('壱弐参四伍六七八九', '阡', '百', '拾', '零')},
  'korean-hangul-formal':  {placeholder: '일', system: 'additive', range: [-9999, 9999], suffix: ', ', negative: '마이너스 ', symbols: cjkAdditive('일이삼사오육칠팔구', '천', '백', '십', '영')},
  'simp-chinese-informal': {placeholder: '一', system: 'chinese', range: [-9999, 9999], suffix: '、', negative: '负', symbols: {digits: chars('零一二三四五六七八九'), markers: chars('十百千'), informal: true}},
  'simp-chinese-formal':   {placeholder: '壹', system: 'chinese', range: [-9999, 9999], suffix: '、', negative: '负', symbols: {digits: chars('零壹贰叁肆伍陆柒捌玖'), markers: chars('拾佰仟'), informal: false}},
} satisfies Record<string, CounterStyleDefinition>

const STYLES_BY_PLACEHOLDER = new Map(
  counterStyles().map(style => [counterStylePlaceholder(style), style]),
)
