<div align="center">
  <img src="./src/assets/logo.svg" alt="ZBoot Logo" width="120" height="120">
  <h1>🚀 ZBoot超级脚手架 前端版</h1>
  <p>基于 Vue 3 + TypeScript + Element Plus 的现代化前后端分离管理系统</p>
  
  [![Vue](https://img.shields.io/badge/Vue-3.5.18-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Element Plus](https://img.shields.io/badge/Element%20Plus-2.10.5-409EFF?style=flat-square&logo=element)](https://element-plus.org/)
  [![Vite](https://img.shields.io/badge/Vite-7.1.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)
</div>

## 📖 项目介绍

**ZBoot超级脚手架前端版** 是一个基于 **Vue 3 + TypeScript + Element Plus** 构建的现代化前后端分离管理系统。项目采用最新的前端技术栈，内置完整的权限管理、用户管理、角色管理等核心功能，并集成了多种AI大模型和智能体服务，为企业级应用开发提供强大的基础框架。

### ✨ 核心特性

- 🎯 **现代化技术栈**：Vue 3 + TypeScript + Vite + Element Plus
- 🔐 **完整权限系统**：RBAC权限模型，支持动态路由和按钮级权限控制
- 🎨 **响应式设计**：支持暗黑模式，完美适配各种屏幕尺寸
- 🚀 **开箱即用**：内置用户管理、角色管理、菜单管理等基础功能
- 🤖 **AI集成**：支持多种国内外主流大模型和智能体平台
- 📱 **SEO优化**：已配置完整的SEO优化方案，支持搜索引擎收录
- 🛠️ **工程化完善**：ESLint + TypeScript + Mock数据 + 自动化构建

## 🤖 AI能力集成

### 🌟 支持的大模型

#### 🇨🇳 国内大模型
- **DeepSeek** - 深度求索大模型，代码能力突出
- **文心一言** - 百度出品，中文理解能力强
- **通义千问** - 阿里云大模型，多模态支持
- **Kimi** - 月之暗面长文本大模型

#### 🌍 国外大模型
- **ChatGPT** - OpenAI GPT系列模型
- **Grok** - xAI出品，实时信息获取
- **Gemini** - Google多模态大模型
- **Claude** - Anthropic安全可靠的AI助手

### 🤖 智能体平台
- **Coze** - 字节跳动智能体开发平台
- **Dify** - 开源LLMOps平台，支持工作流编排

### ☁️ 第三方服务管理
- **OSS存储** - 阿里云、腾讯云、七牛云等对象存储服务
- **短信服务** - 阿里云、腾讯云短信接口集成
- **邮件服务** - SMTP邮件发送服务配置

## 🏗️ 项目结构

```
zboot-frontend-vue/
├── public/                     # 静态资源目录
│   └── favicon.ico            # 网站图标
├── src/                       # 源代码目录
│   ├── api/                   # API接口层
│   │   ├── auth.ts           # 认证相关接口
│   │   ├── user.ts           # 用户管理接口
│   │   ├── role.ts           # 角色管理接口
│   │   ├── permission.ts     # 权限管理接口
│   │   ├── menu.ts           # 菜单管理接口
│   │   ├── llm.ts            # 大模型接口
│   │   ├── agent.ts          # 智能体接口
│   │   ├── chat.ts           # 对话接口
│   │   ├── dashboard.ts      # 仪表盘接口
│   │   ├── redis.ts          # Redis管理接口
│   │   ├── log.ts            # 日志管理接口
│   │   ├── task.ts           # 任务管理接口
│   │   └── student.ts        # 学生管理接口（示例）
│   ├── assets/               # 静态资源
│   │   ├── logo.svg         # 项目Logo
│   │   ├── base.css         # 基础样式
│   │   └── main.css         # 主样式文件
│   ├── components/           # 公共组件
│   │   ├── common/          # 通用组件
│   │   ├── icons/           # 图标组件
│   │   ├── HelloWorld.vue   # 示例组件
│   │   ├── TheWelcome.vue   # 欢迎组件
│   │   └── WelcomeItem.vue  # 欢迎项组件
│   ├── config/              # 配置文件
│   │   └── mock.ts          # Mock配置
│   ├── layouts/             # 布局组件
│   │   └── AdminLayout.vue  # 管理后台布局
│   ├── mock/                # Mock数据
│   │   ├── data/           # 模拟数据
│   │   ├── data.ts         # 数据导出
│   │   └── services/       # Mock服务
│   ├── pages/               # 页面组件
│   │   ├── admin/          # 管理后台页面
│   │   │   ├── system/     # 系统管理
│   │   │   │   ├── UserManagement.vue      # 用户管理
│   │   │   │   ├── RoleManagement.vue      # 角色管理
│   │   │   │   ├── PermissionManagement.vue # 权限管理
│   │   │   │   └── MenuManagement.vue      # 菜单管理
│   │   │   ├── monitor/    # 系统监控
│   │   │   │   ├── RedisManagement.vue     # Redis管理
│   │   │   │   ├── TaskManagement.vue      # 任务管理
│   │   │   │   ├── LogManagement.vue       # 日志管理
│   │   │   │   └── ApiDocumentation.vue    # API文档
│   │   │   ├── ai/         # AI管理
│   │   │   │   ├── LLMManagement.vue       # 大模型管理
│   │   │   │   ├── AgentManagement.vue     # 智能体管理
│   │   │   │   └── ChatInterface.vue       # 对话界面
│   │   │   ├── codegen/    # 代码生成
│   │   │   │   ├── FrontendCodegen.vue     # 前端代码生成
│   │   │   │   └── BackendCodegen.vue      # 后端代码生成
│   │   │   └── AdminDashboard.vue          # 管理仪表盘
│   │   ├── error/          # 错误页面
│   │   └── home/           # 首页
│   │       └── HomePage.vue # 首页组件
│   ├── router/              # 路由配置
│   │   └── index.ts        # 路由主文件
│   ├── stores/              # 状态管理
│   │   ├── user.ts         # 用户状态
│   │   └── counter.ts      # 计数器状态（示例）
│   ├── styles/              # 样式文件
│   │   ├── variables.scss  # SCSS变量
│   │   ├── global.scss     # 全局样式
│   │   └── index.scss      # 样式入口
│   ├── types/               # TypeScript类型定义
│   │   └── index.ts        # 类型导出
│   ├── utils/               # 工具函数
│   │   ├── request.ts      # HTTP请求封装
│   │   ├── env.ts          # 环境配置
│   │   ├── permission.ts   # 权限工具
│   │   ├── theme.ts        # 主题工具
│   │   ├── styles.ts       # 样式工具
│   │   └── console-protection.ts # 控制台保护
│   ├── App.vue              # 根组件
│   └── main.ts              # 应用入口
├── .editorconfig            # 编辑器配置
├── .gitignore              # Git忽略文件
├── .vscode/                # VSCode配置
│   └── extensions.json     # 推荐插件
├── eslint.config.ts        # ESLint配置
├── index.html              # HTML模板
├── package.json            # 项目依赖
├── tsconfig.json           # TypeScript配置
├── vite.config.ts          # Vite配置
├── API_SPECIFICATION.md    # API规范文档
├── API接口文档.md          # 接口文档
├── Java_SpringBoot_项目结构.md # 后端项目结构
├── Mock数据文档.md         # Mock数据说明
└── README.md               # 项目说明
```

## ⚙️ 环境配置

### 🔧 开发环境配置

环境配置文件位于 `src/utils/env.ts`，支持多环境配置：

```typescript
const envConfig: Record<string, string> = {
  development: 'http://localhost:9000/zboot',  // 开发环境
  test: 'http://test.example.com/zboot',       // 测试环境
  production: 'http://api.example.com/zboot'   // 生产环境
}
```

### 🛡️ 生产环境安全配置

在生产和测试环境中，系统会自动启用控制台保护功能（`src/utils/console-protection.ts`），防止用户在浏览器中查看控制台信息，保护系统安全。

- **开发环境**：控制台正常显示，便于调试
- **测试/生产环境**：自动禁用控制台，清空输出，防止信息泄露

## 🚀 快速开始

### 📋 环境要求

- **Node.js**: ^20.19.0 || >=22.12.0
- **npm**: 最新版本
- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+

### 🛠️ 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/zboot-frontend-vue.git

# 进入项目目录
cd zboot-frontend-vue

# 安装依赖
npm install
```

### 🏃‍♂️ 运行项目

```bash
# 启动开发服务器
npm run dev

# 项目将在 http://localhost:5173 启动
```

### 📦 构建部署

```bash
# 类型检查
npm run type-check

# 代码检查和修复
npm run lint

# 构建开发版本（用于测试）
npm run build

# 构建生产版本
NODE_ENV=production npm run build

# 预览构建结果
npm run preview
```

### 🔍 构建产物

构建完成后，产物将输出到 `dist/` 目录：

```
dist/
├── index.html              # 入口HTML文件
├── static/                 # 静态资源
│   ├── js/                # JavaScript文件
│   ├── css/               # CSS样式文件
│   ├── img/               # 图片资源
│   └── fonts/             # 字体文件
└── favicon.ico            # 网站图标
```

## 🎯 核心功能

### 👥 用户权限管理
- **用户管理**：用户增删改查、状态管理、密码重置
- **角色管理**：角色创建、权限分配、菜单授权
- **权限管理**：细粒度权限控制，支持按钮级权限
- **菜单管理**：动态菜单配置，支持多级菜单

### 📊 系统监控
- **Redis管理**：Redis键值对管理、缓存监控
- **任务管理**：定时任务配置、执行状态监控
- **日志管理**：系统日志查看、操作审计
- **API文档**：在线API文档，支持接口测试

### 🤖 AI功能
- **大模型管理**：多平台大模型配置和管理
- **智能体管理**：Coze和Dify智能体集成
- **对话界面**：统一的AI对话交互界面
- **模型切换**：支持动态切换不同的AI模型

### 🛠️ 开发工具
- **代码生成**：前后端代码自动生成工具
- **Mock数据**：完整的Mock数据服务
- **主题切换**：支持明暗主题切换
- **响应式布局**：完美适配各种设备

## 🔧 技术栈详解

### 前端框架
- **Vue 3.5.18** - 渐进式JavaScript框架
- **TypeScript 5.8.0** - JavaScript的超集，提供静态类型检查
- **Vite 7.1.0** - 下一代前端构建工具

### UI组件库
- **Element Plus 2.10.5** - 基于Vue 3的组件库
- **@element-plus/icons-vue** - Element Plus图标库

### 状态管理
- **Pinia 3.0.3** - Vue 3官方推荐的状态管理库

### 路由管理
- **Vue Router 4.5.1** - Vue.js官方路由管理器

### HTTP客户端
- **Axios 1.11.0** - 基于Promise的HTTP客户端

### 工具库
- **@vueuse/core** - Vue组合式API工具集
- **ECharts** - 数据可视化图表库

### 开发工具
- **ESLint** - 代码质量检查工具
- **Sass** - CSS预处理器
- **Vue DevTools** - Vue开发者工具

## 📚 开发指南

### 🎨 样式规范

项目使用SCSS作为CSS预处理器，样式文件组织如下：

- `src/styles/variables.scss` - 全局变量定义
- `src/styles/global.scss` - 全局样式
- `src/styles/index.scss` - 样式入口文件

### 🔌 API接口

所有API接口统一放在 `src/api/` 目录下，按功能模块划分：

```typescript
// 示例：用户API
import { request } from '@/utils/request'

export const getUserList = (params: UserSearchParams) => {
  return request.get('/api/v1/users', params)
}
```

### 🗂️ 组件开发

组件开发遵循以下规范：

1. **单文件组件**：使用 `.vue` 文件格式
2. **TypeScript**：使用 `<script setup lang="ts">` 语法
3. **样式隔离**：使用 `<style scoped>` 避免样式污染
4. **组件命名**：使用PascalCase命名法

### 🔐 权限控制

项目实现了完整的RBAC权限模型：

```typescript
// 路由权限控制
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (userStore.hasPermission(to.meta.permission)) {
    next()
  } else {
    next('/403')
  }
})
```

## 🤝 贡献指南

我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复

### 提交规范

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加新功能
fix: 修复Bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源协议。

## 🙏 致谢

感谢以下开源项目和技术社区的支持：

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Element Plus](https://element-plus.org/) - Vue 3组件库
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [TypeScript](https://www.typescriptlang.org/) - JavaScript超集

## 📞 联系我们

如果您有任何问题或建议，请通过以下方式联系我们：

- 📧 邮箱：857787854@qq.com
- 🐛 问题反馈：[GitHub Issues](https://github.com/your-username/zboot-frontend-vue/issues)
- 💬 讨论交流：[GitHub Discussions](https://github.com/your-username/zboot-frontend-vue/discussions)

---

<div align="center">
  <p>⭐ 如果这个项目对您有帮助，请给我们一个Star！</p>
  <p>Made with ❤️ by ZBoot Team</p>
</div>
