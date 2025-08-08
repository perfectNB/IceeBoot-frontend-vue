# API接口规范文档

本项目采用RESTful API设计风格，所有接口遵循统一的命名规范和路径格式。

## 基础规范

### 1. 基础路径格式
所有API接口统一使用 `/api/v1/` 作为基础路径前缀。

### 2. RESTful风格
- 使用HTTP动词表示操作类型
- 使用名词复数形式表示资源
- 使用路径参数表示资源ID

### 3. HTTP方法映射
- `GET` - 获取资源
- `POST` - 创建资源
- `PUT` - 更新整个资源
- `PATCH` - 部分更新资源
- `DELETE` - 删除资源

## API接口列表

### 认证相关 (Auth)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/logout` | 用户登出 |
| GET | `/api/v1/auth/user` | 获取当前用户信息 |
| POST | `/api/v1/auth/refresh` | 刷新访问令牌 |
| GET | `/api/v1/auth/wechat/qrcode` | 获取微信登录二维码 |
| GET | `/api/v1/auth/wechat/check/{scene}` | 检查微信登录状态 |

### 用户管理 (Users)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/users` | 获取用户列表 |
| GET | `/api/v1/users/{id}` | 获取用户详情 |
| POST | `/api/v1/users` | 创建用户 |
| PUT | `/api/v1/users/{id}` | 更新用户信息 |
| DELETE | `/api/v1/users/{id}` | 删除用户 |
| POST | `/api/v1/users/{id}/reset-password` | 重置用户密码 |
| PATCH | `/api/v1/users/{id}/status` | 更新用户状态 |

### 角色管理 (Roles)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/roles` | 获取角色列表 |
| GET | `/api/v1/roles/{id}` | 获取角色详情 |
| POST | `/api/v1/roles` | 创建角色 |
| PUT | `/api/v1/roles/{id}` | 更新角色信息 |
| DELETE | `/api/v1/roles/{id}` | 删除角色 |

### 权限管理 (Permissions)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/permissions` | 获取权限列表 |
| GET | `/api/v1/permissions/{id}` | 获取权限详情 |
| POST | `/api/v1/permissions` | 创建权限 |
| PUT | `/api/v1/permissions/{id}` | 更新权限信息 |
| DELETE | `/api/v1/permissions/{id}` | 删除权限 |

### 菜单管理 (Menus)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/menus` | 获取所有菜单 |
| GET | `/api/v1/menus/user` | 获取用户菜单 |
| POST | `/api/v1/menus` | 创建菜单 |
| PUT | `/api/v1/menus/{id}` | 更新菜单信息 |
| DELETE | `/api/v1/menus/{id}` | 删除菜单 |

## 环境配置

### 环境切换

项目支持多环境配置，环境切换配置位于以下文件：

1. **主要配置文件**: `src/utils/env.ts`
   - 包含不同环境的API基础URL配置
   - 支持 development、test、production 三种环境

2. **Mock数据配置**: `src/config/mock.ts`
   - 控制是否使用Mock数据
   - 设置 `enabled: true` 使用Mock数据
   - 设置 `enabled: false` 调用真实API

### 环境配置详情

```typescript
// src/utils/env.ts
const envConfig: Record<string, string> = {
  development: 'http://localhost:9000/zboot',
  test: 'http://test.example.com/zboot',
  production: 'http://api.example.com/zboot'
}
```

```typescript
// src/config/mock.ts
export const mockConfig: MockConfig = {
  enabled: true,  // 修改此处控制Mock模式
  delay: 300,
  log: true
}
```

## 请求和响应格式

### 请求格式
- Content-Type: `application/json;charset=UTF-8`
- 认证头: `accessToken: {token}`

### 响应格式
```typescript
interface ApiResponse<T> {
  code: number
  message: string
  data: T
  success: boolean
  timestamp?: number
}
```

### 分页格式
```typescript
interface PageParams {
  page: number
  size: number
  keyword?: string
}

interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
  pages: number
}
```

## 注意事项

1. 所有接口都支持Mock模式和真实API模式切换
2. Mock模式下会模拟网络延迟（默认300ms）
3. 所有接口都包含完整的TypeScript类型定义
4. 错误处理统一在请求拦截器中处理
5. 认证token会自动添加到请求头中