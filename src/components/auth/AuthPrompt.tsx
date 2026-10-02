import { Link } from 'react-router-dom'
import { EmptyState } from '../ui/EmptyState'

/**
 * Invitación (nunca una barrera) a iniciar sesión para una ventaja que solo tiene la cuenta:
 * favoritos, historial. Comprar sigue sin exigirla.
 */
export function AuthPrompt({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-4 lg:px-0">
      <EmptyState icon="person" title={title} description={description} />
      <div className="mx-auto max-w-sm grid gap-3 pb-10">
        <Link
          to="/login"
          className="inline-flex min-h-12 items-center justify-center rounded-r-md bg-gradient-primary px-4 font-semibold text-white"
        >
          Iniciar sesión
        </Link>
        <Link
          to="/registro"
          className="inline-flex min-h-12 items-center justify-center rounded-r-md border border-primary px-4 font-semibold text-primary-text hover:bg-primary/5"
        >
          Crear cuenta
        </Link>
      </div>
    </div>
  )
}
