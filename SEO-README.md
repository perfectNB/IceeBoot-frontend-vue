# SEO配置说明 - 二次开发脚手架

本项目已集成完整的SEO优化方案，支持快速配置和二次开发。

## 📁 文件结构

```
src/
├── config/
│   └── seo.config.ts          # SEO配置文件（主要修改此文件）
├── utils/
│   └── seo.ts                 # SEO工具类（一般无需修改）
public/
├── robots.txt                 # 搜索引擎爬虫规则
└── sitemap.xml                # 网站地图
index.html                     # HTML模板（包含基础SEO标签）
```

## 🚀 快速配置

### 1. 修改基础配置

编辑 `src/config/seo.config.ts` 文件中的 `SITE_CONFIG`：

```typescript
export const SITE_CONFIG = {
  // 修改为你的域名
  domain: 'https://your-domain.com',
  // 修改为你的网站名称
  siteName: 'YourSite',
  // 修改为你的网站全称
  fullSiteName: 'Your Site Name',
  // 修改为你的网站描述
  description: '你的网站描述',
  // 修改为你的作者信息
  author: 'Your Team',
  // 修改为你的关键词
  keywords: '关键词1,关键词2,关键词3',
  // 其他配置...
}
```

### 2. 更新HTML模板

编辑 `index.html` 文件，将以下内容替换为你的实际信息：
- `<title>` 标签
- `meta` 标签中的 `description`、`keywords`、`author`
- `canonical` 链接
- Open Graph 和 Twitter Card 标签
- 结构化数据中的信息

### 3. 更新robots.txt和sitemap.xml

这两个文件会根据配置自动生成，但你也可以手动编辑：
- `public/robots.txt` - 搜索引擎爬虫规则
- `public/sitemap.xml` - 网站地图

## 🎯 当前SEO策略

**重要：当前配置只允许主页被搜索引擎收录**

- ✅ 主页 (`/`) - 被搜索引擎收录
- ❌ 其他所有页面 - 不被搜索引擎收录（`noindex,nofollow`）

这种策略适合：
- 管理后台系统
- 内部工具
- 需要保护隐私的应用

## 📝 如何添加更多页面到SEO

如果你需要让更多页面被搜索引擎收录：

### 1. 修改SEO配置

在 `src/config/seo.config.ts` 中的 `PAGE_SEO_CONFIGS` 添加页面配置：

```typescript
export const PAGE_SEO_CONFIGS: Record<string, Partial<typeof DEFAULT_SEO_CONFIG>> = {
  '/': {
    // 主页配置
  },
  '/about': {
    title: '关于我们 - ' + SITE_CONFIG.siteName,
    description: '了解我们的团队和使命',
    keywords: '关于我们,团队介绍,' + SITE_CONFIG.keywords
  },
  // 添加更多页面...
}
```

### 2. 修改路由SEO处理

在 `src/router/index.ts` 中修改路由后置守卫：

```typescript
router.afterEach((to) => {
  // 定义允许被搜索引擎收录的页面
  const allowedPaths = ['/', '/about', '/contact']
  
  if (allowedPaths.includes(to.path)) {
    const seoConfig = getSEOConfigByPath(to.path)
    const fullUrl = getFullUrl(to.path)
    
    setSEO({
      ...seoConfig,
      canonical: fullUrl,
      og: {
        ...seoConfig.og,
        url: fullUrl
      }
    })
  } else {
    setSEO({
      robots: 'noindex,nofollow'
    })
  }
})
```

### 3. 更新robots.txt

在 `public/robots.txt` 中添加允许的路径：

```
User-agent: *
Allow: /$
Allow: /about$
Allow: /contact$
# 其他配置...
```

### 4. 更新sitemap.xml

在 `public/sitemap.xml` 中添加新页面：

```xml
<url>
  <loc>https://your-domain.com/about</loc>
  <lastmod>2024-01-01</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

## 🛠️ 高级功能

### 动态SEO

使用 `setSEO()` 函数动态设置页面SEO：

```typescript
import { setSEO } from '@/utils/seo'

// 在组件中动态设置SEO
setSEO({
  title: '动态标题',
  description: '动态描述',
  keywords: '动态关键词'
})
```

### 结构化数据

修改 `src/config/seo.config.ts` 中的 `generateStructuredData()` 函数来自定义结构化数据。

### 性能监控

项目已集成Web Vitals性能监控，在生产环境自动启用。

## 📋 检查清单

部署前请确认：

- [ ] 修改了 `SITE_CONFIG` 中的所有配置
- [ ] 更新了 `index.html` 中的SEO标签
- [ ] 检查了 `robots.txt` 和 `sitemap.xml`
- [ ] 测试了主要页面的SEO标签
- [ ] 验证了结构化数据格式

## 🔍 SEO验证工具

推荐使用以下工具验证SEO效果：

- [Google Search Console](https://search.google.com/search-console)
- [百度搜索资源平台](https://ziyuan.baidu.com/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

## 📞 技术支持

如有问题，请检查：
1. 配置文件是否正确修改
2. 构建是否成功
3. 网络是否可以访问相关资源

---

**注意：这是一个二次开发脚手架，请根据实际项目需求调整配置。**