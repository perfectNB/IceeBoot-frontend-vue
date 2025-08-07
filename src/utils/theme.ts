import { useDark, useToggle } from '@vueuse/core'
import type { ThemeMode } from '@/types'

// 使用VueUse的useDark组合式函数
export const isDark = useDark({
  selector: 'html',
  attribute: 'data-theme',
  valueDark: 'dark',
  valueLight: 'light',
  storageKey: 'zboot-theme',
  storage: localStorage
})

// 切换主题
export const toggleTheme = useToggle(isDark)

// 设置主题
export const setTheme = (theme: ThemeMode): void => {
  isDark.value = theme === 'dark'
}

// 获取当前主题
export const getTheme = (): ThemeMode => {
  return isDark.value ? 'dark' : 'light'
}

// 初始化主题
export const initTheme = (): void => {
  const savedTheme = localStorage.getItem('zboot-theme')
  if (savedTheme) {
    setTheme(savedTheme as ThemeMode)
  } else {
    // 默认跟随系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
  }
}

// 监听系统主题变化
export const watchSystemTheme = (): (() => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleChange = (e: MediaQueryListEvent) => {
    // 只有在没有手动设置主题时才跟随系统
    const savedTheme = localStorage.getItem('zboot-theme')
    if (!savedTheme) {
      setTheme(e.matches ? 'dark' : 'light')
    }
  }
  
  mediaQuery.addEventListener('change', handleChange)
  
  // 返回清理函数
  return () => {
    mediaQuery.removeEventListener('change', handleChange)
  }
}