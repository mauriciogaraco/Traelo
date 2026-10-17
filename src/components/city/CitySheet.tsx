import { useActiveCity } from '../../hooks/useActiveCity'
import { Icon } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'

/**
 * Cambiar de localidad desde el header. Se explica qué pasa con el carrito para que nadie crea que
 * pierde lo que armó: cada localidad guarda el suyo.
 */
export function CitySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cities, cityCode, chooseCity } = useActiveCity()

  return (
    <Sheet open={open} onClose={onClose} title="¿Desde dónde quieres pedir?">
      <p className="text-caption text-text-secondary mb-3">
        Cada localidad tiene sus propios negocios, productos y condiciones. Elige dónde quieres comprar: no
        importa dónde estés tú, puedes pedir para tu familia en Cuba.
      </p>
      <ul className="space-y-2" role="radiogroup" aria-label="Localidad">
        {cities.map((city) => {
          const active = city.code === cityCode
          return (
            <li key={city.code}>
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  chooseCity(city.code)
                  onClose()
                }}
                className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                  active ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:bg-surface-muted'
                }`}
              >
                <Icon name="location" size={20} filled={active} className={active ? 'text-primary' : 'text-text-tertiary'} />
                <span className="flex-1 font-semibold text-text-primary">{city.name}</span>
                {active && <span className="text-caption font-semibold text-primary-text">Actual</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-caption text-text-tertiary">
        Si ya agregaste productos, cada localidad guarda su propio carrito: lo encuentras al volver a ella.
      </p>
    </Sheet>
  )
}
