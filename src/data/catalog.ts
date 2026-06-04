import type { Business, Product, Category } from '../types'

// Logos de negocio
import BMercado from '../assets/images/business/mercado.webp'
import BRestaurante from '../assets/images/business/restaurant.jpg'

// Fotos del mercadito (una por imagen del directorio)
import Avena from '../assets/images/products/mercadito/avena.jpg'
import Bambil from '../assets/images/products/mercadito/bambil.jpg'
import Botonetas from '../assets/images/products/mercadito/botonetas.jpg'
import CervezaBeck from '../assets/images/products/mercadito/cerveza_becks.jpg'
import Chicharrones from '../assets/images/products/mercadito/chicharrones.jpg'
import ChupaChups from '../assets/images/products/mercadito/chups_chups.jpg'
import Coconut from '../assets/images/products/mercadito/coconut.jpg'
import Crackers from '../assets/images/products/mercadito/crackers.jpg'
import Cukis from '../assets/images/products/mercadito/cukis.jpg'
import CulerosBebish from '../assets/images/products/mercadito/culeros_bebish.jpg'
import CulerosLula from '../assets/images/products/mercadito/culeros_lula.jpg'
import Donas from '../assets/images/products/mercadito/donas.jpg'
import Frijoles from '../assets/images/products/mercadito/frijoles.jpg'
import Gelatina from '../assets/images/products/mercadito/gelatina.jpg'
import GelatinaPomo from '../assets/images/products/mercadito/gelatina_pomo.jpg'
import Intimas from '../assets/images/products/mercadito/intimas.jpg'
import JabonLavar from '../assets/images/products/mercadito/jabón_de_lavar.jpg'
import JugosPetit from '../assets/images/products/mercadito/jugos_petit.jpg'
import Jumbo from '../assets/images/products/mercadito/jumbo.jpg'
import Lavavajillas from '../assets/images/products/mercadito/lavavajillas.jpg'
import Mayonesa from '../assets/images/products/mercadito/mayonesa.jpg'
import Papel from '../assets/images/products/mercadito/papel_higienico.jpg'
import Pastatomate from '../assets/images/products/mercadito/pastaDeTomate.jpg'
import PastillaCongris from '../assets/images/products/mercadito/pastillaCongrís.jpg'
import PastillaPolloTomate from '../assets/images/products/mercadito/pastilla_de_pollo_con_tomate.jpg'
import PeterNeptun from '../assets/images/products/mercadito/peter_neptun.jpg'
import PurePapas from '../assets/images/products/mercadito/pure_de_papas.jpg'
import RefrescoCana from '../assets/images/products/mercadito/refresco_cana_cola.jpg'
import Shaka from '../assets/images/products/mercadito/shaka.jpg'
import Spaguetti from '../assets/images/products/mercadito/spaguetti.jpg'
import Vinagre from '../assets/images/products/mercadito/Vinagre.jpg'
import Yogurt from '../assets/images/products/mercadito/yogurt_vima.jpg'

// Fotos del restaurante
import Pizza from '../assets/images/products/pizza.jpg'
import Hamburguesa from '../assets/images/products/hamburguesa.jpg'
import Pollo from '../assets/images/products/pollo.jpg'

export const categories: Category[] = ['Alimentos', 'Bebidas', 'Aseo', 'Hogar', 'Comida', 'Confituras']

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
  Confituras: '🍯',
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

const MERCADO = 'bodega-central'
const MERCADO_NAME = 'La Bodega Central'

/**
 * Datos de prueba.
 * - Para marcar agotado: `stockStatus: 'agotado'` (TS solo admite 'disponible' | 'pocas' | 'agotado').
 * - `formato`: nº de unidades por caja/paca. El precio es POR UNIDAD; en el carrito
 *   cada "+1" añade una caja completa (p. ej. formato 24 → 24, 48, 72…).
 * - `photo` opcional: si no hay, se muestra el emoji `image` sobre un placeholder.
 */
export const products: Product[] = [
  // ───────────────── La Bodega Central (mercadito) ─────────────────
  {
    id: 'bc-001', name: 'Avena con leche', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Lista para preparar.',
    longDescription: 'Avena con leche, se vende por unidad.',
    image: '🥣', photo: Avena, price: 2250, stockStatus: 'disponible',
  },
  {
    id: 'bc-002', name: 'Chicharrones de viento', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Listos para freír.',
    longDescription: 'Se venden por unidad, listos para freír.',
    image: '🍟', photo: Chicharrones, price: 850, stockStatus: 'disponible',
  },
  {
    id: 'bc-003', name: 'Shaka (vodka energético)', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Bebidas', shortDescription: 'Caja de 24 unidades.',
    longDescription: 'Llévate la caja de 24 unidades y disfruta del sabor que todos aman.',
    image: '🥤', photo: Shaka, price: 400, formato: 24, stockStatus: 'disponible',
  },
  {
    id: 'bc-004', name: 'Refresco Caná Cola', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Bebidas', shortDescription: 'Bien frío, para compartir.',
    longDescription: 'Refresco de cola carbonatado. Sabor clásico y refrescante.',
    image: '🥤', photo: RefrescoCana, price: 290, stockStatus: 'disponible',
  },
  {
    id: 'bc-005', name: 'Papel sanitario', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Aseo', shortDescription: 'Extra suave.',
    longDescription: 'Se vende por paca de 24 unidades.',
    image: '🧻', photo: Papel, price: 460, formato: 24, stockStatus: 'disponible',
  },
  {
    id: 'bc-006', name: 'Cerveza Beck’s', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Bebidas', shortDescription: 'Caja de 24.',
    longDescription: 'Disfruta de la calidad de una cerveza alemana. Se vende por caja de 24.',
    image: '🍺', photo: CervezaBeck, price: 280, formato: 24, stockStatus: 'disponible',
  },
  {
    id: 'bc-007', name: 'Pasta de tomate Marwa', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Caja de 24 unidades.',
    longDescription: 'Pasta de tomate. Se vende por cajas de 24 unidades.',
    image: '🥫', photo: Pastatomate, price: 400, formato: 24, stockStatus: 'disponible',
  },
  {
    id: 'bc-008', name: 'Botonetas', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'Tira de 24 unidades.',
    longDescription: 'Se venden por tira de 24 unidades.',
    image: '🧀', photo: Botonetas, price: 50, formato: 24, stockStatus: 'disponible',
  },
  {
    id: 'bc-009', name: 'Chupa Chups XXXL', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'Estuche de 48 unidades.',
    longDescription: 'Se vende por estuches de 48 unidades.',
    image: '🍭', photo: ChupaChups, price: 45, formato: 48, stockStatus: 'disponible',
  },
  {
    id: 'bc-010', name: 'Culeros Bebish', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Aseo', shortDescription: 'Pañales desechables.',
    longDescription: 'Se vende por unidad.',
    image: '🧷', photo: CulerosBebish, price: 2800, stockStatus: 'disponible',
  },
  {
    id: 'bc-011', name: 'Culeros Lula', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Aseo', shortDescription: 'Pañales desechables.',
    longDescription: 'Se vende por unidad.',
    image: '🧷', photo: CulerosLula, price: 3500, stockStatus: 'disponible',
  },
  {
    id: 'bc-012', name: 'Bambil', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Bebidas', shortDescription: 'Refresco/jugo.',
    longDescription: 'Bebida refrescante. Se vende por unidad.',
    image: '🧃', photo: Bambil, price: 200, stockStatus: 'disponible',
  },
  {
    id: 'bc-013', name: 'Galletas Coconut', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'De coco.',
    longDescription: 'Galletas dulces de coco. Se vende por paquete.',
    image: '🍪', photo: Coconut, price: 180, stockStatus: 'disponible',
  },
  {
    id: 'bc-014', name: 'Crackers', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Galletas saladas.',
    longDescription: 'Galletas tipo cracker. Se vende por paquete.',
    image: '🍘', photo: Crackers, price: 220, stockStatus: 'disponible',
  },
  {
    id: 'bc-015', name: 'Cukis', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'Galletas con chips.',
    longDescription: 'Galletas dulces con chips. Se vende por paquete.',
    image: '🍪', photo: Cukis, price: 160, stockStatus: 'disponible',
  },
  {
    id: 'bc-016', name: 'Donas', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'Suaves y dulces.',
    longDescription: 'Donas glaseadas. Se vende por unidad.',
    image: '🍩', photo: Donas, price: 150, stockStatus: 'pocas',
  },
  {
    id: 'bc-017', name: 'Frijoles negros 1 kg', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Secos, seleccionados.',
    longDescription: 'Frijoles negros de primera calidad, limpios y listos para cocinar. Bolsa de 1 kg.',
    image: '🫘', photo: Frijoles, price: 450, stockStatus: 'disponible',
  },
  {
    id: 'bc-018', name: 'Gelatina', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'Para preparar.',
    longDescription: 'Gelatina en sobre. Se vende por unidad.',
    image: '🍮', photo: Gelatina, price: 90, stockStatus: 'disponible',
  },
  {
    id: 'bc-019', name: 'Gelatina en pomo', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'Lista para comer.',
    longDescription: 'Gelatina en pomo, lista para comer. Se vende por unidad.',
    image: '🍮', photo: GelatinaPomo, price: 320, stockStatus: 'disponible',
  },
  {
    id: 'bc-020', name: 'Toallas íntimas', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Aseo', shortDescription: 'Protección diaria.',
    longDescription: 'Toallas sanitarias. Se vende por paquete.',
    image: '🧻', photo: Intimas, price: 380, stockStatus: 'disponible',
  },
  {
    id: 'bc-021', name: 'Jabón de lavar', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Hogar', shortDescription: 'Para ropa.',
    longDescription: 'Jabón de lavar en barra. Se vende por unidad.',
    image: '🧼', photo: JabonLavar, price: 240, stockStatus: 'disponible',
  },
  {
    id: 'bc-022', name: 'Jugos Petit', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Bebidas', shortDescription: 'Jugo individual.',
    longDescription: 'Jugo Petit. Se vende por unidad.',
    image: '🧃', photo: JugosPetit, price: 120, stockStatus: 'disponible',
  },
  {
    id: 'bc-023', name: 'Detergente Jumbo', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Hogar', shortDescription: 'Alto rendimiento.',
    longDescription: 'Detergente en polvo Jumbo. Se vende por unidad.',
    image: '🧺', photo: Jumbo, price: 620, stockStatus: 'disponible',
  },
  {
    id: 'bc-024', name: 'Lavavajillas', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Hogar', shortDescription: 'Quita grasa.',
    longDescription: 'Lavavajillas líquido. Se vende por unidad.',
    image: '🧴', photo: Lavavajillas, price: 350, stockStatus: 'disponible',
  },
  {
    id: 'bc-025', name: 'Mayonesa', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Cremosa.',
    longDescription: 'Mayonesa en pomo. Se vende por unidad.',
    image: '🥚', photo: Mayonesa, price: 520, stockStatus: 'disponible',
  },
  {
    id: 'bc-026', name: 'Pastilla para congrí', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Sazón en pastilla.',
    longDescription: 'Pastilla saborizante para congrí. Se vende por unidad.',
    image: '🧂', photo: PastillaCongris, price: 120, stockStatus: 'disponible',
  },
  {
    id: 'bc-027', name: 'Pastilla de pollo con tomate', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Sazón en pastilla.',
    longDescription: 'Pastilla saborizante de pollo con tomate. Se vende por unidad.',
    image: '🧂', photo: PastillaPolloTomate, price: 120, stockStatus: 'disponible',
  },
  {
    id: 'bc-028', name: 'Galletas Peter Neptun', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'Rellenas.',
    longDescription: 'Galletas rellenas Peter Neptun. Se vende por paquete.',
    image: '🍪', photo: PeterNeptun, price: 190, stockStatus: 'disponible',
  },
  {
    id: 'bc-029', name: 'Puré de papas', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Instantáneo.',
    longDescription: 'Puré de papas instantáneo. Se vende por unidad.',
    image: '🥔', photo: PurePapas, price: 280, stockStatus: 'disponible',
  },
  {
    id: 'bc-030', name: 'Espaguetis', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Pasta seca.',
    longDescription: 'Espaguetis secos. Se vende por paquete.',
    image: '🍝', photo: Spaguetti, price: 260, stockStatus: 'disponible',
  },
  {
    id: 'bc-031', name: 'Vinagre', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Para aderezar.',
    longDescription: 'Vinagre en pomo. Se vende por unidad.',
    image: '🧴', photo: Vinagre, price: 180, stockStatus: 'agotado',
  },
  {
    id: 'bc-032', name: 'Yogurt Vima', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Bebidas', shortDescription: 'Bebible.',
    longDescription: 'Yogurt bebible Vima. Se vende por unidad.',
    image: '🥛', photo: Yogurt, price: 260, stockStatus: 'disponible',
  },

  // ───────────────── Restaurante El Patio ─────────────────
  // Productos estrella (con foto)
  {
    id: 'ep-001', name: 'Pizza de queso (mediana)', businessId: 'el-patio', businessName: 'Restaurante El Patio',
    category: 'Comida', shortDescription: 'Masa artesanal.',
    longDescription: 'Pizza mediana de masa artesanal con abundante queso gratinado y salsa de tomate natural.',
    image: '🍕', photo: Pizza, price: 580, stockStatus: 'disponible',
  },
  {
    id: 'ep-002', name: 'Hamburguesa de la casa', businessId: 'el-patio', businessName: 'Restaurante El Patio',
    category: 'Comida', shortDescription: 'Carne, queso y vegetales.',
    longDescription: 'Hamburguesa de res a la parrilla con queso fundido, lechuga, tomate y salsa especial. Con papas.',
    image: '🍔', photo: Hamburguesa, price: 540, stockStatus: 'disponible',
  },
  {
    id: 'ep-003', name: 'Pollo asado con papas', businessId: 'el-patio', businessName: 'Restaurante El Patio',
    category: 'Comida', shortDescription: 'Jugoso, recién hecho.',
    longDescription: 'Cuarto de pollo asado al horno, marinado con especias de la casa, con papas doradas.',
    image: '🍗', photo: Pollo, price: 720, stockStatus: 'pocas',
  },
  // Productos sin foto (placeholder)
  {
    id: 'ep-004', name: 'Arroz congrí + cerdo', businessId: 'el-patio', businessName: 'Restaurante El Patio',
    category: 'Comida', shortDescription: 'Plato criollo completo.',
    longDescription: 'Arroz congrí con masas de cerdo asado, yuca con mojo y ensalada fresca.',
    image: '🍛', price: 650, stockStatus: 'disponible',
  },
  {
    id: 'ep-005', name: 'Espaguetis a la boloñesa', businessId: 'el-patio', businessName: 'Restaurante El Patio',
    category: 'Comida', shortDescription: 'Salsa de carne casera.',
    longDescription: 'Espaguetis al dente con salsa boloñesa casera y un toque de queso. Porción individual.',
    image: '🍝', price: 490, stockStatus: 'disponible',
  },
  {
    id: 'ep-006', name: 'Flan de la casa', businessId: 'el-patio', businessName: 'Restaurante El Patio',
    category: 'Comida', shortDescription: 'Postre cremoso.',
    longDescription: 'Flan casero de huevo con caramelo, suave y cremoso. El cierre perfecto.',
    image: '🍮', price: 220, stockStatus: 'pocas',
  },
]
