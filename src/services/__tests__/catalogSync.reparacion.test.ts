import {
  getCatalogBootstrap,
  getCatalogBusinesses,
  getCatalogBusinessProducts,
  getCatalogCategories,
  getCatalogChanges,
  getCatalogVersion,
} from '../../api/catalog'
import { useCatalogStore } from '../../store/catalogStore'
import type { CatalogBusiness, CatalogChange, CatalogProduct } from '../../types/backend/catalog'
import { businessIdsWithoutProducts, changesPageProgress, syncCatalog } from '../catalogSync'

vi.mock('../../api/catalog')
vi.mock('../../storage/catalogStorage', () => ({ loadStoredCatalog: () => null, saveStoredCatalog: vi.fn() }))

const mockVersion = vi.mocked(getCatalogVersion)
const mockChanges = vi.mocked(getCatalogChanges)
const mockBootstrap = vi.mocked(getCatalogBootstrap)
const mockBusinesses = vi.mocked(getCatalogBusinesses)
const mockCategories = vi.mocked(getCatalogCategories)
const mockBusinessProducts = vi.mocked(getCatalogBusinessProducts)

const business = (id: string) => ({ id, name: id, phone: '', address: '', acceptingOrders: true }) as CatalogBusiness
const product = (id: string, businessId: string) => ({ id, businessId, name: id, price: 100 }) as CatalogProduct
const change = (version: number, entityType: CatalogChange['entityType'], entityId: string) =>
  ({ version, entityType, entityId, changeType: 'UPSERT', createdAt: '' }) as CatalogChange
const range = (from: number, to: number, entityId: string) =>
  Array.from({ length: to - from + 1 }, (_, i) => change(from + i, 'PRODUCT', entityId))

function seedStore(version: number, businesses: CatalogBusiness[], products: CatalogProduct[]) {
  useCatalogStore.getState().setCatalog({
    version,
    categories: [],
    businesses,
    products,
    lastSyncedAt: new Date().toISOString(),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('navigator', { onLine: true })
  mockCategories.mockResolvedValue([])
  // Cada sincronización vuelve a pedir los negocios (isOpenNow depende de la hora): por defecto, los mismos.
  mockBusinesses.mockImplementation(async () => useCatalogStore.getState().businesses)
  useCatalogStore.setState({ version: 0, businesses: [], products: [], categories: [], syncError: null, isOffline: false })
})

describe('changesPageProgress', () => {
  it('página que cabe entera: avanza a la versión global', () => {
    const result = { changes: range(101, 150, 'p1'), latestVersion: 150 }
    expect(changesPageProgress(result, 200)).toEqual({ reachedVersion: 150, hasMore: false })
  })

  it('el servidor avisa que hay más: avanza solo hasta el último cambio recibido', () => {
    const result = { changes: range(101, 300, 'p1'), latestVersion: 300, hasMore: true }
    expect(changesPageProgress(result, 200)).toEqual({ reachedVersion: 300, hasMore: true })
  })

  it('backend anterior (sin hasMore): página llena y versión global por delante = corte', () => {
    const result = { changes: range(101, 300, 'p1'), latestVersion: 7798 }
    expect(changesPageProgress(result, 200)).toEqual({ reachedVersion: 300, hasMore: true })
  })

  it('página llena que justo llega a la versión global: no hay más', () => {
    const result = { changes: range(101, 300, 'p1'), latestVersion: 300 }
    expect(changesPageProgress(result, 200)).toEqual({ reachedVersion: 300, hasMore: false })
  })

  it('sin cambios: no avanza más allá de lo que dice el servidor', () => {
    expect(changesPageProgress({ changes: [], latestVersion: 90 }, 200)).toEqual({ reachedVersion: 90, hasMore: false })
  })
})

describe('businessIdsWithoutProducts', () => {
  it('devuelve los negocios que no tienen ningún producto en la caché', () => {
    expect(businessIdsWithoutProducts([business('b1'), business('b2')], [product('p1', 'b1')])).toEqual(['b2'])
  })
})

describe('syncCatalog: más cambios que una página', () => {
  it('sigue pidiendo desde donde se quedó hasta llegar a la versión final (backend anterior)', async () => {
    seedStore(100, [business('bPag1')], [product('p1', 'bPag1')])
    mockVersion.mockResolvedValue({ version: 700 })
    mockChanges
      .mockResolvedValueOnce({ changes: range(101, 300, 'p1'), latestVersion: 700 })
      .mockResolvedValueOnce({ changes: range(301, 310, 'p1'), latestVersion: 700 })
    mockBusinessProducts.mockResolvedValue([product('p1', 'bPag1')])

    await syncCatalog()

    expect(mockChanges.mock.calls.map(([since]) => since)).toEqual([100, 300])
    expect(useCatalogStore.getState().version).toBe(700)
  })

  it('con hasMore del servidor nuevo, también continúa', async () => {
    seedStore(100, [business('bPag2')], [product('p1', 'bPag2')])
    mockVersion.mockResolvedValue({ version: 500 })
    mockChanges
      .mockResolvedValueOnce({ changes: range(101, 300, 'p1'), latestVersion: 300, hasMore: true })
      .mockResolvedValueOnce({ changes: range(301, 500, 'p1'), latestVersion: 500, hasMore: false })
    mockBusinessProducts.mockResolvedValue([product('p1', 'bPag2')])

    await syncCatalog()

    expect(mockChanges.mock.calls.map(([since]) => since)).toEqual([100, 300])
    expect(useCatalogStore.getState().version).toBe(500)
  })

  it('si una página trae un producto que no conoce, baja todo y termina sin seguir paginando', async () => {
    seedStore(100, [business('bPag3')], [])
    mockVersion.mockResolvedValue({ version: 900 })
    mockChanges.mockResolvedValueOnce({ changes: range(101, 300, 'pNuevo'), latestVersion: 900 })
    mockBootstrap.mockResolvedValue({
      version: 900,
      categories: [],
      businesses: [business('bPag3')],
      products: [product('pNuevo', 'bPag3')],
    } as never)

    await syncCatalog()

    expect(mockChanges).toHaveBeenCalledTimes(1)
    expect(useCatalogStore.getState().version).toBe(900)
    expect(useCatalogStore.getState().products.map((p) => p.id)).toEqual(['pNuevo'])
  })
})

describe('syncCatalog: negocios sin productos en la caché', () => {
  it('con la caché "al día" baja los productos de un negocio que quedó sin ellos', async () => {
    seedStore(50, [business('bRep1'), business('bConProductos')], [product('p1', 'bConProductos')])
    mockVersion.mockResolvedValue({ version: 50 })
    mockBusinessProducts.mockResolvedValue([product('pa', 'bRep1'), product('pb', 'bRep1')])

    await syncCatalog()

    expect(mockBusinessProducts).toHaveBeenCalledWith('bRep1')
    expect(useCatalogStore.getState().products.filter((p) => p.businessId === 'bRep1')).toHaveLength(2)
    expect(useCatalogStore.getState().products.some((p) => p.id === 'p1')).toBe(true)
    expect(useCatalogStore.getState().version).toBe(50)
  })

  it('un negocio que se vuelve visible (cambio de negocio sin cambios de productos) recibe sus productos', async () => {
    seedStore(60, [business('bRep2')], [product('p1', 'bRep2')])
    mockVersion.mockResolvedValue({ version: 61 })
    mockChanges.mockResolvedValueOnce({ changes: [change(61, 'BUSINESS', 'bOculto')], latestVersion: 61 })
    mockBusinesses.mockResolvedValue([business('bRep2'), business('bOculto')])
    mockBusinessProducts.mockResolvedValue([product('pOculto', 'bOculto')])

    await syncCatalog()

    expect(useCatalogStore.getState().businesses.map((b) => b.id)).toEqual(['bRep2', 'bOculto'])
    expect(useCatalogStore.getState().products.map((p) => p.id).sort()).toEqual(['p1', 'pOculto'])
  })

  it('un negocio realmente vacío se consulta una sola vez por sesión', async () => {
    seedStore(70, [business('bVacio')], [])
    mockVersion.mockResolvedValue({ version: 70 })
    mockBusinessProducts.mockResolvedValue([])

    await syncCatalog()
    await syncCatalog()

    expect(mockBusinessProducts).toHaveBeenCalledTimes(1)
  })

  it('si la consulta falla no muestra error y se reintenta en la siguiente sincronización', async () => {
    seedStore(80, [business('bFalla')], [])
    mockVersion.mockResolvedValue({ version: 80 })
    mockBusinessProducts.mockRejectedValueOnce(new Error('sin red')).mockResolvedValueOnce([product('p1', 'bFalla')])

    await syncCatalog()
    expect(useCatalogStore.getState().syncError).toBeNull()
    expect(useCatalogStore.getState().products).toHaveLength(0)

    await syncCatalog()
    expect(useCatalogStore.getState().products.map((p) => p.id)).toEqual(['p1'])
  })
})
