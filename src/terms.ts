import { z } from 'zod'
import { contractLocale, formatCurrency } from './evaluation/values'

/**
 * The rate and conditions of a contractor (a "voorwaardenpakket"). Amounts are in euros, excluding BTW.
 */
export const contractTerms = z.object({
  rate_interval: rateInterval(),
  rate_amount:   z.number().nonnegative(),
  conditions:    z.array(z.string().min(1).max(2048)).default([]),
})

export function rateInterval() {
  return z.enum(['hour', 'half-day', 'day', 'week', 'fixed'])
}

export type ContractTerms = z.output<typeof contractTerms>
export type RateInterval = z.output<ReturnType<typeof rateInterval>>

export namespace ContractTerms {

  export function formatRate(terms: ContractTerms, locale: string = contractLocale) {
    const amount = formatCurrency(terms.rate_amount, rateCurrency, locale)
    if (terms.rate_interval === 'fixed') {
      return `${amount} excl. BTW`
    } else {
      return `${amount} ${rateIntervalLabels[terms.rate_interval]} excl. BTW`
    }
  }

}

export const rateCurrency = {currency: 'EUR', decimals: true}

// Contracts are in Dutch, like their formatting.
export const rateIntervalLabels: Record<RateInterval, string> = {
  'hour':     'per uur',
  'half-day': 'per halve dag',
  'day':      'per dag',
  'week':     'per week',
  'fixed':    'vast bedrag',
}
