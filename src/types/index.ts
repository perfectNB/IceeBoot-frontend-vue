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
  status?: 'active' | 'inactive'
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
  tokenType: string
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
  type: 'menu' | 'button' | 'api' | 'link'
  hidden?: boolean
  keepAlive?: boolean
  requiresAuth?: boolean
  permissions?: string[]
  link?: string
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

// 角色相关类型
export interface Role {
  id: string | number
  name: string
  code: string
  description?: string
  permissions?: string[]
  createTime?: string
  updateTime?: string
  status?: 'active' | 'inactive'
}

// 权限相关类型
export interface Permission {
  id: string | number
  name: string
  code: string
  type: 'menu' | 'button' | 'api'
  parentId?: string | number | null
  path?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description?: string
  status?: 'active' | 'inactive'
  createTime?: string
  updateTime?: string
  children?: Permission[]
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

// AI管理相关类型

// 大模型Key类型
export interface LLMKey {
  id: string | number
  key: string
  remark?: string
  secretKey?: string
  apiKey?: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 大模型类型
export interface LLMModel {
  id: string | number
  name: string
  remark: string
  keys: LLMKey[]
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// Agent类型
export interface Agent {
  id: string | number
  name: string
  type: 'workflow' | 'agent'
  remark: string
  platform: 'coze' | 'dify'
  status: 'active' | 'inactive'
  // coze平台字段
  token?: string
  botId?: string
  workFlowId?: string
  // dify平台字段
  key?: string
  createTime: string
  updateTime: string
}

// AI对话消息类型
export interface ChatMessage {
  id: string | number
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

// AI对话会话类型
export interface ChatSession {
  id: string | number
  title: string
  modelId: string | number
  modelName: string
  messages: ChatMessage[]
  createTime: string
  updateTime: string
}

// 工作台统计数据类型
export interface DashboardStats {
  totalUsers: number
  todayVisits: number
  totalArticles: number
  systemStatus: string
  userGrowth: number
  visitGrowth: number
  articleGrowth: number
}

// 访问趋势数据类型
export interface VisitTrend {
  date: string
  visits: number
  users: number
}

// 用户分布数据类型
export interface UserDistribution {
  name: string
  value: number
  percentage: number
}

// 学生管理相关类型定义

// Student实体
export interface Student {
  id: number
  name: string // 名字
  age: number // 年龄
  sex: string // 性别
  number: string // 学号
  major: string // 专业
  createTime: string
  updateTime: string
}

// Student搜索表单
export interface StudentSearchForm {
  name?: string // 名字
  age?: number // 年龄
  sex?: string // 性别
  number?: string // 学号
  major?: string // 专业
  page?: number
  size?: number
}

// Student创建数据
export interface StudentCreateData {
  name: string // 名字
  age: number // 年龄
  sex: string // 性别
  number: string // 学号
  major: string // 专业
}
