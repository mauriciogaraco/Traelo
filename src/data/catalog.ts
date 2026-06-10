import type { Business, Product, Category } from '../types'

// Logos de negocio
import BMercado from '../assets/images/business/Mercadito.jpg'
import BCentral from '../assets/images/business/bodega_central.jpg'
import Macus from '../assets/images/business/macus.jpg'
import DLM from '../assets/images/business/DLM.jpg'

// Fotos del mercadito (una por imagen del directorio)
import Avena from '../assets/images/products/mercadito/avena.jpg'
import Bambil from '../assets/images/products/mercadito/bambil.jpg'
import Botonetas from '../assets/images/products/mercadito/botonetas.jpg'
//import CervezaBeck from '../assets/images/products/mercadito/cerveza_becks.jpg'
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
//import Pastatomate from '../assets/images/products/mercadito/pastaDeTomate.jpg'
import PastillaCongris from '../assets/images/products/mercadito/pastillaCongrís.jpg'
import PastillaPolloTomate from '../assets/images/products/mercadito/pastilla_de_pollo_con_tomate.jpg'
import PeterNeptun from '../assets/images/products/mercadito/peter_neptun.jpg'
import PurePapas from '../assets/images/products/mercadito/pure_de_papas.jpg'
import RefrescoCana from '../assets/images/products/mercadito/refresco_cana_cola.jpg'
import Shaka from '../assets/images/products/mercadito/shaka.jpg'
import Spaguetti from '../assets/images/products/mercadito/spaguetti.jpg'
import Vinagre from '../assets/images/products/mercadito/Vinagre.jpg'
import Yogurt from '../assets/images/products/mercadito/yogurt_vima.jpg'
import ZumoNaranjaLimon from '../assets/images/products/mercadito/zumo_naranja_limon.jpg'
import QuesoCriollo from '../assets/images/products/mercadito/queso_criollo.jpg'
import ArrozSam from '../assets/images/products/mercadito/arroz_sam.jpg'
import CoditosAda from '../assets/images/products/mercadito/coditos_ada.jpg'
import DetergenteLiquido from '../assets/images/products/mercadito/detergente_liquido.jpg'
import Bombones from '../assets/images/products/mercadito/bombones.jpg'
import PastaDental from '../assets/images/products/mercadito/bombones.jpg'
import ToasllitasHumedas from '../assets/images/products/mercadito/toallitas_indoxa.jpg'
// Fotos del restaurante
import Pizza from '../assets/images/products/pizza.jpg'
import Pollo from '../assets/images/products/pollo.jpg'
import Hamburguesa from '../assets/images/products/hamburguesa.jpg'

import Aceite from '../assets/images/products/mercado/aceite_900ml.jpg'
import ArrozAgranel from '../assets/images/products/mercado/arroz_brasileño_agranel.jpg'
//import Mortadella from '../assets/images/products/mercado/mortadella_1kg.jpg'
//import Mortadella1kg from '../assets/images/products/mercado/mortadella_500g.webp'
//import AzucarAgranel from '../assets/images/products/mercado/azucar_blanca_lb.jpg'
//import PerritoMana from '../assets/images/products/mercado/perritos_mana.jpg'
//import FEFEJabon from '../assets/images/products/mercado/FEFE_jabon.jpg'
//import FrijolesPontarollo from '../assets/images/products/mercado/pontarollo.jpg'
//import SopaInstantanea from '../assets/images/products/mercado/sopa_instantanea.jpg'
//import SpamTubo from '../assets/images/products/mercado/spam_tubo.webp'
//import yogurt from '../assets/images/products/mercado/yogurt_vaso.webp'


//import PanImperial from '../assets/images/products/Macus/pan_imperial.jpg'
//import PanMedianoche from '../assets/images/products/Macus/Pan_medianoche.jpg'
import PanSuperMacu from '../assets/images/products/Macus/pan_macu.jpg'

export const categories: Category[] = ['Alimentos', 'Bebidas', 'Aseo', 'Comida', 'Confituras']

/** Busca un negocio por id (para leer reglas como paymentNote). */
export function businessById(id: string) {
  return businesses.find((b) => b.id === id)
}

export const categoryEmoji: Record<Category, string> = {
  Alimentos: '🥫',
  Bebidas: '🥤',
  Aseo: '🧼',
  Comida: '🍽️',
  Confituras: '🍯',
}

export const businesses: Business[] = [
  {
    id: 'bodega-central',
    name: 'La Bodega Central',
    description: 'Mercadito: alimentos, bebidas y aseo del día a día.',
    image: BCentral,
    color: 'from-amber-100 to-orange-50',
    paymentNote: 'Solo se aceptan billetes de 50 CUP en adelante.',
    schedule: { days: [1, 2, 3, 4, 5, 6], open: '09:00', close: '17:00', label: 'Lun–Sáb · 9:00 am – 5:00 pm' },
  },
  {
    
    id: 'el-patio',
    name: 'DLM Bar-ResTaurante',
    description: 'Comida criolla recién hecha, lista para disfrutar en casa.',
    image: DLM,
    color: 'from-rose-100 to-orange-50',
    schedule: { days: [3, 4, 5, 6, 0], open: '09:00', close: '20:00', label: 'Mié–Dom · 9:00 am – 8:00 pm' },
  },
  {
    id: 'panes-macus',
    name: 'Los Macus',
    description: 'Panadería: panes frescos, frezco, malta y cerveza.',
    image: Macus,
    color: 'from-yellow-100 to-amber-50',
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], open: '08:00', close: '20:00', label: 'Todos los días · 8:00 am – 8:00 pm' },
  },
  {
    id: 'mercadito-ahorro',
    name: 'El Mercadito',
    description: 'Granos por libra, aceite y embutidos frescos.',
    image: BMercado,
    color: 'from-emerald-100 to-teal-50',
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], open: '08:00', close: '20:00', label: 'Todos los días · 8:00 am – 8:00 pm' },
  },
]

const MERCADO = 'bodega-central'
const MERCADO_NAME = 'La Bodega Central'
const PANES = 'panes-macus'
const PANES_NAME = 'Panes Macus'
const MERCA2 = 'mercadito-ahorro'
const MERCA2_NAME = 'Mercadito El Ahorro'

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
    id: 'bc-004', name: 'Refresco Cana', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Bebidas', shortDescription: 'Elige una opción para añadir al carrito',
    longDescription: 'Excelente calidad. Se vende por blister de 12 unidades. Contiene 420ml',
    formato:12,
    options: ['Cola', 'Uva', 'Limón', 'Naranja', 'Frambuesa'],
    image: '🥤', photo: RefrescoCana, price: 250, stockStatus: 'disponible',
  },
  {
    id: 'bc-005', name: 'Papel sanitario', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Aseo', shortDescription: 'Extra suave.',
    longDescription: 'Se vende por paca de 24 unidades.',
    image: '🧻', photo: Papel, price: 460, formato: 24, stockStatus: 'disponible',
  },
  /*{
    id: 'bc-006', name: 'Cerveza Beck’s', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Bebidas', shortDescription: 'Caja de 24.',
    longDescription: 'Disfruta de la calidad de una cerveza alemana. Se vende por caja de 24.',
    image: '🍺', photo: CervezaBeck, price: 280, formato: 24, stockStatus: 'disponible',
  },*/
 /* {
    id: 'bc-007', name: 'Pasta de tomate Marwa', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Caja de 24 unidades.',
    longDescription: 'Pasta de tomate. Se vende por cajas de 24 unidades.',
    image: '🥫', photo: Pastatomate, price: 400, formato: 24, stockStatus: 'disponible',
  },*/
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
    category: 'Confituras', shortDescription: '',
    longDescription: 'Se vende por unidad.',
    image: '🧃', photo: Bambil, price: 330, stockStatus: 'disponible',
  },
  {

    id: 'bc-013', name: 'Galletas Coconut', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'De coco.',
    longDescription: 'Se vende por estuches de 12 unidades',
    formato:12,
    image: '🍪', photo: Coconut, price: 80, stockStatus: 'disponible',
  },
  {
    id: 'bc-014', name: 'Crackers', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'Galletas saladas.',
    longDescription: 'Galletas tipo cracker. Se vende por unidad.',
    image: '🍘', photo: Crackers, price: 230, stockStatus: 'disponible',
  },
  {
    id: 'bc-015', name: "Cuki's", businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'Elige una opción para añadir',
    longDescription: ' Se vende por estuche de 12 unidades',
    options: ['Vainilla', 'Chocolate'],
    image: '🍪', photo: Cukis, price: 940, stockStatus: 'disponible',
  },
  {
    id: 'bc-016', name: 'Donas', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: '',
    longDescription: ' Se vende por unidad.',
    image: '🍩', photo: Donas, price: 600, stockStatus: 'disponible',
  },

  {
    id: 'bc-017', name: 'Frijoles negros', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: '500 gramos.',
    longDescription: 'Se vende por unidad',
    image: '🫘', photo: Frijoles, price: 400, stockStatus: 'disponible',
  },
  {
    id: 'bc-018', name: 'Gelatina', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: '',
    longDescription: 'Se vende por unidad.',
    image: '🍮', photo: Gelatina, price: 300, stockStatus: 'disponible',
  },
  {
    id: 'bc-019', name: 'Gelatina en pomo', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: 'Lista para comer.',
    longDescription: 'Gelatina en pomo. Se vende por pomos de 100 unidades',
    options: ['Pingüino', 'Mono'],
    image: '🍮', photo: GelatinaPomo, price: 3400, stockStatus: 'disponible',
  },
  {
    id: 'bc-020', name: 'Diarias', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Aseo', shortDescription: '',
    longDescription: 'Se vende por unidad.',
    image: '🧻', photo: Intimas, price: 580, stockStatus: 'disponible',
  },
  {
    id: 'bc-021', name: 'Jabón de lavar', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Aseo', shortDescription: '',
    longDescription: ' Se vende por cajas de 96 unidades',formato:96,
    image: '🧼', photo: JabonLavar, price: 232, stockStatus: 'disponible',
  },
  {
    id: 'bc-022', name: 'Jugos Petit', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Bebidas', shortDescription: 'El mejor jugo del mercado',
    longDescription: 'Se vende por cajas de 24 unidades, viene surtido los 3 sabores en la caja', formato:24,
    image: '🧃', photo: JugosPetit, price: 200, stockStatus: 'disponible',
  },
  {
    id: 'bc-023', name: 'Galletas Jumbo', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: '',
    longDescription: 'Se vende por estuches de 12 unidades', formato:12,
    image: '🧺', photo: Jumbo, price: 80, stockStatus: 'disponible',
  },
  {
    id: 'bc-024', name: 'Lavavajillas', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Aseo', shortDescription: 'Pote Lavavajillas',
    longDescription: 'Lavavajillas líquido. Se vende por unidad.',
    image: '🧴', photo: Lavavajillas, price: 560, stockStatus: 'disponible',
  },
  {
    id: 'bc-025', name: 'Mayonesa', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Cremosa.',
    longDescription: 'Mayonesa en pomo. Se vende por blister de 12 unidades', formato:12,
    image: '🥚', photo: Mayonesa, price: 820, stockStatus: 'disponible',
  },
  {
    id: 'bc-026', name: 'Pastilla para congrí', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Sazón en pastilla.',
    longDescription: 'Se vende por caja de 48 pastillitas', formato:12,
    image: '🧂', photo: PastillaCongris, price: 60, stockStatus: 'disponible',
  },
  {
    id: 'bc-027', name: 'Pastilla de pollo', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Sazón en pastilla.',
    longDescription: 'Pastilla saborizante de pollo . Se vende por caajita de 12 unidades.',formato:12,
    image: '🧂', photo: PastillaPolloTomate, price: 15, stockStatus: 'disponible',
  },
  {
    id: 'bc-028', name: 'Peter Neptun', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: '',
    longDescription: 'Se vende por cajas de 24 unidades',formato:24,
    image: '🍪', photo: PeterNeptun, price: 135, stockStatus: 'disponible',
  },
  {
    id: 'bc-029', name: 'Puré de papas', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: '1kg',
    longDescription: ' Se vende por unidad.',
    image: '🥔', photo: PurePapas, price: 3370, stockStatus: 'disponible',
  },
  {
    id: 'bc-030', name: 'Espaguetis', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: '500 gramos.',
    longDescription: 'Se vende por cajas de 20 unidades.',formato:20,
    image: '🍝', photo: Spaguetti, price: 215, stockStatus: 'disponible',
  },
  {
    id: 'bc-031', name: 'Vinagre', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: 'Pomo de 1 litro.',
    longDescription: 'Se vende por blister de 10 unidades.',formato:10,
    image: '🧴', photo: Vinagre, price: 240, stockStatus: 'disponible',
  },
  {
    id: 'bc-032', name: 'Yogurt Vima', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Bebidas', shortDescription: 'x4',
    longDescription: ' Se vende por estuche de 4 vasitos',
    options: ['Fresa', 'Natural'],
    image: '🥛', photo: Yogurt, price: 840, stockStatus: 'disponible',
  },

    {
    id: 'bc-033', name: 'Detergente Líquido', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Aseo', shortDescription: 'Detergente líquido multiuso',
    longDescription: 'Se venden por blister 10 unidades.',formato:10, 
    image: '🍟', photo: DetergenteLiquido, price: 340, stockStatus: 'disponible',
  },
     {
    id: 'bc-034', name: 'Toallitas Húmedas', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Aseo', shortDescription: 'Toallitas húmedas para el cuidado personal',
    longDescription: 'Se venden por unnidad.', 
    image: '🍟', photo: ToasllitasHumedas, price: 650, stockStatus: 'disponible',
  },
    {
    id: 'bc-035', name: 'Bombones', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Confituras', shortDescription: '',
    longDescription: 'Se venden por paquete 80/90 bombones',
    image: '🍟', photo: Bombones, price: 3200, stockStatus: 'disponible',
  },
       {
    id: 'bc-036', name: 'Pasta Dental CoolWhite', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Aseo', shortDescription: 'Toallitas húmedas para el cuidado personal',
    longDescription: 'Se venden por paquete de 12 unidades', formato:12, 
    image: '🍟', photo: PastaDental, price: 360, stockStatus: 'disponible',
  },
       {
    id: 'bc-037', name: 'Coditos Ada', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: '',
    longDescription: 'Se vende por paca de 20 unidades', formato:20, 
    image: '🍟', photo: CoditosAda, price: 290, stockStatus: 'disponible',
  },
    {
    id: 'bc-038', name: 'Bombones', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: '',
    longDescription: 'Se vende por libra',
    image: '🍟', photo: QuesoCriollo, price: 750, stockStatus: 'disponible',
  },
    {
    id: 'bc-039', name: 'Zumo Naranja/Limón', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: '',
    longDescription: 'Se vende por blister de 10 unidades',formato:10, options:['Naranja', 'Limón'],
    image: '🍟', photo: ZumoNaranjaLimon, price: 750, stockStatus: 'disponible',
  },
    {
    id: 'bc-040', name: 'Arroz Sam 1kg', businessId: MERCADO, businessName: MERCADO_NAME,
    category: 'Alimentos', shortDescription: '',
    longDescription: 'Se vende por paca de 10 unidades',formato:10,
    image: '🍟', photo: ArrozSam, price: 640, stockStatus: 'disponible',
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

  // ───────────────── Panes Macus (panadería) ─────────────────
  // (fotos reutilizadas / placeholder; el cliente las ajustará luego)
 // ───────────────── Panes Macus ─────────────────

{
  id: 'pm-001',
  name: 'Jamón',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Pan con jamón.',
  longDescription: 'Pan con jamón recién preparado.',
  image: '🥪',
  price: 290,
  stockStatus: 'disponible',
},
{
  id: 'pm-002',
  name: 'Jamón y Queso',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Jamón y queso.',
  longDescription: 'Pan con jamón y queso.',
  image: '🥪',
  price: 340,
  stockStatus: 'disponible',
},
{
  id: 'pm-003',
  name: 'Hamburguesa',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Hamburguesa de la casa.',
  longDescription: 'Hamburguesa preparada al momento.',
  image: '🍔',
  price: 400,
  stockStatus: 'disponible',
},
{
  id: 'pm-004',
  name: 'Macu',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Especialidad de la casa.',
  longDescription: 'Pan Macu preparado al momento.',
  image: '🥪',
  price: 600,
  stockStatus: 'disponible',
},
{
  id: 'pm-005',
  name: 'Super Macu',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Nuestro producto estrella.',
  longDescription: 'Versión especial del Macu con ingredientes premium.',
  image: '🥪',
  photo: PanSuperMacu, // cambia por la foto real cuando la tengas
  price: 1370,
  stockStatus: 'disponible',
},
{
  id: 'pm-006',
  name: 'Aporreado',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Aporreado tradicional.',
  longDescription: 'Pan con aporreado recién preparado.',
  image: '🥪',
  price: 370,
  stockStatus: 'disponible',
},
{
  id: 'pm-007',
  name: 'Picadillo',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Picadillo preparado.',
  longDescription: 'Pan con picadillo.',
  image: '🥪',
  price: 210,
  stockStatus: 'disponible',
},
{
  id: 'pm-008',
  name: 'Surtido',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Combinación surtida.',
  longDescription: 'Pan surtido con diferentes ingredientes.',
  image: '🥪',
  price: 370,
  stockStatus: 'disponible',
},
{
  id: 'pm-009',
  name: 'Surtido Especial',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Versión especial.',
  longDescription: 'Pan surtido especial.',
  image: '🥪',
  price: 640,
  stockStatus: 'disponible',
},
{
  id: 'pm-010',
  name: 'Tortilla',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Tortilla recién hecha.',
  longDescription: 'Pan con tortilla.',
  image: '🥚',
  price: 300,
  stockStatus: 'disponible',
},
{
  id: 'pm-011',
  name: 'Jamón y Queso Especial',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Versión especial.',
  longDescription: 'Pan con jamón y queso especial.',
  image: '🥪',
  price: 490,
  stockStatus: 'disponible',
},
{
  id: 'pm-012',
  name: 'Croqueta',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Croqueta individual.',
  longDescription: 'Croqueta para añadir al pan.',
  image: '🍘',
  price: 280,
  stockStatus: 'agotado',
},
{
  id: 'pm-013',
  name: 'Queso',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Porción de queso.',
  longDescription: 'Queso para añadir al pan.',
  image: '🧀',
  price: 250,
  stockStatus: 'disponible',
},
{
  id: 'pm-014',
  name: 'Pollo',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Pollo preparado.',
  longDescription: 'Pan con pollo.',
  image: '🍗',
  price: 450,
  stockStatus: 'disponible',
},
{
  id: 'pm-015',
  name: 'Carne Asada',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Carne asada.',
  longDescription: 'Pan con carne asada.',
  image: '🥩',
  price: 700,
  stockStatus: 'disponible',
},
{
  id: 'pm-016',
  name: 'Perro Grande',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Perro caliente grande.',
  longDescription: 'Perro caliente tamaño grande.',
  image: '🌭',
  price: 350,
  stockStatus: 'disponible',
},
{
  id: 'pm-017',
  name: 'Mortadella',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Mortadella.',
  longDescription: 'Pan con mortadella.',
  image: '🥪',
  price: 270,
  stockStatus: 'disponible',
},
{
  id: 'pm-018',
  name: 'Lomo Ahumado',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Lomo ahumado.',
  longDescription: 'Pan con lomo ahumado.',
  image: '🥪',
  price: 700,
  stockStatus: 'disponible',
},
{
  id: 'pm-019',
  name: 'Especial de Pollo (Bistec)',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Especial de pollo.',
  longDescription: 'Pan especial con bistec de pollo.',
  image: '🍗',
  price: 650,
  stockStatus: 'agotado',
},
{
  id: 'pm-020',
  name: 'Bistec de Cerdo',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Bistec de cerdo.',
  longDescription: 'Pan con bistec de cerdo.',
  image: '🥩',
  price: 850,
  stockStatus: 'disponible',
},
{
  id: 'pm-021',
  name: 'Bistec de Res',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Bistec de res.',
  longDescription: 'Pan con bistec de res.',
  image: '🥩',
  price: 850,
  stockStatus: 'agotado',
},
{
  id: 'pm-022',
  name: 'Vaca Frita',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Vaca frita.',
  longDescription: 'Pan con vaca frita.',
  image: '🥩',
  price: 570,
  stockStatus: 'agotado',
},
{
  id: 'pm-022',
  name: 'Vaca Frita',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Vaca frita.',
  longDescription: 'Pan con vaca frita.',
  image: '🥩',
  price: 570,
  stockStatus: 'agotado',
},
{
  id: 'pm-023',
  name: 'Lechonazo',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Lechón.',
  longDescription: 'Pan con lechón.',
  image: '🥩',
  price: 1200,
  stockStatus: 'disponible',
},
{
  id: 'pm-024',
  name: 'Medianoche',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: '',
  longDescription: '',
  image: '🥩',
  price: 1100,
  stockStatus: 'disponible',
},
{
  id: 'pm-025',
  name: 'Imperial',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Pan especial imperial',
  longDescription: '',
  image: '🥩',
  price: 1300,
  stockStatus: 'disponible',
},
{
  id: 'pm-026',
  name: 'Chorizo',
  businessId: PANES,
  businessName: PANES_NAME,
  category: 'Comida',
  shortDescription: 'Pan con chorizo',
  longDescription: '',
  image: '🥩',
  price: 320,
  stockStatus: 'disponible',
},
  // ───────────────── Mercadito El Ahorro ─────────────────
  {
    id: 'ma-001', name: 'Arroz Guyanés(por libra)', businessId: MERCA2, businessName: MERCA2_NAME,
    category: 'Alimentos', shortDescription: 'Precio por libra.',
    longDescription: 'Arroz a granel, precio por libra. Indica la cantidad de libras al confirmar.',
    image: '🍚', photo: ArrozAgranel, price: 320, stockStatus: 'disponible',
  },
  {
    id: 'ma-002', name: 'Aceite (90mL)', businessId: MERCA2, businessName: MERCA2_NAME,
    category: 'Alimentos', shortDescription: 'Botella de 900ml.',
    longDescription: 'Aceite vegetal en botella de 900ml.',
    image: '🫒', photo: Aceite, price: 1500, stockStatus: 'disponible',
  },
  {
    id: 'ma-003', name: 'Perrito caliente', businessId: MERCA2, businessName: MERCA2_NAME,
    category: 'Alimentos', shortDescription: 'Salchicha + pan.',
    longDescription: 'Perrito caliente listo para preparar (salchicha y pan). Se vende por unidad.',
    image: '🌭', price: 620, stockStatus: 'disponible',
  },
  {
    id: 'ma-004', name: 'Azúcar (por libra)', businessId: MERCA2, businessName: MERCA2_NAME,
    category: 'Alimentos', shortDescription: 'Precio por libra.',
    longDescription: 'Azúcar a granel, precio por libra. Indica la cantidad de libras al confirmar.',
    image: '🍬', price: 400, stockStatus: 'disponible',
  },
  {
    id: 'ma-005', name: 'Jamonada de pollo (500)', businessId: MERCA2, businessName: MERCA2_NAME,
    category: 'Alimentos', shortDescription: 'Una libra.',
    longDescription: 'Jamonada de pollo, se entrega por libra.',
    image: '🍖', photo: Pollo, price: 700, stockStatus: 'disponible',
  },
  {
    id: 'ma-006', name: 'Lomo de cerdo en bistec (1 lb)', businessId: MERCA2, businessName: MERCA2_NAME,
    category: 'Alimentos', shortDescription: 'Una libra, en bistec.',
    longDescription: 'Lomo de cerdo cortado en bistec, se entrega por libra.',
    image: '🥩', photo: Hamburguesa, price: 1400, stockStatus: 'disponible',
  },
]
