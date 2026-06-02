import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++idRef.current
      setToasts((prev) => [...prev, { id, message, type }])
      window.setTimeout(() => remove(id), 3800)
    },
    [remove]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastViewport toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  )
}

const styles: Record<ToastType, { icon: ReactNode; ring: string }> = {
  success: {
    ring: 'border-green-200',
    icon: (
      <span className="w-7 h-7 rounded-full bg-green-100 text-success flex items-center justify-center flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    ),
  },
  error: {
    ring: 'border-red-200',
    icon: (
      <span className="w-7 h-7 rounded-full bg-red-100 text-danger flex items-center justify-center flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </span>
    ),
  },
  info: {
    ring: 'border-border',
    icon: (
      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
        </svg>
      </span>
    ),
  },
}

function ToastViewport({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-[100] px-4 pt-4 pointer-events-none space-y-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onClose(t.id)}
          className={`pointer-events-auto w-full flex items-center gap-3 bg-surface border ${styles[t.type].ring} rounded-2xl shadow-card px-3.5 py-3 text-left animate-slide-down`}
        >
          {styles[t.type].icon}
          <span className="text-sm font-semibold text-text-primary flex-1">{t.message}</span>
        </button>
      ))}
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
