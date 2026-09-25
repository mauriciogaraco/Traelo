import { useState } from 'react'
import { optimizedImageUrl } from '../../lib/images'
import { useThemePreference } from '../../lib/theme'
import { placeholderBackground, type CategoryVisual } from '../../features/catalog'

const TINTS = ['#FFEDD5', '#FEF3C7', '#FFE4E6', '#FDE68A', '#FED7AA', '#FECACA']

function tintFor(label: string): string {
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) % TINTS.length
  return TINTS[hash]!
}

interface CatalogImageProps {
  uri: string | null | undefined
  /** Ancho aproximado en que se muestra (px CSS): se pide la foto a ese tamaño. */
  width: number
  className?: string
  /** Negocio/producto: si no hay foto, se muestra su inicial sobre un fondo cálido. */
  label?: string
  /** Producto sin foto: emoji y color de SU categoría. Tiene prioridad sobre `label`. */
  visual?: CategoryVisual
  alt?: string
  /** Cargar de inmediato (imágenes visibles al abrir, como el encabezado de un negocio). */
  eager?: boolean
}

/**
 * Imagen del catálogo — `CatalogImage` de mobile: sin foto, un recuadro inmediato (inicial del
 * negocio o el emoji y color de la categoría del producto) en vez de un cuadro gris. Con foto, se
 * baja diferida (`loading="lazy"`) y redimensionada, con el mismo fondo mientras carga.
 */
export function CatalogImage({ uri, width, className = '', label, visual, alt = '', eager = false }: CatalogImageProps) {
  const { resolved } = useThemePreference()
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const src = failed ? null : optimizedImageUrl(uri, width)

  const background = visual
    ? placeholderBackground(visual.accent, resolved)
    : tintFor(label || alt || 'traelo')

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background }}>
      {(!src || !loaded) && (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center select-none">
          {visual ? (
            <span className="leading-none drop-shadow-sm" style={{ fontSize: Math.max(18, Math.min(44, width * 0.28)) }}>
              {visual.emoji}
            </span>
          ) : label ? (
            <span className="text-h1 font-bold text-[#9A3412]">{label.trim().charAt(0).toUpperCase()}</span>
          ) : null}
        </div>
      )}
      {src && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`relative w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
