import { DateTime } from 'luxon'

/**
 * How a value reads in a contract.
 */
export function formatValue(value: unknown, options: FormatOptions): string {
  const {locale = contractLocale, booleanLabels} = options

  if (value == null) { return '' }
  if (typeof value === 'boolean') { return value ? booleanLabels.true : booleanLabels.false }
  if (typeof value === 'number') { return value.toLocaleString(locale) }
  if (value instanceof DateTime) { return formatDate(value, locale) }
  if (Array.isArray(value)) { return value.map(it => formatValue(it, options)).join(', ') }
  if (typeof value === 'object') { return JSON.stringify(value) }
  return String(value)
}

export function formatDate(date: DateTime, locale: string = contractLocale): string {
  return date.setLocale(locale).toLocaleString(DateTime.DATE_FULL)
}

export function formatCurrency(amount: number, options: CurrencyOptions, locale: string = contractLocale): string {
  const digits = options.decimals ? 2 : 0
  return new Intl.NumberFormat(locale, {
    style:                 'currency',
    currency:              options.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
}

export function toDateTime(value: unknown): DateTime | null {
  if (value instanceof DateTime) { return value }
  if (typeof value === 'string') {
    const date = DateTime.fromISO(value)
    return date.isValid ? date : null
  }
  return null
}

/** Contracts read the same wherever they're shown, so they're not formatted in the locale of the environment. */
export const contractLocale = 'nl-NL'

export interface FormatOptions {
  locale?: string
  booleanLabels: BooleanLabels
}

export interface CurrencyOptions {
  currency: string
  decimals: boolean
}

export interface BooleanLabels {
  true: string
  false: string
}
