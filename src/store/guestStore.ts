import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DeliveryLocation } from '../types/backend/location'
import type { Order } from '../types/backend/order'

/**
 * Datos del invitado, SOLO en este navegador (como `guestStore` de mobile): sirven para no reescribir
 * el formulario en cada compra. Nunca se mandan como "direcciones guardadas" (un invitado no tiene cuenta).
 */
type GuestProfileState = {
  name: string
  phone: string
  address: string
  addressReference: string
  location: DeliveryLocation | null
  setProfile: (profile: {
    name: string
    phone: string
    address: string
    addressReference: string
    location?: DeliveryLocation | null
  }) => void
  clear: () => void
}

export const useGuestProfileStore = create<GuestProfileState>()(
  persist(
    (set) => ({
      name: '',
      phone: '',
      address: '',
      addressReference: '',
      location: null,
      setProfile: (profile) => set({ ...profile, location: profile.location ?? null }),
      clear: () => set({ name: '', phone: '', address: '', addressReference: '', location: null }),
    }),
    { name: 'traelo.guestProfile', storage: createJSONStorage(() => localStorage) },
  ),
)

/** Un pedido hecho sin cuenta: el token (que solo este navegador conoce) permite seguirlo. */
export type GuestOrderRef = {
  orderId: string
  orderNumber: number
  token: string
  createdAt: string
  /** Solo web: número del sorteo que asignó el aviso a Telegram (si hubo). */
  raffleNumber?: number | null
}

/** Cuántos pedidos de invitado se recuerdan. */
export const MAX_GUEST_ORDERS = 8

type GuestOrdersState = {
  orders: GuestOrderRef[]
  add: (ref: GuestOrderRef) => void
  update: (orderId: string, patch: Partial<GuestOrderRef>) => void
  find: (orderId: string) => GuestOrderRef | undefined
}

/**
 * Pedidos de invitado (id + token de acceso). En mobile viven en SecureStore; en la web, en
 * localStorage de este sitio: el token solo abre ESE pedido (verlo y valorarlo), no una cuenta.
 */
export const useGuestOrdersStore = create<GuestOrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      add: (ref) =>
        set((state) => ({
          orders: [ref, ...state.orders.filter((o) => o.orderId !== ref.orderId)].slice(0, MAX_GUEST_ORDERS),
        })),
      update: (orderId, patch) =>
        set((state) => ({ orders: state.orders.map((o) => (o.orderId === orderId ? { ...o, ...patch } : o)) })),
      find: (orderId) => get().orders.find((o) => o.orderId === orderId),
    }),
    { name: 'traelo.guestOrders', storage: createJSONStorage(() => localStorage) },
  ),
)

type OrderState = {
  /** Pedido recién creado, para mostrar la confirmación sin otra petición. Solo en memoria. */
  lastCreatedOrder: Order | null
  setLastCreatedOrder: (order: Order) => void
}

export const useOrderStore = create<OrderState>((set) => ({
  lastCreatedOrder: null,
  setLastCreatedOrder: (order) => set({ lastCreatedOrder: order }),
}))
