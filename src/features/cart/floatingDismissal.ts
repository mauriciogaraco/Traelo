/** Cuánto hay que arrastrar un aviso flotante para que se quite. */
export const SWIPE_DISMISS_PX = 70

export function shouldDismissSwipe(dx: number): boolean {
  return Math.abs(dx) >= SWIPE_DISMISS_PX
}

/**
 * ¿Se muestra el aviso del carrito? Si la persona lo quitó con N productos, vuelve a aparecer solo
 * cuando agrega más (señal de que está comprando); vaciar el carrito reinicia todo.
 */
export function isCartBarVisible(itemCount: number, dismissedAtCount: number | null): boolean {
  if (itemCount <= 0) return false
  return dismissedAtCount === null || itemCount > dismissedAtCount
}
