import { useSyncExternalStore } from 'react'

/**
 * Tema claro/oscuro — mismo modelo que `themeStore` de la app móvil (Claro / Oscuro / Automático).
 * Se aplica con `data-theme` en <html>; los colores salen de las variables de src/index.css.
 * index.html repite la lectura inicial en un script inline para no pintar un frame con el tema
 * equivocado. El selector (Claro/Oscuro/Automático) vive en "Mi cuenta".
 */
export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'traelo.themePreference'
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system'

const listeners = new Set<() => void>()
const darkQuery =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    // Almacenamiento bloqueado: se usa el valor por defecto.
  }
  return DEFAULT_THEME_PREFERENCE
}

let preference: ThemePreference = typeof window === 'undefined' ? DEFAULT_THEME_PREFERENCE : readPreference()

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return darkQuery?.matches ? 'dark' : 'light'
  return pref
}

function apply(): void {
  const resolved = resolveTheme(preference)
  document.documentElement.dataset.theme = resolved
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#181310' : '#F97316')
}

function emit(): void {
  apply()
  listeners.forEach((listener) => listener())
}

darkQuery?.addEventListener('change', () => {
  if (preference === 'system') emit()
})

export function setThemePreference(next: ThemePreference): void {
  preference = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Sin persistencia: el cambio vale solo para esta visita.
  }
  emit()
}

export function initTheme(): void {
  apply()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useThemePreference(): {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (next: ThemePreference) => void
} {
  const current = useSyncExternalStore(subscribe, () => preference)
  return { preference: current, resolved: resolveTheme(current), setPreference: setThemePreference }
}
