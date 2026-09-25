import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

const FIELD =
  'w-full h-12 pl-11 pr-10 rounded-full bg-surface border border-border text-body text-text-primary placeholder:text-text-tertiary shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
}

/** Buscador editable (pantalla Buscar) — `SearchBar` de mobile, con botón para borrar. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, placeholder = 'Busca productos o negocios', autoFocus },
  ref,
) {
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); (document.activeElement as HTMLElement | null)?.blur() }} className="relative">
      <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
      <input
        ref={ref}
        type="search"
        enterKeyHint="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar productos o negocios"
        className={FIELD}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Borrar búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:bg-surface-muted"
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </form>
  )
})

/** Buscador del hero de Home: solo lleva a la pestaña Buscar (como en mobile). */
export function SearchLink({ placeholder = 'Busca productos o negocios' }: { placeholder?: string }) {
  return (
    <Link to="/buscar" className="relative block" aria-label="Buscar productos o negocios">
      <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
      <span className={`${FIELD} flex items-center text-text-tertiary`}>{placeholder}</span>
    </Link>
  )
}
