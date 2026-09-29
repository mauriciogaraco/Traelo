import { ChipRow } from '../ui/ChipRow'
import { useThemePreference, type ThemePreference } from '../../lib/theme'

const OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Oscuro' },
  { key: 'system', label: 'Automático' },
]

/** Selector de tema (Claro/Oscuro/Automático) — `ThemeSelector` de mobile, en "Mi cuenta". */
export function ThemeSelector() {
  const { preference, setPreference } = useThemePreference()

  return (
    <div className="rounded-r-lg bg-surface border border-border/60 p-3 space-y-2" data-testid="theme-selector">
      <p className="font-semibold text-text-primary">Tema</p>
      <ChipRow
        label="Tema"
        items={OPTIONS.map((option) => ({ ...option, selected: preference === option.key }))}
        onPress={(key) => setPreference(key as ThemePreference)}
      />
    </div>
  )
}
