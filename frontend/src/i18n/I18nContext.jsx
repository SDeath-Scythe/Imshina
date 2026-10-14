import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { dict } from './translations'
import { errorMessage } from '../utils/helpers'

const I18nContext = createContext(null)
const KEY = 'imshina_lang'

function initialLang() {
  const saved = localStorage.getItem(KEY) || localStorage.getItem('touriraq_lang')
  if (saved === 'ar' || saved === 'en') return saved
  return navigator.language?.startsWith('ar') ? 'ar' : 'en'
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem(KEY, lang)
  }, [lang])

  // Plurals: with a numeric {n}, a key like 'common.days_one' / '_two' / '_few' / '_many' wins when it exists
  // (Arabic uses all four; English only needs '_one').
  const plural = useMemo(() => new Intl.PluralRules(lang === 'ar' ? 'ar' : 'en'), [lang])
  const t = useCallback((key, vars) => {
    let k = key
    if (vars && typeof vars.n === 'number') {
      const form = `${key}_${plural.select(vars.n)}`
      if (dict[lang][form] != null || (lang === 'en' && dict.en[form] != null)) k = form
    }
    let s = dict[lang][k] ?? dict.en[k] ?? dict.en[key] ?? key
    // In Arabic, isolate inserted text (often English data) so its direction can't scramble the sentence.
    const wrap = (v) => (lang === 'ar' && typeof v === 'string' && /[A-Za-z]/.test(v) ? `⁨${v}⁩` : v)
    if (vars) Object.entries(vars).forEach(([name, v]) => { s = s.split(`{${name}}`).join(wrap(v)) })
    return s
  }, [lang, plural])

  // Translation that falls back to the raw value (e.g. a governorate name the dictionary lacks).
  const tf = useCallback((key, fallback) => dict[lang][key] ?? dict.en[key] ?? fallback, [lang])

  // Picks the Arabic field when the UI is Arabic and the data has it: loc(place, 'name').
  const loc = useCallback((obj, field) => {
    if (!obj) return ''
    if (lang === 'ar') return obj[`${field}Ar`] || obj[field] || ''
    return obj[field] || ''
  }, [lang])

  // API errors → user-facing text.
  const te = useCallback((err) => {
    const msg = typeof err === 'string' ? err : errorMessage(err)
    return msg === 'NETWORK' ? t('error.network') : msg
  }, [t])

  const value = useMemo(() => ({
    lang, t, tf, loc, te, isRtl: lang === 'ar',
    gov: (name) => (name ? dict[lang][`gov.${name}`] ?? name : ''),
    setLang, toggleLang: () => setLang((l) => (l === 'en' ? 'ar' : 'en')),
  }), [lang, t, tf, loc, te])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
