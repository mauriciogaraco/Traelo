// @ts-nocheck
import type { Business, Category, Packaging, Product, StockStatus } from '../../types'
import DLM from '../../assets/images/business/DLM.jpg'
import menuData from './products.json'

/** Envase obligatorio para la comida del restaurante (no aplica a bebidas). */
const TERMOPACK: Packaging[] = [{ name: 'Termopack', price: 200 }]

const ID = 'dlm'
const NAME = 'Bar Restaurante DLM'

export const dlm: Business = {
  id: ID,
  name: NAME,
  description: 'Sabores de la casa, bebidas, picaderas y platos fuertes para compartir.',
  image: DLM,
  color: 'from-rose-100 to-orange-50',
  schedule: { days: [3, 4, 5, 6, 0], open: '13:00', close: '22:00', label: 'Mié–Dom · 1:00 pm – 10:00 pm' },
}

// ── Mapeo del JSON de la carta al formato de la app ──

interface MenuJson {
  restaurant: { name: string; subtitle?: string; description?: string; service?: string }
  categories: {
    title: string
    subtitle?: string
    products: { name: string; price: string; available: boolean }[]
  }[]
}

const menu = menuData as MenuJson

/** Secciones que NO se incluyen: cócteles, agregos, líneas (espirituosos) y café. */
const EXCLUDED = new Set(['Coctelería', 'Agregos', 'Líneas', 'Café'])

/** Secciones de bebida (el resto se considera Comida). */
const DRINK_SECTIONS = new Set(['Bebidas', 'Café', 'Líneas', 'Botellas en Ofertas'])

/** Emoji por sección (no hay fotos en el JSON). */
const SECTION_EMOJI: Record<string, string> = {
  Entrantes: '🍤',
  Fríos: '🥗',
  Cocteles: '🦐',
  Guarniciones: '🍚',
  Agregos: '➕',
  'Pastas & arroz': '🍝',
  Pollo: '🍗',
  Cerdo: '🥩',
  Res: '🥩',
  Mar: '🦞',
  Postres: '🍮',
  Bebidas: '🥤',
  Café: '☕',
  Líneas: '🥃',
  'Botellas en Ofertas': '🍾',
}

/** "$1350" → 1350, "$120 USD" → 120, "Con agregos" → null. */
function parsePrice(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) : null
}

function buildProducts(): Product[] {
  const out: Product[] = []
  let n = 0
  for (const cat of menu.categories) {
    if (EXCLUDED.has(cat.title)) continue
    const category: Category = DRINK_SECTIONS.has(cat.title) ? 'Bebidas' : 'Comida'
    const image = SECTION_EMOJI[cat.title] ?? '🍽️'
    for (const p of cat.products) {
      const price = parsePrice(p.price)
      if (price === null) continue // ignora precios no numéricos (ej: "Con agregos")
      n += 1
      const status: StockStatus = p.available ? 'disponible' : 'agotado'

      const baseName = p.name.trim()
      // Las fajitas se diferencian por carne (sección Pollo/Cerdo) en el nombre.
      const isFajita = /fajita/i.test(baseName) && (cat.title === 'Pollo' || cat.title === 'Cerdo')
      const name = isFajita ? `${baseName} (${cat.title})` : baseName
      // El refresco de lata se sirve en varios sabores.
      const options =
        baseName.toLowerCase() === 'refresco de lata' ? ['Naranja', 'Limón', 'Cola'] : undefined

      out.push({
        id: `dlm-${String(n).padStart(3, '0')}`,
        name,
        businessId: ID,
        businessName: NAME,
        category,
        shortDescription: cat.title,
        longDescription: cat.subtitle ? `${cat.title} · ${cat.subtitle}` : cat.title,
        image,
        price,
        ...(options ? { options } : {}),
        // La comida lleva termopack obligatorio; las bebidas no.
        ...(category === 'Bebidas' ? {} : { packaging: TERMOPACK }),
        stockStatus: status,
      })
    }
  }
  return out
}

export const dlmProducts: Product[] = buildProducts()
