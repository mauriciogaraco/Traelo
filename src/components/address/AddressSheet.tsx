import { useEffect, useState } from 'react'
import type { Address } from '../../types'
import { Button } from '../ui/Button'

interface AddressSheetProps {
  open: boolean
  initial: Address | null
  onClose: () => void
  onSave: (address: Address) => void
}

const empty: Address = {
  nombreComprador: '',
  whatsappComprador: '',
  nombreDestinatario: '',
  direccion: '',
  observaciones: '',
}

type Errors = Partial<Record<keyof Address, string>>

export function AddressSheet({ open, initial, onClose, onSave }: AddressSheetProps) {
  const [form, setForm] = useState<Address>(initial ?? empty)
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    if (open) {
      setForm(initial ?? empty)
      setErrors({})
    }
  }, [open, initial])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  function update(field: keyof Address, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate(): boolean {
    const errs: Errors = {}
    if (!form.nombreComprador.trim()) errs.nombreComprador = 'Requerido'
    if (!form.whatsappComprador.trim()) errs.whatsappComprador = 'Requerido'
    else if (!/^\+?[\d\s\-().]{7,20}$/.test(form.whatsappComprador.trim()))
      errs.whatsappComprador = 'Número no válido'
    if (!form.nombreDestinatario.trim()) errs.nombreDestinatario = 'Requerido'
    if (!form.direccion.trim()) errs.direccion = 'Requerido'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSave({
      nombreComprador: form.nombreComprador.trim(),
      whatsappComprador: form.whatsappComprador.trim(),
      nombreDestinatario: form.nombreDestinatario.trim(),
      direccion: form.direccion.trim(),
      observaciones: form.observaciones?.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fade-in"
      />
      <div className="relative w-full max-w-[440px] bg-surface rounded-t-4xl shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto scrollbar-none">
        <div className="sticky top-0 bg-surface px-5 pt-4 pb-3 border-b border-border">
          <div className="w-10 h-1.5 bg-border rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">
              {initial ? 'Editar datos del pedido' : 'Datos del pedido'}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-5" noValidate>
          {/* Sección comprador */}
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">
              Tu información (comprador)
            </p>
            <div className="space-y-3">
              <Field
                label="Tu nombre"
                value={form.nombreComprador}
                onChange={(v) => update('nombreComprador', v)}
                error={errors.nombreComprador}
                placeholder="Ej: Juan García"
                autoComplete="name"
              />
              <Field
                label="Tu WhatsApp"
                value={form.whatsappComprador}
                onChange={(v) => update('whatsappComprador', v)}
                error={errors.whatsappComprador}
                placeholder="Ej: +1 305 555 0123"
                type="tel"
                autoComplete="tel"
                hint="Te contactaremos aquí para coordinar el pago por Zelle"
              />
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-dashed border-border" />

          {/* Sección destinatario */}
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">
              Quién recibe en Güira de Melena
            </p>
            <div className="space-y-3">
              <Field
                label="Nombre del familiar"
                value={form.nombreDestinatario}
                onChange={(v) => update('nombreDestinatario', v)}
                error={errors.nombreDestinatario}
                placeholder="Ej: María García"
              />
              <Field
                label="Dirección en Güira de Melena"
                value={form.direccion}
                onChange={(v) => update('direccion', v)}
                error={errors.direccion}
                placeholder="Calle, número, entre calles..."
                multiline
                autoComplete="street-address"
              />
              <Field
                label="Observaciones (opcional)"
                value={form.observaciones ?? ''}
                onChange={(v) => update('observaciones', v)}
                placeholder="Ej: Llamar antes de entregar, al doblar de la farmacia..."
                multiline
              />
            </div>
          </div>

          <Button type="submit" size="lg" fullWidth>
            Guardar datos
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
  hint?: string
}

function Field({ label, value, onChange, error, placeholder, type = 'text', multiline, autoComplete, hint }: FieldProps) {
  const base = 'w-full px-4 py-3 rounded-2xl border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 transition-all'
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
      {hint && !error && <span className="block text-[11px] text-text-secondary mt-1">{hint}</span>}
      {error && <span className="block text-danger text-xs font-bold mt-1">{error}</span>}
    </label>
  )
}
