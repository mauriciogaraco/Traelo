/**
 * ¿Se puede dibujar el mapa en este navegador? MapLibre necesita WebGL. Cuando es false el
 * seguimiento sigue funcionando: solo se ve el texto (nunca se bloquea el pedido por el mapa).
 */
export function isMapAvailable(): boolean {
  try {
    if (typeof document === 'undefined') return false
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}
