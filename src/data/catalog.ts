import type { Business, Product, Category } from '../types'
import BLogo from '../assets/images/business/mercado.webp'
import BLogo2 from '../assets/images/business/electrodomésticos.jpg'
import BLogo3 from '../assets/images/business/restaurant.jpg'
import Arroz from '../assets/images/products/arroz.webp'
import Aceite from '../assets/images/products/aceite.jpg'
import Frijoles from '../assets/images/products/frijoles.webp'
import Cafe from '../assets/images/products/café.avif'
import Refresco from '../assets/images/products/refresco.avif'
import Agua from '../assets/images/products/agua.webp'
import Jabón from '../assets/images/products/jabón.webp'
import Pasta from '../assets/images/products/pasta.jpg'
import Detergente from '../assets/images/products/detergente.jpg'
import sal from '../assets/images/products/sal.webp'
import Ventilador from '../assets/images/products/ventilador.jpg'
import Olla from '../assets/images/products/olla.webp'
import Licuadora from '../assets/images/products/licuadora.webp'
import Sartenes from '../assets/images/products/sartenes.webp'
import Bombillo from '../assets/images/products/bombillo.webp'
import Extension from '../assets/images/products/extension.jpg'
import Congris from '../assets/images/products/congris.jpg'
import Pollo from '../assets/images/products/pollo.jpg'
import Pizza from '../assets/images/products/pizza.jpg'
import Hamburguesa from '../assets/images/products/hamburguesa.jpg'
import Spaguetti from '../assets/images/products/espaguettis.jpg'
import Flan from '../assets/images/products/flan.jpg'
import Sandwich from '../assets/images/products/sandwich.jpg'

export const categories: Category[] = [
  'Alimentos',
  'Bebidas',
  'Aseo',
  'Hogar',
  'Electrodomésticos',
  'Comida',
]

export const categoryEmoji: Record<Category, string> = {
  Alimentos: '🥫',
  Bebidas: '🥤',
  Aseo: '🧼',
  Hogar: '🧺',
  Electrodomésticos: '🔌',
  Comida: '🍽️',
}

export const businesses: Business[] = [
  {
    id: 'bodega-central',
    name: 'La Bodega Central',
    description: 'Alimentos, bebidas y productos del hogar. Lo esencial del día a día.',
    image: BLogo,
    color: 'from-amber-100 to-orange-50',
  },
  {
    id: 'electrohogar',
    name: 'ElectroHogar',
    description: 'Electrodomésticos y artículos para tu casa, con garantía.',
    image: BLogo2,
    color: 'from-sky-100 to-cyan-50',
  },
  {
    id: 'el-patio',
    name: 'Restaurante El Patio',
    description: 'Comida criolla recién hecha, lista para disfrutar en casa.',
    image: BLogo3,
    color: 'from-rose-100 to-orange-50',
  },
]

export const products: Product[] = [
  // ───────────────── La Bodega Central ─────────────────
  {
    id: 'bc-001',
    name: 'Arroz grano largo 1 kg',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Alimentos',
    shortDescription: 'Blanco, de grano largo.',
    longDescription:
      'Arroz blanco de grano largo seleccionado, sin impurezas y de cocción uniforme. Bolsa de 1 kg sellada para mayor frescura. Rinde aproximadamente 4 porciones por libra.',
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
    longDescription:
      'Aceite vegetal 100% refinado, ideal para frituras, salteados y aderezos. Botella de 1 litro con tapa de seguridad. Sin colesterol.',
    image: '🫒',
    photo: Aceite,
    price: 780,
    stockStatus: 'disponible',
  },

  {
    id: 'bc-003',
    name: 'Frijoles negros 1 kg',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Alimentos',
    shortDescription: 'Secos, seleccionados.',
    longDescription:
      'Frijoles negros de primera calidad, limpios y listos para cocinar. Ricos en proteína y fibra. Bolsa de 1 kg.',
    image: '🫘',
    photo: Frijoles,
    price: 450,
    stockStatus: 'pocas',
  },
  {
    id: 'bc-004',
    name: 'Café molido 250 g',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Bebidas',
    shortDescription: 'Tueste natural cubano.',
    longDescription:
      'Café molido de tueste natural, aroma intenso y cuerpo equilibrado. Paquete de 250 g. Perfecto para la colada de la mañana.',
    image: '☕',
    photo: Cafe,
    price: 540,
    stockStatus: 'disponible',
  },
  {
    id: 'bc-005',
    name: 'Refresco de cola 2 L',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Bebidas',
    shortDescription: 'Bien frío, para compartir.',
    longDescription:
      'Refresco de cola carbonatado en botella de 2 litros. Sabor clásico y refrescante. Ideal para compartir en familia.',
    image: '🥤',
    photo: Refresco,
    price: 290,
    stockStatus: 'disponible',
  },
  {
    id: 'bc-006',
    name: 'Agua purificada 5 L',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Bebidas',
    shortDescription: 'Lista para beber.',
    longDescription:
      'Agua purificada por osmosis inversa, sin sabor ni olor. Botellón de 5 litros con tapón de seguridad. Ideal para beber y cocinar.',
    image: '💧',
    photo: Agua,
    price: 180,
    stockStatus: 'disponible',
  },
  {
    id: 'bc-007',
    name: 'Jabón de baño (x3)',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Aseo',
    shortDescription: 'Suave con la piel.',
    longDescription:
      'Pack de 3 jabones de tocador con glicerina y extractos naturales. Aroma fresco y duradero, apto para piel sensible. 100 g por unidad.',
    image: '🧼',
    photo: Jabón,
    price: 260,
    stockStatus: 'disponible',
  },
  {
    id: 'bc-008',
    name: 'Pasta dental 100 ml',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Aseo',
    shortDescription: 'Con flúor, protección total.',
    longDescription:
      'Pasta dental con flúor y acción antibacteriana. Protege contra caries y mal aliento. Tubo de 100 ml para uso familiar.',
    image: '🪥',
    photo: Pasta,
    price: 210,
    stockStatus: 'pocas',
  },
  {
    id: 'bc-009',
    name: 'Detergente en polvo 1 kg',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Hogar',
    shortDescription: 'Alto rendimiento.',
    longDescription:
      'Detergente en polvo de gran poder limpiador para máquina y lavado a mano. Cuida los colores y deja fragancia fresca. Rinde hasta 30 lavados.',
    image: '🧺',
    photo: Detergente,
    price: 560,
    stockStatus: 'disponible',
  },
  {
    id: 'bc-010',
    name: 'Sal de mesa 1 kg',
    businessId: 'bodega-central',
    businessName: 'La Bodega Central',
    category: 'Alimentos',
    shortDescription: 'Refinada, yodada.',
    longDescription:
      'Sal de mesa refinada y enriquecida con yodo. Grano fino que fluye con facilidad. Bolsa de 1 kg con cierre.',
    image: '🧂',
    photo: sal,
    price: 90,
    stockStatus: 'agotado',
  },

  // ───────────────── ElectroHogar ─────────────────
  {
    id: 'eh-001',
    name: 'Ventilador de mesa 12"',
    businessId: 'electrohogar',
    businessName: 'ElectroHogar',
    category: 'Electrodomésticos',
    shortDescription: '3 velocidades, silencioso.',
    longDescription:
      'Ventilador de mesa de 12" con motor silencioso de bajo consumo, 3 velocidades y oscilación automática. Rejilla desmontable para fácil limpieza. 110V.',
    image: '🌀',
    photo: Ventilador,
    price: 8500,
    stockStatus: 'disponible',
  },
  {
    id: 'eh-002',
    name: 'Olla de presión 4 L',
    businessId: 'electrohogar',
    businessName: 'ElectroHogar',
    category: 'Electrodomésticos',
    shortDescription: 'Acero inoxidable.',
    longDescription:
      'Olla a presión de acero inoxidable de 4 litros con doble válvula de seguridad. Ahorra hasta un 70% de tiempo y energía. Compatible con todas las cocinas.',
    image: '🍲',
    photo: Olla,
    price: 11200,
    stockStatus: 'disponible',
  },
  {
    id: 'eh-003',
    name: 'Licuadora 1.5 L',
    businessId: 'electrohogar',
    businessName: 'ElectroHogar',
    category: 'Electrodomésticos',
    shortDescription: '5 velocidades + pulso.',
    longDescription:
      'Licuadora con vaso de vidrio de 1.5 L, motor de 500W, 5 velocidades y función pulso. Cuchillas de acero desmontables. 110V.',
    image: '🥤',
    photo: Licuadora,
    price: 7400,
    stockStatus: 'pocas',
  },

  {
    id: 'eh-006',
    name: 'Set de sartenes (3 pzs)',
    businessId: 'electrohogar',
    businessName: 'ElectroHogar',
    category: 'Hogar',
    shortDescription: 'Antiadherentes.',
    longDescription:
      'Set de 3 sartenes antiadherentes de aluminio (20, 24 y 28 cm). Recubrimiento de 3 capas libre de PFOA y mango termoaislante.',
    image: '🍳',
    photo: Sartenes,
    price: 6900,
    stockStatus: 'disponible',
  },
  {
    id: 'eh-007',
    name: 'Bombillos LED 9W (x4)',
    businessId: 'electrohogar',
    businessName: 'ElectroHogar',
    category: 'Hogar',
    shortDescription: 'Bajo consumo.',
    longDescription:
      'Pack de 4 bombillos LED de 9W (equivalentes a 60W). Luz blanca neutra, casquillo E27, hasta 15.000 horas de vida útil.',
    image: '🔆',
    photo: Bombillo,
    price: 1500,
    stockStatus: 'pocas',
  },
  {
    id: 'eh-008',
    name: 'Extensión eléctrica 3 m',
    businessId: 'electrohogar',
    businessName: 'ElectroHogar',
    category: 'Electrodomésticos',
    shortDescription: '4 tomas + 2 USB.',
    longDescription:
      'Extensión de 3 metros con 4 tomas, 2 puertos USB y protector contra sobretensiones. Cable de cobre, interruptor con luz indicadora.',
    image: '🔌',
    photo: Extension,
    price: 2300,
    stockStatus: 'disponible',
  },


  // ───────────────── Restaurante El Patio ─────────────────
  {
    id: 'ep-001',
    name: 'Arroz congrí + cerdo',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Plato criollo completo.',
    longDescription:
      'Generosa ración de arroz congrí acompañado de masas de cerdo asado, yuca con mojo y ensalada fresca. El plato criollo de la casa.',
    image: '🍛',
    photo: Congris,
    price: 650,
    stockStatus: 'disponible',
  },
  {
    id: 'ep-002',
    name: 'Pollo asado con papas',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Jugoso, recién hecho.',
    longDescription:
      'Cuarto de pollo asado al horno, marinado con especias de la casa, acompañado de papas doradas y arroz blanco.',
    image: '🍗',
    photo: Pollo,
    price: 720,
    stockStatus: 'disponible',
  },
  {
    id: 'ep-003',
    name: 'Pizza de queso (mediana)',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Masa artesanal.',
    longDescription:
      'Pizza mediana de masa artesanal con abundante queso gratinado y salsa de tomate natural. Lista para compartir.',
    image: '🍕',
    photo: Pizza,
    price: 580,
    stockStatus: 'disponible',
  },
  {
    id: 'ep-004',
    name: 'Hamburguesa de la casa',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Carne, queso y vegetales.',
    longDescription:
      'Hamburguesa de carne de res a la parrilla con queso fundido, lechuga, tomate y salsa especial. Incluye papas fritas.',
    image: '🍔',
    photo: Hamburguesa,
    price: 540,
    stockStatus: 'pocas',
  },
  {
    id: 'ep-005',
    name: 'Espaguetis a la boloñesa',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Salsa de carne casera.',
    longDescription:
      'Espaguetis al dente bañados en salsa boloñesa casera con carne molida y un toque de queso. Porción individual abundante.',
    image: '🍝',
    photo: Spaguetti,
    price: 490,
    stockStatus: 'disponible',
  },
  {
    id: 'ep-006',
    name: 'Sándwich cubano',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Pan tostado, bien servido.',
    longDescription:
      'Clásico sándwich cubano con jamón, cerdo asado, queso, pepinillos y mostaza, en pan tostado a la plancha.',
    image: '🥪',
    photo: Sandwich,
    price: 380,
    stockStatus: 'disponible',
  },
 

  {
    id: 'ep-009',
    name: 'Flan de la casa',
    businessId: 'el-patio',
    businessName: 'Restaurante El Patio',
    category: 'Comida',
    shortDescription: 'Postre cremoso.',
    longDescription:
      'Flan casero de huevo con caramelo, suave y cremoso. El cierre perfecto para tu pedido.',
    image: '🍮',
    photo: Flan,
    price: 220,
    stockStatus: 'pocas',
  },
]
