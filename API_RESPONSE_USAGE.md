# ApiResponse 使用位置清单

## 1) 使用 ApiResponse.data 的位置

### 请求封装层
- src/utils/request.ts

### 状态与页面层
- src/stores/user.ts
- src/pages/admin/AdminDashboard.vue
- src/components/common/LoginDialog.vue

### 业务 API 直接返回 response.data
- src/api/task.ts
- src/api/chat.ts

### 特殊路径
- src/api/redis.ts

## 2) 使用 result/message 的位置（集中在 api 层）

### 认证
- src/api/auth.ts

### AI
- src/api/aiChat.ts

### 支付
- src/api/pay.ts

### 学生/任务
- src/api/student.ts
- src/api/task.ts

### 用户/角色/权限/菜单/日志/消息
- src/api/user.ts
- src/api/role.ts
- src/api/permission.ts
- src/api/menu.ts
- src/api/log.ts
- src/api/message.ts

### OSS/SMS/Email/LLM/Agent
- src/api/oss.ts
- src/api/sms.ts
- src/api/email.ts
- src/api/llm.ts
- src/api/agent.ts
