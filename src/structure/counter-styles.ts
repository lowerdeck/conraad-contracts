/**
 * Formats a counter value in one of the predefined CSS counter styles (CSS Counter Styles Level 3). Values outside a
 * style's range fall back to `decimal`, like CSS does.
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

export function isCounterStyle(style: string): style is CounterStyle {
  return Object.hasOwn(COUNTER_STYLES, style)
}

export type CounterStyle = keyof typeof COUNTER_STYLES

export const counterStyles = () => Object.keys(COUNTER_STYLES) as CounterStyle[]

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
  case 'ethiopic': return ethiopic(value)
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

// CSS Counter Styles 3, §7.1.3 "Ethiopic numeric".
function ethiopic(value: number) {
  if (value === 1) { return '፩' }

  const groups: number[] = []
  for (let rest = value; rest > 0; rest = Math.floor(rest / 100)) {
    groups.push(rest % 100)
  }

  let result = ''
  for (const [index, group] of groups.entries()) {
    const mostSignificant = index === groups.length - 1
    const omitDigits = group === 0 || (group === 1 && (mostSignificant || index % 2 === 1))

    let part = omitDigits ? '' : ETHIOPIC_TENS[Math.floor(group / 10)] + ETHIOPIC_ONES[group % 10]
    if (index % 2 === 1 && group !== 0) {
      part += '፻'
    } else if (index % 2 === 0 && index > 0) {
      part += '፼'
    }
    result = part + result
  }
  return result
}

type CounterStyleDefinition = {
  range:     [number, number]
  suffix?:   string
  negative?: string
  pad?:      {length: number, symbol: string}
} & (
  | {system: 'numeric' | 'alphabetic', symbols: string[]}
  | {system: 'additive', symbols: Array<[number, string]>}
  | {system: 'chinese', symbols: ChineseSymbols}
  | {system: 'ethiopic', symbols?: never}
)

interface ChineseSymbols {
  digits:   string[]
  markers:  string[]
  informal: boolean
}

const ETHIOPIC_ONES = ['', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱']
const ETHIOPIC_TENS = ['', '፲', '፳', '፴', '፵', '፶', '፷', '፸', '፹', '፺']

const INFINITE: [number, number] = [-Infinity, Infinity]
const POSITIVE: [number, number] = [1, Infinity]

// Digits in these scripts are contiguous code points starting at zero.
function digits(zero: string) {
  const start = zero.codePointAt(0)!
  return Array.from({length: 10}, (_, index) => String.fromCodePoint(start + index))
}

function chars(symbols: string) {
  return Array.from(symbols)
}

function numericStyle(zero: string): CounterStyleDefinition {
  return {system: 'numeric', range: INFINITE, symbols: digits(zero)}
}

function repeated(symbols: string, weights: number[]): Array<[number, string]> {
  const list = chars(symbols)
  return weights.map((weight, index) => [weight, list[index]])
}

const ROMAN: Array<[number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

const ARMENIAN_WEIGHTS = [
  9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000,
  900, 800, 700, 600, 500, 400, 300, 200, 100,
  90, 80, 70, 60, 50, 40, 30, 20, 10,
  9, 8, 7, 6, 5, 4, 3, 2, 1,
]
const UPPER_ARMENIAN = repeated('ՔՓՒՑՐՏՎՍՌՋՊՉՈՇՆՅՄՃՂՁՀԿԾԽԼԻԺԹԸԷԶԵԴԳԲԱ', ARMENIAN_WEIGHTS)
const LOWER_ARMENIAN = UPPER_ARMENIAN.map(([weight, symbol]): [number, string] => [weight, symbol.toLowerCase()])

const GEORGIAN = repeated('ჵჰჯჴხჭწძცჩშყღქფჳტსრჟპოჲნმლკითჱზვედგბა', [10000, ...ARMENIAN_WEIGHTS])

const HEBREW: Array<[number, string]> = [
  [10000, 'י׳'], [9000, 'ט׳'], [8000, 'ח׳'], [7000, 'ז׳'], [6000, 'ו׳'],
  [5000, 'ה׳'], [4000, 'ד׳'], [3000, 'ג׳'], [2000, 'ב׳'], [1000, 'א׳'],
  [400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'],
  [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'],
  // 15 and 16 are written as 9+6 and 9+7 to avoid spelling the divine name.
  [19, 'יט'], [18, 'יח'], [17, 'יז'], [16, 'טז'], [15, 'טו'],
  [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א'],
]

function cjkAdditive(
  digits: string,
  thousand: string,
  hundred: string,
  ten: string,
  oneBeforeMarker: boolean,
  zero: string,
): Array<[number, string]> {
  // `digits` lists 1 through 9.
  const list = chars(digits)
  const prefix = (digit: number) => (digit === 1 && !oneBeforeMarker ? '' : list[digit - 1])

  const symbols: Array<[number, string]> = []
  for (const [weight, marker] of [[1000, thousand], [100, hundred], [10, ten]] as const) {
    for (let digit = 9; digit >= 1; digit--) {
      symbols.push([digit * weight, prefix(digit) + marker])
    }
  }
  for (let digit = 9; digit >= 1; digit--) {
    symbols.push([digit, list[digit - 1]])
  }
  symbols.push([0, zero])
  return symbols
}

const CJK_INFORMAL_DIGITS = chars('零一二三四五六七八九')

const COUNTER_STYLES = {
  // Numeric
  'decimal':              {system: 'numeric', range: INFINITE, symbols: digits('0')},
  'decimal-leading-zero': {system: 'numeric', range: INFINITE, symbols: digits('0'), pad: {length: 2, symbol: '0'}},
  'arabic-indic':         numericStyle('٠'),
  'bengali':              numericStyle('০'),
  'cambodian':            numericStyle('០'),
  'khmer':                numericStyle('០'),
  'cjk-decimal':          {system: 'numeric', range: INFINITE, suffix: '、', symbols: chars('〇一二三四五六七八九')},
  'devanagari':           numericStyle('०'),
  'gujarati':             numericStyle('૦'),
  'gurmukhi':             numericStyle('੦'),
  'kannada':              numericStyle('೦'),
  'lao':                  numericStyle('໐'),
  'malayalam':            numericStyle('൦'),
  'mongolian':            numericStyle('᠐'),
  'myanmar':              numericStyle('၀'),
  'oriya':                numericStyle('୦'),
  'persian':              numericStyle('۰'),
  'tamil':                numericStyle('௦'),
  'telugu':               numericStyle('౦'),
  'thai':                 numericStyle('๐'),
  'tibetan':              numericStyle('༠'),

  // Additive
  'lower-roman':    {system: 'additive', range: [1, 3999], symbols: ROMAN.map(([weight, symbol]) => [weight, symbol.toLowerCase()])},
  'upper-roman':    {system: 'additive', range: [1, 3999], symbols: ROMAN},
  'armenian':       {system: 'additive', range: [1, 9999], symbols: UPPER_ARMENIAN},
  'upper-armenian': {system: 'additive', range: [1, 9999], symbols: UPPER_ARMENIAN},
  'lower-armenian': {system: 'additive', range: [1, 9999], symbols: LOWER_ARMENIAN},
  'georgian':       {system: 'additive', range: [1, 19999], symbols: GEORGIAN},
  'hebrew':         {system: 'additive', range: [1, 10999], symbols: HEBREW},

  // Alphabetic
  'lower-alpha':        {system: 'alphabetic', range: POSITIVE, symbols: chars('abcdefghijklmnopqrstuvwxyz')},
  'lower-latin':        {system: 'alphabetic', range: POSITIVE, symbols: chars('abcdefghijklmnopqrstuvwxyz')},
  'upper-alpha':        {system: 'alphabetic', range: POSITIVE, symbols: chars('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
  'upper-latin':        {system: 'alphabetic', range: POSITIVE, symbols: chars('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
  'lower-greek':        {system: 'alphabetic', range: POSITIVE, symbols: chars('αβγδεζηθικλμνξοπρστυφχψω')},
  'hiragana':           {system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわゐゑをん')},
  'hiragana-iroha':     {system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす')},
  'katakana':           {system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヰヱヲン')},
  'katakana-iroha':     {system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセス')},
  'cjk-earthly-branch': {system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('子丑寅卯辰巳午未申酉戌亥')},
  'cjk-heavenly-stem':  {system: 'alphabetic', range: POSITIVE, suffix: '、', symbols: chars('甲乙丙丁戊己庚辛壬癸')},

  // Complex
  'japanese-informal':     {system: 'additive', range: [-9999, 9999], suffix: '、', negative: 'マイナス', symbols: cjkAdditive('一二三四五六七八九', '千', '百', '十', false, '〇')},
  'japanese-formal':       {system: 'additive', range: [-9999, 9999], suffix: '、', negative: 'マイナス', symbols: cjkAdditive('壱弐参四伍六七八九', '阡', '百', '拾', true, '零')},
  'korean-hangul-formal':  {system: 'additive', range: [-9999, 9999], suffix: ', ', negative: '마이너스 ', symbols: cjkAdditive('일이삼사오육칠팔구', '천', '백', '십', true, '영')},
  'korean-hanja-informal': {system: 'additive', range: [-9999, 9999], suffix: ', ', negative: '마이너스 ', symbols: cjkAdditive('一二三四五六七八九', '千', '百', '十', false, '零')},
  'korean-hanja-formal':   {system: 'additive', range: [-9999, 9999], suffix: ', ', negative: '마이너스 ', symbols: cjkAdditive('壹貳參四五六七八九', '仟', '百', '拾', true, '零')},
  'simp-chinese-informal': {system: 'chinese', range: [-9999, 9999], suffix: '、', negative: '负', symbols: {digits: CJK_INFORMAL_DIGITS, markers: chars('十百千'), informal: true}},
  'simp-chinese-formal':   {system: 'chinese', range: [-9999, 9999], suffix: '、', negative: '负', symbols: {digits: chars('零壹贰叁肆伍陆柒捌玖'), markers: chars('拾佰仟'), informal: false}},
  'trad-chinese-informal': {system: 'chinese', range: [-9999, 9999], suffix: '、', negative: '負', symbols: {digits: CJK_INFORMAL_DIGITS, markers: chars('十百千'), informal: true}},
  'trad-chinese-formal':   {system: 'chinese', range: [-9999, 9999], suffix: '、', negative: '負', symbols: {digits: chars('零壹貳參肆伍陸柒捌玖'), markers: chars('拾佰仟'), informal: false}},
  'ethiopic-numeric':      {system: 'ethiopic', range: POSITIVE, suffix: '/ '},
} satisfies Record<string, CounterStyleDefinition>
