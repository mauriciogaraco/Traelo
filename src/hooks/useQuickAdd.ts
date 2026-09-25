import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { toLegacyProduct } from '../context/CatalogContext'
import { useToast } from '../context/ToastContext'
import { flyToCart } from '../lib/flyToCart'
import { useCatalogStore } from '../store/catalogStore'
import type { CatalogProduct } from '../types/backend/catalog'

/** ¿Hay que elegir algo antes de agregar? (tipo/sabor): entonces el "+" abre la ficha. */
export function needsChoice(product: CatalogProduct): boolean {
  return (product.options?.length ?? 0) > 0
}

/**
 * "+" de las tarjetas: agrega 1 al carrito sin abrir el detalle, con aviso — como el quick add de
 * mobile (sin empaque). Si el producto tiene tipos/sabores, lleva a la ficha para elegir.
 *
 * TEMPORAL (fase 4): escribe en el carrito actual de la web; al pasar al carrito de mobile solo
 * cambia este hook, no las tarjetas.
 */
export function useQuickAdd(): (product: CatalogProduct, origin?: HTMLElement | null) => void {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()

  return useCallback(
    (product, origin) => {
      if (needsChoice(product)) {
        navigate(`/producto/${product.id}`)
        return
      }
      const business = useCatalogStore.getState().businesses.find((b) => b.id === product.businessId)
      addItem(toLegacyProduct(product, business?.name ?? ''), 1)
      flyToCart(origin ?? null)
      showToast(`Agregado al carrito: ${product.name}`, 'success')
    },
    [addItem, navigate, showToast],
  )
}
