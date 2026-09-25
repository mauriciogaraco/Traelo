import type { CatalogBusiness } from '../../types/backend/catalog';

export type BusinessStatusInfo = {
  label: 'ABIERTO' | 'CERRADO' | 'NO ACEPTA PEDIDOS';
};

/**
 * Deriva el estado visual del negocio — checklist §11. El backend ya decide
 * acceptingOrders/isOpenNow; esto solo traduce esos dos booleanos a una etiqueta.
 * Nunca calcular "abierto/cerrado" por horario en el cliente.
 *
 * Sin color: el color depende del tema activo (Light/Dark) — lo resuelve `BusinessStatusBadge`
 * con `useAppTheme()`, no esta función pura.
 */
export function getBusinessStatus(business: Pick<CatalogBusiness, 'acceptingOrders' | 'isOpenNow'>): BusinessStatusInfo {
  if (!business.acceptingOrders) {
    return { label: 'NO ACEPTA PEDIDOS' };
  }
  if (business.isOpenNow) {
    return { label: 'ABIERTO' };
  }
  return { label: 'CERRADO' };
}
