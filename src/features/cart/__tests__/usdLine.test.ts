import { describe, expect, it } from 'vitest'
import { formatUsd } from '../../../components/catalog/Price'
import { estimateUsdLine } from '../lines'

describe('estimateUsdLine', () => {
  it('multiplica cantidad por precio en USD y no mezcla el agrego ni el envase (CUP)', () => {
    expect(estimateUsdLine({ priceUsd: 25, quantity: 2 })).toEqual({ usd: 50, extrasCup: 0 })
    expect(estimateUsdLine({ priceUsd: 25, quantity: 2, addonPrice: 100, packagingPrice: 200 })).toEqual({
      usd: 50,
      extrasCup: 100 * 2 + 200 * 2,
    })
  })

  it('devuelve null si el producto no está en USD', () => {
    expect(estimateUsdLine({ priceUsd: null, quantity: 1 })).toBeNull()
    expect(estimateUsdLine({ priceUsd: undefined, quantity: 1 })).toBeNull()
  })
})

describe('formatUsd', () => {
  it('muestra el monto en USD sin convertir', () => {
    expect(formatUsd(25)).toBe('25 USD')
    expect(formatUsd(4.5)).toMatch(/^4[,.]5 USD$/)
  })
})
