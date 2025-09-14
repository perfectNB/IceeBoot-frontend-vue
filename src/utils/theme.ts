import { ref, watch } from 'vue'
import type { ThemeMode } from '@/types'

// 主题状态
export const isDark = ref<boolean>(false)

// 应用主题到DOM
const applyTheme = (dark: boolean) => {
  const html = document.documentElement
  if (dark) {
    html.setAttribute('data-theme', 'dark')
    // 兼容 Element Plus 暗色主题
    html.classList.add('dark')
  } else {
    html.setAttribute('data-theme', 'light')
    html.classList.remove('dark')
  }
  // 同时保存到localStorage
  localStorage.setItem('iceeboot-theme', dark ? 'dark' : 'light')
}

// 监听主题变化
watch(isDark, (newValue) => {
  applyTheme(newValue)
})

// 切换主题
export const toggleTheme = (): void => {
  isDark.value = !isDark.value
}

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
  const savedTheme = localStorage.getItem('iceeboot-theme')
  if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
    // 直接设置isDark的值，而不是通过setTheme函数
    isDark.value = savedTheme === 'dark'
  } else {
    // 默认跟随系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = prefersDark
  }
}

// 监听系统主题变化
export const watchSystemTheme = (): (() => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handleChange = (e: MediaQueryListEvent) => {
    // 只有在没有手动设置主题时才跟随系统
    const savedTheme = localStorage.getItem('iceeboot-theme')
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
