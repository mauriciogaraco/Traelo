import { useState } from 'react'
import { useActiveCity } from '../../hooks/useActiveCity'
import { Icon } from '../ui/Icon'
import { CitySheet } from './CitySheet'

/**
 * "Comprando desde <localidad>" — recuerda, en el carrito y antes de confirmar, desde qué localidad se
 * hace el pedido (no es la dirección de entrega). Solo existe con 2+ localidades. En el checkout va sin
 * botón de cambio: cambiar de localidad a mitad de un pedido cambiaría de carrito.
 */
export function CityNote({ changeable = false }: { changeable?: boolean }) {
  const { city, showSelector } = useActiveCity()
  const [open, setOpen] = useState(false)
  if (!showSelector || !city) return null

  return (
    <div className="flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-caption text-primary-text" data-testid="city-note">
      <Icon name="storefront" size={16} filled className="shrink-0" />
      <span className="flex-1 min-w-0">
        Comprando desde <strong>{city.name}</strong>
      </span>
      {changeable && (
        <>
          <button type="button" onClick={() => setOpen(true)} className="font-semibold underline underline-offset-2">
            Cambiar
          </button>
          <CitySheet open={open} onClose={() => setOpen(false)} />
        </>
      )}
    </div>
  )
}
