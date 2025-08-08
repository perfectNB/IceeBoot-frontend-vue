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

### Redis管理 (Redis)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/redis/keys` | 获取Redis键列表 |
| GET | `/api/v1/redis/keys/{key}` | 获取Redis键详情 |
| DELETE | `/api/v1/redis/keys/{key}` | 删除Redis键 |
| POST | `/api/v1/redis/keys/batch-delete` | 批量删除Redis键 |

### AI管理 - 大模型管理 (LLM Models)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/llm/models` | 获取大模型列表 |
| GET | `/api/v1/llm/models/{id}` | 获取大模型详情 |
| POST | `/api/v1/llm/models` | 创建大模型 |
| PUT | `/api/v1/llm/models/{id}` | 更新大模型信息 |
| DELETE | `/api/v1/llm/models/{id}` | 删除大模型 |
| PATCH | `/api/v1/llm/models/{id}/status` | 更新大模型状态 |
| POST | `/api/v1/llm/models/{id}/keys` | 添加模型密钥 |
| DELETE | `/api/v1/llm/models/{modelId}/keys/{keyId}` | 删除模型密钥 |

### AI管理 - Agent管理 (Agents)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/agents` | 获取Agent列表 |
| GET | `/api/v1/agents/{id}` | 获取Agent详情 |
| POST | `/api/v1/agents` | 创建Agent |
| PUT | `/api/v1/agents/{id}` | 更新Agent信息 |
| DELETE | `/api/v1/agents/{id}` | 删除Agent |
| PATCH | `/api/v1/agents/{id}/status` | 更新Agent状态 |

### AI管理 - 对话管理 (Chat)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/chat/sessions` | 获取对话会话列表 |
| GET | `/api/v1/chat/sessions/{id}` | 获取对话会话详情 |
| POST | `/api/v1/chat/sessions` | 创建对话会话 |
| DELETE | `/api/v1/chat/sessions/{id}` | 删除对话会话 |
| POST | `/api/v1/chat/sessions/{id}/messages` | 发送消息 |
| GET | `/api/v1/chat/sessions/{id}/messages` | 获取会话消息列表 |
| POST | `/api/v1/chat/stream` | 流式对话接口 |
| GET | `/api/v1/chat/models` | 获取可用模型列表 |

## 环境配置

### 定时任务管理 (Tasks)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/tasks` | 获取定时任务列表 |
| GET | `/api/v1/tasks/{id}` | 获取定时任务详情 |
| POST | `/api/v1/tasks` | 创建定时任务 |
| PUT | `/api/v1/tasks/{id}` | 更新定时任务 |
| DELETE | `/api/v1/tasks/{id}` | 删除定时任务 |
| POST | `/api/v1/tasks/{id}/start` | 启动定时任务 |
| POST | `/api/v1/tasks/{id}/stop` | 停止定时任务 |
| POST | `/api/v1/tasks/{id}/execute` | 立即执行定时任务 |

### 日志管理 (Logs)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/logs` | 获取系统日志列表 |
| GET | `/api/v1/logs/{id}` | 获取日志详情 |
| DELETE | `/api/v1/logs/{id}` | 删除单条日志 |
| POST | `/api/v1/logs/batch-delete` | 批量删除日志 |
| DELETE | `/api/v1/logs/clear` | 清空所有日志 |
| GET | `/api/v1/logs/export` | 导出日志文件 |

### AI管理 - 大模型管理 (LLM)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/ai/llm` | 获取大模型列表 |
| GET | `/api/v1/ai/llm/{id}` | 获取大模型详情 |
| POST | `/api/v1/ai/llm` | 创建大模型 |
| PUT | `/api/v1/ai/llm/{id}` | 更新大模型信息 |
| DELETE | `/api/v1/ai/llm/{id}` | 删除大模型 |
| POST | `/api/v1/ai/llm/{id}/keys` | 添加模型Key |
| DELETE | `/api/v1/ai/llm/{id}/keys/{keyId}` | 删除模型Key |
| PUT | `/api/v1/ai/llm/{id}/keys/{keyId}/status` | 更新模型Key状态 |

### AI管理 - Agent管理 (Agent)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/ai/agent` | 获取Agent列表 |
| GET | `/api/v1/ai/agent/{id}` | 获取Agent详情 |
| POST | `/api/v1/ai/agent` | 创建Agent |
| PUT | `/api/v1/ai/agent/{id}` | 更新Agent信息 |
| DELETE | `/api/v1/ai/agent/{id}` | 删除Agent |
| PUT | `/api/v1/ai/agent/{id}/status` | 更新Agent状态 |

### AI管理 - AI对话 (Chat)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/ai/chat/sessions` | 获取对话会话列表 |
| GET | `/api/v1/ai/chat/sessions/{id}` | 获取对话会话详情 |
| POST | `/api/v1/ai/chat/sessions` | 创建对话会话 |
| DELETE | `/api/v1/ai/chat/sessions/{id}` | 删除对话会话 |
| POST | `/api/v1/ai/chat/sessions/{id}/messages` | 发送消息 |
| GET | `/api/v1/ai/chat/models` | 获取可用大模型列表 |
| GET | `/api/v1/ai/chat/models/{name}/config` | 获取模型API配置 |
| POST | `/api/v1/ai/chat/stream` | 流式对话 |

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