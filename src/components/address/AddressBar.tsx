import { useState } from 'react'
import { useAddressStore } from '../../store/addressStore'
import { Icon } from '../ui/Icon'
import { AddressSheet } from './AddressSheet'

/**
 * Pill de dirección del header — `TopHeader` de mobile: muestra la dirección predeterminada de la
 * libreta de este navegador ("Agregar dirección" si no hay) y abre la hoja para agregarla/editarla.
 * La libreta completa (varias direcciones, predeterminada, borrar) está en `/direcciones`.
 */
export function AddressBar() {
  const defaultAddress = useAddressStore((state) => state.addresses.find((a) => a.isDefault) ?? state.addresses[0] ?? null)
  const [open, setOpen] = useState(false)
  const label = defaultAddress ? defaultAddress.label : 'Agregar dirección'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Dirección de entrega: ${defaultAddress ? `${defaultAddress.label}, ${defaultAddress.address}` : 'agregar'}`}
        className="w-full min-w-0 flex items-center justify-center gap-1 rounded-full bg-background px-3 py-2 hover:bg-surface-muted transition-colors"
      >
        <Icon name="location" size={16} filled className="text-primary shrink-0" />
        <span className="text-caption font-semibold text-text-primary truncate">{label}</span>
        <Icon name="chevron-down" size={14} className="text-text-tertiary shrink-0" />
      </button>
      <AddressSheet open={open} address={defaultAddress} onClose={() => setOpen(false)} />
    </>
  )
}
