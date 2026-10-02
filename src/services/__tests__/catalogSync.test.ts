import { getCatalogBusinesses, getCatalogVersion } from '../../api/catalog'
import { useCatalogStore } from '../../store/catalogStore'
import { makeBusiness } from '../../testing/fixtures'
import { syncCatalog } from '../catalogSync'

vi.mock('../../api/catalog')
vi.mock('../../storage/catalogStorage', () => ({ loadStoredCatalog: () => null, saveStoredCatalog: vi.fn() }))

const version = vi.mocked(getCatalogVersion)
const businesses = vi.mocked(getCatalogBusinesses)

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('navigator', { onLine: true })
})

describe('syncCatalog — estado abierto/cerrado', () => {
  it('con la misma versión igual refresca los negocios: isOpenNow cambia con la hora, no con la versión', async () => {
    useCatalogStore.getState().setCatalog({
      version: 7,
      categories: [],
      products: [],
      businesses: [makeBusiness({ id: 'b1', isOpenNow: false })],
      lastSyncedAt: '2026-10-02T05:00:00.000Z',
    })
    version.mockResolvedValueOnce({ version: 7 })
    businesses.mockResolvedValueOnce([makeBusiness({ id: 'b1', isOpenNow: true })])

    await syncCatalog()

    expect(businesses).toHaveBeenCalledTimes(1)
    expect(useCatalogStore.getState().businesses[0].isOpenNow).toBe(true)
    expect(useCatalogStore.getState().version).toBe(7)
  })
})
