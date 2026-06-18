---
name: project-traelo-familia
description: Contexto del proyecto Tráelo Familia — arquitectura, decisiones clave, qué está implementado y qué falta
metadata:
  type: project
---

## Tráelo Familia — Estado del proyecto (junio 2026)

Aplicación React + Vite + TypeScript basada en el proyecto Tráelo (mismo repo, misma rama main).

**Por qué:** Versión de Tráelo orientada a la diáspora cubana (USA) que compra para familiares en Güira de Melena. Pago por Zelle, entrega local incluida en precio, moneda USD.

**How to apply:** Este es el mismo codebase que Tráelo. Cuando se trabaje en este proyecto, asumir que los precios son USD y el flujo es comprador-en-USA → destinatario-en-Güira.

---

## Cambios realizados vs Tráelo original

| Archivo | Cambio |
|---|---|
| `tailwind.config.js` | Nueva paleta: primary #C96A3D, accent #7A8F5A, text-primary #4A2C1A |
| `src/types/index.ts` | `Category` → Combos/Comidas/Regalos/Bebidas/Panadería; `Address` → buyer+recipient fields; `Business.schedule` optional |
| `src/lib/format.ts` | `formatPrice` → USD ($15, $15.50) |
| `src/lib/fees.ts` | `computeFee` siempre retorna 0 (mensajería incluida en precio) |
| `src/lib/telegram.ts` | Mensaje Familia: comprador, WhatsApp, destinatario, dirección, Zelle note |
| `src/lib/config.ts` | SITE_URL actualizado; mismo bot/chat Telegram |
| `src/lib/hours.ts` | `isOpenNow` siempre true (sin horarios); `ordersClosedForToday` siempre false |
| `src/services/catalog.ts` | Carga `/data/catalog-familia.json` (cache key `traelo_familia_catalog_v1`) |
| `src/data/catalog.ts` | Nuevas categorías y emojis |
| `src/components/ui/Logo.tsx` | "Tráelo" + "FAMILIA" en accent color |
| `src/components/address/AddressSheet.tsx` | Formulario nuevo: nombreComprador, whatsappComprador, nombreDestinatario, direccion, observaciones |
| `src/components/address/AddressBar.tsx` | Muestra destinatario en pill |
| `src/components/product/ProductCard.tsx` | USD, sin lógica de horarios |
| `src/pages/HomePage.tsx` | Landing emocional: hero, categorías, productos, cómo funciona, confianza, soporte |
| `src/pages/CartPage.tsx` | USD, mensajería incluida, Zelle note |
| `src/pages/CheckoutPage.tsx` | Sin horarios, sin delivery time, Zelle note, datos buyer+recipient |
| `src/pages/ProductDetailPage.tsx` | USD, sin horarios |
| `src/pages/OrdersPage.tsx` | USD, muestra destinatario |
| `public/data/catalog-familia.json` | Catálogo curado: 4 negocios, 17 productos, todos en USD |
| `index.html` | Título y meta description Familia |
| `vite.config.ts` | PWA manifest Familia, nuevo theme color |

## Catálogo Familia

4 categorías de negocio:
- **Combos** (5 combos: $18–$45)
- **Bar Restaurante DLM** (4 comidas: $7–$15)
- **Panadería Los Macus** (4 productos: $4–$8)
- **Bebidas & Regalos** (4 productos: $8–$22)

Total: 17 productos en USD.

## Pendiente / próximos pasos

- Combos destacados para el Día de los Padres (campaña activa)
- Fotos propias de combos (actualmente reusan fotos de productos individuales)
- Más productos: electrodomésticos, ventiladores (estructura ya soportada)
- Posible: banner de campaña "Día de los Padres" en el hero
