import { ELSEWHERE_CODE, type CityOption } from '../../features/city'
import type { DeviceLocationState } from '../../hooks/useDeviceLocation'
import { Icon } from '../ui/Icon'

/** Lo que el servidor calculó para la entrega elegida (nunca un precio escrito en el cliente). */
export type DeliveryPreview = {
  /** 'idle' = misma localidad; 'loading' = calculando; 'ready' = hay precio; 'unavailable' = no se puede entregar así. */
  state: 'idle' | 'loading' | 'ready' | 'unavailable'
  fee: number | null
  message: string | null
  /** Solo "otra ubicación": km medidos desde el centro del pueblo y CUP por km. */
  distanceKm: number | null
  ratePerKm: number | null
}

/**
 * "¿En qué localidad entregamos?" — con 2+ localidades, la persona dice DÓNDE recibe el pedido (puede
 * comprar en una y recibir en otra). Tres caminos: la misma localidad de los negocios (mensajería normal),
 * otra localidad configurada (mensajería fija entre localidades) u "Otra ubicación" (comparte su ubicación y
 * la mensajería se cobra por kilómetro desde el centro del pueblo). Los montos los calcula el servidor.
 */
export function DeliveryCityPicker({
  cities,
  value,
  buyingCityName,
  onChange,
  preview,
  locationState,
  onRequestLocation,
}: {
  cities: readonly CityOption[]
  value: string | null
  /** Localidad de los negocios (la del catálogo): se nombra en los avisos. */
  buyingCityName: string
  onChange: (cityCode: string) => void
  preview: DeliveryPreview
  /** Estado del permiso de ubicación (solo importa con "Otra ubicación"). */
  locationState: DeviceLocationState
  onRequestLocation: () => void
}) {
  const selected = cities.find((city) => city.code === value)
  const elsewhere = value === ELSEWHERE_CODE
  const options = [
    ...cities.map((city) => ({ code: city.code, name: city.name })),
    { code: ELSEWHERE_CODE, name: 'Otra ubicación' },
  ]

  return (
    <fieldset className="space-y-2" data-testid="delivery-city-picker">
      <legend className="text-h3 text-text-primary">¿En qué localidad entregamos?</legend>
      <div role="radiogroup" aria-label="Localidad de entrega" className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const active = option.code === value
          return (
            <button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.code)}
              className={`flex items-center gap-2 rounded-r-md bg-surface p-3 text-left transition ${
                active ? 'border-2 border-primary' : 'border border-border hover:border-primary/40'
              }`}
            >
              <Icon name="location" size={18} filled={active} className={active ? 'text-primary' : 'text-text-tertiary'} />
              <span className="text-[15px] font-semibold text-text-primary">{option.name}</span>
            </button>
          )
        })}
      </div>

      {elsewhere && (
        <div className="space-y-2 rounded-r-md bg-surface border border-border p-3" data-testid="elsewhere-panel">
          <p className="text-body-sm text-text-secondary">
            Activa tu ubicación y calculamos la mensajería por kilómetro desde el centro de {buyingCityName}.
          </p>
          {locationState === 'idle' && (
            <button
              type="button"
              onClick={onRequestLocation}
              className="min-h-11 rounded-r-md border border-primary px-4 text-body-sm font-semibold text-primary-text hover:bg-primary/5"
            >
              Usar mi ubicación
            </button>
          )}
          {locationState === 'loading' && (
            <p className="text-caption text-text-secondary" aria-live="polite">
              Buscando tu ubicación…
            </p>
          )}
          {(locationState === 'denied' || locationState === 'error') && (
            <div role="alert" className="space-y-2">
              <p className="text-body-sm text-danger-text">
                {locationState === 'denied'
                  ? 'No pudimos usar tu ubicación. Permítela en los ajustes del navegador para continuar, o elige una localidad.'
                  : 'Tu navegador no pudo darnos la ubicación. Elige una localidad.'}
              </p>
              <button
                type="button"
                onClick={onRequestLocation}
                className="min-h-11 rounded-r-md border border-primary px-4 text-body-sm font-semibold text-primary-text hover:bg-primary/5"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      )}

      {preview.state === 'loading' && (
        <p className="text-caption text-text-secondary" aria-live="polite">
          Calculando la mensajería…
        </p>
      )}
      {preview.state === 'ready' && preview.fee !== null && !elsewhere && selected && (
        <p role="status" className="rounded-r-md bg-primary-soft p-3 text-body-sm text-primary-text">
          Entregamos en <strong>{selected.name}</strong>. Como tus negocios son de {buyingCityName}, la mensajería entre localidades es{' '}
          <strong>{preview.fee.toLocaleString('es')} CUP</strong> (precio fijo).
        </p>
      )}
      {preview.state === 'ready' && preview.fee !== null && elsewhere && (
        <p role="status" className="rounded-r-md bg-primary-soft p-3 text-body-sm text-primary-text">
          Estás a <strong>{(preview.distanceKm ?? 0).toLocaleString('es')} km</strong> del centro de {buyingCityName}
          {preview.ratePerKm !== null && <> ({preview.ratePerKm.toLocaleString('es')} CUP por km)</>}: la mensajería es{' '}
          <strong>{preview.fee.toLocaleString('es')} CUP</strong>.
        </p>
      )}
      {preview.state === 'unavailable' && (
        <p role="alert" className="rounded-r-md bg-danger-soft p-3 text-body-sm text-danger-text">
          {preview.message ?? `Por ahora no hacemos entregas desde ${buyingCityName} hasta ahí.`}
        </p>
      )}
    </fieldset>
  )
}
