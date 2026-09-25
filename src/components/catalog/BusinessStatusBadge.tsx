import { getBusinessStatus } from '../../features/catalog'
import type { CatalogBusiness } from '../../types/backend/catalog'
import { StatusBadge, type StatusTone } from '../ui/StatusBadge'

const TONE: Record<ReturnType<typeof getBusinessStatus>['label'], StatusTone> = {
  ABIERTO: 'success',
  CERRADO: 'danger',
  'NO ACEPTA PEDIDOS': 'warning',
}

/** Abierto / cerrado / no acepta pedidos — lo decide el backend, nunca el horario en el navegador. */
export function BusinessStatusBadge({ business }: { business: Pick<CatalogBusiness, 'acceptingOrders' | 'isOpenNow'> }) {
  const status = getBusinessStatus(business)
  return <StatusBadge label={status.label} tone={TONE[status.label]} />
}
