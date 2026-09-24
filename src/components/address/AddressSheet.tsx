import { useEffect, useState } from 'react'
import type { Address } from '../../types'
import { Button } from '../ui/Button'

interface AddressSheetProps {
  open: boolean
  initial: Address | null
  onClose: () => void
  onSave: (address: Address) => void
}

const empty: Address = { nombre: '', apellidos: '', telefono: '', direccion: '', referencia: '' }
type Errors = Partial<Record<keyof Address, string>>

export function AddressSheet({ open, initial, onClose, onSave }: AddressSheetProps) {
  const [form, setForm] = useState<Address>(initial ?? empty)
  const [errors, setErrors] = useState<Errors>({})

  // Sincroniza el formulario cada vez que se abre
  useEffect(() => {
    if (open) {
      setForm(initial ?? empty)
      setErrors({})
    }
  }, [open, initial])

  // Bloquea el scroll del fondo mientras el sheet está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  if (!open) return null

  function update(field: keyof Address, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate(): boolean {
    const errs: Errors = {}
    if (!form.nombre.trim()) errs.nombre = 'Requerido'
    if (!form.apellidos.trim()) errs.apellidos = 'Requerido'
    if (!form.telefono.trim()) errs.telefono = 'Requerido'
    else if (!/^\d{6,11}$/.test(form.telefono.replace(/\s|-/g, '')))
      errs.telefono = 'Número no válido'
    if (!form.direccion.trim()) errs.direccion = 'Requerido'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSave({
      nombre: form.nombre.trim(),
      apellidos: form.apellidos.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
      referencia: form.referencia?.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fade-in"
      />
      {/* Sheet */}
      <div className="relative w-full max-w-content bg-surface rounded-t-4xl shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto scrollbar-none">
        <div className="sticky top-0 bg-surface px-5 pt-4 pb-3 border-b border-border">
          <div className="w-10 h-1.5 bg-border rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">
              {initial ? 'Editar dirección' : 'Agregar dirección'}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-text-secondary"
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" value={form.nombre} onChange={(v) => update('nombre', v)} error={errors.nombre} placeholder="Ej: María" autoComplete="given-name" />
            <Field label="Apellidos" value={form.apellidos} onChange={(v) => update('apellidos', v)} error={errors.apellidos} placeholder="Ej: García" autoComplete="family-name" />
          </div>
          <Field label="Teléfono" value={form.telefono} onChange={(v) => update('telefono', v)} error={errors.telefono} placeholder="Ej: 55123456" type="tel" autoComplete="tel" />
          <Field label="Dirección completa" value={form.direccion} onChange={(v) => update('direccion', v)} error={errors.direccion} placeholder="Calle, número, entre calles, municipio..." multiline autoComplete="street-address" />
          <Field label="Referencia (opcional)" value={form.referencia ?? ''} onChange={(v) => update('referencia', v)} placeholder="Ej: al doblar de la farmacia, frente al parque..." multiline />

          <Button type="submit" size="lg" fullWidth>
            Guardar dirección
          </Button>
        </form>
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  type?: string
  multiline?: boolean
  autoComplete?: string
}

function Field({ label, value, onChange, error, placeholder, type = 'text', multiline, autoComplete }: FieldProps) {
  const base =
    'w-full px-4 py-3 rounded-2xl border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 transition-all'
  const state = error
    ? 'border-danger/50 bg-red-50 focus:ring-danger/20'
    : 'border-border bg-background focus:ring-primary/25 focus:border-primary/40'
  return (
    <label className="block">
      <span className="block text-xs font-bold text-text-secondary mb-1.5">{label}</span>
      {multiline ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className={`${base} ${state} resize-none`} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className={`${base} ${state}`} />
      )}
      {error && <span className="block text-danger text-xs font-bold mt-1">{error}</span>}
    </label>
  )
}
