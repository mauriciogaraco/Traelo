import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type PromoState = {
  /** Código de promoción con el que llegó la persona (`?promo=` del enlace). null = sin promoción. */
  code: string | null
  /** Localidad del enlace (`?ciudad=`), si la traía: el código solo se manda al comprar en esa localidad. */
  cityCode: string | null
  setPromo: (code: string, cityCode: string | null) => void
  clear: () => void
}

/**
 * Código de la promoción "primera mensajería gratis". Es solo lo que viajó en el enlace: no prueba nada.
 * El servidor decide al cotizar y al crear el pedido si aplica (ciudad, cupos, primer pedido).
 */
export const usePromoStore = create<PromoState>()(
  persist(
    (set) => ({
      code: null,
      cityCode: null,
      setPromo: (code, cityCode) => set({ code, cityCode }),
      clear: () => set({ code: null, cityCode: null }),
    }),
    {
      name: 'traelo.promo.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ code: state.code, cityCode: state.cityCode }),
    },
  ),
)
