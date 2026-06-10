import type { Addon, Business, Product } from '../../types'
import { makeDrinks } from '../drinks'

// Sin fotos propias por ahora: se reutiliza una imagen como logo del negocio.
import LogoPizza from '../../assets/images/products/pizza.jpg'

const ID = 'la-marina'
const NAME = 'La Marina'

export const laMarina: Business = {
  id: ID,
  name: NAME,
  description: 'Pizzas y espaguetis con agregos a elección, más bebidas frías.',
  image: LogoPizza,
  color: 'from-red-100 to-orange-50',
  schedule: { days: [0, 1, 2, 3, 4, 5, 6], open: '09:00', close: '22:00', label: 'Todos los días · 9:00 am – 10:00 pm' },
}

/** Agregos opcionales (máximo uno por producto). */
const AGREGOS: Addon[] = [
  { name: 'Jamón', price: 150 },
  { name: 'Queso', price: 200 },
  { name: 'Picadillo de cerdo', price: 300 },
  { name: 'Cebolla', price: 100 },
]

const comida: Product[] = [
  { id: 'lm-001', name: 'Espaguetis', businessId: ID, businessName: NAME, category: 'Comida',
     shortDescription: 'Con salsa de la casa.', longDescription: 'Espaguetis recién hechos. Puedes añadir un agrego.',
      image: '🍝', price: 450, addons: AGREGOS, stockStatus: 'disponible' },
  { id: 'lm-002', name: 'Pizza de Queso', businessId: ID, businessName: NAME, category: 'Comida',
     shortDescription: 'Clásica.', longDescription: 'Pizza de queso. Puedes añadir un agrego.', image: '🍕',
     price: 300, addons: AGREGOS, stockStatus: 'disponible' },
  { id: 'lm-003', name: 'Pizza Queso Doble', businessId: ID, businessName: NAME, category: 'Comida',
     shortDescription: 'Doble queso.', longDescription: 'Pizza con doble queso. Puedes añadir un agrego.', image: '🍕',
      price: 520, addons: AGREGOS, stockStatus: 'disponible' },
  { id: 'lm-004', name: 'Pizza de Jamón', businessId: ID, businessName: NAME, category: 'Comida',
     shortDescription: 'Con jamón.', longDescription: 'Pizza de jamón. Puedes añadir un agrego.', image: '🍕', 
     price: 670, addons: AGREGOS, stockStatus: 'disponible' },
  { id: 'lm-005', name: 'Pizza de Picadillo', businessId: ID, businessName: NAME, category: 'Comida',
     shortDescription: 'Con picadillo.', longDescription: 'Pizza de picadillo. Puedes añadir un agrego.', image: '🍕',
      price: 770, addons: AGREGOS, stockStatus: 'disponible' },
  { id: 'lm-006', name: 'Pizza de Cebolla', businessId: ID, businessName: NAME, category: 'Comida', 
    shortDescription: 'Con cebolla.', longDescription: 'Pizza de cebolla. Puedes añadir un agrego.',
     image: '🍕', price: 570, addons: AGREGOS, stockStatus: 'disponible' },
]

export const laMarinaProducts: Product[] = [...comida, ...makeDrinks(ID, NAME, 'lm-dr')]
