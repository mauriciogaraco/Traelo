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

// Dos ciudades de PRUEBA, inyectadas: la lista real de la web sigue teniendo solo Güira.
import {
  cityQueryParams,
  DEFAULT_CITY_CODE,
  findCity,
  needsCityChoice,
  resolveActiveCityCode,
  shouldShowCitySelector,
  type CityOption,
} from '../cities'

const GUIRA: CityOption = { code: 'guira-de-melena', name: 'Güira de Melena' }
const SAN_ANTONIO: CityOption = { code: 'san-antonio-de-los-banos', name: 'San Antonio de los Baños', apiId: 'cmtest0000000000000000001' }
const TWO = [GUIRA, SAN_ANTONIO]

describe('con una sola ciudad la web se comporta como siempre', () => {
  it('sin selector y sin pregunta', () => {
    expect(shouldShowCitySelector([GUIRA])).toBe(false)
    expect(needsCityChoice(null, [GUIRA])).toBe(false)
    expect(needsCityChoice('guira-de-melena', [GUIRA], false)).toBe(false) // con una sola no hay qué elegir
    expect(resolveActiveCityCode(null, [GUIRA])).toBe(DEFAULT_CITY_CODE)
  })
})

describe('con dos ciudades', () => {
  it('muestra el selector', () => {
    expect(shouldShowCitySelector(TWO)).toBe(true)
  })

  it('primera visita: hay que preguntar, no se adivina', () => {
    expect(resolveActiveCityCode(null, TWO)).toBeNull()
    expect(needsCityChoice(null, TWO)).toBe(true)
  })

  it('una visita nueva SIEMPRE pregunta, aunque haya una elección guardada (queda como preselección)', () => {
    expect(resolveActiveCityCode('san-antonio-de-los-banos', TWO)).toBe('san-antonio-de-los-banos')
    expect(needsCityChoice('san-antonio-de-los-banos', TWO, false)).toBe(true)
    expect(needsCityChoice('san-antonio-de-los-banos', TWO)).toBe(true)
  })

  it('una vez elegida en ESTA visita no se repite al navegar', () => {
    expect(needsCityChoice('san-antonio-de-los-banos', TWO, true)).toBe(false)
  })

  it('aunque se dé por confirmada, sin una ciudad válida hay que preguntar', () => {
    expect(needsCityChoice(null, TWO, true)).toBe(true)
    expect(needsCityChoice('pinar-del-rio', TWO, true)).toBe(true)
  })

  it('una ciudad guardada que ya no existe (o un valor manipulado) obliga a elegir de nuevo', () => {
    expect(resolveActiveCityCode('pinar-del-rio', TWO)).toBeNull()
    expect(needsCityChoice('pinar-del-rio', TWO)).toBe(true)
    expect(needsCityChoice('<script>', TWO)).toBe(true)
  })

  it('?ciudad= solo acepta ciudades de la lista', () => {
    expect(resolveCityFromQuery(new URLSearchParams('ciudad=san-antonio-de-los-banos'), TWO)).toBe('san-antonio-de-los-banos')
    expect(resolveCityFromQuery(new URLSearchParams('ciudad=otra'), TWO)).toBeNull()
  })

  it('findCity devuelve la ciudad o null', () => {
    expect(findCity('san-antonio-de-los-banos', TWO)?.name).toBe('San Antonio de los Baños')
    expect(findCity('x', TWO)).toBeNull()
    expect(findCity(null, TWO)).toBeNull()
  })
})

describe('cityQueryParams (filtro de catálogo en el servidor)', () => {
  it('manda cityId solo si la ciudad conoce su id de servidor', () => {
    expect(cityQueryParams(SAN_ANTONIO)).toEqual({ cityId: 'cmtest0000000000000000001' })
    expect(cityQueryParams(GUIRA)).toEqual({})
    expect(cityQueryParams(null)).toEqual({})
  })
})

import { onlyProductsOfBusinesses } from '../catalogScope'

describe('onlyProductsOfBusinesses (destacados globales → solo los de la ciudad activa)', () => {
  const businesses = [{ id: 'b-guira' }] as never
  const products = [
    { id: 'p1', businessId: 'b-guira' },
    { id: 'p2', businessId: 'b-san-antonio' },
  ] as never

  it('deja solo los productos de negocios del catálogo activo', () => {
    expect(onlyProductsOfBusinesses(products, businesses).map((p) => p.id)).toEqual(['p1'])
  })

  it('con el catálogo todavía vacío (cambiando de ciudad) no muestra nada', () => {
    expect(onlyProductsOfBusinesses(products, [])).toEqual([])
  })
})
