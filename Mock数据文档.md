# Mock数据文档

本文档包含了系统中所有的Mock数据，用于前端开发和测试。

## 目录

1. [用户数据](#用户数据)
2. [角色数据](#角色数据)
3. [权限数据](#权限数据)
4. [菜单数据](#菜单数据)
5. [AI代理数据](#ai代理数据)
6. [大模型数据](#大模型数据)
7. [任务数据](#任务数据)
8. [对话数据](#对话数据)
9. [工作台数据](#工作台数据)
10. [日志数据](#日志数据)
11. [Redis数据](#redis数据)

---

## 用户数据

### 用户列表 (mockUsers)

```typescript
[
  {
    id: 1,
    username: 'admin',
    nickname: '超级管理员',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'admin@zboot.com',
    phone: '13800138000',
    roles: ['admin'],
    permissions: ['dashboard:view', 'system', 'system:user', ...],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    username: 'system_admin',
    nickname: '系统管理员',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'system@zboot.com',
    phone: '13800138001',
    roles: ['system_admin'],
    permissions: ['dashboard:view', 'system', ...],
    status: 'active',
    createTime: '2024-01-02 00:00:00',
    updateTime: '2024-01-02 00:00:00'
  },
  {
    id: 3,
    username: 'user',
    nickname: '普通用户',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'user@zboot.com',
    phone: '13800138002',
    roles: ['user'],
    permissions: ['dashboard:view'],
    status: 'active',
    createTime: '2024-01-03 00:00:00',
    updateTime: '2024-01-03 00:00:00'
  },
  {
    id: 4,
    username: 'user_admin',
    nickname: '用户管理员',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'useradmin@zboot.com',
    phone: '13800138003',
    roles: ['user_admin'],
    permissions: ['dashboard:view', 'system:user', ...],
    status: 'active',
    createTime: '2024-01-04 00:00:00',
    updateTime: '2024-01-04 00:00:00'
  }
]
```

### 登录用户数据 (mockLoginUsers)

```typescript
[
  {
    username: 'admin',
    password: '111111',
    user: { /* 用户详细信息 */ }
  },
  {
    username: 'system_admin',
    password: '111111',
    user: { /* 用户详细信息 */ }
  },
  {
    username: 'user',
    password: '111111',
    user: { /* 用户详细信息 */ }
  },
  {
    username: 'user_admin',
    password: '111111',
    user: { /* 用户详细信息 */ }
  }
]
```

---

## 角色数据

### 角色列表 (mockRoles)

```typescript
[
  {
    id: 1,
    name: '超级管理员',
    code: 'admin',
    description: '拥有系统所有权限',
    permissions: ['dashboard:view', 'system', ...],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: '系统管理员',
    code: 'system_admin',
    description: '拥有系统管理权限',
    permissions: ['dashboard:view', 'system', ...],
    status: 'active',
    createTime: '2024-01-02 00:00:00',
    updateTime: '2024-01-02 00:00:00'
  },
  {
    id: 3,
    name: '普通用户',
    code: 'user',
    description: '只有基本查看权限',
    permissions: ['dashboard:view'],
    status: 'active',
    createTime: '2024-01-03 00:00:00',
    updateTime: '2024-01-03 00:00:00'
  },
  {
    id: 4,
    name: '用户管理员',
    code: 'user_admin',
    description: '只能管理用户',
    permissions: ['dashboard:view', 'system:user', ...],
    status: 'active',
    createTime: '2024-01-04 00:00:00',
    updateTime: '2024-01-04 00:00:00'
  }
]
```

---

## 权限数据

### 权限列表 (mockPermissions)

权限数据包含92个权限项，涵盖以下模块：

- **工作台权限**: dashboard:view
- **系统管理权限**: system, system:user, system:role, system:permission, system:menu
- **系统监控权限**: monitor, monitor:redis, monitor:task, monitor:log
- **AI管理权限**: ai, ai:llm, ai:agent, ai:chat
- **代码生成权限**: codegen, codegen:frontend, codegen:backend

每个权限包含以下字段：
```typescript
{
  id: string,
  name: string,
  code: string,
  type: 'menu' | 'button' | 'api',
  parentId: string | null,
  path?: string,
  method?: string,
  description: string,
  status: 'active' | 'inactive',
  createTime: string,
  updateTime: string
}
```

---

## 菜单数据

### 菜单列表 (mockMenus)

```typescript
[
  {
    id: 1,
    title: '工作台',
    name: 'Dashboard',
    path: '/admin/dashboard',
    component: 'Dashboard',
    icon: 'DataAnalysis',
    type: 'menu',
    sort: 1,
    requiresAuth: true,
    permissions: ['dashboard:view']
  },
  {
    id: 2,
    title: '系统管理',
    name: 'SystemManagement',
    path: '/admin/system',
    icon: 'Setting',
    type: 'menu',
    sort: 2,
    requiresAuth: true,
    permissions: ['system'],
    children: [
      {
        id: 21,
        title: '用户管理',
        name: 'UserManagement',
        path: '/admin/system/user',
        component: 'UserManagement',
        icon: 'User',
        parentId: 2,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: ['system:user']
      },
      // ... 其他子菜单
    ]
  },
  // ... 其他菜单项
]
```

---

## AI代理数据

### AI代理列表 (mockAgents)

```typescript
[
  {
    id: 1,
    name: 'Coze智能客服',
    type: 'agent',
    remark: '用于处理客户咨询的智能助手',
    platform: 'coze',
    status: 'active',
    token: 'coze-token-1234567890abcdef',
    botId: 'bot_12345',
    workFlowId: 'workflow_67890',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    name: 'Dify文档助手',
    type: 'workflow',
    remark: '基于文档内容的智能问答助手',
    platform: 'dify',
    status: 'active',
    key: 'dify-1234567890abcdef1234567890abcdef',
    createTime: '2024-01-02 00:00:00',
    updateTime: '2024-01-16 14:20:00'
  },
  // ... 其他代理
]
```

---

## 大模型数据

### 大模型列表 (mockLLMModels)

```typescript
[
  {
    id: 1,
    name: 'ChatGPT',
    remark: 'OpenAI的GPT模型',
    keys: [
      {
        id: 1,
        key: 'sk-1234567890abcdef1234567890abcdef',
        status: 'active',
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00'
      },
      // ... 其他密钥
    ],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: 'Claude',
    remark: 'Anthropic的Claude模型',
    keys: [/* ... */],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  // ... 其他模型（文心一言、通义千问、DeepSeek、Kimi、Grok、Gemini）
]
```

### 大模型API配置 (llmApiConfigs)

```typescript
{
  'ChatGPT': {
    baseUrl: 'https://api.openai.com/v1',
    endpoint: '/chat/completions',
    model: 'gpt-3.5-turbo'
  },
  'Claude': {
    baseUrl: 'https://api.anthropic.com',
    endpoint: '/v1/messages',
    model: 'claude-3-sonnet-20240229'
  },
  // ... 其他模型配置
}
```

---

## 任务数据

### 定时任务列表 (taskData)

```typescript
[
  {
    id: '1',
    name: '用户数据同步任务',
    className: 'com.zboot.job.UserSyncJob',
    cronExpression: '0 0 2 * * ?',
    status: 'running',
    description: '每天凌晨2点同步用户数据到数据仓库',
    lastExecuteTime: '2024-01-15 02:00:00',
    nextExecuteTime: '2024-01-16 02:00:00',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-15 02:00:00'
  },
  {
    id: '2',
    name: '日志清理任务',
    className: 'com.zboot.job.LogCleanupJob',
    cronExpression: '0 0 1 * * ?',
    status: 'running',
    description: '每天凌晨1点清理30天前的系统日志',
    lastExecuteTime: '2024-01-15 01:00:00',
    nextExecuteTime: '2024-01-16 01:00:00',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-15 01:00:00'
  },
  // ... 其他任务（邮件发送、缓存预热、数据备份、统计报表、健康检查、临时文件清理）
]
```

---

## 对话数据

### AI对话会话列表 (mockChatSessions)

```typescript
[
  {
    id: 1,
    title: 'ChatGPT对话会话',
    modelId: 1,
    modelName: 'ChatGPT',
    messages: [
      {
        id: 1,
        role: 'user',
        content: '你好，请介绍一下Vue.js',
        timestamp: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Vue.js是一个用于构建用户界面的渐进式JavaScript框架...',
        timestamp: '2024-01-01 10:00:05'
      }
    ],
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:05'
  },
  {
    id: 2,
    title: 'Claude编程助手',
    modelId: 2,
    modelName: 'Claude',
    messages: [/* ... */],
    createTime: '2024-01-01 11:00:00',
    updateTime: '2024-01-01 11:00:10'
  }
]
```

---

## 工作台数据

### 统计数据 (mockDashboardStats)

```typescript
{
  totalUsers: 1248,
  todayVisits: 3567,
  totalArticles: 892,
  systemStatus: 'normal',
  userGrowth: 12.5,
  visitGrowth: 8.3,
  articleGrowth: 15.2
}
```

### 访问趋势数据 (mockVisitTrend)

```typescript
[
  { date: '2024-01-15', visits: 2340, users: 1120 },
  { date: '2024-01-16', visits: 2890, users: 1350 },
  { date: '2024-01-17', visits: 3120, users: 1480 },
  { date: '2024-01-18', visits: 2750, users: 1290 },
  { date: '2024-01-19', visits: 3450, users: 1620 },
  { date: '2024-01-20', visits: 3890, users: 1850 },
  { date: '2024-01-21', visits: 3567, users: 1680 }
]
```

### 用户分布数据 (mockUserDistribution)

```typescript
[
  { name: '北京', value: 312, percentage: 25.0 },
  { name: '上海', value: 249, percentage: 20.0 },
  { name: '广州', value: 187, percentage: 15.0 },
  { name: '深圳', value: 149, percentage: 12.0 },
  { name: '杭州', value: 125, percentage: 10.0 },
  { name: '成都', value: 100, percentage: 8.0 },
  { name: '其他', value: 126, percentage: 10.0 }
]
```

---

## 日志数据

### 系统日志列表 (logData)

```typescript
[
  {
    id: '1',
    level: 'INFO',
    timestamp: '2024-01-15 14:30:15',
    module: 'UserService',
    message: '用户登录成功: admin',
    thread: 'http-nio-8080-exec-1',
    className: 'com.example.service.UserService'
  },
  {
    id: '2',
    level: 'ERROR',
    timestamp: '2024-01-15 14:28:32',
    module: 'DatabaseService',
    message: '数据库连接失败',
    thread: 'http-nio-8080-exec-2',
    className: 'com.example.service.DatabaseService',
    stackTrace: 'java.sql.SQLException: Connection refused...'
  },
  // ... 其他日志（包含INFO、WARN、DEBUG、ERROR等各种级别）
]
```

---

## Redis数据

### Redis键值数据 (redisData)

```typescript
[
  {
    key: 'user:session:12345',
    type: 'string',
    value: '{"userId":"12345","username":"admin","loginTime":"2024-01-15 10:30:00"}',
    ttl: 3600,
    size: '128B'
  },
  {
    key: 'cache:user:profile:admin',
    type: 'hash',
    value: {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'super_admin'
    },
    ttl: 7200,
    size: '256B'
  },
  {
    key: 'queue:email:pending',
    type: 'list',
    value: ['email:task:001', 'email:task:002', 'email:task:003'],
    ttl: -1,
    size: '512B'
  },
  // ... 其他Redis数据（包含string、hash、list、set、zset等类型）
]
```

---

## 数据统计

- **用户数据**: 4个用户，4个登录账户
- **角色数据**: 4个角色
- **权限数据**: 92个权限项
- **菜单数据**: 5个主菜单，多个子菜单
- **AI代理数据**: 4个代理（Coze、Dify平台）
- **大模型数据**: 8个大模型（ChatGPT、Claude、文心一言等）
- **任务数据**: 8个定时任务
- **对话数据**: 2个对话会话
- **工作台数据**: 完整的统计和趋势数据
- **日志数据**: 15条系统日志
- **Redis数据**: 10个Redis键值对

---

## 使用说明

1. 所有Mock数据都位于 `src/mock/data/` 目录下
2. 数据通过 `src/mock/data/index.ts` 统一导出
3. Mock服务位于 `src/mock/services/` 目录下
4. 可以根据需要修改Mock数据来适应不同的测试场景
5. 所有时间格式统一使用 `YYYY-MM-DD HH:mm:ss` 格式
6. 状态字段统一使用 `active`、`inactive`、`running`、`stopped`、`paused` 等值

---

**最后更新时间**: 2024-01-21
**文档版本**: v1.0