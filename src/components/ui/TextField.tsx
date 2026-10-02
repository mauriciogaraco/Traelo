import { forwardRef, useId, type InputHTMLAttributes } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  /** Mensaje de error inline (los errores de validación de un campo van aquí, no en un toast). */
  error?: string
  hint?: string
}

/**
 * Campo de texto de la app — equivalente web del `TextField` de mobile (Paper "outlined": borde
 * cálido, naranja al enfocar, radio md). Etiqueta visible siempre, no solo placeholder.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, className = '', ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block mb-1 text-label text-text-secondary">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full h-12 rounded-r-md border bg-surface px-3 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 transition ${
          error
            ? 'border-danger focus:ring-danger/25'
            : 'border-border focus:border-primary focus:ring-primary/20'
        }`}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1 text-caption text-danger-text">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1 text-caption text-text-tertiary">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
