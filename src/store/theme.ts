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
]

export const accentColors = [
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
  { label: 'Purple', value: 'purple' },
  { label: 'Amber', value: 'amber' },
  { label: 'Red', value: 'red' },
  { label: 'Default', value: '' },
]

const THEME_KEY = 'mimocodehub-theme'
const ACCENT_KEY = 'mimocodehub-accent'

function loadTheme(): string {
  try { return localStorage.getItem(THEME_KEY) || 'dark' } catch { return 'dark' }
}

function loadAccent(): string {
  try { return localStorage.getItem(ACCENT_KEY) || '' } catch { return '' }
}

function applyThemeToDOM(themeID: string, accent: string) {
  const root = document.documentElement
  root.setAttribute('data-theme', themeID)
  if (accent) root.setAttribute('data-accent', accent)
  else root.removeAttribute('data-accent')
}

interface ThemeState {
  currentThemeID: string
  currentAccent: string
  setTheme: (id: string) => void
  setAccent: (accent: string) => void
}

export const useThemeStore = create<ThemeState>((set) => {
  const initTheme = loadTheme()
  const initAccent = loadAccent()

  // Apply on load
  if (typeof document !== 'undefined') {
    applyThemeToDOM(initTheme, initAccent)
  }

  return {
    currentThemeID: initTheme,
    currentAccent: initAccent,

    setTheme: (id: string) => {
      localStorage.setItem(THEME_KEY, id)
      applyThemeToDOM(id, loadAccent())
      set({ currentThemeID: id })
    },

    setAccent: (accent: string) => {
      if (accent) localStorage.setItem(ACCENT_KEY, accent)
      else localStorage.removeItem(ACCENT_KEY)
      applyThemeToDOM(loadTheme(), accent)
      set({ currentAccent: accent })
    },
  }
})
