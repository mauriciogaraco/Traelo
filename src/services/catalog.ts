import type { Business, Product } from '../types'

const BUSINESS_IDS = ['bodega-central', 'dlm', 'panes-macus', 'mercadito-ahorro', 'la-marina']

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  return res.json() as Promise<T>
}

export function fetchBusinesses(): Promise<Business[]> {
  return fetchJson<Business[]>('/data/businesses.json')
}

export function fetchProducts(businessId: string): Promise<Product[]> {
  return fetchJson<Product[]>(`/data/${businessId}.json`)
}

export async function fetchCatalog(): Promise<{ businesses: Business[]; products: Product[] }> {
  const [businesses, groups] = await Promise.all([
    fetchBusinesses(),
    Promise.all(BUSINESS_IDS.map(fetchProducts)),
  ])
  return { businesses, products: groups.flat() }
}
