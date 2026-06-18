// @ts-nocheck
import type { Business, Product } from '../../types'

import BCentral from '../../assets/images/business/alpha.jpg'
import Avena from '../../assets/images/products/mercadito/avena.jpg'
import Bambil from '../../assets/images/products/mercadito/bambil.jpg'
import Botonetas from '../../assets/images/products/mercadito/botonetas.jpg'
import Chicharrones from '../../assets/images/products/mercadito/chicharrones.jpg'
import ChupaChups from '../../assets/images/products/mercadito/chups_chups.jpg'
import Coconut from '../../assets/images/products/mercadito/coconut.jpg'
import Crackers from '../../assets/images/products/mercadito/crackers.jpg'
import Cukis from '../../assets/images/products/mercadito/cukis.jpg'
import CulerosBebish from '../../assets/images/products/mercadito/culeros_bebish.jpg'
//import CulerosLula from '../../assets/images/products/mercadito/culeros_lula.jpg'
//import Donas from '../../assets/images/products/mercadito/donas.jpg'
import Frijoles from '../../assets/images/products/mercadito/frijoles.jpg'
import Gelatina from '../../assets/images/products/mercadito/gelatina.jpg'
import GelatinaPomo from '../../assets/images/products/mercadito/gelatina_pomo.jpg'
import Intimas from '../../assets/images/products/mercadito/intimas.jpg'
//import JabonLavar from '../../assets/images/products/mercadito/jabón_de_lavar.jpg'
import JugosPetit from '../../assets/images/products/mercadito/jugos_petit.jpg'
import Jumbo from '../../assets/images/products/mercadito/jumbo.jpg'
import Lavavajillas from '../../assets/images/products/mercadito/lavavajillas.jpg'
import Mayonesa from '../../assets/images/products/mercadito/mayonesa.jpg'
import Papel from '../../assets/images/products/mercadito/papel_higienico.jpg'
import PastillaCongris from '../../assets/images/products/mercadito/pastillaCongrís.jpg'
import PastillaPolloTomate from '../../assets/images/products/mercadito/pastilla_de_pollo_con_tomate.jpg'
import PeterNeptun from '../../assets/images/products/mercadito/peter_neptun.jpg'
import PurePapas from '../../assets/images/products/mercadito/pure_de_papas.jpg'
import RefrescoCana from '../../assets/images/products/mercadito/refresco_cana_cola.jpg'
import Shaka from '../../assets/images/products/mercadito/shaka.jpg'
import Spaguetti from '../../assets/images/products/mercadito/spaguetti.jpg'
import Vinagre from '../../assets/images/products/mercadito/Vinagre.jpg'
import Yogurt from '../../assets/images/products/mercadito/yogurt_vima.jpg'
import ZumoNaranjaLimon from '../../assets/images/products/mercadito/zumo_naranja_limon.jpg'
import QuesoCriollo from '../../assets/images/products/mercadito/queso_criollo.jpg'
import ArrozSam from '../../assets/images/products/mercadito/arroz_sam.jpg'
//import CoditosAda from '../../assets/images/products/mercadito/coditos_ada.jpg'
import DetergenteLiquido from '../../assets/images/products/mercadito/detergente_liquido.jpg'
import Bombones from '../../assets/images/products/mercadito/bombones.jpg'
import PastaDental from '../../assets/images/products/mercadito/bombones.jpg'
import ToasllitasHumedas from '../../assets/images/products/mercadito/toallitas_indoxa.jpg'

const ID = 'bodega-central'
const NAME = 'Mercado Alpha'

export const bodegaCentral: Business = {
  id: ID,
  name: NAME,
  description: 'Mercado Alpha: alimentos, bebidas y aseo del día a día.',
  image: BCentral,
  color: 'from-amber-100 to-orange-50',
  paymentNote: 'Solo se aceptan billetes de 50 CUP en adelante.',
  schedule: { days: [1, 2, 3, 4, 5, 6], open: '09:00', close: '17:00', label: 'Lun–Sáb · 9:00 am – 5:00 pm' },
}

export const bodegaCentralProducts: Product[] = [
  { id: 'bc-001', name: 'Avena con leche', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: 'Lista para preparar.', longDescription: 'Avena con leche, se vende por unidad.', image: '🥣', photo: Avena, price: 2250, stockStatus: 'disponible' },
  { id: 'bc-002', name: 'Chicharrones de viento', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: 'Listos para freír.', longDescription: 'Se venden por unidad, listos para freír.', image: '🍟', photo: Chicharrones, price: 850, stockStatus: 'disponible' },
  { id: 'bc-003', name: 'Shaka (vodka energético)', businessId: ID, businessName: NAME, category: 'Bebidas', shortDescription: 'Caja de 24 unidades.', longDescription: 'Llévate la caja de 24 unidades y disfruta del sabor que todos aman.', image: '🥤', photo: Shaka, price: 400, formato: 24, stockStatus: 'disponible' },
  { id: 'bc-004', name: 'Refresco Cana', businessId: ID, businessName: NAME, category: 'Bebidas', shortDescription: 'Elige una opción para añadir al carrito', longDescription: 'Excelente calidad. Se vende por blister de 12 unidades. Contiene 420ml', formato: 12, options: ['Cola', 'Uva', 'Limón', 'Naranja', 'Frambuesa'], image: '🥤', photo: RefrescoCana, price: 250, stockStatus: 'disponible' },
  { id: 'bc-005', name: 'Papel sanitario', businessId: ID, businessName: NAME, category: 'Aseo', shortDescription: 'Extra suave.', longDescription: 'Se vende por paca de 24 unidades.', image: '🧻', photo: Papel, price: 500, formato: 24, stockStatus: 'disponible' },
  { id: 'bc-008', name: 'Botonetas', businessId: ID, businessName: NAME, category: 'Confituras', shortDescription: 'Tira de 24 unidades.', longDescription: 'Se venden por tira de 24 unidades.', image: '🧀', photo: Botonetas, price: 55, formato: 24, stockStatus: 'disponible' },
  { id: 'bc-009', name: 'Chupa Chupa XXXL', businessId: ID, businessName: NAME, category: 'Confituras', shortDescription: 'Estuche de 48 unidades.', longDescription: 'Se vende por estuches de 48 unidades.', image: '🍭', photo: ChupaChups, price: 47, formato: 48, stockStatus: 'disponible' },
  { id: 'bc-010', name: 'Culeros Bebish', businessId: ID, businessName: NAME, category: 'Aseo', shortDescription: 'Pañales desechables.', longDescription: 'Se vende por unidad.', image: '🧷', photo: CulerosBebish, price: 2800, stockStatus: 'disponible' },

  { id: 'bc-012', name: 'Bambil', businessId: ID, businessName: NAME, category: 'Confituras', shortDescription: '', longDescription: 'Se vende por unidad.', image: '🧃', photo: Bambil, price: 330, stockStatus: 'disponible' },
  { id: 'bc-013', name: 'Galletas Coconut', businessId: ID, businessName: NAME, category: 'Confituras', shortDescription: 'De coco.', longDescription: 'Se vende por estuches de 12 unidades', formato: 12, image: '🍪', photo: Coconut, price: 85, stockStatus: 'disponible' },
  { id: 'bc-014', name: 'Crackers', businessId: ID, businessName: NAME, category: 'Confituras', shortDescription: 'Galletas saladas.', longDescription: 'Galletas tipo cracker. Se vende por unidad.', image: '🍘', photo: Crackers, price: 230, stockStatus: 'disponible' },
  { id: 'bc-015', name: "Cuki's", businessId: ID, businessName: NAME, category: 'Confituras', shortDescription: 'Elige una opción para añadir', longDescription: ' Se vende por estuche de 12 unidades', options: ['Vainilla', 'Chocolate'], image: '🍪', photo: Cukis, price: 1050, stockStatus: 'disponible' },

  { id: 'bc-017', name: 'Frijoles negros', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: '500 gramos.', longDescription: 'Se vende por unidad', image: '🫘', photo: Frijoles, price: 400, stockStatus: 'disponible' },
  { id: 'bc-018', name: 'Gelatina', businessId: ID, businessName: NAME, category: 'Confituras', shortDescription: '', longDescription: 'Se vende por unidad.', image: '🍮', photo: Gelatina, price: 300, stockStatus: 'disponible' },
  { id: 'bc-019', name: 'Gelatina en pomo', businessId: ID, businessName: NAME, category: 'Confituras', shortDescription: 'Lista para comer.', longDescription: 'Gelatina en pomo. Se vende por pomos de 100 unidades', options: ['Pingüino', 'Mono'], image: '🍮', photo: GelatinaPomo, price: 3500, stockStatus: 'disponible' },
  { id: 'bc-020', name: 'Diarias', businessId: ID, businessName: NAME, category: 'Aseo', shortDescription: '', longDescription: 'Se vende por unidad.', image: '🧻', photo: Intimas, price: 580, stockStatus: 'disponible' },
  
  { id: 'bc-022', name: 'Jugos Petit', businessId: ID, businessName: NAME, category: 'Bebidas', shortDescription: 'El mejor jugo del mercado', longDescription: 'Se vende por cajas de 24 unidades, viene surtido los 3 sabores en la caja', formato: 24, image: '🧃', photo: JugosPetit, price: 200, stockStatus: 'disponible' },
  { id: 'bc-023', name: 'Galletas Jumbo', businessId: ID, businessName: NAME, category: 'Confituras', shortDescription: '', longDescription: 'Se vende por estuches de 12 unidades', formato: 12, image: '🧺', photo: Jumbo, price: 85, stockStatus: 'disponible' },
  { id: 'bc-024', name: 'Lavavajillas', businessId: ID, businessName: NAME, category: 'Aseo', shortDescription: 'Pote Lavavajillas', longDescription: 'Lavavajillas líquido. Se vende por unidad.', image: '🧴', photo: Lavavajillas, price: 560, stockStatus: 'disponible' },
  { id: 'bc-025', name: 'Mayonesa', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: 'Cremosa.', longDescription: 'Mayonesa en pomo. Se vende por blister de 12 unidades', formato: 12, image: '🥚', photo: Mayonesa, price: 820, stockStatus: 'disponible' },
  { id: 'bc-026', name: 'Pastilla para congrí', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: 'Sazón en pastilla.', longDescription: 'Se vende por caja de 48 pastillitas', formato: 12, image: '🧂', photo: PastillaCongris, price: 60, stockStatus: 'disponible' },
  { id: 'bc-027', name: 'Pastilla de pollo', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: 'Sazón en pastilla.', longDescription: 'Pastilla saborizante de pollo . Se vende por caajita de 12 unidades.', formato: 12, image: '🧂', photo: PastillaPolloTomate, price: 20
    , stockStatus: 'disponible' },
  { id: 'bc-028', name: 'Peter Neptun', businessId: ID, businessName: NAME, category: 'Confituras', shortDescription: '', longDescription: 'Se vende por cajas de 24 unidades', formato: 24, image: '🍪', photo: PeterNeptun, price: 135, stockStatus: 'disponible' },
  { id: 'bc-029', name: 'Puré de papas', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: '1kg', longDescription: ' Se vende por unidad.', image: '🥔', photo: PurePapas, price: 3370, stockStatus: 'disponible' },
  { id: 'bc-030', name: 'Espaguetis', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: '500 gramos.', longDescription: 'Se vende por cajas de 20 unidades.', formato: 20, image: '🍝', photo: Spaguetti, price: 235, stockStatus: 'disponible' },
  { id: 'bc-031', name: 'Vinagre', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: 'Pomo de 1 litro.', longDescription: 'Se vende por blister de 10 unidades.', formato: 10, image: '🧴', photo: Vinagre, price: 250, stockStatus: 'disponible' },
  { id: 'bc-032', name: 'Yogurt Vima', businessId: ID, businessName: NAME, category: 'Bebidas', shortDescription: 'x4', longDescription: ' Se vende por estuche de 4 vasitos', options: ['Fresa', 'Natural'], image: '🥛', photo: Yogurt, price: 880, stockStatus: 'disponible' },
  { id: 'bc-033', name: 'Detergente Líquido', businessId: ID, businessName: NAME, category: 'Aseo', shortDescription: 'Detergente líquido multiuso', longDescription: 'Se venden por blister 10 unidades.', formato: 10, image: '🧴', photo: DetergenteLiquido, price: 340, stockStatus: 'disponible' },
  { id: 'bc-034', name: 'Toallitas Húmedas', businessId: ID, businessName: NAME, category: 'Aseo', shortDescription: 'Toallitas húmedas para el cuidado personal', longDescription: 'Se venden por unnidad.', image: '🧴', photo: ToasllitasHumedas, price: 650, stockStatus: 'disponible' },
  { id: 'bc-035', name: 'Bombones', businessId: ID, businessName: NAME, category: 'Confituras', shortDescription: '', longDescription: 'Se venden por paquete 80/90 bombones', image: '🍫', photo: Bombones, price: 3200, stockStatus: 'disponible' },
  { id: 'bc-036', name: 'Pasta Dental CoolWhite', businessId: ID, businessName: NAME, category: 'Aseo', shortDescription: 'Pasta dental', longDescription: 'Se venden por paquete de 12 unidades', formato: 12, image: '🪥', photo: PastaDental, price: 360, stockStatus: 'disponible' },
 // { id: 'bc-037', name: 'Coditos Ada', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: '', longDescription: 'Se vende por paca de 20 unidades', formato: 20, image: '🍝', photo: CoditosAda, price: 290, stockStatus: 'disponible' },
  { id: 'bc-038', name: 'Queso criollo', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: '', longDescription: 'Se vende por libra', image: '🧀', photo: QuesoCriollo, price: 750, stockStatus: 'disponible' },
  { id: 'bc-039', name: 'Zumo Naranja/Limón', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: '', longDescription: 'Se vende por blister de 10 unidades', formato: 10, options: ['Naranja', 'Limón'], image: '🧃', photo: ZumoNaranjaLimon, price: 750, stockStatus: 'disponible' },
  { id: 'bc-040', name: 'Arroz Sam 1kg', businessId: ID, businessName: NAME, category: 'Alimentos', shortDescription: '', longDescription: 'Se vende por paca de 10 unidades', formato: 10, image: '🍚', photo: ArrozSam, price: 640, stockStatus: 'disponible' },
]
