import { createI18n } from 'vue-i18n'
import zhCN from './lang/zh-CN'
import en from './lang/en'

export type LocaleType = 'zh-CN' | 'en'

const LOCALE_KEY = 'app-locale'

function getDefaultLocale(): LocaleType {
  // 只在浏览器环境中访问 localStorage 和 navigator
  if (typeof window === 'undefined') return 'zh-CN'

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
  globalInjection: true,
  messages: {
    'zh-CN': zhCN,
    en,
  },
})

export function setLocale(locale: LocaleType) {
  i18n.global.locale.value = locale
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCALE_KEY, locale)
    document.querySelector('html')?.setAttribute('lang', locale)
  }
}

export function getLocale(): LocaleType {
  return i18n.global.locale.value as LocaleType
}

export default i18n
