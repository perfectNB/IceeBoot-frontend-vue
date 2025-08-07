// 用户相关类型
export interface User {
  id: string | number
  username: string
  nickname?: string
  avatar?: string
  email?: string
  phone?: string
  roles?: string[]
  permissions?: string[]
  createTime?: string
  updateTime?: string
}

// 登录相关类型
export interface LoginForm {
  username: string
  password: string
  captcha?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken?: string
  user: User
  expires?: number
}

// 菜单相关类型
export interface MenuItem {
  id: string | number
  title: string
  name: string
  path: string
  component?: string
  icon?: string
  parentId?: string | number | null
  sort?: number
  type: 'menu' | 'button' | 'api'
  hidden?: boolean
  keepAlive?: boolean
  requiresAuth?: boolean
  permissions?: string[]
  children?: MenuItem[]
  meta?: {
    title: string
    icon?: string
    hidden?: boolean
    keepAlive?: boolean
    requiresAuth?: boolean
    permissions?: string[]
  }
}

// API响应类型
export interface ApiResponse<T = Record<string, unknown>> {
  code: number
  message: string
  data: T
  success: boolean
  timestamp?: number
}

// 分页相关类型
export interface PageParams {
  page: number
  size: number
  keyword?: string
  [key: string]: string | number | boolean | undefined
}

export interface PageResult<T = Record<string, unknown>> {
  list: T[]
  total: number
  page: number
  size: number
  pages: number
}

// 环境配置类型
export interface EnvConfig {
  VITE_APP_TITLE: string
  VITE_APP_BASE_API: string
  VITE_APP_ENV: 'development' | 'test' | 'production'
}

// 主题类型
export type ThemeMode = 'light' | 'dark'

// 路由元信息类型
export interface RouteMeta {
  title: string
  icon?: string
  hidden?: boolean
  keepAlive?: boolean
  requiresAuth?: boolean
  permissions?: string[]
  roles?: string[]
}

// 表格列配置类型
export interface TableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean
  formatter?: (row: Record<string, unknown>, column: Record<string, unknown>, cellValue: unknown, index: number) => string
  [key: string]: unknown
}

// 表单项配置类型
export interface FormItem {
  prop: string
  label: string
  type: 'input' | 'select' | 'date' | 'datetime' | 'textarea' | 'number' | 'switch' | 'radio' | 'checkbox'
  placeholder?: string
  required?: boolean
  rules?: Record<string, unknown>[]
  options?: { label: string; value: string | number | boolean }[]
  [key: string]: unknown
}

// 通用状态类型
export interface LoadingState {
  loading: boolean
  error: string | null
}

// 文件上传类型
export interface UploadFile {
  name: string
  url: string
  size: number
  type: string
  uid: string
}