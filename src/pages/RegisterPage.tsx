import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthShell, FieldError, PasswordField, useLeaveAuthScreen } from '../components/auth/AuthShell'
import { Button } from '../components/ui/Button'
import { PhoneField } from '../components/ui/PhoneField'
import { TextField } from '../components/ui/TextField'
import { useToast } from '../context/ToastContext'
import {
  authErrorMessage,
  validateName,
  validateOptionalEmail,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone,
} from '../features/auth/validation'
import { sanitizeCubanPhone, toCubanE164 } from '../lib/phone'
import { registerAccount } from '../services/authService'
import { useGuestProfileStore } from '../store/guestStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const leave = useLeaveAuthScreen()
  const { showToast } = useToast()
  const guest = useGuestProfileStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tras un pedido de invitado se reutilizan los datos que ya escribió, para no pedirlos de nuevo.
  useEffect(() => {
    setName((current) => current || guest.name)
    setPhone((current) => current || sanitizeCubanPhone(guest.phone))
    // Solo al abrir: no pisar lo que la persona vaya escribiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return
    setError(null)
    const invalid =
      validateName(name) ??
      validatePhone(phone) ??
      validateOptionalEmail(email) ??
      validatePassword(password) ??
      validatePasswordConfirmation(password, confirmation)
    if (invalid) {
      setError(invalid)
      return
    }
    setSubmitting(true)
    try {
      const customer = await registerAccount({
        name: name.trim(),
        phone: toCubanE164(phone),
        password,
        email: email.trim() || undefined,
      })
      showToast(`¡Cuenta creada! Bienvenido, ${customer.name}`, 'success')
      leave()
    } catch (err) {
      const message = authErrorMessage(err)
      setError(message)
      showToast(`No pudimos crear tu cuenta. ${message}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Guarda tus datos para pedir más rápido. Es opcional: siempre puedes pedir sin cuenta."
    >
      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        <TextField label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <PhoneField value={phone} onChange={setPhone} />
        <TextField
          label="Correo (opcional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
        />
        <PasswordField label="Contraseña" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordField
          label="Confirmar contraseña"
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
        />
        <FieldError message={error} />
        <Button type="submit" fullWidth loading={submitting}>
          Crear cuenta
        </Button>
      </form>
      <Button variant="outline" fullWidth onClick={() => navigate('/login', { replace: true })}>
        Ya tengo cuenta
      </Button>
    </AuthShell>
  )
}
