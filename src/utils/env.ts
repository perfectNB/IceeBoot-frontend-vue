import type { EnvConfig } from '@/types'

// 环境配置
const envConfig: Record<string, string> = {
  development: 'http://localhost:9000/zboot',
  test: 'http://test.example.com/zboot',
  production: 'http://api.example.com/zboot'
}

// 获取当前环境
export const getEnv = (): string => {
  return import.meta.env.MODE || 'development'
}

// 获取API基础URL
export const getBaseURL = (): string => {
  const env = getEnv()
  return envConfig[env] || envConfig.development
}

// 获取环境配置
export const getEnvConfig = (): Partial<EnvConfig> => {
  return {
    VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE || 'ZBoot超级脚手架',
    VITE_APP_BASE_API: getBaseURL(),
    VITE_APP_ENV: (import.meta.env.MODE as 'development' | 'test' | 'production') || 'development'
  }
}

// 是否为开发环境
export const isDev = (): boolean => {
  return getEnv() === 'development'
}

// 是否为生产环境
export const isProd = (): boolean => {
  return getEnv() === 'production'
}

// 是否为测试环境
export const isTest = (): boolean => {
  return getEnv() === 'test'
}
