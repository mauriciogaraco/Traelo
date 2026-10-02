/**
 * Las fotos del catálogo viven en Cloudinary en tamaño original. Para no gastar datos (conexión
 * limitada) se pide una versión redimensionada al ancho en que se muestra, en el mejor formato que
 * acepte el navegador (webp/avif). Otras URLs se devuelven tal cual.
 */
export function optimizedImageUrl(url: string | null | undefined, width: number): string | null {
  if (!url) return null
  const marker = '/image/upload/'
  const index = url.indexOf(marker)
  if (!url.includes('res.cloudinary.com') || index === -1) return url
  const dpr = typeof window !== 'undefined' && window.devicePixelRatio > 1 ? 2 : 1
  const transform = `f_auto,q_auto,c_limit,w_${Math.round(width * dpr)}/`
  return url.slice(0, index + marker.length) + transform + url.slice(index + marker.length)
}
