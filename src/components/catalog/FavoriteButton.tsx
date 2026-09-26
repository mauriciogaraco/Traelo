import { Icon } from '../ui/Icon'

/** Corazón de favoritos (`FavoriteButton` de mobile): relleno y en rojo cuando es favorito. */
export function FavoriteButton({
  isFavorite,
  onToggle,
  className = '',
}: {
  isFavorite: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      className={`w-10 h-10 shrink-0 rounded-full bg-surface border border-border shadow-soft flex items-center justify-center transition active:scale-95 ${
        isFavorite ? 'text-danger' : 'text-text-secondary hover:text-text-primary'
      } ${className}`}
    >
      <Icon name="heart" size={22} filled={isFavorite} />
    </button>
  )
}
