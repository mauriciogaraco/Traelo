// @ts-nocheck
import type { Business, Product } from '../../types'

import BMercado from '../../assets/images/business/Mercadito.jpg'
import ArrozAgranel from '../../assets/images/products/mercado/arroz_brasileño_agranel.jpg'
import Aceite from '../../assets/images/products/mercado/aceite_900ml.jpg'


import PerritosMana from '../../assets/images/products/mercado/perritos_mana.jpg'
import SopaInstantanea from '../../assets/images/products/mercado/sopa_instantanea.jpg'
import Mortadella500g from '../../assets/images/products/mercado/mortadella_500g.webp'
import azucar from '../../assets/images/products/mercado/azucar_blanca_lb.jpg'
import JabonFefe from '../../assets/images/products/mercado/FEFE_jabon.jpg'
import arrozKg from '../../assets/images/products/mercado/arroz_sam1kg.jpg'
import mortadellaKg from '../../assets/images/products/mercado/mortadella_1kg.jpg'
import spamTubo from '../../assets/images/products/mercado/spam_tubo.webp'
import yogurtvaso  from '../../assets/images/products/mercado/yogurt_vaso.webp'
import frijoles1kg  from '../../assets/images/products/mercado/pontarollo.jpg'
const ID = 'mercadito-ahorro'
const NAME = 'El Mercadito'

export const mercaditoAhorro: Business = {
  id: ID,
  name: NAME,
  description: 'Granos por libra, aceite y embutidos frescos.',
  image: BMercado,
  color: 'from-emerald-100 to-teal-50',
  schedule: { days: [0, 1, 2, 3, 4, 5, 6], open: '09:00', close: '22:00', label: 'Todos los días · 9:00 am – 10:00 pm' },
}

export const mercaditoAhorroProducts: Product[] = [
  { id: 'ma-001', name: 'Arroz Guyanés (por libra)', businessId: ID, businessName: NAME,
     category: 'Alimentos', shortDescription: 'Precio por libra.',
      longDescription: 'Arroz a granel, precio por libra. Indica la cantidad de libras al confirmar.', image: '🍚',
       photo: ArrozAgranel, price: 320, stockStatus: 'disponible' },
  { id: 'ma-002', name: 'Aceite (900 mL)', businessId: ID, businessName: NAME, category: 'Alimentos',
     shortDescription: 'Botella de 900ml.', longDescription: 'Aceite vegetal en botella de 900ml.', image: '🫒', 
     photo: Aceite, price: 1500, stockStatus: 'disponible' },
  { id: 'ma-003', name: 'Perrito caliente', businessId: ID,photo: PerritosMana, businessName: NAME, 
    category: 'Alimentos', shortDescription: 'Salchicha + pan.', 
    longDescription: 'Perrito caliente listo para preparar (salchicha y pan). Se vende por unidad.', image: '🌭',
     price: 620, stockStatus: 'disponible' },
  { id: 'ma-004', name: 'Azúcar (por libra)', businessId: ID, photo: azucar, businessName: NAME, category: 'Alimentos', 
    shortDescription: 'Precio por libra.',
     longDescription: 'Azúcar a granel, precio por libra. Indica la cantidad de libras al confirmar.',
     image: '🍬', price: 400, stockStatus: 'disponible' },
  { id: 'ma-005', name: 'Jamonada de pollo (500 g)',photo: Mortadella500g, businessId: ID, businessName: NAME,
     category: 'Alimentos', shortDescription: 'Media libra.', longDescription: 'Jamonada de pollo, se entrega por unidad.', 
     image: '🍖', price: 700, stockStatus: 'disponible' },
  { id: 'ma-006', name: 'Lomo de cerdo en bistec (1 lb)', businessId: ID, businessName: NAME, category: 'Alimentos',
     shortDescription: 'Una libra, en bistec.', longDescription: 'Lomo de cerdo cortado en bistec, se entrega por libra.', image: '🥩', 
      price: 1400, stockStatus: 'disponible' },
    { id: 'ma-013', name: 'Sopita instantánea', businessId: ID, businessName: NAME, category: 'Alimentos',
      shortDescription: '', longDescription: 'Sopa intantanea.', image: '🍚', 
      photo: SopaInstantanea, price: 200, stockStatus: 'disponible' },
       { id: 'ma-007', name: 'Jabón en Polvo', businessId: ID, businessName: NAME, category: 'Aseo',
      shortDescription: '', longDescription: 'Jabón en polvo para lavado de ropa (1kg).', image: '🍚', 
      photo: JabonFefe, price: 1200, stockStatus: 'disponible' },

       { id: 'ma-008', name: 'Mortadella 1kg', businessId: ID, businessName: NAME, category: 'Alimentos',
      shortDescription: '', longDescription: 'Mortadella de 1kg.', image: '�', 
      photo: mortadellaKg, price: 1300, stockStatus: 'disponible' },

          { id: 'ma-009', name: 'Spam de tubo', businessId: ID, businessName: NAME, category: 'Alimentos',
      shortDescription: '', longDescription: 'Spam de tubo (400g).', image: '', 
      photo: spamTubo, price: 700, stockStatus: 'disponible' },
      
          { id: 'ma-0010', name: 'Frijoles 1kg', businessId: ID, businessName: NAME, category: 'Alimentos',
      shortDescription: '', longDescription: 'Frijoles de 1kg.', image: '', 
      photo: frijoles1kg, price: 850, stockStatus: 'disponible' },

             { id: 'ma-0011', name: 'Arroz 1kg', businessId: ID, businessName: NAME, category: 'Alimentos',
      shortDescription: '', longDescription: 'Arroz de 1kg.', image: '', 
      photo: arrozKg, price: 700, stockStatus: 'disponible' },

            { id: 'ma-0012', name: 'Yogurt Vaso', businessId: ID, businessName: NAME, category: 'Alimentos',
      shortDescription: '', longDescription: 'Yogurt envasaado', image: '', 
      photo: yogurtvaso, price: 250, stockStatus: 'disponible' },
]
