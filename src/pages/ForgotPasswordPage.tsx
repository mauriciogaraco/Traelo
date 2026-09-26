import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '../api/auth'
import { AuthShell, FieldError, PasswordField } from '../components/auth/AuthShell'
import { Button } from '../components/ui/Button'
import { PhoneField } from '../components/ui/PhoneField'
import { TextField } from '../components/ui/TextField'
import { useToast } from '../context/ToastContext'
import { authErrorMessage, validatePassword, validatePasswordConfirmation, validatePhone } from '../features/auth/validation'
import { SUPPORT_WHATSAPP } from '../lib/config'
import { toCubanE164 } from '../lib/phone'

const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP}`

/**
 * Recuperar contraseña. Hoy el backend NO tiene un canal (SMS/email) para entregar un código, y
 * no se simula uno: la respuesta trae channelAvailable=false y se remite al soporte por WhatsApp.
 * El segundo paso (código + contraseña nueva) queda listo para cuando exista el canal.
 */
export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'phone' | 'noChannel' | 'code'>('phone')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRequest(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return
    setError(null)
    const invalid = validatePhone(phone)
    if (invalid) {
      setError(invalid)
      return
    }
    setSubmitting(true)
    try {
      const result = await requestPasswordReset(toCubanE164(phone))
      setStep(result.channelAvailable ? 'code' : 'noChannel')
      if (result.channelAvailable) showToast('Código enviado. Revisa tu mensaje e ingrésalo aquí.', 'success')
    } catch (err) {
      const message = authErrorMessage(err)
      setError(message)
      showToast(`No pudimos enviar la solicitud. ${message}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return
    setError(null)
    const invalid =
      (token.trim().length === 0 ? 'Escribe el código que recibiste.' : null) ??
      validatePassword(password) ??
      validatePasswordConfirmation(password, confirmation)
    if (invalid) {
      setError(invalid)
      return
    }
    setSubmitting(true)
    try {
      await resetPassword({ token: token.trim(), newPassword: password })
      showToast('Contraseña actualizada. Inicia sesión con la nueva.', 'success')
      navigate('/login', { replace: true })
    } catch (err) {
      const message = authErrorMessage(err)
      setError(message)
      showToast(`No pudimos cambiar tu contraseña. ${message}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'noChannel') {
    return (
      <AuthShell title="Recuperar contraseña">
        <div className="rounded-r-lg bg-surface-muted p-4 text-body text-text-primary" data-testid="forgot-no-channel">
          Por ahora no podemos enviarte un código de recuperación automáticamente. Contáctanos por WhatsApp y te
          ayudamos a recuperar tu cuenta.
        </div>
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full min-h-12 items-center justify-center rounded-r-md bg-gradient-primary px-4 font-semibold text-white"
        >
          Escribir por WhatsApp
        </a>
        <Button variant="outline" fullWidth onClick={() => navigate(-1)}>
          Volver
        </Button>
      </AuthShell>
    )
  }

  if (step === 'code') {
    return (
      <AuthShell title="Nueva contraseña" subtitle="Escribe el código que te enviamos y elige tu contraseña nueva.">
        <form onSubmit={handleReset} className="space-y-4" noValidate>
          <TextField
            label="Código"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <PasswordField label="Contraseña nueva" value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordField
            label="Confirmar contraseña"
            value={confirmation}
            onChange={setConfirmation}
            autoComplete="new-password"
          />
          <FieldError message={error} />
          <Button type="submit" fullWidth loading={submitting}>
            Cambiar contraseña
          </Button>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Recuperar contraseña" subtitle="Escribe el teléfono de tu cuenta.">
      <form onSubmit={handleRequest} className="space-y-4" noValidate>
        <PhoneField value={phone} onChange={setPhone} />
        <FieldError message={error} />
        <Button type="submit" fullWidth loading={submitting}>
          Continuar
        </Button>
      </form>
    </AuthShell>
  )
}
