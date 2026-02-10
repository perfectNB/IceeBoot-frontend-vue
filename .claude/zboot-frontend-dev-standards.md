# IceeBoot Frontend Vue 开发规范

> 本文档定义了 IceeBoot Frontend Vue 项目的开发标准和最佳实践。
> AI 助手在协助开发时应严格遵循这些规范。

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [代码规范](#代码规范)
- [组件开发](#组件开发)
- [API 接口开发](#api-接口开发)
- [Mock 数据开发](#mock-数据开发)
- [状态管理](#状态管理)
- [路由管理](#路由管理)
- [样式规范](#样式规范)
- [类型定义](#类型定义)
- [命名规范](#命名规范)
- [文件组织](#文件组织)
- [最佳实践](#最佳实践)

---

## 项目概述

**项目名称：** IceeBoot Frontend Vue
**技术栈：** Vue 3 + TypeScript + Vite + Element Plus
**架构模式：** 前后端分离、RBAC 权限模型、Mock 数据系统
**核心特性：** AI 集成、工作流引擎、代码生成器、系统监控

---

## 技术栈

### 核心框架
- **Vue 3.5.18** - 使用 Composition API 和 `<script setup>` 语法
- **TypeScript 5.8.0** - 所有代码必须使用 TypeScript
- **Vite 7.1.0** - 构建工具

### UI 和工具库
- **Element Plus 2.10.5** - UI 组件库
- **Pinia 3.0.3** - 状态管理
- **Vue Router 4.5.1** - 路由管理
- **Axios 1.11.0** - HTTP 客户端
- **@vueuse/core** - 组合式 API 工具集

---

## 代码规范

### 1. 使用 Composition API

**✅ 正确示例：**
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { User } from '@/types'

const userList = ref<User[]>([])
const loading = ref(false)

const activeUsers = computed(() =>
  userList.value.filter(user => user.status === 'active')
)

onMounted(() => {
  fetchUserList()
})

const fetchUserList = async () => {
  loading.value = true
  try {
    // 获取数据
  } finally {
    loading.value = false
  }
}
</script>
```

**❌ 错误示例：**
```vue
<!-- 不要使用 Options API -->
<script lang="ts">
export default {
  data() {
    return {
      userList: []
    }
  },
  methods: {
    fetchUserList() {
      // ...
    }
  }
}
</script>
```

### 2. TypeScript 类型安全

**必须：**
- 所有变量、函数参数、返回值都要有明确的类型
- 使用 `interface` 或 `type` 定义复杂类型
- 避免使用 `any`，必要时使用 `unknown`

**✅ 正确示例：**
```typescript
interface User {
  id: number
  username: string
  email?: string
}

const getUser = async (id: number): Promise<User> => {
  const response = await request.get<User>(`/api/v1/users/${id}`)
  return response
}
```

### 3. 响应式数据

**规则：**
- 基本类型使用 `ref()`
- 对象类型使用 `ref()` 或 `reactive()`
- 推荐使用 `ref()` 以保持一致性

**✅ 正确示例：**
```typescript
const count = ref(0)
const user = ref<User | null>(null)
const form = ref({
  username: '',
  email: ''
})
```

---

## 组件开发

### 1. 组件结构

**标准组件模板：**
```vue
<template>
  <div class="component-name">
    <!-- 组件内容 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { ComponentProps } from '@/types'

// Props 定义
interface Props {
  title: string
  data?: any[]
}

// Emits 定义
interface Emits {
  (e: 'update', value: any): void
  (e: 'delete', id: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const loading = ref(false)

// 计算属性
const displayTitle = computed(() => props.title.toUpperCase())

// 方法
const handleUpdate = () => {
  emit('update', { /* data */ })
}

// 生命周期
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped lang="scss">
.component-name {
  padding: 20px;

  // 样式内容
}
</style>
```

### 2. 组件命名

- **文件名：** PascalCase，如 `UserManagement.vue`
- **组件名：** 与文件名一致
- **CSS 类名：** kebab-case，如 `.user-management`

### 3. Props 和 Emits

**Props 规范：**
```typescript
interface Props {
  // 必需属性
  id: number
  title: string

  // 可选属性
  description?: string

  // 带默认值的属性
  size?: 'small' | 'medium' | 'large'

  // 复杂类型
  data?: User[]
}

// 使用 withDefaults 设置默认值
const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  data: () => []
})
```

**Emits 规范：**
```typescript
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: any): void
  (e: 'delete', id: number): void
}

const emit = defineEmits<Emits>()
```

---

## API 接口开发

### 1. API 文件结构

**位置：** `src/api/模块名.ts`

**标准模板：**
```typescript
import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockUserService } from '@/mock/services/user'
import type { User, UserSearchParams, PageResult } from '@/types'

// 获取用户列表
export const getUserList = async (params: UserSearchParams): Promise<PageResult<User>> => {
  if (isMockEnabled()) {
    return await MockUserService.getUsers(params)
  }
  return await request.get<PageResult<User>>('/api/v1/users', params)
}

// 获取用户详情
export const getUser = async (id: number): Promise<User> => {
  if (isMockEnabled()) {
    return await MockUserService.getUser(id)
  }
  return await request.get<User>(`/api/v1/users/${id}`)
}

// 创建用户
export const createUser = async (data: User): Promise<User> => {
  if (isMockEnabled()) {
    return await MockUserService.createUser(data)
  }
  return await request.post<User>('/api/v1/users', data as unknown as Record<string, unknown>)
}

// 更新用户
export const updateUser = async (id: number, data: User): Promise<User> => {
  if (isMockEnabled()) {
    return await MockUserService.updateUser(id, data)
  }
  return await request.put<User>(`/api/v1/users/${id}`, data as unknown as Record<string, unknown>)
}

// 删除用户
export const deleteUser = async (id: number): Promise<void> => {
  if (isMockEnabled()) {
    return await MockUserService.deleteUser(id)
  }
  await request.delete(`/api/v1/users/${id}`)
}
```

### 2. API 开发规则

**必须遵守：**
1. ✅ 所有 API 函数必须检查 `isMockEnabled()`
2. ✅ Mock 模式下调用对应的 Mock 服务
3. ✅ 所有 API 函数必须有明确的类型定义
4. ✅ 使用 `async/await` 语法
5. ✅ 导出的函数使用 `export const` 而不是 `export function`

---

## Mock 数据开发

### 1. Mock 数据文件

**位置：** `src/mock/data/模块名.ts`

**示例：**
```typescript
import type { User } from '@/types'

export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    nickname: '管理员',
    email: 'admin@example.com',
    phone: '13800138000',
    status: 'active',
    roles: ['admin'],
    permissions: ['*:*:*'],
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    username: 'user',
    nickname: '普通用户',
    email: 'user@example.com',
    status: 'active',
    roles: ['user'],
    permissions: ['user:read'],
    createTime: '2024-01-02 00:00:00',
    updateTime: '2024-01-16 14:20:00'
  }
]
```

### 2. Mock 服务文件

**位置：** `src/mock/services/模块名.ts`

**标准模板：**
```typescript
import { mockDelay, mockLog } from '@/config/mock'
import { mockUsers } from '../data/user'
import type { User, UserSearchParams, PageResult } from '@/types'

export class MockUserService {
  // 获取用户列表
  static async getUsers(params: UserSearchParams): Promise<PageResult<User>> {
    await mockDelay()
    mockLog('获取用户列表', params)

    const { pageNum = 1, pageSize = 20, username = '', status = '' } = params

    // 过滤
    let filteredUsers = [...mockUsers]
    if (username) {
      filteredUsers = filteredUsers.filter(u =>
        u.username.toLowerCase().includes(username.toLowerCase())
      )
    }
    if (status) {
      filteredUsers = filteredUsers.filter(u => u.status === status)
    }

    // 分页
    const total = filteredUsers.length
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    const records = filteredUsers.slice(start, end)
    const pages = Math.ceil(total / pageSize)

    return {
      records,
      total,
      current: pageNum,
      size: pageSize,
      pages,
      hasPrevious: pageNum > 1,
      hasNext: pageNum < pages
    }
  }

  // 获取用户详情
  static async getUser(id: number): Promise<User> {
    await mockDelay()
    mockLog('获取用户详情', id)

    const user = mockUsers.find(u => u.id === id)
    if (!user) {
      throw new Error(`用户 "${id}" 不存在`)
    }
    return user
  }

  // 创建用户
  static async createUser(data: User): Promise<User> {
    await mockDelay()
    mockLog('创建用户', data)

    const newUser: User = {
      ...data,
      id: Math.max(...mockUsers.map(u => u.id)) + 1,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }

    mockUsers.push(newUser)
    return newUser
  }

  // 更新用户
  static async updateUser(id: number, data: User): Promise<User> {
    await mockDelay()
    mockLog('更新用户', { id, data })

    const index = mockUsers.findIndex(u => u.id === id)
    if (index === -1) {
      throw new Error(`用户 "${id}" 不存在`)
    }

    mockUsers[index] = {
      ...mockUsers[index],
      ...data,
      id,
      updateTime: new Date().toISOString()
    }

    return mockUsers[index]
  }

  // 删除用户
  static async deleteUser(id: number): Promise<void> {
    await mockDelay()
    mockLog('删除用户', id)

    const index = mockUsers.findIndex(u => u.id === id)
    if (index === -1) {
      throw new Error(`用户 "${id}" 不存在`)
    }

    mockUsers.splice(index, 1)
  }
}
```

### 3. Mock 服务导出

**位置：** `src/mock/services/index.ts`

```typescript
export { MockUserService } from './user'
export { MockRoleService } from './role'
// ... 其他服务
```

---

## 状态管理

### 1. Pinia Store 结构

**位置：** `src/stores/模块名.ts`

**标准模板：**
```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getUserInfo as getUserInfoApi, login as loginApi } from '@/api'
import type { User, LoginForm } from '@/types'

export const useUserStore = defineStore('user', () => {
  // ========== State ==========
  const token = ref<string>('')
  const user = ref<User | null>(null)
  const permissions = ref<string[]>([])

  // ========== Getters ==========
  const isLoggedIn = computed(() => !!token.value)
  const userRoles = computed(() => user.value?.roles || [])
  const isAdmin = computed(() => userRoles.value.includes('admin'))

  // ========== Actions ==========

  // 登录
  const login = async (loginForm: LoginForm) => {
    const response = await loginApi(loginForm)
    token.value = response.token
    localStorage.setItem('token', response.token)
    await getUserInfo()
  }

  // 获取用户信息
  const getUserInfo = async () => {
    const userInfo = await getUserInfoApi()
    user.value = userInfo
    permissions.value = userInfo.permissions || []
  }

  // 登出
  const logout = () => {
    token.value = ''
    user.value = null
    permissions.value = []
    localStorage.removeItem('token')
  }

  // 检查权限
  const hasPermission = (permission: string): boolean => {
    if (permissions.value.includes('*:*:*')) {
      return true
    }
    return permissions.value.includes(permission)
  }

  // 检查角色
  const hasRole = (role: string): boolean => {
    return userRoles.value.includes(role)
  }

  // ========== Return ==========
  return {
    // State
    token,
    user,
    permissions,

    // Getters
    isLoggedIn,
    userRoles,
    isAdmin,

    // Actions
    login,
    getUserInfo,
    logout,
    hasPermission,
    hasRole
  }
})
```

---

## 路由管理

### 1. 路由配置

**位置：** `src/router/index.ts`

**动态路由系统：**
- 基础路由（静态）：首页、登录、错误页面
- 动态路由：根据用户菜单数据动态生成
- 路由守卫：权限检查、登录检查

**路由元信息：**
```typescript
interface RouteMeta {
  title?: string           // 页面标题
  requiresAuth?: boolean   // 是否需要登录
  permission?: string      // 所需权限
  noIndex?: boolean        // SEO: 是否不索引
}
```

---

## 样式规范

### 1. SCSS 变量

**使用 CSS 变量：**
```scss
.component {
  color: var(--text-primary);
  background: var(--bg-color);
  border: 1px solid var(--border-light);
}
```

**常用变量：**
- `--text-primary` - 主要文本颜色
- `--text-secondary` - 次要文本颜色
- `--text-regular` - 常规文本颜色
- `--bg-color` - 背景颜色
- `--bg-color-page` - 页面背景颜色
- `--border-light` - 浅色边框
- `--primary-color` - 主题色

### 2. 样式组织

```scss
.component-name {
  // 布局
  display: flex;
  padding: 20px;

  // 子元素
  .header {
    margin-bottom: 20px;

    .title {
      font-size: 24px;
      font-weight: 600;
    }
  }

  .content {
    flex: 1;
  }

  // 响应式
  @media (max-width: 768px) {
    padding: 16px;
  }
}
```

### 3. 样式规则

**必须：**
- ✅ 使用 `<style scoped lang="scss">`
- ✅ 使用 CSS 变量而不是硬编码颜色
- ✅ 使用 BEM 命名或嵌套选择器
- ✅ 添加响应式设计

**禁止：**
- ❌ 不要使用内联样式（除非动态计算）
- ❌ 不要使用 `!important`（除非必要）
- ❌ 不要硬编码颜色值

---

## 类型定义

### 1. 类型文件位置

**位置：** `src/types/index.ts`

### 2. 类型定义规范

```typescript
// 基础实体类型
export interface User {
  id: number
  username: string
  nickname?: string
  email?: string
  phone?: string
  avatar?: string
  status: 'active' | 'inactive'
  roles?: string[]
  permissions?: string[]
  createTime?: string
  updateTime?: string
}

// 搜索参数类型
export interface UserSearchParams {
  username?: string
  status?: string
  pageNum?: number
  pageSize?: number
}

// 分页结果类型
export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
  hasPrevious?: boolean
  hasNext?: boolean
}

// 表单类型
export interface UserForm {
  username: string
  nickname?: string
  email?: string
  phone?: string
  password?: string
  roleIds?: number[]
}

// API 响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}
```

---

## 命名规范

### 1. 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `UserManagement.vue` |
| 工具文件 | kebab-case | `request.ts`, `theme.ts` |
| 类型文件 | kebab-case | `index.ts` |
| 样式文件 | kebab-case | `variables.scss` |

### 2. 变量命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量 | camelCase | `const userName = 'admin'` |
| 常量 | UPPER_SNAKE_CASE | `const API_BASE_URL = '...'` |
| 函数 | camelCase | `function getUserList() {}` |
| 类 | PascalCase | `class MockUserService {}` |
| 接口/类型 | PascalCase | `interface User {}` |
| 枚举 | PascalCase | `enum UserStatus {}` |

### 3. CSS 类名

- 使用 kebab-case
- 使用 BEM 命名或嵌套选择器
- 示例：`.user-management`, `.user-management__header`, `.user-management--active`

---

## 文件组织

### 1. 目录结构

```
src/
├── api/              # API 接口层
├── assets/           # 静态资源
├── components/       # 公共组件
├── config/           # 配置文件
├── layouts/          # 布局组件
├── mock/             # Mock 数据
│   ├── data/         # Mock 数据
│   └── services/     # Mock 服务
├── pages/            # 页面组件
├── router/           # 路由配置
├── stores/           # 状态管理
├── styles/           # 全局样式
├── types/            # 类型定义
└── utils/            # 工具函数
```

### 2. 导入顺序

```typescript
// 1. Vue 核心
import { ref, computed, onMounted } from 'vue'

// 2. 第三方库
import { ElMessage } from 'element-plus'

// 3. 项目内部 - 类型
import type { User, UserSearchParams } from '@/types'

// 4. 项目内部 - API
import { getUserList, createUser } from '@/api'

// 5. 项目内部 - Store
import { useUserStore } from '@/stores/user'

// 6. 项目内部 - 组件
import UserDialog from './components/UserDialog.vue'
```

---

## 最佳实践

### 1. 错误处理

```typescript
const handleSubmit = async () => {
  loading.value = true
  try {
    await createUser(form.value)
    ElMessage.success('创建成功')
    emit('success')
  } catch (error) {
    console.error('创建用户失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '创建失败')
  } finally {
    loading.value = false
  }
}
```

### 2. 表单验证

```typescript
const formRef = ref<FormInstance>()

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    // 提交表单
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}
```

### 3. 列表加载

```typescript
const tableData = ref<User[]>([])
const loading = ref(false)
const pagination = ref({
  pageNum: 1,
  pageSize: 20,
  total: 0
})

const fetchList = async () => {
  loading.value = true
  try {
    const response = await getUserList({
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    })
    tableData.value = response.records
    pagination.value.total = response.total
  } catch (error) {
    console.error('获取列表失败:', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.value.pageNum = page
  fetchList()
}
```

### 4. 对话框管理

```typescript
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const currentRow = ref<User | null>(null)

const handleCreate = () => {
  dialogMode.value = 'create'
  currentRow.value = null
  dialogVisible.value = true
}

const handleEdit = (row: User) => {
  dialogMode.value = 'edit'
  currentRow.value = { ...row }
  dialogVisible.value = true
}

const handleDialogClose = () => {
  dialogVisible.value = false
  currentRow.value = null
}
```

### 5. 权限控制

```vue
<template>
  <!-- 按钮权限 -->
  <el-button
    v-if="hasPermission('user:create')"
    type="primary"
    @click="handleCreate"
  >
    新增用户
  </el-button>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const hasPermission = (permission: string) => {
  return userStore.hasPermission(permission)
}
</script>
```

---

## 🚨 重要提醒

### 开发新功能时的检查清单

- [ ] 是否使用了 TypeScript 类型定义？
- [ ] 是否使用了 Composition API 和 `<script setup>`？
- [ ] API 接口是否检查了 `isMockEnabled()`？
- [ ] 是否创建了对应的 Mock 数据和服务？
- [ ] 是否使用了 `<style scoped lang="scss">`？
- [ ] 是否使用了 CSS 变量而不是硬编码颜色？
- [ ] 是否添加了错误处理？
- [ ] 是否添加了 loading 状态？
- [ ] 是否遵循了命名规范？
- [ ] 是否添加了必要的注释？

---

## 📝 总结

遵循这些开发规范可以确保：
- ✅ 代码质量高、可维护性强
- ✅ 团队协作顺畅
- ✅ Mock 数据系统完整
- ✅ 类型安全、减少 bug
- ✅ 代码风格统一

**记住：规范不是限制，而是为了更好的开发体验！**
