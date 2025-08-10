# API接口文档

本文档统计了项目中所有的API接口地址、传递参数、返回参数和对象定义。

## 目录

1. [认证管理 (Auth)](#认证管理-auth)
2. [用户管理 (User)](#用户管理-user)
3. [角色管理 (Role)](#角色管理-role)
4. [权限管理 (Permission)](#权限管理-permission)
5. [菜单管理 (Menu)](#菜单管理-menu)
6. [AI代理管理 (Agent)](#ai代理管理-agent)
7. [大模型管理 (LLM)](#大模型管理-llm)
8. [任务管理 (Task)](#任务管理-task)
9. [学生管理 (Student)](#学生管理-student)
10. [AI对话 (Chat)](#ai对话-chat)
11. [工作台 (Dashboard)](#工作台-dashboard)
12. [日志管理 (Log)](#日志管理-log)
13. [Redis管理 (Redis)](#redis管理-redis)
14. [数据对象定义](#数据对象定义)

---

## 认证管理 (Auth)

### 1. 用户登录
- **接口地址**: `POST /api/v1/auth/login`
- **传递参数**: 
  ```typescript
  {
    username: string,  // 用户名
    password: string,  // 密码
    captcha?: string   // 验证码（可选）
  }
  ```
- **返回参数**: 
  ```typescript
  {
    accessToken: string,    // 访问令牌
    refreshToken?: string,  // 刷新令牌（可选）
    user: User,            // 用户信息
    expires?: number       // 过期时间（可选）
  }
  ```

### 2. 用户登出
- **接口地址**: `POST /api/v1/auth/logout`
- **传递参数**: 无
- **返回参数**: `void`

### 3. 获取用户信息
- **接口地址**: `GET /api/v1/auth/user`
- **传递参数**: 无
- **返回参数**: `User` 对象

### 4. 刷新令牌
- **接口地址**: `POST /api/v1/auth/refresh`
- **传递参数**: 无
- **返回参数**: 
  ```typescript
  {
    accessToken: string,    // 新的访问令牌
    refreshToken?: string,  // 新的刷新令牌（可选）
    expires?: number       // 过期时间（可选）
  }
  ```

### 5. 获取微信二维码
- **接口地址**: `GET /api/v1/auth/wechat/qrcode`
- **传递参数**: 无
- **返回参数**: 
  ```typescript
  {
    qrcode: string,  // 二维码URL
    scene: string    // 场景值
  }
  ```

### 6. 检查微信登录状态
- **接口地址**: `GET /api/v1/auth/wechat/check/{scene}`
- **传递参数**: 
  - **路径参数**: `scene: string` // 场景值
- **返回参数**: 
  ```typescript
  {
    status: 'pending' | 'success' | 'failed',  // 登录状态
    user?: User,                               // 用户信息（成功时）
    token?: string                             // 访问令牌（成功时）
  }
  ```

---

## 用户管理 (User)

### 1. 获取用户列表
- **接口地址**: `GET /api/v1/users`
- **传递参数**: 
  ```typescript
  {
    page: number,        // 页码
    size: number,        // 每页数量
    keyword?: string,    // 关键词搜索（可选）
    status?: string,     // 状态筛选（可选）
    roleId?: string      // 角色ID筛选（可选）
  }
  ```
- **返回参数**: `PageResult<User>` 分页用户列表

### 2. 根据ID获取用户
- **接口地址**: `GET /api/v1/users/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 用户ID
- **返回参数**: `User` 对象

### 3. 创建用户
- **接口地址**: `POST /api/v1/users`
- **传递参数**: 
  ```typescript
  {
    username: string,     // 用户名
    password: string,     // 密码
    nickname?: string,    // 昵称（可选）
    email?: string,       // 邮箱（可选）
    phone?: string,       // 手机号（可选）
    roles?: string[],     // 角色列表（可选）
    status?: string       // 状态（可选）
  }
  ```
- **返回参数**: `User` 对象

### 4. 更新用户
- **接口地址**: `PUT /api/v1/users/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 用户ID
  - **请求体**: `Partial<User>` // 部分用户信息
- **返回参数**: `User` 对象

### 5. 删除用户
- **接口地址**: `DELETE /api/v1/users/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 用户ID
- **返回参数**: `void`

### 6. 重置用户密码
- **接口地址**: `POST /api/v1/users/{id}/reset-password`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 用户ID
  - **请求体**: 
    ```typescript
    {
      newPassword: string  // 新密码
    }
    ```
- **返回参数**: `void`

### 7. 更新用户状态
- **接口地址**: `PATCH /api/v1/users/{id}/status`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 用户ID
  - **请求体**: 
    ```typescript
    {
      status: 'active' | 'inactive'  // 新状态
    }
    ```
- **返回参数**: `void`

---

## 角色管理 (Role)

### 1. 获取角色列表
- **接口地址**: `GET /api/v1/roles`
- **传递参数**: 
  ```typescript
  {
    page: number,        // 页码
    size: number,        // 每页数量
    keyword?: string,    // 关键词搜索（可选）
    status?: string      // 状态筛选（可选）
  }
  ```
- **返回参数**: `PageResult<Role>` 分页角色列表

### 2. 创建角色
- **接口地址**: `POST /api/v1/roles`
- **传递参数**: 
  ```typescript
  {
    name: string,           // 角色名称
    code: string,           // 角色编码
    description?: string,   // 描述（可选）
    permissions?: string[]  // 权限列表（可选）
  }
  ```
- **返回参数**: `Role` 对象

### 3. 更新角色
- **接口地址**: `PUT /api/v1/roles/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 角色ID
  - **请求体**: `Partial<Role>` // 部分角色信息
- **返回参数**: `Role` 对象

### 4. 删除角色
- **接口地址**: `DELETE /api/v1/roles/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 角色ID
- **返回参数**: `void`

### 5. 根据ID获取角色
- **接口地址**: `GET /api/v1/roles/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 角色ID
- **返回参数**: `Role` 对象

### 6. 保存角色权限
- **接口地址**: `POST /api/v1/roles/{roleId}/permissions`
- **传递参数**: 
  - **路径参数**: `roleId: string | number` // 角色ID
  - **请求体**: 
    ```typescript
    {
      permissionIds: string[]  // 权限ID列表
    }
    ```
- **返回参数**: `void`

---

## 权限管理 (Permission)

### 1. 获取权限列表
- **接口地址**: `GET /api/v1/permissions`
- **传递参数**: 
  ```typescript
  {
    page: number,        // 页码
    size: number,        // 每页数量
    keyword?: string,    // 关键词搜索（可选）
    type?: string,       // 类型筛选（可选）
    parentId?: string    // 父级ID筛选（可选）
  }
  ```
- **返回参数**: `PageResult<Permission>` 分页权限列表

### 2. 获取所有权限
- **接口地址**: `GET /api/v1/permissions`
- **传递参数**: 无
- **返回参数**: `Permission[]` 权限列表

### 3. 创建权限
- **接口地址**: `POST /api/v1/permissions`
- **传递参数**: 
  ```typescript
  {
    name: string,                              // 权限名称
    code: string,                              // 权限编码
    type: 'menu' | 'button' | 'api',          // 权限类型
    parentId?: string | number | null,        // 父级ID（可选）
    path?: string,                             // 路径（可选）
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',  // 请求方法（可选）
    description?: string                       // 描述（可选）
  }
  ```
- **返回参数**: `Permission` 对象

### 4. 更新权限
- **接口地址**: `PUT /api/v1/permissions/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 权限ID
  - **请求体**: `Partial<Permission>` // 部分权限信息
- **返回参数**: `Permission` 对象

### 5. 删除权限
- **接口地址**: `DELETE /api/v1/permissions/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 权限ID
- **返回参数**: `void`

### 6. 根据ID获取权限
- **接口地址**: `GET /api/v1/permissions/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 权限ID
- **返回参数**: `Permission` 对象

---

## 菜单管理 (Menu)

### 1. 获取用户菜单
- **接口地址**: `GET /api/v1/menus/user`
- **传递参数**: 无
- **返回参数**: `MenuItem[]` 菜单列表

### 2. 获取所有菜单
- **接口地址**: `GET /api/v1/menus`
- **传递参数**: 无
- **返回参数**: `MenuItem[]` 菜单列表

### 3. 创建菜单
- **接口地址**: `POST /api/v1/menus`
- **传递参数**: 
  ```typescript
  {
    title: string,                           // 菜单标题
    name: string,                            // 菜单名称
    path: string,                            // 菜单路径
    component?: string,                      // 组件路径（可选）
    icon?: string,                           // 图标（可选）
    parentId?: string | number | null,      // 父级ID（可选）
    sort?: number,                           // 排序（可选）
    type: 'menu' | 'button' | 'api' | 'link', // 菜单类型
    hidden?: boolean,                        // 是否隐藏（可选）
    keepAlive?: boolean,                     // 是否缓存（可选）
    requiresAuth?: boolean,                  // 是否需要认证（可选）
    permissions?: string[],                  // 权限列表（可选）
    link?: string                            // 外链地址（可选）
  }
  ```
- **返回参数**: `MenuItem` 对象

### 4. 更新菜单
- **接口地址**: `PUT /api/v1/menus/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 菜单ID
  - **请求体**: `Partial<MenuItem>` // 部分菜单信息
- **返回参数**: `MenuItem` 对象

### 5. 删除菜单
- **接口地址**: `DELETE /api/v1/menus/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 菜单ID
- **返回参数**: `void`

---

## AI代理管理 (Agent)

### 1. 获取代理列表
- **接口地址**: `GET /api/v1/ai/agent`
- **传递参数**: 
  ```typescript
  {
    page: number,        // 页码
    size: number,        // 每页数量
    keyword?: string,    // 关键词搜索（可选）
    type?: string,       // 类型筛选（可选）
    platform?: string,   // 平台筛选（可选）
    status?: string      // 状态筛选（可选）
  }
  ```
- **返回参数**: `PageResult<Agent>` 分页代理列表

### 2. 根据ID获取代理
- **接口地址**: `GET /api/v1/ai/agent/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 代理ID
- **返回参数**: `Agent` 对象

### 3. 创建代理
- **接口地址**: `POST /api/v1/ai/agent`
- **传递参数**: 
  ```typescript
  {
    name: string,                    // 代理名称
    type: 'workflow' | 'agent',     // 代理类型
    remark: string,                  // 备注
    platform: 'coze' | 'dify',     // 平台
    // coze平台字段
    token?: string,                  // 令牌（可选）
    botId?: string,                  // 机器人ID（可选）
    workFlowId?: string,             // 工作流ID（可选）
    // dify平台字段
    key?: string                     // 密钥（可选）
  }
  ```
- **返回参数**: `Agent` 对象

### 4. 更新代理
- **接口地址**: `PUT /api/v1/ai/agent/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 代理ID
  - **请求体**: `Partial<Agent>` // 部分代理信息
- **返回参数**: `Agent` 对象

### 5. 删除代理
- **接口地址**: `DELETE /api/v1/ai/agent/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 代理ID
- **返回参数**: `void`

### 6. 更新代理状态
- **接口地址**: `PUT /api/v1/ai/agent/{id}/status`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 代理ID
  - **请求体**: 
    ```typescript
    {
      status: 'active' | 'inactive'  // 新状态
    }
    ```
- **返回参数**: `void`

---

## 大模型管理 (LLM)

### 1. 获取大模型列表
- **接口地址**: `GET /api/v1/ai/llm`
- **传递参数**: 
  ```typescript
  {
    page: number,        // 页码
    size: number,        // 每页数量
    keyword?: string,    // 关键词搜索（可选）
    status?: string      // 状态筛选（可选）
  }
  ```
- **返回参数**: `PageResult<LLMModel>` 分页大模型列表

### 2. 根据ID获取大模型
- **接口地址**: `GET /api/v1/ai/llm/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 大模型ID
- **返回参数**: `LLMModel` 对象

### 3. 创建大模型
- **接口地址**: `POST /api/v1/ai/llm`
- **传递参数**: 
  ```typescript
  {
    name: string,    // 模型名称
    remark: string   // 备注
  }
  ```
- **返回参数**: `LLMModel` 对象

### 4. 更新大模型
- **接口地址**: `PUT /api/v1/ai/llm/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 大模型ID
  - **请求体**: `Partial<LLMModel>` // 部分大模型信息
- **返回参数**: `LLMModel` 对象

### 5. 删除大模型
- **接口地址**: `DELETE /api/v1/ai/llm/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 大模型ID
- **返回参数**: `void`

### 6. 添加大模型密钥
- **接口地址**: `POST /api/v1/ai/llm/{modelId}/keys`
- **传递参数**: 
  - **路径参数**: `modelId: string | number` // 大模型ID
  - **请求体**: 
    ```typescript
    {
      key: string,         // 密钥
      remark?: string,     // 备注（可选）
      secretKey?: string,  // 秘密密钥（可选）
      apiKey?: string      // API密钥（可选）
    }
    ```
- **返回参数**: `LLMKey` 对象

### 7. 删除大模型密钥
- **接口地址**: `DELETE /api/v1/ai/llm/{modelId}/keys/{keyId}`
- **传递参数**: 
  - **路径参数**: 
    - `modelId: string | number` // 大模型ID
    - `keyId: string | number` // 密钥ID
- **返回参数**: `void`

### 8. 更新大模型密钥状态
- **接口地址**: `PUT /api/v1/ai/llm/{modelId}/keys/{keyId}/status`
- **传递参数**: 
  - **路径参数**: 
    - `modelId: string | number` // 大模型ID
    - `keyId: string | number` // 密钥ID
  - **请求体**: 
    ```typescript
    {
      status: 'active' | 'inactive'  // 新状态
    }
    ```
- **返回参数**: `void`

---

## 任务管理 (Task)

### 1. 获取任务列表
- **接口地址**: `GET /api/v1/tasks`
- **传递参数**: 
  ```typescript
  {
    page: number,        // 页码
    size: number,        // 每页数量
    name?: string,       // 任务名称筛选（可选）
    status?: string      // 状态筛选（可选）
  }
  ```
- **返回参数**: 
  ```typescript
  {
    list: Task[],  // 任务列表
    total: number  // 总数
  }
  ```

### 2. 创建任务
- **接口地址**: `POST /api/v1/tasks`
- **传递参数**: 
  ```typescript
  {
    name: string,           // 任务名称
    className: string,      // 类名
    cronExpression: string, // Cron表达式
    status: string,         // 状态
    description: string     // 描述
  }
  ```
- **返回参数**: `Task` 对象

### 3. 更新任务
- **接口地址**: `PUT /api/v1/tasks/{id}`
- **传递参数**: 
  - **路径参数**: `id: string` // 任务ID
  - **请求体**: `Partial<Task>` // 部分任务信息
- **返回参数**: `Task` 对象

### 4. 删除任务
- **接口地址**: `DELETE /api/v1/tasks/{id}`
- **传递参数**: 
  - **路径参数**: `id: string` // 任务ID
- **返回参数**: `void`

### 5. 启动任务
- **接口地址**: `POST /api/v1/tasks/{id}/start`
- **传递参数**: 
  - **路径参数**: `id: string` // 任务ID
- **返回参数**: `void`

### 6. 停止任务
- **接口地址**: `POST /api/v1/tasks/{id}/stop`
- **传递参数**: 
  - **路径参数**: `id: string` // 任务ID
- **返回参数**: `void`

---

## 学生管理 (Student)

### 1. 获取学生列表
- **接口地址**: `GET /api/v1/student`
- **传递参数**: 
  ```typescript
  {
    page?: number,    // 页码（可选）
    size?: number,    // 每页数量（可选）
    name?: string,    // 名字筛选（可选）
    age?: number,     // 年龄筛选（可选）
    sex?: string,     // 性别筛选（可选）
    number?: string,  // 学号筛选（可选）
    major?: string    // 专业筛选（可选）
  }
  ```
- **返回参数**: `PageResult<Student>` 分页学生列表

### 2. 创建学生
- **接口地址**: `POST /api/v1/student`
- **传递参数**: 
  ```typescript
  {
    name: string,    // 名字
    age: number,     // 年龄
    sex: string,     // 性别
    number: string,  // 学号
    major: string    // 专业
  }
  ```
- **返回参数**: `Student` 对象

### 3. 更新学生
- **接口地址**: `PUT /api/v1/student/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 学生ID
  - **请求体**: `Partial<Student>` // 部分学生信息
- **返回参数**: `Student` 对象

### 4. 删除学生
- **接口地址**: `DELETE /api/v1/student/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 学生ID
- **返回参数**: `boolean`

### 5. 根据ID获取学生
- **接口地址**: `GET /api/v1/student/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 学生ID
- **返回参数**: `Student` 对象

---

## AI对话 (Chat)

### 1. 获取对话会话列表
- **接口地址**: `GET /api/v1/ai/chat/sessions`
- **传递参数**: 
  ```typescript
  {
    page: number,     // 页码
    size: number,     // 每页数量
    keyword?: string  // 关键词搜索（可选）
  }
  ```
- **返回参数**: `PageResult<ChatSession>` 分页会话列表

### 2. 获取对话会话详情
- **接口地址**: `GET /api/v1/ai/chat/sessions/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 会话ID
- **返回参数**: `ChatSession` 对象

### 3. 创建对话会话
- **接口地址**: `POST /api/v1/ai/chat/sessions`
- **传递参数**: 
  ```typescript
  {
    title: string,              // 会话标题
    modelId: string | number,   // 模型ID
    modelName: string           // 模型名称
  }
  ```
- **返回参数**: `ChatSession` 对象

### 4. 删除对话会话
- **接口地址**: `DELETE /api/v1/ai/chat/sessions/{id}`
- **传递参数**: 
  - **路径参数**: `id: string | number` // 会话ID
- **返回参数**: `void`

### 5. 发送消息
- **接口地址**: `POST /api/v1/ai/chat/sessions/{sessionId}/messages`
- **传递参数**: 
  - **路径参数**: `sessionId: string | number` // 会话ID
  - **请求体**: 
    ```typescript
    {
      content: string  // 消息内容
    }
    ```
- **返回参数**: `ChatMessage` 对象

### 6. 获取可用的大模型列表
- **接口地址**: `GET /api/v1/ai/chat/models`
- **传递参数**: 无
- **返回参数**: `LLMModel[]` 模型列表

### 7. 获取模型API配置
- **接口地址**: `GET /api/v1/ai/chat/models/{modelName}/config`
- **传递参数**: 
  - **路径参数**: `modelName: string` // 模型名称
- **返回参数**: 
  ```typescript
  {
    baseUrl: string,   // 基础URL
    endpoint: string,  // 端点
    model: string      // 模型
  } | null
  ```

### 8. 流式对话
- **接口地址**: `POST /api/v1/ai/chat/stream`
- **传递参数**: 
  ```typescript
  {
    sessionId: string | number,  // 会话ID
    content: string              // 消息内容
  }
  ```
- **返回参数**: 流式响应（通过回调函数处理）

---

## 工作台 (Dashboard)

### 1. 获取工作台统计数据
- **接口地址**: `GET /api/v1/dashboard/stats`
- **传递参数**: 无
- **返回参数**: 
  ```typescript
  {
    code: number,
    message: string,
    data: DashboardStats,
    success: boolean,
    timestamp: number
  }
  ```

### 2. 获取访问趋势数据
- **接口地址**: `GET /api/v1/dashboard/visit-trend`
- **传递参数**: 
  ```typescript
  {
    period: string  // 时间周期
  }
  ```
- **返回参数**: 
  ```typescript
  {
    code: number,
    message: string,
    data: VisitTrend[],
    success: boolean,
    timestamp: number
  }
  ```

### 3. 获取用户分布数据
- **接口地址**: `GET /api/v1/dashboard/user-distribution`
- **传递参数**: 无
- **返回参数**: 
  ```typescript
  {
    code: number,
    message: string,
    data: UserDistribution[],
    success: boolean,
    timestamp: number
  }
  ```

---

## 日志管理 (Log)

### 1. 获取日志列表
- **接口地址**: `GET /api/v1/logs`
- **传递参数**: 
  ```typescript
  {
    page: number,        // 页码
    size: number,        // 每页数量
    level?: string,      // 日志级别筛选（可选）
    module?: string,     // 模块筛选（可选）
    keyword?: string,    // 关键词搜索（可选）
    startTime?: string,  // 开始时间（可选）
    endTime?: string     // 结束时间（可选）
  }
  ```
- **返回参数**: 
  ```typescript
  {
    list: LogItem[],  // 日志列表
    total: number     // 总数
  }
  ```

### 2. 删除日志
- **接口地址**: `DELETE /api/v1/logs/{id}`
- **传递参数**: 
  - **路径参数**: `id: string` // 日志ID
- **返回参数**: `void`

### 3. 批量删除日志
- **接口地址**: `DELETE /api/v1/logs/batch`
- **传递参数**: 
  ```typescript
  {
    ids: string[]  // 日志ID列表
  }
  ```
- **返回参数**: `void`

### 4. 清空日志
- **接口地址**: `DELETE /api/v1/logs/clear`
- **传递参数**: 
  ```typescript
  {
    level?: string,      // 日志级别（可选）
    beforeDate?: string  // 清空指定日期之前的日志（可选）
  }
  ```
- **返回参数**: `void`

---

## Redis管理 (Redis)

### 1. 获取Redis键列表
- **接口地址**: `GET /api/v1/redis/keys`
- **传递参数**: 
  ```typescript
  {
    page: number,     // 页码
    size: number,     // 每页数量
    key?: string,     // 键名筛选（可选）
    type?: string     // 类型筛选（可选）
  }
  ```
- **返回参数**: 
  ```typescript
  {
    list: RedisKey[],  // Redis键列表
    total: number      // 总数
  }
  ```

### 2. 删除Redis键
- **接口地址**: `DELETE /api/v1/redis/keys/{key}`
- **传递参数**: 
  - **路径参数**: `key: string` // Redis键名（URL编码）
- **返回参数**: `void`

### 3. 获取Redis键详情
- **接口地址**: `GET /api/v1/redis/keys/{key}`
- **传递参数**: 
  - **路径参数**: `key: string` // Redis键名（URL编码）
- **返回参数**: `RedisKey` 对象

---

## 数据对象定义

### User（用户）
```typescript
interface User {
  id: string | number,          // 用户ID
  username: string,             // 用户名
  nickname?: string,            // 昵称（可选）
  avatar?: string,              // 头像URL（可选）
  email?: string,               // 邮箱（可选）
  phone?: string,               // 手机号（可选）
  roles?: string[],             // 角色列表（可选）
  permissions?: string[],       // 权限列表（可选）
  status?: 'active' | 'inactive', // 状态（可选）
  createTime?: string,          // 创建时间（可选）
  updateTime?: string           // 更新时间（可选）
}
```

### Role（角色）
```typescript
interface Role {
  id: string | number,          // 角色ID
  name: string,                 // 角色名称
  code: string,                 // 角色编码
  description?: string,         // 描述（可选）
  permissions?: string[],       // 权限列表（可选）
  createTime?: string,          // 创建时间（可选）
  updateTime?: string,          // 更新时间（可选）
  status?: 'active' | 'inactive' // 状态（可选）
}
```

### Permission（权限）
```typescript
interface Permission {
  id: string | number,                              // 权限ID
  name: string,                                     // 权限名称
  code: string,                                     // 权限编码
  type: 'menu' | 'button' | 'api',                 // 权限类型
  parentId?: string | number | null,               // 父级ID（可选）
  path?: string,                                    // 路径（可选）
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', // 请求方法（可选）
  description?: string,                             // 描述（可选）
  status?: 'active' | 'inactive',                  // 状态（可选）
  createTime?: string,                              // 创建时间（可选）
  updateTime?: string,                              // 更新时间（可选）
  children?: Permission[]                           // 子权限列表（可选）
}
```

### MenuItem（菜单项）
```typescript
interface MenuItem {
  id: string | number,                    // 菜单ID
  title: string,                          // 菜单标题
  name: string,                           // 菜单名称
  path: string,                           // 菜单路径
  component?: string,                     // 组件路径（可选）
  icon?: string,                          // 图标（可选）
  parentId?: string | number | null,     // 父级ID（可选）
  sort?: number,                          // 排序（可选）
  type: 'menu' | 'button' | 'api' | 'link', // 菜单类型
  hidden?: boolean,                       // 是否隐藏（可选）
  keepAlive?: boolean,                    // 是否缓存（可选）
  requiresAuth?: boolean,                 // 是否需要认证（可选）
  permissions?: string[],                 // 权限列表（可选）
  link?: string,                          // 外链地址（可选）
  children?: MenuItem[],                  // 子菜单列表（可选）
  meta?: {                                // 元信息（可选）
    title: string,                        // 标题
    icon?: string,                        // 图标（可选）
    hidden?: boolean,                     // 是否隐藏（可选）
    keepAlive?: boolean,                  // 是否缓存（可选）
    requiresAuth?: boolean,               // 是否需要认证（可选）
    permissions?: string[]                // 权限列表（可选）
  }
}
```

### Agent（AI代理）
```typescript
interface Agent {
  id: string | number,              // 代理ID
  name: string,                     // 代理名称
  type: 'workflow' | 'agent',      // 代理类型
  remark: string,                   // 备注
  platform: 'coze' | 'dify',      // 平台
  status: 'active' | 'inactive',   // 状态
  // coze平台字段
  token?: string,                   // 令牌（可选）
  botId?: string,                   // 机器人ID（可选）
  workFlowId?: string,              // 工作流ID（可选）
  // dify平台字段
  key?: string,                     // 密钥（可选）
  createTime: string,               // 创建时间
  updateTime: string                // 更新时间
}
```

### LLMModel（大模型）
```typescript
interface LLMModel {
  id: string | number,              // 模型ID
  name: string,                     // 模型名称
  remark: string,                   // 备注
  keys: LLMKey[],                   // 密钥列表
  status: 'active' | 'inactive',   // 状态
  createTime: string,               // 创建时间
  updateTime: string                // 更新时间
}
```

### LLMKey（大模型密钥）
```typescript
interface LLMKey {
  id: string | number,              // 密钥ID
  key: string,                      // 密钥
  remark?: string,                  // 备注（可选）
  secretKey?: string,               // 秘密密钥（可选）
  apiKey?: string,                  // API密钥（可选）
  status: 'active' | 'inactive',   // 状态
  createTime: string,               // 创建时间
  updateTime: string                // 更新时间
}
```

### Task（任务）
```typescript
interface Task {
  id?: string,                      // 任务ID（可选）
  name: string,                     // 任务名称
  className: string,                // 类名
  cronExpression: string,           // Cron表达式
  status: string,                   // 状态
  description: string,              // 描述
  lastExecuteTime?: string,         // 最后执行时间（可选）
  nextExecuteTime?: string | null,  // 下次执行时间（可选）
  createTime?: string,              // 创建时间（可选）
  updateTime?: string               // 更新时间（可选）
}
```

### Student（学生）
```typescript
interface Student {
  id: number,                       // 学生ID
  name: string,                     // 名字
  age: number,                      // 年龄
  sex: string,                      // 性别
  number: string,                   // 学号
  major: string,                    // 专业
  createTime: string,               // 创建时间
  updateTime: string                // 更新时间
}
```

### ChatSession（对话会话）
```typescript
interface ChatSession {
  id: string | number,              // 会话ID
  title: string,                    // 会话标题
  modelId: string | number,         // 模型ID
  modelName: string,                // 模型名称
  messages: ChatMessage[],          // 消息列表
  createTime: string,               // 创建时间
  updateTime: string                // 更新时间
}
```

### ChatMessage（对话消息）
```typescript
interface ChatMessage {
  id: string | number,              // 消息ID
  role: 'user' | 'assistant' | 'system', // 角色
  content: string,                  // 消息内容
  timestamp: string                 // 时间戳
}
```

### DashboardStats（工作台统计）
```typescript
interface DashboardStats {
  totalUsers: number,               // 总用户数
  todayVisits: number,              // 今日访问量
  totalArticles: number,            // 总文章数
  systemStatus: string,             // 系统状态
  userGrowth: number,               // 用户增长率
  visitGrowth: number,              // 访问增长率
  articleGrowth: number             // 文章增长率
}
```

### VisitTrend（访问趋势）
```typescript
interface VisitTrend {
  date: string,                     // 日期
  visits: number,                   // 访问量
  users: number                     // 用户数
}
```

### UserDistribution（用户分布）
```typescript
interface UserDistribution {
  name: string,                     // 名称
  value: number,                    // 数值
  percentage: number                // 百分比
}
```

### LogItem（日志项）
```typescript
interface LogItem {
  id: string,                       // 日志ID
  level: string,                    // 日志级别
  timestamp: string,                // 时间戳
  module: string,                   // 模块
  message: string,                  // 消息
  thread: string,                   // 线程
  className: string,                // 类名
  stackTrace?: string               // 堆栈跟踪（可选）
}
```

### RedisKey（Redis键）
```typescript
interface RedisKey {
  key: string,                      // 键名
  type: string,                     // 类型
  value: string | number | object | boolean, // 值
  ttl: number,                      // 生存时间
  size: string                      // 大小
}
```

### PageResult（分页结果）
```typescript
interface PageResult<T> {
  list: T[],                        // 数据列表
  total: number,                    // 总数
  page: number,                     // 当前页
  size: number,                     // 每页大小
  pages: number                     // 总页数
}
```

### ApiResponse（API响应）
```typescript
interface ApiResponse<T> {
  code: number,                     // 响应码
  message: string,                  // 响应消息
  data: T,                          // 响应数据
  success: boolean,                 // 是否成功
  timestamp?: number                // 时间戳（可选）
}
```

---

## 接口统计总结

### 按模块统计

| 模块 | 接口数量 | 主要功能 |
|------|----------|----------|
| 认证管理 (Auth) | 6 | 用户登录、登出、获取用户信息、刷新令牌、微信登录 |
| 用户管理 (User) | 7 | 用户CRUD操作、密码重置、状态更新 |
| 角色管理 (Role) | 6 | 角色CRUD操作、权限分配 |
| 权限管理 (Permission) | 6 | 权限CRUD操作、权限树管理 |
| 菜单管理 (Menu) | 5 | 菜单CRUD操作、用户菜单获取 |
| AI代理管理 (Agent) | 6 | AI代理CRUD操作、状态管理 |
| 大模型管理 (LLM) | 8 | 大模型CRUD操作、密钥管理 |
| 任务管理 (Task) | 6 | 任务CRUD操作、启停控制 |
| 学生管理 (Student) | 5 | 学生CRUD操作 |
| AI对话 (Chat) | 8 | 对话会话管理、消息发送、流式对话 |
| 工作台 (Dashboard) | 3 | 统计数据、访问趋势、用户分布 |
| 日志管理 (Log) | 4 | 日志查询、删除、清空 |
| Redis管理 (Redis) | 3 | Redis键管理、查询、删除 |

**总计**: 73个API接口

### 按HTTP方法统计

| HTTP方法 | 接口数量 | 占比 |
|----------|----------|------|
| GET | 28 | 38.4% |
| POST | 21 | 28.8% |
| PUT | 11 | 15.1% |
| DELETE | 12 | 16.4% |
| PATCH | 1 | 1.4% |

### 数据对象统计

**总计**: 17个主要数据对象，涵盖用户管理、权限控制、AI功能、系统监控等各个方面。