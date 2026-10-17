import { useActiveCity } from '../../hooks/useActiveCity'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'

/**
 * "¿Desde dónde quieres hacer tu pedido?" — sale con 2+ localidades cuando no hay una elección válida
 * guardada (primera visita, o la guardada ya no existe): una sola interacción y entra al catálogo de esa
 * localidad. Con una elección guardada no se repite al cerrar o refrescar; se cambia desde el selector
 * del header. No se puede cerrar sin elegir (sin localidad no hay catálogo que mostrar). Los datos salen
 * de la lista de localidades; aquí no se afirma nada que el servidor no diga.
 */
export function CityChooser() {
  const { cities, needsChoice, chooseCity } = useActiveCity()
  if (!needsChoice) return null

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="city-chooser-title" className="fixed inset-0 z-[70] flex items-center justify-center bg-background p-5 overflow-y-auto">
      <div className="w-full max-w-md py-8">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <h1 id="city-chooser-title" className="text-h2 text-text-primary text-center">
          ¿Desde dónde quieres hacer tu pedido?
        </h1>
        <p className="mt-2 text-body text-text-secondary text-center">
          Cada localidad tiene sus propios negocios, productos y condiciones de entrega. Puedes cambiar cuando quieras.
        </p>
        <ul className="mt-6 space-y-3">
          {cities.map((city) => {
            return (
              <li key={city.code}>
                <button
                  type="button"
                  onClick={() => chooseCity(city.code)}
                  className={`w-full flex items-center gap-3 rounded-lg border px-5 py-4 text-left transition-colors hover:border-primary hover:bg-primary-soft border-border bg-surface`}
                >
                  <Icon name="location" size={22} filled className="text-primary shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-h3 text-text-primary">{city.name}</span>
                    {city.acceptingOrders === false && (
                      <span className="block text-caption text-text-secondary">Por ahora no recibe pedidos</span>
                    )}
                  </span>
                  <Icon name="chevron-right" size={18} className="text-text-tertiary" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
