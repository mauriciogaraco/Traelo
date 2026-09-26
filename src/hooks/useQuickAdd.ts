import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { canQuickAdd } from '../features/cart'
import { isSoldOut } from '../features/catalog'
import { flyToCart } from '../lib/flyToCart'
import { useCartStore } from '../store/cartStore'
import type { CatalogProduct } from '../types/backend/catalog'

/**
 * "+" de las tarjetas: agrega 1 al carrito sin abrir el detalle — como el quick add de mobile (con el
 * envase más barato preseleccionado). Si el producto exige elegir tipo/sabor, lleva a la ficha.
 */
export function useQuickAdd(): (product: CatalogProduct, origin?: HTMLElement | null) => void {
  const addItem = useCartStore((state) => state.addItem)
  const { showToast } = useToast()
  const navigate = useNavigate()

  return useCallback(
    (product, origin) => {
      if (isSoldOut(product)) return
      if (!canQuickAdd(product)) {
        navigate(`/producto/${product.id}`)
        return
      }
      addItem(product, 1)
      flyToCart(origin ?? null)
      showToast(`Agregado al carrito: ${product.name}`, 'success')
    },
    [addItem, navigate, showToast],
  )
}
