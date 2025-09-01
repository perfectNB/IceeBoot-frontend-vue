/**
 * 样式加载优化工具
 */

// 预加载关键样式
export const preloadCriticalStyles = () => {
  const criticalStyles = [
    '/src/styles/variables.scss',
    '/src/styles/global.scss'
  ]

  criticalStyles.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = href
    document.head.appendChild(link)
  })
}

// 懒加载非关键样式
export const loadNonCriticalStyles = () => {
  const nonCriticalStyles = [
    'element-plus/dist/index.css',
    'element-plus/theme-chalk/dark/css-vars.css'
  ]

  nonCriticalStyles.forEach(stylePath => {
    import(stylePath).catch(err => {
      console.warn(`Failed to load style: ${stylePath}`, err)
    })
  })
}

// 样式加载完成回调
export const onStylesLoaded = (callback: () => void) => {
  if (document.readyState === 'complete') {
    callback()
  } else {
    window.addEventListener('load', callback)
  }
}

// 检测样式加载状态
export const checkStylesLoaded = (): Promise<void> => {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const computedStyle = window.getComputedStyle(document.body)
      if (computedStyle.fontFamily.includes('Helvetica')) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 50)

    // 超时保护
    setTimeout(() => {
      clearInterval(checkInterval)
      resolve()
    }, 3000)
  })
}
