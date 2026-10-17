import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CatalogBootstrap } from '../../types/backend/catalog'

const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
})
vi.stubGlobal('navigator', { onLine: true })

vi.mock('../../config/env', () => ({ env: { apiBaseUrl: 'https://api.test/api/v1', apiKey: 'k' } }))
// Dos ciudades de PRUEBA con id de servidor; la lista real de la web no se toca.
vi.mock('../../features/city/cities', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../features/city/cities')>()
  const cities = [
    { code: 'guira-de-melena', name: 'Güira de Melena' },
    { code: 'san-antonio-de-los-banos', name: 'San Antonio', apiId: 'cmtest0000000000000000001' },
  ]
  return { ...original, getCities: () => cities }
})
vi.mock('../../api/catalog', () => ({
  getCatalogBootstrap: vi.fn(),
  getCatalogBusinesses: vi.fn(),
  getCatalogBusinessProducts: vi.fn(),
  getCatalogCategories: vi.fn(),
  getCatalogChanges: vi.fn(),
  getCatalogVersion: vi.fn(),
}))

const api = await import('../../api/catalog')
const { useCatalogStore } = await import('../../store/catalogStore')
const { switchCatalogCity, syncCatalog } = await import('../catalogSync')
const { catalogStorageKey } = await import('../../storage/catalogStorage')

const bootstrap = (name: string, version = 5): CatalogBootstrap =>
  ({
    version,
    categories: [],
    businesses: [{ id: `b-${name}`, name }],
    products: [{ id: `p-${name}`, businessId: `b-${name}`, name }],
  }) as unknown as CatalogBootstrap

const deferred = <T,>() => {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

beforeEach(() => {
  memory.clear()
  vi.clearAllMocks()
  useCatalogStore.setState({ cityCode: 'guira-de-melena', version: 0, categories: [], businesses: [], products: [], lastSyncedAt: null, hydrated: false, isSyncing: false, isOffline: false, syncError: null })
})

describe('caché por ciudad', () => {
  it('Güira conserva la clave de siempre y las demás llevan su código', () => {
    expect(catalogStorageKey('guira-de-melena')).toBe('traelo.catalog.v1')
    expect(catalogStorageKey('san-antonio-de-los-banos')).toBe('traelo.catalog.v1.san-antonio-de-los-banos')
  })
})

describe('catálogo por ciudad', () => {
  it('pide el catálogo con el cityId de la ciudad solo si la ciudad lo tiene', async () => {
    vi.mocked(api.getCatalogBootstrap).mockResolvedValue(bootstrap('guira'))
    await syncCatalog()
    expect(api.getCatalogBootstrap).toHaveBeenLastCalledWith({}) // Güira: sin filtro (ver INFORME §I)

    vi.mocked(api.getCatalogBootstrap).mockResolvedValue(bootstrap('sa'))
    switchCatalogCity('san-antonio-de-los-banos')
    await syncCatalog()
    expect(api.getCatalogBootstrap).toHaveBeenLastCalledWith({ cityId: 'cmtest0000000000000000001' })
  })

  it('al cambiar de ciudad lo de la anterior desaparece al instante (sin datos obsoletos)', async () => {
    vi.mocked(api.getCatalogBootstrap).mockResolvedValue(bootstrap('guira'))
    await syncCatalog()
    expect(useCatalogStore.getState().businesses[0].name).toBe('guira')

    const pending = deferred<CatalogBootstrap>() // la nueva aún no llega
    vi.mocked(api.getCatalogBootstrap).mockReturnValue(pending.promise)
    switchCatalogCity('san-antonio-de-los-banos')

    expect(useCatalogStore.getState().cityCode).toBe('san-antonio-de-los-banos')
    expect(useCatalogStore.getState().businesses).toEqual([])
    expect(useCatalogStore.getState().products).toEqual([])
    pending.resolve(bootstrap('sa'))
    await syncCatalog()
  })

  it('una respuesta de la ciudad anterior que llega tarde NO se pinta ni se guarda como actual', async () => {
    const late = deferred<CatalogBootstrap>()
    vi.mocked(api.getCatalogBootstrap).mockReturnValueOnce(late.promise)
    const first = syncCatalog() // sincroniza Güira…

    vi.mocked(api.getCatalogBootstrap).mockResolvedValueOnce(bootstrap('sa'))
    switchCatalogCity('san-antonio-de-los-banos') // …y el cliente cambia antes de que llegue
    late.resolve(bootstrap('guira')) // llega la de Güira, ya obsoleta
    await first
    await syncCatalog()

    expect(useCatalogStore.getState().businesses.map((b) => b.name)).toEqual(['sa'])
    // La caché de Güira no recibió nada de San Antonio, ni al revés.
    expect(memory.get('traelo.catalog.v1')).toBeUndefined()
    expect(JSON.parse(memory.get('traelo.catalog.v1.san-antonio-de-los-banos')!).businesses[0].name).toBe('sa')
  })

  it('volver a una ciudad pinta su caché guardada de inmediato', async () => {
    vi.mocked(api.getCatalogBootstrap).mockResolvedValue(bootstrap('guira'))
    await syncCatalog()
    vi.mocked(api.getCatalogBootstrap).mockResolvedValue(bootstrap('sa'))
    switchCatalogCity('san-antonio-de-los-banos')
    await syncCatalog()

    const pending = deferred<CatalogBootstrap>()
    vi.mocked(api.getCatalogBootstrap).mockReturnValue(pending.promise)
    switchCatalogCity('guira-de-melena')

    expect(useCatalogStore.getState().businesses[0].name).toBe('guira') // de la caché, sin esperar a la red
    pending.resolve(bootstrap('guira'))
    await syncCatalog()
  })
})
