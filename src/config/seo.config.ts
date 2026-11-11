/**
 * SEO配置文件 - 二次开发脚手架模板
 * 使用说明：
 * 1. 修改 SITE_CONFIG 中的基础信息
 * 2. 根据需要调整 DEFAULT_SEO_CONFIG 的默认值
 * 3. 在 PAGE_SEO_CONFIGS 中添加特定页面的SEO配置
 */

// 网站基础配置
export const SITE_CONFIG = {
  // 网站域名 - 请修改为实际域名
  domain: 'https://iceeboot.yxycompany.com',
  // 网站名称 - 请修改为实际项目名称
  siteName: 'IceeBoot',
  // 网站全称 - 请修改为实际项目全称
  fullSiteName: 'IceeBoot AI 应用开发脚手架',
  // 网站描述 - 请修改为实际项目描述
  description: '面向独立开发者，集成 AgentScope 智能体、模型连接、Skill、Tool、MCP、沙箱与基础服务的 AI 应用开发脚手架',
  // 作者信息 - 请修改为实际作者
  author: 'CodeIcee',
  // 默认关键词 - 请修改为实际关键词
  keywords: 'AI应用开发,AgentScope,智能体,Skills,MCP,E2B,独立开发者,Spring Boot,Vue3,IceeBoot',
  // 网站语言
  locale: 'zh_CN',
  // 网站类型
  type: 'website'
}

// 默认SEO配置
export const DEFAULT_SEO_CONFIG = {
  title: `${SITE_CONFIG.fullSiteName} - 为独立开发者打造`,
  description: `${SITE_CONFIG.description}，复用成熟基础，专注应用开发。`,
  keywords: SITE_CONFIG.keywords,
  author: SITE_CONFIG.author,
  robots: 'index,follow',
  canonical: SITE_CONFIG.domain + '/',

  // Open Graph配置
  og: {
    type: SITE_CONFIG.type,
    title: `${SITE_CONFIG.fullSiteName} - 为独立开发者打造`,
    description: `${SITE_CONFIG.description}，从基础服务到智能体执行。`,
    url: SITE_CONFIG.domain + '/',
    siteName: SITE_CONFIG.siteName,
    locale: SITE_CONFIG.locale
  },

  // Twitter Card配置
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.fullSiteName,
    description: '为独立开发者打造的 AI 应用开发脚手架，集成 AgentScope 与常用基础服务'
  }
}

// 页面特定SEO配置
// 注意：当前配置只针对主页，其他页面不被搜索引擎收录
export const PAGE_SEO_CONFIGS: Record<string, Partial<typeof DEFAULT_SEO_CONFIG>> = {
  '/': {
    // 主页使用默认配置
    ...DEFAULT_SEO_CONFIG
  }
  // 如需添加其他页面，请在此处扩展
  // 例如：
  // '/about': {
  //   title: '关于我们 - ' + SITE_CONFIG.siteName,
  //   description: '了解我们的团队和使命',
  //   keywords: '关于我们,团队介绍,' + SITE_CONFIG.keywords
  // }
}

// 获取页面SEO配置
export function getPageSEOConfig(path: string) {
  return PAGE_SEO_CONFIGS[path] || DEFAULT_SEO_CONFIG
}

// 生成完整URL
export function getFullUrl(path: string = '') {
  return SITE_CONFIG.domain + path
}

// 生成robots.txt内容
export function generateRobotsTxt(): string {
  return `# robots.txt for ${SITE_CONFIG.siteName}
# 二次开发脚手架 - SEO配置模板

User-agent: *
# 只允许访问主页
Allow: /$

# 禁止访问所有其他页面和目录
Disallow: /admin/
Disallow: /home/
Disallow: /api/
Disallow: /config/
Disallow: /logs/
Disallow: /temp/
Disallow: /cache/

# 禁止访问开发相关文件
Disallow: /*.json$
Disallow: /*.ts$
Disallow: /*.vue$
Disallow: /src/
Disallow: /node_modules/
Disallow: /.git/
Disallow: /.vscode/
Disallow: /dist/

# 允许必要的静态资源
Allow: /*.css$
Allow: /*.js$
Allow: /static/
Allow: /assets/
Allow: /favicon.ico

# 站点地图位置
Sitemap: ${SITE_CONFIG.domain}/sitemap.xml

# 爬取延迟（秒）
Crawl-delay: 1

# 针对百度爬虫的特殊配置
User-agent: Baiduspider
Allow: /$
Disallow: /
Crawl-delay: 2

# 针对Google爬虫的配置
User-agent: Googlebot
Allow: /$
Disallow: /
Crawl-delay: 1`
}

// 生成sitemap.xml内容
export function generateSitemapXml(): string {
  const lastmod = new Date().toISOString().split('T')[0]

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- 二次开发脚手架 - SEO配置模板 -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- 主页 - 仅收录首页 -->
  <url>
    <loc>${SITE_CONFIG.domain}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

</urlset>`
}

// 生成结构化数据
export function generateStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_CONFIG.fullSiteName,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.domain,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.author
    },
    featureList: [
      '用户管理',
      '权限控制',
      'AI聊天助手',
      '代码生成',
      '系统监控',
      '文件管理'
    ]
  }
}
