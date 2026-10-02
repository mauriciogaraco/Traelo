import { listCustomerAddresses } from '../../api/customerAddresses'
import { useAddressStore } from '../../store/addressStore'
import type { CustomerAddress } from '../../types/backend/customer'
import { importAccountAddresses, rememberDeliveryAddress } from '../addressBookService'

vi.mock('../../api/customerAddresses')

const listMock = vi.mocked(listCustomerAddresses)

const remote = (over: Partial<CustomerAddress>): CustomerAddress =>
  ({
    id: 'r1',
    label: 'Trabajo',
    address: 'Calle 23 #10',
    reference: null,
    isDefault: false,
    location: null,
    createdAt: '',
    updatedAt: '',
    ...over,
  }) as CustomerAddress

beforeEach(() => {
  vi.clearAllMocks()
  useAddressStore.setState({ addresses: [], loaded: true, importedFromAccount: false })
})

describe('rememberDeliveryAddress', () => {
  it('la primera se llama "Casa", las siguientes "Dirección N", y no duplica', () => {
    rememberDeliveryAddress({ address: 'Calle 1 #2' })
    rememberDeliveryAddress({ address: 'Calle 9 #4' })
    rememberDeliveryAddress({ address: '  calle 1   #2 ' })
    const list = useAddressStore.getState().addresses
    expect(list.map((a) => a.label)).toEqual(['Casa', 'Dirección 2'])
    expect(list[0].isDefault).toBe(true)
  })

  it('ignora direcciones demasiado cortas', () => {
    rememberDeliveryAddress({ address: 'ab' })
    expect(useAddressStore.getState().addresses).toEqual([])
  })
})

describe('importAccountAddresses (una sola vez, sin duplicar)', () => {
  it('copia las de la cuenta, respeta la predeterminada y se marca como hecho', async () => {
    rememberDeliveryAddress({ address: 'Calle 1 #2' })
    listMock.mockResolvedValueOnce([
      remote({ id: 'r1', label: 'Trabajo', address: 'Calle 23 #10', isDefault: true }),
      remote({ id: 'r2', label: 'Casa', address: 'Calle 1 #2' }), // ya existe: se omite
    ])

    await importAccountAddresses()

    const state = useAddressStore.getState()
    expect(state.addresses.map((a) => a.address)).toEqual(['Calle 1 #2', 'Calle 23 #10'])
    expect(state.addresses.find((a) => a.isDefault)?.address).toBe('Calle 23 #10')
    expect(state.importedFromAccount).toBe(true)
  })

  it('ya importadas: no vuelve a pedir nada', async () => {
    useAddressStore.setState({ importedFromAccount: true })
    await importAccountAddresses()
    expect(listMock).not.toHaveBeenCalled()
  })

  it('sin red: no rompe y se reintenta la próxima vez', async () => {
    listMock.mockRejectedValueOnce(new Error('red'))
    await expect(importAccountAddresses()).resolves.toBeUndefined()
    expect(useAddressStore.getState().importedFromAccount).toBe(false)
  })
})
