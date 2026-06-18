// @ts-nocheck
import type { Business, Product } from '../../types'
import { makeDrinks } from '../drinks'

import Macus from '../../assets/images/business/macus.jpg'
import PanSuperMacu from '../../assets/images/products/Macus/pan_macu.jpg'

const ID = 'panes-macus'
const NAME = 'Los Macus'

export const panesMacus: Business = {
  id: ID,
  name: NAME,
  description: 'Panadería: panes recién hechos y bebidas frías.',
  image: Macus,
  color: 'from-yellow-100 to-amber-50',
  schedule: { days: [0, 1, 2, 3, 4, 5, 6], open: '09:00', close: '22:00', label: 'Todos los días · 9:00 am – 10:00 pm' },
}

const panes: Product[] = [
  { id: 'pm-001', name: 'Jamón', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Pan con jamón.', longDescription: 'Pan con jamón recién preparado.', image: '🥪', price: 290, stockStatus: 'disponible' },
  { id: 'pm-002', name: 'Jamón y Queso', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Jamón y queso.', longDescription: 'Pan con jamón y queso.', image: '🥪', price: 340, stockStatus: 'disponible' },
  { id: 'pm-003', name: 'Hamburguesa', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Hamburguesa de la casa.', longDescription: 'Hamburguesa preparada al momento.', image: '🍔', price: 400, stockStatus: 'disponible' },
  { id: 'pm-004', name: 'Macu', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Especialidad de la casa.', longDescription: 'Pan Macu preparado al momento.', image: '🥪', price: 600, stockStatus: 'disponible' },
  { id: 'pm-005', name: 'Super Macu', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Nuestro producto estrella.', longDescription: 'Versión especial del Macu con ingredientes premium.', image: '🥪', photo: PanSuperMacu, price: 1370, stockStatus: 'disponible' },
  { id: 'pm-006', name: 'Aporreado', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Aporreado tradicional.', longDescription: 'Pan con aporreado recién preparado.', image: '🥪', price: 370, stockStatus: 'disponible' },
  { id: 'pm-007', name: 'Picadillo', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Picadillo preparado.', longDescription: 'Pan con picadillo.', image: '🥪', price: 210, stockStatus: 'disponible' },
  { id: 'pm-008', name: 'Surtido', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Combinación surtida.', longDescription: 'Pan surtido con diferentes ingredientes.', image: '🥪', price: 370, stockStatus: 'disponible' },
  { id: 'pm-009', name: 'Surtido Especial', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Versión especial.', longDescription: 'Pan surtido especial.', image: '🥪', price: 640, stockStatus: 'disponible' },
  { id: 'pm-010', name: 'Tortilla', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Tortilla recién hecha.', longDescription: 'Pan con tortilla.', image: '🥚', price: 300, stockStatus: 'disponible' },
  { id: 'pm-011', name: 'Jamón y Queso Especial', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Versión especial.', longDescription: 'Pan con jamón y queso especial.', image: '🥪', price: 490, stockStatus: 'disponible' },
  { id: 'pm-012', name: 'Croqueta', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Croqueta individual.', longDescription: 'Croqueta para añadir al pan.', image: '🍘', price: 280, stockStatus: 'agotado' },
  { id: 'pm-013', name: 'Queso', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Porción de queso.', longDescription: 'Queso para añadir al pan.', image: '🧀', price: 250, stockStatus: 'disponible' },
 // { id: 'pm-014', name: 'Pollo', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Pollo preparado.', longDescription: 'Pan con pollo.', image: '🍗', price: 450, stockStatus: 'disponible' },
 // { id: 'pm-015', name: 'Carne Asada', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Carne asada.', longDescription: 'Pan con carne asada.', image: '🥩', price: 700, stockStatus: 'disponible' },
  { id: 'pm-016', name: 'Perro Grande', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Perro caliente grande.', longDescription: 'Perro caliente tamaño grande.', image: '🌭', price: 350, stockStatus: 'disponible' },
  { id: 'pm-017', name: 'Mortadella', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Mortadella.', longDescription: 'Pan con mortadella.', image: '🥪', price: 270, stockStatus: 'disponible' },
  { id: 'pm-018', name: 'Lomo Ahumado', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Lomo ahumado.', longDescription: 'Pan con lomo ahumado.', image: '🥪', price: 700, stockStatus: 'disponible' },
  //{ id: 'pm-019', name: 'Especial de Pollo (Bistec)', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Especial de pollo.', longDescription: 'Pan especial con bistec de pollo.', image: '🍗', price: 650, stockStatus: 'agotado' },
  { id: 'pm-020', name: 'Bistec de Cerdo', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Bistec de cerdo.', longDescription: 'Pan con bistec de cerdo.', image: '🥩', price: 850, stockStatus: 'disponible' },
  { id: 'pm-021', name: 'Bistec de Res', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Bistec de res.', longDescription: 'Pan con bistec de res.', image: '🥩', price: 850, stockStatus: 'agotado' },
  { id: 'pm-022', name: 'Vaca Frita', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Vaca frita.', longDescription: 'Pan con vaca frita.', image: '🥩', price: 570, stockStatus: 'agotado' },
//  { id: 'pm-023', name: 'Lechonazo', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Lechón.', longDescription: 'Pan con lechón.', image: '🥩', price: 1200, stockStatus: 'disponible' },
  { id: 'pm-024', name: 'Medianoche', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: '', longDescription: '', image: '🥪', price: 1100, stockStatus: 'disponible' },
  { id: 'pm-025', name: 'Imperial', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Pan especial imperial', longDescription: '', image: '🥪', price: 1300, stockStatus: 'disponible' },
  { id: 'pm-026', name: 'Chorizo', businessId: ID, businessName: NAME, category: 'Comida', shortDescription: 'Pan con chorizo', longDescription: '', image: '🥩', price: 320, stockStatus: 'disponible' },
]

export const panesMacusProducts: Product[] = [...panes, ...makeDrinks(ID, NAME, 'pm-dr')]
