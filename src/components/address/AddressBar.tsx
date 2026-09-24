import { useState } from 'react'
import { useAddress } from '../../context/AddressContext'
import { AddressSheet } from './AddressSheet'
import { Icon } from '../ui/Icon'

type Variant = 'home' | 'card' | 'pill' | 'header'

export function AddressBar({ variant = 'home' }: { variant?: Variant }) {
  const { address, saveAddress } = useAddress()
  const [open, setOpen] = useState(false)

  const trigger =
    variant === 'header' ? (
      <HeaderTrigger address={address} onClick={() => setOpen(true)} />
    ) : variant === 'pill' ? (
      <PillTrigger address={address} onClick={() => setOpen(true)} />
    ) : (
      <FullTrigger address={address} isCard={variant === 'card'} onClick={() => setOpen(true)} />
    )

  return (
    <>
      {trigger}
      <AddressSheet
        open={open}
        initial={address}
        onClose={() => setOpen(false)}
        onSave={(a) => {
          saveAddress(a)
          setOpen(false)
        }}
      />
    </>
  )
}

function PinIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  )
}

/** Pill de la cabecera compartida — igual que `TopHeader` de la app móvil. */
function HeaderTrigger({
  address,
  onClick,
}: {
  address: ReturnType<typeof useAddress>['address']
  onClick: () => void
}) {
  const label = address ? address.direccion : 'Agregar dirección'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Dirección de entrega: ${label}`}
      className="w-full min-w-0 flex items-center justify-center gap-1 rounded-full bg-background px-3 py-2 hover:bg-surface-muted transition-colors"
    >
      <Icon name="location" size={16} filled className="text-primary shrink-0" />
      <span className="text-caption font-semibold text-text-primary truncate">{label}</span>
      <Icon name="chevron-down" size={14} className="text-text-tertiary shrink-0" />
    </button>
  )
}

/** Pill compacto (al lado del logo). */
function PillTrigger({
  address,
  onClick,
}: {
  address: ReturnType<typeof useAddress>['address']
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 max-w-[210px] pl-2.5 pr-2 py-1.5 rounded-full bg-surface/80 backdrop-blur border border-border hover:border-primary/40 transition-colors"
    >
      <span className="text-primary flex-shrink-0">
        <PinIcon />
      </span>
      <span className="flex flex-col items-start min-w-0 leading-tight">
        <span className="text-[10px] font-semibold text-text-secondary -mb-0.5">
          {address ? 'Entregar en' : 'Dirección'}
        </span>
        <span className="text-xs font-bold text-text-primary truncate max-w-[130px]">
          {address ? address.direccion : 'Agregar'}
        </span>
      </span>
      <svg className="text-text-secondary flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
      </svg>
    </button>
  )
}

/** Fila completa (usada en checkout y como tarjeta). */
function FullTrigger({
  address,
  isCard,
  onClick,
}: {
  address: ReturnType<typeof useAddress>['address']
  isCard: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left transition-colors ${
        isCard ? 'bg-surface border border-border rounded-3xl p-4 hover:border-primary/40' : 'py-1'
      }`}
    >
      <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
        <PinIcon className="!w-5 !h-5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[11px] font-semibold text-text-secondary leading-tight">
          {address ? 'Entregar en' : 'Sin dirección'}
        </span>
        <span className={`block text-sm font-bold truncate ${address ? 'text-text-primary' : 'text-primary'}`}>
          {address ? address.direccion : 'Agregar dirección'}
        </span>
      </span>
      <svg className="text-text-secondary flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        {address ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        )}
      </svg>
    </button>
  )
}
