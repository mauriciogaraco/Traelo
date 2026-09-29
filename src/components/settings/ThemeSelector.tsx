import { SegmentedTabs, type SegmentedOption } from '../ui/SegmentedTabs'
import { useThemePreference, type ThemePreference } from '../../lib/theme'

const OPTIONS: SegmentedOption<ThemePreference>[] = [
  { key: 'light', label: 'Claro', icon: 'sun' },
  { key: 'dark', label: 'Oscuro', icon: 'moon' },
  { key: 'system', label: 'Automático', icon: 'contrast' },
]

/** Selector de tema (Claro/Oscuro/Automático) — `ThemeSelector` de mobile, en "Mi cuenta". */
export function ThemeSelector() {
  const { preference, setPreference } = useThemePreference()

  return (
    <div className="rounded-r-lg bg-surface border border-border/60 p-3 space-y-2" data-testid="theme-selector">
      <p className="font-semibold text-text-primary">Tema</p>
      <SegmentedTabs label="Tema" options={OPTIONS} value={preference} onChange={setPreference} />
    </div>
  )
}
