import { create } from 'zustand'

export interface Theme {
  id: string
  name: string
}

export const themes: Theme[] = [
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
  { id: 'catppuccin', name: 'Catppuccin Mocha' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'nord', name: 'Nord' },
  { id: 'tokyonight', name: 'Tokyo Night' },
  { id: 'gruvbox', name: 'Gruvbox' },
  { id: 'custom', name: 'Custom' },
]

export const accentColors = [
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
  { label: 'Purple', value: 'purple' },
  { label: 'Amber', value: 'amber' },
  { label: 'Red', value: 'red' },
  { label: 'Default', value: '' },
]

export interface CustomColors {
  bg0: string; bg1: string; bg2: string; bg3: string; bg4: string
  accent: string; text1: string; text2: string; text3: string
  border: string; surface: string
}

const THEME_KEY = 'mimocodehub-theme'
const ACCENT_KEY = 'mimocodehub-accent'
const CUSTOM_KEY = 'mimocodehub-custom'

function loadTheme(): string {
  try { return localStorage.getItem(THEME_KEY) || 'dark' } catch { return 'dark' }
}

function loadAccent(): string {
  try { return localStorage.getItem(ACCENT_KEY) || '' } catch { return '' }
}

function loadCustom(): CustomColors | null {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function applyThemeToDOM(themeID: string, accent: string, custom?: CustomColors | null) {
  const root = document.documentElement
  root.setAttribute('data-theme', themeID)
  if (accent) root.setAttribute('data-accent', accent)
  else root.removeAttribute('data-accent')

  // Apply custom colors if in custom mode
  if (themeID === 'custom' && custom) {
    root.style.setProperty('--color-bg-0', custom.bg0)
    root.style.setProperty('--color-bg-1', custom.bg1)
    root.style.setProperty('--color-bg-2', custom.bg2)
    root.style.setProperty('--color-bg-3', custom.bg3)
    root.style.setProperty('--color-bg-4', custom.bg4)
    root.style.setProperty('--color-accent', custom.accent)
    root.style.setProperty('--color-accent-dim', custom.accent + '33')
    root.style.setProperty('--color-accent-mid', custom.accent + '66')
    root.style.setProperty('--color-text-1', custom.text1)
    root.style.setProperty('--color-text-2', custom.text2)
    root.style.setProperty('--color-text-3', custom.text3)
    root.style.setProperty('--color-border', custom.border)
    root.style.setProperty('--color-border-bright', custom.border + '99')
    root.style.setProperty('--color-surface', custom.surface)
  } else {
    // Clear inline styles to let CSS rules take over
    const vars = ['--color-bg-0','--color-bg-1','--color-bg-2','--color-bg-3','--color-bg-4',
      '--color-accent','--color-accent-dim','--color-accent-mid','--color-text-1','--color-text-2',
      '--color-text-3','--color-border','--color-border-bright','--color-surface']
    vars.forEach(v => root.style.removeProperty(v))
  }
}

interface ThemeState {
  currentThemeID: string
  currentAccent: string
  customColors: CustomColors | null
  setTheme: (id: string) => void
  setAccent: (accent: string) => void
  setCustomColors: (colors: CustomColors) => void
}

export const useThemeStore = create<ThemeState>((set) => {
  const initTheme = loadTheme()
  const initAccent = loadAccent()
  const initCustom = loadCustom()

  if (typeof document !== 'undefined') {
    applyThemeToDOM(initTheme, initAccent, initCustom)
  }

  return {
    currentThemeID: initTheme,
    currentAccent: initAccent,
    customColors: initCustom,

    setTheme: (id: string) => {
      localStorage.setItem(THEME_KEY, id)
      applyThemeToDOM(id, loadAccent(), id === 'custom' ? loadCustom() : null)
      set({ currentThemeID: id })
    },

    setAccent: (accent: string) => {
      if (accent) localStorage.setItem(ACCENT_KEY, accent)
      else localStorage.removeItem(ACCENT_KEY)
      applyThemeToDOM(loadTheme(), accent, loadTheme() === 'custom' ? loadCustom() : null)
      set({ currentAccent: accent })
    },

    setCustomColors: (colors: CustomColors) => {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(colors))
      applyThemeToDOM('custom', loadAccent(), colors)
      set({ customColors: colors, currentThemeID: 'custom' })
      localStorage.setItem(THEME_KEY, 'custom')
    },
  }
})
