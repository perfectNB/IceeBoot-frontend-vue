/**
 * 性能监控工具
 * 用于监测Core Web Vitals指标和页面性能
 */

// Core Web Vitals 指标接口
export interface WebVitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

// 性能指标阈值
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }  // Time to First Byte
}

/**
 * 获取性能评级
 * @param name 指标名称
 * @param value 指标值
 * @returns 评级
 */
function getRating(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * 监控Core Web Vitals
 * @param callback 回调函数
 */
export function monitorWebVitals(callback: (metric: WebVitalsMetric) => void): void {
  // 检查是否支持Performance Observer
  if (!('PerformanceObserver' in window)) {
    console.warn('PerformanceObserver not supported')
    return
  }

  // 监控LCP (Largest Contentful Paint)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
      
      callback({
        name: 'LCP',
        value: lastEntry.startTime,
        rating: getRating('LCP', lastEntry.startTime),
        delta: lastEntry.startTime,
        id: 'lcp-' + Date.now()
      })
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
  } catch (e) {
    console.warn('LCP monitoring failed:', e)
  }

  // 监控FID (First Input Delay)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEntry & { processingStart: number }
        callback({
          name: 'FID',
          value: fidEntry.processingStart - fidEntry.startTime,
          rating: getRating('FID', fidEntry.processingStart - fidEntry.startTime),
          delta: fidEntry.processingStart - fidEntry.startTime,
          id: 'fid-' + Date.now()
        })
      })
    })
    fidObserver.observe({ entryTypes: ['first-input'] })
  } catch (e) {
    console.warn('FID monitoring failed:', e)
  }

  // 监控CLS (Cumulative Layout Shift)
  try {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        const clsEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number }
        if (!clsEntry.hadRecentInput) {
          clsValue += clsEntry.value
        }
      })
      
      callback({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        delta: clsValue,
        id: 'cls-' + Date.now()
      })
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  } catch (e) {
    console.warn('CLS monitoring failed:', e)
  }

  // 监控FCP (First Contentful Paint)
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        callback({
          name: 'FCP',
          value: entry.startTime,
          rating: getRating('FCP', entry.startTime),
          delta: entry.startTime,
          id: 'fcp-' + Date.now()
        })
      })
    })
    fcpObserver.observe({ entryTypes: ['paint'] })
  } catch (e) {
    console.warn('FCP monitoring failed:', e)
  }
}

/**
 * 获取页面加载性能指标
 * @returns 性能指标对象
 */
export function getPagePerformance() {
  if (!window.performance || !window.performance.timing) {
    return null
  }

  const timing = window.performance.timing
  const navigation = window.performance.navigation

  return {
    // DNS查询时间
    dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
    // TCP连接时间
    tcpTime: timing.connectEnd - timing.connectStart,
    // 请求时间
    requestTime: timing.responseEnd - timing.requestStart,
    // 解析DOM树时间
    domParseTime: timing.domComplete - timing.domLoading,
    // 白屏时间
    whiteScreenTime: timing.responseStart - timing.navigationStart,
    // DOM Ready时间
    domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
    // 页面完全加载时间
    loadCompleteTime: timing.loadEventEnd - timing.navigationStart,
    // 重定向次数
    redirectCount: navigation.redirectCount,
    // 导航类型
    navigationType: navigation.type
  }
}

/**
 * 获取资源加载性能
 * @returns 资源性能数组
 */
export function getResourcePerformance() {
  if (!window.performance || !window.performance.getEntriesByType) {
    return []
  }

  const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  
  return resources.map(resource => ({
    name: resource.name,
    type: resource.initiatorType,
    size: resource.transferSize || 0,
    duration: resource.duration,
    startTime: resource.startTime,
    // DNS查询时间
    dnsTime: resource.domainLookupEnd - resource.domainLookupStart,
    // TCP连接时间
    tcpTime: resource.connectEnd - resource.connectStart,
    // 请求时间
    requestTime: resource.responseEnd - resource.requestStart
  }))
}

/**
 * 监控长任务
 * @param callback 回调函数
 */
export function monitorLongTasks(callback: (task: PerformanceEntry) => void): void {
  if (!('PerformanceObserver' in window)) {
    return
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(callback)
    })
    observer.observe({ entryTypes: ['longtask'] })
  } catch (e) {
    console.warn('Long task monitoring failed:', e)
  }
}

/**
 * 性能监控初始化
 */
export function initPerformanceMonitoring(): void {
  // 监控Core Web Vitals
  monitorWebVitals((metric) => {
    console.log(`[Performance] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating
    })
    
    // 可以在这里发送数据到分析服务
    // sendToAnalytics(metric)
  })

  // 监控长任务
  monitorLongTasks((task) => {
    console.warn('[Performance] Long task detected:', {
      duration: task.duration,
      startTime: task.startTime
    })
  })

  // 页面加载完成后输出性能报告
  window.addEventListener('load', () => {
    setTimeout(() => {
      const pagePerf = getPagePerformance()
      const resourcePerf = getResourcePerformance()
      
      console.log('[Performance] Page Performance:', pagePerf)
      console.log('[Performance] Resource Performance:', resourcePerf)
    }, 0)
  })
}