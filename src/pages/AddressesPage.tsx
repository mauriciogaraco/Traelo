import { useState } from 'react'
import { AddressSheet } from '../components/address/AddressSheet'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useToast } from '../context/ToastContext'
import { useAddresses } from '../hooks/useAddresses'
import { useAddressStore } from '../store/addressStore'
import type { SavedAddress } from '../types/backend/customer'

/**
 * Direcciones guardadas EN ESTE NAVEGADOR (`AddressesScreen` de mobile): no hace falta cuenta ni
 * internet. Al pedir se elige una con un toque; también se recuerda sola la última con la que se pidió.
 * El pin de ubicación de mobile no está en la web (no hay mapa): la dirección escrita es lo que viaja.
 */
export function AddressesPage() {
  const { addresses } = useAddresses()
  const removeAddress = useAddressStore((state) => state.remove)
  const setDefaultAddress = useAddressStore((state) => state.setDefault)
  const { showToast } = useToast()
  // undefined = hoja cerrada, null = agregar una nueva, objeto = editar esa.
  const [editing, setEditing] = useState<SavedAddress | null | undefined>(undefined)

  return (
    <div className="px-4 lg:px-0 pt-6 pb-10 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-h1 text-text-primary">Direcciones</h1>
        {addresses.length > 1 && (
          <p className="mt-1 text-caption text-text-secondary" data-testid="default-address-hint">
            Elige el círculo de tu dirección predeterminada.
          </p>
        )}
      </div>

      {addresses.length === 0 ? (
        <p className="text-caption text-text-secondary">Todavía no tienes direcciones guardadas.</p>
      ) : (
        <ul role="radiogroup" aria-label="Dirección predeterminada" className="space-y-3">
          {addresses.map((item) => (
            <li
              key={item.id}
              className={`rounded-r-lg bg-surface p-4 space-y-2 border-[1.5px] ${
                item.isDefault ? 'border-primary' : 'border-transparent shadow-card'
              }`}
            >
              <button
                type="button"
                role="radio"
                aria-checked={item.isDefault}
                aria-label={`${item.label}, dirección predeterminada`}
                data-testid={`address-default-${item.id}`}
                onClick={() => {
                  if (item.isDefault) return
                  setDefaultAddress(item.id)
                  showToast('Dirección predeterminada', 'success')
                }}
                className="w-full flex items-center gap-3 text-left"
              >
                <span
                  aria-hidden="true"
                  className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    item.isDefault ? 'border-primary' : 'border-border'
                  }`}
                >
                  {item.isDefault && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </span>
                <span className="flex-1 min-w-0 truncate font-semibold text-text-primary">{item.label}</span>
                {item.isDefault && <StatusBadge label="Predeterminada" tone="success" />}
              </button>
              <p className="text-body text-text-primary">{item.address}</p>
              {item.reference && <p className="text-caption text-text-secondary">{item.reference}</p>}
              <div className="flex gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="text-caption font-semibold text-primary-text"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeAddress(item.id)
                    showToast('Dirección eliminada', 'info')
                  }}
                  className="text-caption font-semibold text-danger-text"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button variant="outline" fullWidth onClick={() => setEditing(null)}>
        Agregar dirección
      </Button>

      <AddressSheet open={editing !== undefined} address={editing ?? null} onClose={() => setEditing(undefined)} />
    </div>
  )
}
