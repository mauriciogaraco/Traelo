/**
 * App de Android (APK) que se ofrece desde la web. El archivo vive en `public/assets/` y lo sirve
 * Vercel como estático. Para publicar una versión nueva basta reemplazar el archivo (mismo nombre);
 * el tamaño se lee del propio archivo al mostrar el flyer (HEAD), este valor es solo el respaldo.
 */
export const APP_DOWNLOAD = {
  url: '/assets/Traelo-Market.apk',
  /** Nombre con el que se guarda en el teléfono. */
  fileName: 'Traelo-Market.apk',
  mimeType: 'application/vnd.android.package-archive',
  /** Tamaño aproximado (bytes) si no se pudo leer del servidor. */
  fallbackSizeBytes: 30_568_459,
} as const
