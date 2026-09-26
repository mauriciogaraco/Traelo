import { useEffect } from 'react'
import { importAccountAddresses } from '../services/addressBookService'
import { useAddressStore } from '../store/addressStore'
import { useAuth } from './useAuth'

/**
 * Libreta de direcciones de este NAVEGADOR (persistida en local): la usa cualquiera, con o sin
 * cuenta. Si la persona inicia sesión y su cuenta tenía direcciones en el servidor, se copian una vez.
 */
export function useAddresses() {
  const { isAuthenticated } = useAuth()
  const addresses = useAddressStore((state) => state.addresses)
  const loaded = useAddressStore((state) => state.loaded)
  const importedFromAccount = useAddressStore((state) => state.importedFromAccount)

  useEffect(() => {
    if (isAuthenticated && loaded && !importedFromAccount) void importAccountAddresses()
  }, [isAuthenticated, loaded, importedFromAccount])

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null
  return { isAuthenticated, addresses, defaultAddress, loaded }
}
