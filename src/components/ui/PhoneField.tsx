import { useId } from 'react'
import { CUBAN_PHONE_DIGITS, sanitizeCubanPhone } from '../../lib/phone'

interface PhoneFieldProps {
  /** Siempre los 8 dígitos locales, nunca el prefijo: quien lo usa arma `+53…` al enviar. */
  value: string
  onChange: (digits: string) => void
  label?: string
  error?: string
  className?: string
}

/**
 * Teléfono cubano — `PhoneField` de mobile: "🇨🇺 +53" fijo y siempre visible + 8 dígitos. Pegar un
 * número con "+53" ya puesto no falla: `sanitizeCubanPhone` le quita el prefijo duplicado.
 */
export function PhoneField({ value, onChange, label = 'Teléfono', error, className = '' }: PhoneFieldProps) {
  const id = useId()
  const digits = sanitizeCubanPhone(value)

  return (
    <div className={className}>
      <label htmlFor={id} className="block mb-1 text-label text-text-secondary">
        {label}
      </label>
      <div
        className={`flex items-center h-12 rounded-r-md border bg-surface focus-within:ring-2 transition ${
          error
            ? 'border-danger focus-within:ring-danger/25'
            : 'border-border focus-within:border-primary focus-within:ring-primary/20'
        }`}
      >
        <span className="pl-3 pr-2 text-body font-semibold text-text-primary select-none" aria-hidden="true">
          🇨🇺 +53
        </span>
        <span className="w-px h-6 bg-border" aria-hidden="true" />
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={CUBAN_PHONE_DIGITS + 6}
          placeholder="5 1234567"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          value={digits}
          onChange={(e) => onChange(sanitizeCubanPhone(e.target.value))}
          className="flex-1 min-w-0 h-full bg-transparent px-3 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-caption text-danger-text">
          {error}
        </p>
      )}
    </div>
  )
}
