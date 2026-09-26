import { useEffect, useState } from 'react'
import { useAddressStore } from '../../store/addressStore'
import type { SavedAddress } from '../../types/backend/customer'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import { TextField } from '../ui/TextField'

interface AddressSheetProps {
  open: boolean
  /** La dirección a editar; null = agregar una nueva (que queda como predeterminada si es la primera). */
  address: SavedAddress | null
  onClose: () => void
}

/**
 * Agregar o editar una dirección de la libreta de este navegador — mismas reglas que mobile: la
 * dirección escrita es obligatoria (3+ caracteres), el nombre corto y la referencia son opcionales.
 */
export function AddressSheet({ open, address, onClose }: AddressSheetProps) {
  const add = useAddressStore((state) => state.add)
  const update = useAddressStore((state) => state.update)
  const [label, setLabel] = useState('')
  const [text, setText] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLabel(address?.label ?? '')
    setText(address?.address ?? '')
    setReference(address?.reference ?? '')
    setError(null)
  }, [open, address])

  const save = () => {
    const trimmed = text.trim()
    if (trimmed.length < 3) {
      setError('Escribe la dirección (calle, número, entre calles…)')
      return
    }
    const fields = { label: label.trim() || 'Casa', address: trimmed, reference: reference.trim() || null }
    if (address) update(address.id, fields)
    else add(fields)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={address ? 'Editar dirección' : 'Agregar dirección'}
      footer={
        <Button fullWidth onClick={save}>
          Guardar dirección
        </Button>
      }
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <TextField label="Nombre (opcional, ej.: Casa, Trabajo)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <TextField
          label="Dirección (calle, número, entre calles...)"
          autoComplete="street-address"
          value={text}
          error={error ?? undefined}
          onChange={(e) => setText(e.target.value)}
        />
        <TextField label="Referencia (opcional, ej.: casa azul frente al parque)" value={reference} onChange={(e) => setReference(e.target.value)} />
        <p className="text-caption text-text-secondary">Se guarda solo en este navegador, para pedir más rápido.</p>
      </form>
    </Sheet>
  )
}
