/**
 * SEO工具类 - 二次开发脚手架
 * 用于动态设置页面的SEO信息
 * 配置文件位置：src/config/seo.config.ts
 */

import { 
  DEFAULT_SEO_CONFIG, 
  getPageSEOConfig, 
  getFullUrl as configGetFullUrl,
  generateStructuredData
} from '@/config/seo.config'

// SEO配置接口
export interface SEOConfig {
  title?: string
  description?: string
  keywords?: string
  author?: string
  robots?: string
  canonical?: string
  og?: {
    type?: string
    title?: string
    description?: string
    url?: string
    siteName?: string
    locale?: string
    image?: string
  }
  twitter?: {
    card?: string
    title?: string
    description?: string
    image?: string
  }
}

/**
 * 设置页面SEO信息
 * @param config SEO配置
 */
export function setSEO(config: SEOConfig): void {
  // 设置页面标题
  if (config.title) {
    document.title = config.title
  }

  // 设置meta标签
  if (config.description) {
    setMetaTag('description', config.description)
  }

  if (config.keywords) {
    setMetaTag('keywords', config.keywords)
  }

  if (config.author) {
    setMetaTag('author', config.author)
  }

  if (config.robots) {
    setMetaTag('robots', config.robots)
  }

  // 设置canonical链接
  if (config.canonical) {
    setCanonicalLink(config.canonical)
  }

  // 设置Open Graph标签
  if (config.og) {
    const og = config.og
    if (og.type) setMetaTag('og:type', og.type, 'property')
    if (og.title) setMetaTag('og:title', og.title, 'property')
    if (og.description) setMetaTag('og:description', og.description, 'property')
    if (og.url) setMetaTag('og:url', og.url, 'property')
    if (og.siteName) setMetaTag('og:site_name', og.siteName, 'property')
    if (og.locale) setMetaTag('og:locale', og.locale, 'property')
    if (og.image) setMetaTag('og:image', og.image, 'property')
  }

  // 设置Twitter Card标签
  if (config.twitter) {
    const twitter = config.twitter
    if (twitter.card) setMetaTag('twitter:card', twitter.card)
    if (twitter.title) setMetaTag('twitter:title', twitter.title)
    if (twitter.description) setMetaTag('twitter:description', twitter.description)
    if (twitter.image) setMetaTag('twitter:image', twitter.image)
  }
}

/**
 * 设置meta标签
 * @param name 标签名称
 * @param content 标签内容
 * @param attribute 属性名称（name或property）
 */
function setMetaTag(name: string, content: string, attribute: string = 'name'): void {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement
  
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, name)
    document.head.appendChild(meta)
  }
  
  meta.setAttribute('content', content)
}

/**
 * 设置canonical链接
 * @param url canonical URL
 */
function setCanonicalLink(url: string): void {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
  
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  
  link.setAttribute('href', url)
}

/**
 * 生成完整URL（使用配置文件中的域名）
 * @param path 路径
 * @returns 完整URL
 */
export function getFullUrl(path: string = ''): string {
  return configGetFullUrl(path)
}

/**
 * 根据路径获取SEO配置（使用配置文件）
 * @param path 路径
 * @returns SEO配置
 */
export function getSEOConfigByPath(path: string): SEOConfig {
  return getPageSEOConfig(path)
}

/**
 * 初始化页面SEO
 * 在应用启动时调用，设置默认SEO信息和结构化数据
 */
export function initSEO(): void {
  // 设置默认SEO配置
  setSEO(DEFAULT_SEO_CONFIG)
  
  // 添加结构化数据
  const structuredData = generateStructuredData()
  let script = document.querySelector('script[type="application/ld+json"]')
  
  if (!script) {
    script = document.createElement('script')
    script.setAttribute('type', 'application/ld+json')
    document.head.appendChild(script)
  }
  
  script.textContent = JSON.stringify(structuredData, null, 2)
}