/**
 * URL con que se muestra una foto del catálogo. Antes se pedía a Cloudinary una versión redimensionada al
 * vuelo (f_auto,q_auto,w_N), pero cada variante cuenta como una "transformación" y eso consumió casi la mitad
 * de los créditos del plan gratuito. Las fotos ya son livianas (~30 KB), así que se sirven tal cual hasta
 * migrarlas a un almacenamiento con tamaños pregenerados. `width` se conserva para no tocar a los llamadores.
 */
export function optimizedImageUrl(url: string | null | undefined, _width: number): string | null {
  return url ? url : null
}
