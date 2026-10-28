import { describe, expect, it } from 'vitest'
import { ContractTerms } from '../terms'

describe('ContractTerms', () => {

  describe('formatRate', () => {

    it('formats the amount with its interval', () => {
      expect(ContractTerms.formatRate({rate_interval: 'day', rate_amount: 450, conditions: []}))
        .toEqual('€ 450,00 per dag excl. BTW')
    })

    it('leaves out the interval of a fixed amount', () => {
      expect(ContractTerms.formatRate({rate_interval: 'fixed', rate_amount: 2000, conditions: []}))
        .toEqual('€ 2.000,00 excl. BTW')
    })

  })

})
