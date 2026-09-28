import { z } from 'zod'

export const counter = z.object({
  /**
   * The marker format.
   */
  marker: z.string().max(10).default('1.'),
  start:  z.number().default(1),
  nested: z.boolean().default(true),
})

export type Counter = z.output<typeof counter>

export function formatMarker(index: number, counter: Counter) {
  const ordinal = index + counter.start
  return counter.marker
    .replace(/1/, `${ordinal}`)
    .replace(/A/, String.fromCharCode('A'.charCodeAt(0) + ordinal - 1))
    .replace(/a/, String.fromCharCode('a'.charCodeAt(0) + ordinal - 1))
    .replace(/I/, toRoman(ordinal))
    .replace(/i/, toRoman(ordinal).toLocaleLowerCase())
}

function toRoman(num: number) {
  let result = ''
  for (const [value, numeral] of ROMAN_NUMERALS) {
    while (num >= value) {
      result += numeral
      num -= value
    }
  }
  return result
}

const ROMAN_NUMERALS: Array<[number, string]> = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]