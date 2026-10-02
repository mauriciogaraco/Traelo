import type { CatalogCategory, CatalogProduct } from '../../types/backend/catalog'

/**
 * Cómo se ve un producto SIN foto: el ícono y el color de SU categoría, para que una pizza, una
 * medicina y un martillo no se vean iguales — misma regla que `categoryVisual.ts` de la app móvil.
 * No depende del `icon` que traiga el backend: se decide por el `slug` y, si es una categoría nueva,
 * por palabras de su nombre. En la web el ícono es un emoji (sin descargar una librería de íconos).
 */
export type CategoryVisual = {
  emoji: string
  /** Color de acento de la categoría (hex #RRGGBB). */
  accent: string
}

export const GENERIC_CATEGORY_VISUAL: CategoryVisual = { emoji: '🛍️', accent: '#F97316' }

/** Las categorías definitivas (mismos slugs y acentos que mobile). */
const BY_SLUG: Record<string, CategoryVisual> = {
  electrodomesticos: { emoji: '🔌', accent: '#6366F1' },
  'aseo-y-limpieza': { emoji: '🧼', accent: '#0891B2' },
  asados: { emoji: '🔥', accent: '#DC2626' },
  bebidas: { emoji: '🥤', accent: '#0284C7' },
  'comida-criolla': { emoji: '🍲', accent: '#EA580C' },
  'compra-mayorista': { emoji: '📦', accent: '#A16207' },
  confituras: { emoji: '🍬', accent: '#E11D48' },
  carnicos: { emoji: '🥩', accent: '#B91C1C' },
  dulces: { emoji: '🧁', accent: '#C026D3' },
  farmacia: { emoji: '💊', accent: '#059669' },
  ferreteria: { emoji: '🛠️', accent: '#475569' },
  helados: { emoji: '🍦', accent: '#DB2777' },
  mercado: { emoji: '🧺', accent: '#16A34A' },
  panes: { emoji: '🥖', accent: '#D97706' },
  'pizzas-y-mas': { emoji: '🍕', accent: '#EF4444' },
  'productos-del-agro': { emoji: '🌽', accent: '#65A30D' },
  'ropa-y-accesorios': { emoji: '👕', accent: '#7C3AED' },
}

/** Categorías nuevas o con otro slug: se reconocen por una palabra de su nombre (sin tildes). */
const KEYWORDS: [RegExp, string][] = [
  [/electro|electric|tecnolog|celular/, 'electrodomesticos'],
  [/aseo|limpie|higiene/, 'aseo-y-limpieza'],
  [/asad|parrill|barbac/, 'asados'],
  [/bebid|refresc|jugo|cerveza|malta|vino|ron\b/, 'bebidas'],
  [/criolla|casera|comida/, 'comida-criolla'],
  [/mayor/, 'compra-mayorista'],
  [/confit|galleta|snack/, 'confituras'],
  [/carnic|carne|pollo|cerdo|embutid|pescad/, 'carnicos'],
  [/dulce|postre|cake|pastel|torta/, 'dulces'],
  [/farmac|medic|salud/, 'farmacia'],
  [/ferret|herramient|construc/, 'ferreteria'],
  [/helad/, 'helados'],
  [/mercad|super|bodega|viveres/, 'mercado'],
  [/\bpan(es)?\b|panader|paner/, 'panes'],
  [/pizza/, 'pizzas-y-mas'],
  [/agro|vegetal|fruta|viand|hortaliz/, 'productos-del-agro'],
  [/ropa|calzado|accesor|vestir/, 'ropa-y-accesorios'],
]

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Ícono y color de una categoría (por slug; si no, por su nombre; si no, el genérico). */
export function visualForCategory(
  category: { slug?: string | null; name?: string | null } | null | undefined,
): CategoryVisual {
  if (!category) return GENERIC_CATEGORY_VISUAL
  const slug = category.slug ? normalize(category.slug) : ''
  const bySlug = BY_SLUG[slug]
  if (bySlug) return bySlug
  const name = normalize(`${category.name ?? ''} ${slug.replace(/-/g, ' ')}`)
  if (!name) return GENERIC_CATEGORY_VISUAL
  for (const [pattern, key] of KEYWORDS) {
    if (pattern.test(name)) return BY_SLUG[key] as CategoryVisual
  }
  return GENERIC_CATEGORY_VISUAL
}

/** Visual de un producto sin foto: la de su categoría en el catálogo o la que se deduce de su nombre. */
export function visualForProduct(
  product: Pick<CatalogProduct, 'categoryId'> & Partial<Pick<CatalogProduct, 'categoryName' | 'category'>>,
  categories: CatalogCategory[],
): CategoryVisual {
  const category = product.categoryId ? categories.find((c) => c.id === product.categoryId) : undefined
  if (category) return visualForCategory(category)
  return visualForCategory({ name: product.categoryName ?? product.category ?? null })
}

/** Mezcla dos colores #RRGGBB: `t` = 0 devuelve `a`, 1 devuelve `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const [ar, ag, ab] = parse(a) as [number, number, number]
  const [br, bg, bb] = parse(b) as [number, number, number]
  const channel = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `#${[channel(ar, br), channel(ag, bg), channel(ab, bb)].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** Fondo del recuadro según el acento y el tema — mismos tintes que `placeholderTints` de mobile. */
export function placeholderBackground(accent: string, scheme: 'light' | 'dark'): string {
  const base = scheme === 'dark' ? '#1A1410' : '#FFFFFF'
  const from = mixHex(accent, base, scheme === 'dark' ? 0.84 : 0.9)
  const to = mixHex(accent, base, scheme === 'dark' ? 0.7 : 0.74)
  return `linear-gradient(135deg, ${from}, ${to})`
}
