import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell, FieldError, PasswordField, useLeaveAuthScreen } from '../components/auth/AuthShell'
import { Button } from '../components/ui/Button'
import { PhoneField } from '../components/ui/PhoneField'
import { useToast } from '../context/ToastContext'
import { authErrorMessage, validatePhone } from '../features/auth/validation'
import { toCubanE164 } from '../lib/phone'
import { loginWithPassword } from '../services/authService'

export function LoginPage() {
  const navigate = useNavigate()
  const leave = useLeaveAuthScreen()
  const { showToast } = useToast()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return
    setError(null)
    const invalid = validatePhone(phone) ?? (password.length === 0 ? 'Escribe tu contraseña.' : null)
    if (invalid) {
      setError(invalid)
      return
    }
    setSubmitting(true)
    try {
      const customer = await loginWithPassword({ phone: toCubanE164(phone), password })
      showToast(`¡Hola de nuevo, ${customer.name}!`, 'success')
      leave()
    } catch (err) {
      const message = authErrorMessage(err)
      setError(message)
      showToast(`No pudimos iniciar sesión. ${message}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Con tu cuenta ves tus pedidos, guardas direcciones y favoritos. Para pedir no la necesitas."
    >
      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <PhoneField value={phone} onChange={setPhone} />
        <PasswordField label="Contraseña" value={password} onChange={setPassword} />
        <FieldError message={error} />
        <Button type="submit" fullWidth loading={submitting}>
          Iniciar sesión
        </Button>
      </form>
      <Link to="/recuperar" className="block text-center text-caption font-semibold text-primary-text py-2">
        Olvidé mi contraseña
      </Link>
      <Button variant="outline" fullWidth onClick={() => navigate('/registro', { replace: true })}>
        Crear cuenta
      </Button>
    </AuthShell>
  )
}
