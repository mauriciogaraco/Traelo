import { useState } from 'react'
import { useActiveCity } from '../../hooks/useActiveCity'
import { Icon } from '../ui/Icon'
import { CitySheet } from './CitySheet'

/**
 * Pill con la localidad activa del header — un control APARTE de `AddressBar` (la localidad es dónde se
 * compra; la dirección, dónde se entrega). Solo existe cuando hay 2+ localidades: con una sola no hay
 * nada que elegir y no ocupa lugar. `className` decide dónde/cómo se muestra (en teléfono va en su
 * propia fila con el nombre completo; en escritorio, en línea con el resto del header).
 */
export function CityPill({ className = 'flex' }: { className?: string }) {
  const { city, showSelector } = useActiveCity()
  const [open, setOpen] = useState(false)
  if (!showSelector || !city) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Comprando desde ${city.name}. Cambiar localidad`}
        className={`${className} items-center justify-center gap-1.5 rounded-full bg-primary-soft px-3 py-2 text-primary-text hover:brightness-95 transition`}
      >
        <Icon name="storefront" size={16} filled className="shrink-0" />
        <span className="text-caption font-semibold truncate">{city.name}</span>
        <Icon name="chevron-down" size={14} className="shrink-0" />
      </button>
      <CitySheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
