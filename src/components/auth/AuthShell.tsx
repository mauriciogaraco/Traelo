import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField } from '../ui/TextField'

/** Vuelve a donde estaba la persona (checkout, favoritos…) o, si no hay historial, a "Mi cuenta". */
export function useLeaveAuthScreen() {
  const navigate = useNavigate()
  return () => {
    const idx = (window.history.state?.idx as number | undefined) ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/cuenta', { replace: true })
  }
}

/** Columna de formulario de las pantallas de cuenta: título, texto de apoyo y campos. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="px-4 lg:px-0 pt-6 pb-10 space-y-4 max-w-md mx-auto">
      <div>
        <h1 className="text-h1 text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-caption text-text-secondary">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

/** Error de formulario (validación o del backend), anunciado a lectores de pantalla. */
export function FieldError({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="text-caption text-danger-text">
      {message}
    </p>
  ) : null
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete = 'current-password',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <TextField
        label={label}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="[&_input]:pr-20"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-2 top-[26px] h-10 px-2 text-caption font-semibold text-primary-text"
      >
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  )
}
