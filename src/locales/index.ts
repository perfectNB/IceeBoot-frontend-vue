import { createI18n } from 'vue-i18n'
import zhCN from './lang/zh-CN'
import en from './lang/en'

export type LocaleType = 'zh-CN' | 'en'

const LOCALE_KEY = 'app-locale'

function getDefaultLocale(): LocaleType {
  const saved = localStorage.getItem(LOCALE_KEY)
  if (saved === 'zh-CN' || saved === 'en') return saved
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) return 'zh-CN'
  return 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    en,
  },
})

export function setLocale(locale: LocaleType) {
  ;(i18n.global.locale as unknown as { value: string }).value = locale
  localStorage.setItem(LOCALE_KEY, locale)
  document.querySelector('html')?.setAttribute('lang', locale)
}

export function getLocale(): LocaleType {
  return (i18n.global.locale as unknown as { value: string }).value as LocaleType
}

export default i18n
