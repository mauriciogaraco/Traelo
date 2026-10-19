/** Lo mínimo que hace falta de una dirección guardada para decidir cuál está elegida. */
type AddressRef = { id: string; isDefault?: boolean }

/**
 * La dirección guardada que de verdad está elegida. El id que guarda la pantalla se fija UNA vez al abrirla (o
 * viene de un borrador viejo) y puede dejar de existir si la libreta cambió mientras tanto (se borró la dirección,
 * se importó la de la cuenta...). En ese caso, en vez de quedarse sin ninguna elegida —con "Continuar" apagado y sin
 * decir por qué— se toma la predeterminada, o la primera. Sin direcciones guardadas, null.
 */
export function effectiveSavedAddressId(addresses: readonly AddressRef[], selectedId: string | null): string | null {
  if (selectedId !== null && addresses.some((address) => address.id === selectedId)) return selectedId
  return (addresses.find((address) => address.isDefault) ?? addresses[0])?.id ?? null
}

/** Clases del botón que cambia entre "dirección guardada" y "escribir otra": visible, no un enlace diminuto. */
export const SWITCH_ADDRESS_MODE_CLASS =
  'flex min-h-11 w-full items-center justify-center rounded-r-md border border-primary px-4 text-body-sm font-semibold text-primary-text hover:bg-primary/5'
