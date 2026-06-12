import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Business, Product } from '../types'
import { fetchCatalog } from '../services/catalog'
import { _setBusinessCache } from '../data/catalog'

interface CatalogState {
  businesses: Business[]
  products: Product[]
  loading: boolean
}

const CatalogContext = createContext<CatalogState>({
  businesses: [],
  products: [],
  loading: true,
})

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>({
    businesses: [],
    products: [],
    loading: true,
  })

  useEffect(() => {
    fetchCatalog()
      .then(({ businesses, products }) => {
        _setBusinessCache(businesses)
        setState({ businesses, products, loading: false })
      })
      .catch(() => {
        setState({ businesses: [], products: [], loading: false })
      })
  }, [])

  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  return useContext(CatalogContext)
}
