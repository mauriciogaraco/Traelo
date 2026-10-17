import { beforeEach, describe, expect, it, vi } from 'vitest'

const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
  clear: () => memory.clear(),
})
vi.mock('../../../config/env', () => ({ env: { apiBaseUrl: 'https://api.test/api/v1', apiKey: 'k' } }))

import { useCitiesStore } from '../../../store/citiesStore'
import { loadStoredCatalog, saveStoredCatalog } from '../../../storage/catalogStorage'
import { cityFromApi, getCities, KNOWN_CITIES, resolveActiveCityCode } from '../cities'

const guira = { id: 'cty_guira_de_melena', code: 'guira-de-melena', name: 'Güira de Melena', acceptingOrders: true }
const sanAntonio = { id: 'cmuq8dolk000c1gceaixsi39e', code: 'san-antonio-de-los-banos', name: 'San Antonio de los Baños', acceptingOrders: false }

beforeEach(() => {
  localStorage.clear()
  useCitiesStore.setState({ cities: [] })
})

describe('cityFromApi', () => {
  it('convierte una localidad del servidor, con su id como apiId', () => {
    expect(cityFromApi(sanAntonio)).toEqual({
      code: 'san-antonio-de-los-banos',
      name: 'San Antonio de los Baños',
      apiId: 'cmuq8dolk000c1gceaixsi39e',
      acceptingOrders: false,
      heroPhotos: false,
    })
    expect(cityFromApi(guira)?.heroPhotos).toBe(true)
  })

  it('descarta lo que no es una localidad válida', () => {
    for (const bad of [null, 'x', {}, { id: 'a', code: 'b' }, { id: '', code: 'b', name: 'c' }, { id: 1, code: 'b', name: 'c' }]) {
      expect(cityFromApi(bad)).toBeNull()
    }
  })

  it('acceptingOrders solo cuenta si es booleano (no se asume)', () => {
    expect(cityFromApi({ ...guira, acceptingOrders: 'yes' })?.acceptingOrders).toBeUndefined()
  })
})

describe('getCities', () => {
  it('sin lista del servidor usa la mínima (solo Güira)', () => {
    expect(getCities()).toBe(KNOWN_CITIES)
  })

  it('con la lista del servidor, esa manda', () => {
    useCitiesStore.setState({ cities: [cityFromApi(guira)!, cityFromApi(sanAntonio)!] })
    expect(getCities().map((c) => c.code)).toEqual(['guira-de-melena', 'san-antonio-de-los-banos'])
    expect(resolveActiveCityCode('san-antonio-de-los-banos')).toBe('guira-de-melena') // la lista mínima no la conoce
    expect(resolveActiveCityCode('san-antonio-de-los-banos', getCities())).toBe('san-antonio-de-los-banos')
  })
})

describe('caché del catálogo vs. filtro de servidor', () => {
  const catalog = { version: 5, categories: [], businesses: [], products: [], lastSyncedAt: '2026-10-17T00:00:00.000Z' }

  it('una caché global (sin filtro) no sirve cuando la ciudad ya se pide filtrada', () => {
    saveStoredCatalog(catalog, 'guira-de-melena') // como la de antes del filtro: scoped ausente
    expect(loadStoredCatalog('guira-de-melena', false)).not.toBeNull()
    expect(loadStoredCatalog('guira-de-melena', true)).toBeNull()
  })

  it('una caché filtrada sí sirve', () => {
    saveStoredCatalog({ ...catalog, scoped: true }, 'guira-de-melena')
    expect(loadStoredCatalog('guira-de-melena', true)).not.toBeNull()
  })
})
