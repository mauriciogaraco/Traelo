import type { ToastType } from '../context/ToastContext'
import type { FavoriteToggleResult } from '../services/favoritesService'

/** Aviso (texto + tipo) para el resultado de tocar el corazón; mismos textos que mobile. */
export function favoriteToast(result: FavoriteToggleResult, what: string): { message: string; type: ToastType } {
  if (result === 'added') return { message: `Guardado en favoritos: ${what}`, type: 'success' }
  if (result === 'removed') return { message: `Quitado de favoritos: ${what}`, type: 'info' }
  return { message: 'No pudimos actualizar tus favoritos. Inténtalo de nuevo en un momento.', type: 'error' }
}
