import { useActiveCity } from '../../hooks/useActiveCity'

/**
 * Para "no encontrado" en un enlace directo: con 2+ localidades, el negocio o producto puede ser de
 * otra. Esta pantalla NO adivina cuál (el servidor todavía no dice de qué localidad es un negocio que
 * no está en el catálogo activo): lo explica y deja cambiar de localidad SIN salir del enlace — al
 * cambiar se carga el catálogo de esa localidad y la misma dirección se vuelve a resolver sola.
 * Con una sola localidad no aparece.
 */
export function OtherCityHint() {
  const { cities, city, showSelector, chooseCity } = useActiveCity()
  if (!showSelector || !city) return null
  const others = cities.filter((c) => c.code !== city.code)

  return (
    <div className="mt-4 rounded-lg bg-primary-soft p-4 text-left" data-testid="other-city-hint">
      <p className="text-body text-text-primary">
        Estás viendo <strong>{city.name}</strong>. Si este enlace es de otra localidad, cámbiala y lo abrimos
        ahí mismo.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {others.map((other) => (
          <button
            key={other.code}
            type="button"
            onClick={() => chooseCity(other.code)}
            className="min-h-10 rounded-full border border-primary px-4 text-sm font-semibold text-primary-text hover:bg-primary/5"
          >
            Ver en {other.name}
          </button>
        ))}
      </div>
    </div>
  )
}
