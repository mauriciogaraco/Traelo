import { isPromoErrorCode, parsePromoParam, promoCodeToSend, promoHomeHref } from '../promo'

describe('parsePromoParam', () => {
  it('lee ?promo= y lo pasa a mayúsculas', () => {
    expect(parsePromoParam(new URLSearchParams('promo=primera-gratis-sa'))).toBe('PRIMERA-GRATIS-SA')
  })
  it('sin parámetro o con forma rara se ignora', () => {
    expect(parsePromoParam(new URLSearchParams(''))).toBeNull()
    expect(parsePromoParam(new URLSearchParams('promo=ab'))).toBeNull()
    expect(parsePromoParam(new URLSearchParams('promo=%3Cscript%3E'))).toBeNull()
    expect(parsePromoParam(new URLSearchParams('promo=' + 'A'.repeat(41)))).toBeNull()
  })
})

describe('promoCodeToSend', () => {
  it('sin código no manda nada', () => expect(promoCodeToSend({ code: null, cityCode: null }, 'x')).toBeUndefined())
  it('manda el código si la localidad coincide o el enlace no traía localidad', () => {
    expect(promoCodeToSend({ code: 'ABC', cityCode: 'sa' }, 'sa')).toBe('ABC')
    expect(promoCodeToSend({ code: 'ABC', cityCode: null }, 'guira')).toBe('ABC')
  })
  it('no lo manda si se compra en otra localidad', () => {
    expect(promoCodeToSend({ code: 'ABC', cityCode: 'sa' }, 'guira')).toBeUndefined()
  })
})

describe('promoHomeHref', () => {
  it('lleva al Home de la localidad con el código en el enlace', () => {
    expect(promoHomeHref({ cityCode: 'san-antonio-de-los-banos', code: 'PRIMERA-GRATIS-SA' })).toBe(
      '/?ciudad=san-antonio-de-los-banos&promo=PRIMERA-GRATIS-SA',
    )
  })
})

describe('isPromoErrorCode', () => {
  it('reconoce los códigos PROMO_*', () => {
    expect(isPromoErrorCode('PROMO_EXHAUSTED')).toBe(true)
    expect(isPromoErrorCode('MIXED_CITY_BUSINESSES')).toBe(false)
  })
})
