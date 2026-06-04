import type { Business, Product, Category } from '../types'

// Logos de negocio
import BMercado from '../assets/images/business/mercado.webp'
import BRestaurante from '../assets/images/business/restaurant.jpg'

// Fotos de productos (solo las que se usan)
import Arroz from '../assets/images/products/arroz.webp'
import Aceite from '../assets/images/products/aceite.jpg'
import Cafe from '../assets/images/products/café.avif'
import Refresco from '../assets/images/products/refresco.avif'
import Jabon from '../assets/images/products/jabón.webp'
import Detergente from '../assets/images/products/detergente.jpg'
import Pizza from '../assets/images/products/pizza.jpg'
import Hamburguesa from '../assets/images/products/hamburguesa.jpg'
import Pollo from '../assets/images/products/pollo.jpg'

export const categories: Category[] = ['Alimentos', 'Bebidas', 'Aseo', 'Hogar', 'Comida']

/** Busca un negocio por id (para leer reglas como paymentNote). */
export function businessById(id: string) {
  return businesses.find((b) => b.id === id)
}

export const categoryEmoji: Record<Category, string> = {
  Alimentos: '🥫',
  Bebidas: '🥤',
  Aseo: '🧼',
  Hogar: '🧺',
  Comida: '🍽️',
}

export const businesses: Business[] = [
  {
    id: 'bodega-central',
    name: 'La Bodega Central',
    description: 'Mercadito: alimentos, bebidas y aseo del día a día.',
    image: BMercado,
    color: 'from-amber-100 to-orange-50',
    paymentNote: 'Solo se aceptan billetes de 50 CUP en adelante.',
  },
  {
    id: 'el-patio',
    name: 'Restaurante El Patio',
    description: 'Comida criolla recién hecha, lista para disfrutar en casa.',
    image: BRestaurante,
    color: 'from-rose-100 to-orange-50',
  },
]

/**
 * Datos de prueba (cortos). Para marcar un producto como agotado, cambia
 * `stockStatus` a 'agotado' (TypeScript solo admite 'disponible' | 'pocas' | 'agotado').
 *
 * `photo` es OPCIONAL: los productos con foto se muestran como tarjetas grandes
 * (estrella); los que no tienen foto usan un placeholder y una tarjeta más pequeña.
 */
export const products: Product[] = [
  // ───────────────── La Bodega Central (mercadito) ─────────────────
  {
    id: 'bc-001',
    name: 'Avena',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Alimentos',
    shortDescription: 'Blanco, de grano largo.',
    longDescription:
      'Arroz blanco de grano largo seleccionado, sin impurezas y de cocción uniforme. Bolsa de 1 kg.',
    image: '🍚',
    photo: Arroz,
    price: 320,
    stockStatus: 'disponible',
  },
  {
    id: 'bc-002',
    name: 'Aceite vegetal 1 L',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Alimentos',
    shortDescription: 'Refinado, ligero.',
    longDescription: 'Aceite vegetal 100% refinado, ideal para freír y aderezar. Botella de 1 litro.',
    image: '🫒',
    photo: Aceite,
    price: 780,
    stockStatus: 'disponible',
  },
  {
    id: 'bc-003',
    name: 'Café molido 250 g',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Bebidas',
    shortDescription: 'Tueste natural cubano.',
    longDescription: 'Café molido de tueste natural, aroma intenso y cuerpo equilibrado. Paquete de 250 g.',
    image: '☕',
    photo: Cafe,
    price: 540,
    stockStatus: 'pocas',
  },
  {
    id: 'bc-004',
    name: 'Refresco de cola 2 L',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Bebidas',
    shortDescription: 'Bien frío, para compartir.',
    longDescription: 'Refresco de cola carbonatado en botella de 2 litros. Sabor clásico y refrescante.',
    image: '🥤',
    photo: Refresco,
    price: 290,
    stockStatus: 'disponible',
  },
  {
    id: 'bc-005',
    name: 'Jabón de baño (x3)',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Aseo',
    shortDescription: 'Suave con la piel.',
    longDescription: 'Pack de 3 jabones de tocador con glicerina. Aroma fresco y duradero. 100 g c/u.',
    image: '🧼',
    photo: Jabon,
    price: 260,
    stockStatus: 'agotado',
  },
  {
    id: 'bc-007',
    name: 'Cerveza (caja de 24)',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Bebidas',
    shortDescription: 'Se vende por caja de 24.',
    longDescription:
      'Cerveza nacional en lata. Se vende por caja completa de 24 unidades. El precio mostrado es por unidad.',
    image: '🍺',
    price: 280,
    formato: 24,
    stockStatus: 'disponible',
  },
  {
    id: 'bc-006',
    name: 'Detergente en polvo 1 kg',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Hogar',
    shortDescription: 'Alto rendimiento.',
    longDescription: 'Detergente en polvo de gran poder limpiador para máquina y a mano. Rinde hasta 30 lavados.',
    image: '🧺',
    photo: Detergente,
    price: 560,
    stockStatus: 'disponible',
  },

  // ───────────────── Restaurante El Patio ─────────────────
  // Productos estrella (con foto)
  {
    id: 'ep-001',
    name: 'Pizza de queso (mediana)',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Masa artesanal.',
    longDescription: 'Pizza mediana de masa artesanal con abundante queso gratinado y salsa de tomate natural.',
    image: '🍕',
    photo: Pizza,
    price: 580,
    stockStatus: 'disponible',
  },
  {
    id: 'ep-002',
    name: 'Hamburguesa de la casa',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Carne, queso y vegetales.',
    longDescription: 'Hamburguesa de res a la parrilla con queso fundido, lechuga, tomate y salsa especial. Con papas.',
    image: '🍔',
    photo: Hamburguesa,
    price: 540,
    stockStatus: 'disponible',
  },
  {
    id: 'ep-003',
    name: 'Pollo asado con papas',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Jugoso, recién hecho.',
    longDescription: 'Cuarto de pollo asado al horno, marinado con especias de la casa, con papas doradas.',
    image: '🍗',
    photo: Pollo,
    price: 720,
    stockStatus: 'pocas',
  },
  // Productos sin foto (placeholder + tarjeta más pequeña)
  {
    id: 'ep-004',
    name: 'Arroz congrí + cerdo',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Plato criollo completo.',
    longDescription: 'Arroz congrí con masas de cerdo asado, yuca con mojo y ensalada fresca.',
    image: '🍛',
    price: 650,
    stockStatus: 'disponible',
  },
  {
    id: 'ep-005',
    name: 'Espaguetis a la boloñesa',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Salsa de carne casera.',
    longDescription: 'Espaguetis al dente con salsa boloñesa casera y un toque de queso. Porción individual.',
    image: '🍝',
    price: 490,
    stockStatus: 'disponible',
  },
  {
    id: 'ep-006',
    name: 'Flan de la casa',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Postre cremoso.',
    longDescription: 'Flan casero de huevo con caramelo, suave y cremoso. El cierre perfecto.',
    image: '🍮',
    price: 220,
    stockStatus: 'pocas',
  },
]
