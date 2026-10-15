import { defaultCityCode, isKnownCityCode, KNOWN_CITIES } from '../cities'
import { resolveCityFromQuery } from '../resolveCityFromQuery'

describe('isKnownCityCode', () => {
  it('reconoce una ciudad conocida', () => {
    expect(isKnownCityCode('guira-de-melena')).toBe(true)
  })

  it('rechaza un código que no existe', () => {
    expect(isKnownCityCode('san-antonio-de-los-banos')).toBe(false)
  })
})

describe('defaultCityCode', () => {
  it('con una sola ciudad conocida, esa es la default', () => {
    expect(KNOWN_CITIES).toHaveLength(1)
    expect(defaultCityCode()).toBe('guira-de-melena')
  })
})

describe('resolveCityFromQuery', () => {
  it('lee ?ciudad= cuando es una ciudad conocida', () => {
    expect(resolveCityFromQuery(new URLSearchParams('ciudad=guira-de-melena'))).toBe('guira-de-melena')
  })

  it('no distingue mayúsculas ni espacios', () => {
    expect(resolveCityFromQuery(new URLSearchParams('ciudad=%20GUIRA-DE-MELENA%20'))).toBe('guira-de-melena')
  })

  it('ignora un código que no es una ciudad conocida', () => {
    expect(resolveCityFromQuery(new URLSearchParams('ciudad=san-antonio-de-los-banos'))).toBeNull()
  })

  it('null si no viene el parámetro', () => {
    expect(resolveCityFromQuery(new URLSearchParams(''))).toBeNull()
  })
})
