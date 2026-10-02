import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type InboxNotification = {
  id: string
  title: string
  body: string
  receivedAt: number
  read: boolean
  data: Record<string, unknown>
}

const MAX_ITEMS = 50

type NotificationsState = {
  items: InboxNotification[]
  add: (notification: Omit<InboxNotification, 'read'>) => void
  markAllRead: () => void
  clear: () => void
}

/**
 * Buzón local de Web Push (`notificationsStore` de mobile, adaptado): el backend no guarda
 * historial de estos avisos, así que solo aparecen los que este navegador recibió (con la
 * pestaña abierta o aún visibles en el sistema).
 */
export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      items: [],
      add: (notification) =>
        set((state) => {
          if (state.items.some((n) => n.id === notification.id)) return state
          const items = [{ ...notification, read: false }, ...state.items]
            .sort((a, b) => b.receivedAt - a.receivedAt)
            .slice(0, MAX_ITEMS)
          return { items }
        }),
      markAllRead: () => set((state) => ({ items: state.items.map((n) => ({ ...n, read: true })) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'traelo.notifications.v1', storage: createJSONStorage(() => localStorage) },
  ),
)

export const selectUnreadCount = (state: NotificationsState) => state.items.filter((n) => !n.read).length
