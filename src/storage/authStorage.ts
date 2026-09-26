/**
 * Almacén de la sesión. En la app móvil son los tokens en SecureStore; el navegador no tiene un
 * almacén más seguro que `localStorage`, así que ahí van (el mismo origen, sin cookies, y el
 * refresh token rota en cada renovación). Si el almacenamiento no está disponible (modo privado
 * estricto, cuota llena) la sesión vive solo en memoria mientras la pestaña esté abierta.
 *
 * Mantiene la forma asíncrona de SecureStore para que `authService` sea idéntico al de mobile.
 */
const memory = new Map<string, string>()

function backing(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export const authStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = backing()?.getItem(key)
      if (value !== undefined && value !== null) return value
    } catch {
      /* cae a la memoria */
    }
    return memory.get(key) ?? null
  },

  async setItem(key: string, value: string): Promise<void> {
    memory.set(key, value)
    try {
      backing()?.setItem(key, value)
    } catch {
      /* solo memoria */
    }
  },

  async removeItem(key: string): Promise<void> {
    memory.delete(key)
    try {
      backing()?.removeItem(key)
    } catch {
      /* nada que borrar */
    }
  },
}
