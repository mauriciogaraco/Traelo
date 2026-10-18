import { useToast } from '../../context/ToastContext'
import { cityShareUrl } from '../../features/city'
import { useActiveCity } from '../../hooks/useActiveCity'
import { SITE_URL } from '../../lib/config'
import { Icon } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'

/**
 * Cambiar de localidad desde el header. Se explica qué pasa con el carrito para que nadie crea que
 * pierde lo que armó: cada localidad guarda el suyo.
 */
export function CitySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cities, cityCode, chooseCity } = useActiveCity()
  const { showToast } = useToast()
  const activeCity = cities.find((city) => city.code === cityCode)

  async function copyCityLink() {
    if (!activeCity) return
    const url = cityShareUrl(SITE_URL, activeCity.code)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('sin portapapeles')
      await navigator.clipboard.writeText(url)
      showToast(`Enlace de ${activeCity.name} copiado`, 'success')
    } catch {
      showToast('No se pudo copiar. Mantén pulsado el enlace para copiarlo.', 'error')
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="¿Desde dónde quieres pedir?">
      <p className="text-caption text-text-secondary mb-3">
        Cada localidad tiene sus propios negocios, productos y condiciones. Elige dónde quieres comprar.
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
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-text-primary">{city.name}</span>
                  {city.acceptingOrders === false && (
                    <span className="block text-caption text-text-secondary">Por ahora no recibe pedidos</span>
                  )}
                </span>
                {active && <span className="text-caption font-semibold text-primary-text">Actual</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-caption text-text-tertiary">
        Si ya agregaste productos, cada localidad guarda su propio carrito: lo encuentras al volver a ella.
      </p>
      {activeCity && (
        <button
          type="button"
          onClick={copyCityLink}
          className="mt-3 w-full rounded-lg border border-border px-4 py-3 text-left text-body-sm font-semibold text-primary-text hover:bg-surface-muted"
        >
          Copiar enlace de {activeCity.name}
          <span className="block text-caption font-normal text-text-secondary">
            Quien lo abra verá solo los negocios de esa localidad.
          </span>
        </button>
      )}
    </Sheet>
  )
}
