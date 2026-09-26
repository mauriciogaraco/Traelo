import { listCustomerAddresses } from '../api/customerAddresses'
import { useAddressStore } from '../store/addressStore'
import type { DeliveryLocation } from '../types/backend/location'

const normalize = (text: string | null | undefined) => (text ?? '').trim().replace(/\s+/g, ' ').toLowerCase()

/** ¿Ya hay una dirección igual (mismo texto y referencia) en la libreta? */
function findDuplicate(address: string, reference: string | null) {
  return useAddressStore
    .getState()
    .addresses.find((a) => normalize(a.address) === normalize(address) && normalize(a.reference) === normalize(reference))
}

/**
 * Recuerda en el navegador la dirección con la que se acaba de pedir — `rememberDeliveryAddress` de
 * mobile: sin cuenta ni configuración; no duplica; la primera se llama "Casa" y las demás
 * "Dirección 2", "Dirección 3"…
 */
export function rememberDeliveryAddress(input: {
  address: string
  reference?: string | null
  location?: DeliveryLocation | null
}): void {
  const address = input.address.trim()
  if (address.length < 3) return
  const reference = input.reference?.trim() || null
  const existing = findDuplicate(address, reference)
  if (existing) {
    if (input.location) useAddressStore.getState().update(existing.id, { location: input.location })
    return
  }
  const { addresses, add } = useAddressStore.getState()
  add({
    label: addresses.length === 0 ? 'Casa' : `Dirección ${addresses.length + 1}`,
    address,
    reference,
    location: input.location ?? null,
  })
}

/**
 * Las direcciones que una cuenta ya tenía en el servidor (de antes de que vivieran en el navegador)
 * se copian UNA vez a la libreta local, sin duplicar. Es de mejor esfuerzo: si falla (sin red), se
 * reintenta en la próxima sesión y nada se pierde ni bloquea.
 */
export async function importAccountAddresses(): Promise<void> {
  if (useAddressStore.getState().importedFromAccount) return
  try {
    const remote = await listCustomerAddresses()
    for (const item of remote) {
      if (findDuplicate(item.address, item.reference)) continue
      const created = useAddressStore.getState().add({
        label: item.label,
        address: item.address,
        reference: item.reference,
        location: item.location,
      })
      if (item.isDefault) useAddressStore.getState().setDefault(created.id)
    }
    useAddressStore.getState().markImported()
  } catch {
    // Se reintenta la próxima vez.
  }
}
