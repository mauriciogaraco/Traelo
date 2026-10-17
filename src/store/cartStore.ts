import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartChangeDetail } from '../types/backend/order';
import type { CatalogProduct } from '../types/backend/catalog';
import { findAddon, findPackaging, lineIdOf, type LineSelection } from '../features/cart/lines';
import { DEFAULT_CITY_CODE } from '../features/city/cities';

/** Cantidad máxima por línea (regla del carrito; el servidor también la exige). */
export const MAX_LINE_QUANTITY = 99;

export type CartItem = {
  productId: string;
  businessId: string;
  quantity: number;
  /** Informativos únicamente (checklist §21) — el backend siempre recalcula al hacer checkout. */
  nameSnapshot: string;
  priceSnapshot: number | null;
  imageUrlSnapshot: string | null;
  /** Opcional: ítems persistidos antes de existir el blurhash no lo tienen. */
  imageBlurhashSnapshot?: string | null;
  /** Nombre del envase elegido (uno de CatalogProduct.packaging). null/ausente = sin envase. */
  packagingName?: string | null;
  /** Tipo/sabor elegido (uno de CatalogProduct.options) y agrego elegido (uno de CatalogProduct.addons). */
  optionName?: string | null;
  addonName?: string | null;
  /**
   * Precios y formato tal como estaban al agregar, SOLO para mostrar el estimado de la línea; el total
   * real lo calcula el servidor con el catálogo vigente. Ausentes en carritos de antes de estas reglas.
   */
  addonPriceSnapshot?: number | null;
  packagingPriceSnapshot?: number | null;
  packagingCapacitySnapshot?: number | null;
  formatoSnapshot?: number | null;
};

type CartState = {
  /** Las líneas del carrito de la ciudad ACTIVA (todas las pantallas leen esto; ver switchCity). */
  items: CartItem[];
  /** Ciudad a la que pertenece `items`. Los carritos anteriores a la expansión son de Güira. */
  activeCityCode: string;
  /** Los carritos de las OTRAS ciudades, guardados tal cual hasta que el cliente vuelva a ellas. */
  carts: Record<string, CartItem[]>;
  hasHydrated: boolean;
  /** Último resultado de un 409 CART_CHANGED, para avisar en el carrito qué cambió (checklist §26). */
  checkoutIssues: CartChangeDetail[];

  /**
   * Agrega una línea. La identidad es producto + tipo + agrego + envase (ver lineIdOf): lo mismo suma
   * cantidad; cambiar el tipo, el agrego o el envase es OTRA línea. Sin selección se usa el envase más
   * barato si el producto tiene (los de un solo toque no eligen tipo: ver canQuickAdd).
   */
  addItem: (product: CatalogProduct, quantity?: number, selection?: LineSelection) => void;
  /** Sube/baja/quita UNA línea (por lineIdOf; para una línea simple es el productId). */
  incrementItem: (lineId: string) => void;
  decrementItem: (lineId: string) => void;
  removeItem: (lineId: string) => void;
  /** Quita TODAS las líneas de un producto (p. ej. cuando se agotó). */
  removeProduct: (productId: string) => void;
  /** Quita de una sola vez todos los productos de un negocio (p.ej. al cerrarse o dejar de aceptar pedidos). */
  removeBusinessItems: (businessId: string) => void;
  clearCart: () => void;
  /**
   * El cliente cambió de ciudad: el carrito de la anterior se guarda (no se pierde ni se mezcla) y `items`
   * pasa a ser el de la nueva. Un pedido nunca combina ciudades porque cada carrito es de una sola.
   */
  switchCity: (cityCode: string) => void;
  setCheckoutIssues: (issues: CartChangeDetail[]) => void;
  setHasHydrated: (hydrated: boolean) => void;
};

/**
 * Carrito local persistente (checklist §21) — sobrevive cierre/reinicio de la app.
 * Solo guarda productId/businessId/quantity + snapshots informativos, nunca precios
 * definitivos: eso lo decide el backend en /checkout.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      activeCityCode: DEFAULT_CITY_CODE,
      carts: {},
      hasHydrated: false,
      checkoutIssues: [],

      addItem: (product, quantity = 1, selection) =>
        set((state) => {
          // Un producto agotado no se puede agregar (la interfaz ya no lo ofrece; esto es la red de seguridad).
          if (product.available === false) return state;

          const chosen: LineSelection = selection ?? {
            packagingName: product.packaging && product.packaging.length > 0
              ? [...product.packaging].sort((x, y) => x.price - y.price)[0].name
              : null,
          };
          const packaging = findPackaging(product, chosen.packagingName);
          const addon = findAddon(product, chosen.addonName);
          const line = {
            productId: product.id,
            optionName: chosen.optionName ?? null,
            addonName: addon?.name ?? null,
            packagingName: packaging?.name ?? null,
          };
          const id = lineIdOf(line);

          const existing = state.items.find((i) => lineIdOf(i) === id);
          const items = existing
            ? state.items.map((i) =>
                lineIdOf(i) === id ? { ...i, quantity: Math.min(MAX_LINE_QUANTITY, i.quantity + quantity) } : i,
              )
            : [
                ...state.items,
                {
                  productId: product.id,
                  businessId: product.businessId,
                  quantity: Math.min(MAX_LINE_QUANTITY, quantity),
                  nameSnapshot: product.name,
                  priceSnapshot: product.effectivePrice ?? product.price,
                  imageUrlSnapshot: product.imageUrl,
                  imageBlurhashSnapshot: product.imageBlurhash ?? null,
                  optionName: line.optionName,
                  addonName: line.addonName,
                  packagingName: line.packagingName,
                  addonPriceSnapshot: addon?.price ?? null,
                  packagingPriceSnapshot: packaging?.price ?? null,
                  packagingCapacitySnapshot: packaging?.capacity ?? null,
                  formatoSnapshot: product.formato ?? null,
                },
              ];
          return { items, checkoutIssues: [] };
        }),

      incrementItem: (lineId) =>
        set((state) => ({
          items: state.items.map((i) => (lineIdOf(i) === lineId ? { ...i, quantity: Math.min(MAX_LINE_QUANTITY, i.quantity + 1) } : i)),
          checkoutIssues: [],
        })),

      decrementItem: (lineId) =>
        set((state) => ({
          items: state.items
            .map((i) => (lineIdOf(i) === lineId ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0),
          checkoutIssues: [],
        })),

      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((i) => lineIdOf(i) !== lineId),
          checkoutIssues: [],
        })),

      removeProduct: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
          checkoutIssues: [],
        })),

      removeBusinessItems: (businessId) =>
        set((state) => ({
          items: state.items.filter((i) => i.businessId !== businessId),
          checkoutIssues: state.checkoutIssues.filter((issue) => issue.businessId !== businessId),
        })),

      clearCart: () => set({ items: [], checkoutIssues: [] }),

      switchCity: (cityCode) =>
        set((state) => {
          if (cityCode === state.activeCityCode) return state;
          const { [cityCode]: target = [], ...rest } = state.carts;
          return {
            activeCityCode: cityCode,
            // Guarda el de la ciudad que se deja (vacío no ocupa lugar) y trae el de la nueva.
            carts: state.items.length > 0 ? { ...rest, [state.activeCityCode]: state.items } : rest,
            items: target,
            checkoutIssues: [],
          };
        }),
      setCheckoutIssues: (checkoutIssues) => set({ checkoutIssues }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'traelo.cart.v1',
      storage: createJSONStorage(() => localStorage),
      // `activeCityCode`/`carts` ausentes en un carrito guardado antes de la expansión: toma los valores por
      // defecto (sus `items` son de Güira) sin migración ni pérdida.
      partialize: (state) => ({ items: state.items, activeCityCode: state.activeCityCode, carts: state.carts }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
