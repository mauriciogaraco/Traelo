import type { Category } from '../../types'
import { LazyImage } from './LazyImage'

const categoryGradient: Record<Category, string> = {
  Alimentos: 'from-amber-100 to-orange-50',
  Bebidas: 'from-sky-100 to-cyan-50',
  Aseo: 'from-violet-100 to-fuchsia-50',
  Confituras: 'from-pink-100 to-rose-50',
  Comida: 'from-rose-100 to-orange-50',
  Ropa: 'from-pink-100 to-rose-50',
  Electrónica: 'from-blue-100 to-indigo-50',
}

interface ProductImageProps {
  category: Category
  alt: string
  /** Emoji de respaldo si no hay foto. */
  emoji?: string
  /** Foto real (URL importada). Si existe, se usa con carga diferida. */
  photo?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Cargar la imagen de inmediato (above the fold). */
  eager?: boolean
}

const emojiSize = { sm: 'text-3xl', md: 'text-5xl', lg: 'text-8xl' }

export function ProductImage({
  category,
  alt,
  emoji,
  photo,
  size = 'md',
  className = '',
  eager = false,
}: ProductImageProps) {
  const gradient = categoryGradient[category] ?? 'from-stone-100 to-stone-50'

  if (photo) {
    return (
      <LazyImage
        src={photo}
        alt={alt}
        eager={eager}
        placeholderClassName={gradient}
        className={className}
      />
    )
  }

  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br ${gradient} overflow-hidden ${className}`}
      role="img"
      aria-label={alt}
    >
      <span
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/40 blur-2xl"
        aria-hidden="true"
      />
      <span className={`relative ${emojiSize[size]} drop-shadow-sm`} aria-hidden="true">
        {emoji}
      </span>
    </div>
  )
}
