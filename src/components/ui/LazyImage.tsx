import { useState } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  /** Clases del contenedor (tamaño, bordes redondeados, etc.). */
  className?: string
  /** Gradiente Tailwind del placeholder mientras carga (ej: "from-amber-100 to-orange-50"). */
  placeholderClassName?: string
  /** Cargar de inmediato (para imágenes "above the fold" como el detalle). */
  eager?: boolean
}

/**
 * Imagen con carga diferida y transición suave:
 * - `loading="lazy"` nativo: no descarga hasta acercarse al viewport.
 * - Placeholder con gradiente + pulso mientras carga.
 * - La imagen aparece con un desenfoque que se aclara (efecto blur-up) y fade-in.
 */
export function LazyImage({
  src,
  alt,
  className = '',
  placeholderClassName = 'from-stone-200 to-stone-100',
  eager = false,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-br ${placeholderClassName} transition-opacity duration-700 ${
          loaded ? 'opacity-0' : 'opacity-100 animate-pulse'
        }`}
      />
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`relative z-[1] w-full h-full object-cover transition duration-700 ease-out ${
          loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'
        }`}
      />
    </div>
  )
}
