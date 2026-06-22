import { create } from 'zustand'
import en from './en.json'
import zh from './zh.json'

type Locale = 'en' | 'zh'

const dictionaries: Record<Locale, Record<string, string>> = { en, zh }
const STORAGE_KEY = 'mimocodehub-lang'

function loadLang(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'zh') return saved
  } catch { /* ignore */ }
  // Auto-detect from browser
  const browserLang = navigator.language.toLowerCase()
  return browserLang.startsWith('zh') ? 'zh' : 'en'
}

interface I18nState {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

export const useI18n = create<I18nState>((set, get) => ({
  locale: loadLang(),

  setLocale: (locale: Locale) => {
    localStorage.setItem(STORAGE_KEY, locale)
    set({ locale })
  },

  t: (key: string): string => {
    const { locale } = get()
    return dictionaries[locale][key] || dictionaries.en[key] || key
  },
}))
