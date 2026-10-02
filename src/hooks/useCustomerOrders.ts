import { useCallback, useEffect, useState } from 'react'
import { listCustomerOrders } from '../api/customerOrders'
import type { Order } from '../types/backend/order'

const PAGE_SIZE = 20

/**
 * Historial de pedidos de la cuenta, paginado (como `AccountScreen` de mobile). Con `enabled` en
 * false (sin sesión) no pide nada y la lista queda vacía.
 */
export function useCustomerOrders(enabled: boolean) {
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const result = await listCustomerOrders(1, PAGE_SIZE)
      setOrders(result.data)
      setPage(1)
      setHasMore(result.meta.page < result.meta.totalPages)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const next = page + 1
      const result = await listCustomerOrders(next, PAGE_SIZE)
      setOrders((prev) => [...prev, ...result.data])
      setPage(next)
      setHasMore(result.meta.page < result.meta.totalPages)
    } catch {
      setError(true)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, page])

  useEffect(() => {
    if (enabled) void load()
    else setOrders([])
  }, [enabled, load])

  return { orders, loading, loadingMore, hasMore, error, reload: load, loadMore }
}
