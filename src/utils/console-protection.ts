/**
 * 控制台防护工具
 * 防止用户在生产环境中打开浏览器控制台
 */

// 防护配置
interface ProtectionConfig {
  // 是否启用防护（仅在生产环境启用）
  enabled: boolean
  // 检测间隔（毫秒）
  detectInterval: number
  // 警告消息
  warningMessage: string
  // 是否显示警告弹窗
  showAlert: boolean
  // 是否重定向页面
  redirectOnDetect: boolean
  // 重定向URL
  redirectUrl: string
}

const defaultConfig: ProtectionConfig = {
  enabled: import.meta.env.PROD, // 仅在生产环境启用
  detectInterval: 1000,
  warningMessage: '检测到开发者工具，为了系统安全，请关闭控制台！',
  showAlert: true,
  redirectOnDetect: false,
  redirectUrl: '/'
}

class ConsoleProtection {
  private config: ProtectionConfig
  private isDevToolsOpen = false
  private detectTimer: number | null = null
  private startTime = 0
  private checkCount = 0

  constructor(config: Partial<ProtectionConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * 启动控制台防护
   */
  public start(): void {
    if (!this.config.enabled) {
      console.log('控制台防护已禁用（开发环境）')
      return
    }

    console.log('控制台防护已启动')
    this.initProtection()
  }

  /**
   * 停止控制台防护
   */
  public stop(): void {
    if (this.detectTimer) {
      clearInterval(this.detectTimer)
      this.detectTimer = null
    }
    console.log('控制台防护已停止')
  }

  /**
   * 初始化防护措施
   */
  private initProtection(): void {
    // 1. 禁用右键菜单
    this.disableContextMenu()

    // 2. 禁用常用快捷键
    this.disableShortcuts()

    // 3. 检测开发者工具
    this.startDevToolsDetection()

    // 4. 控制台警告信息
    this.showConsoleWarning()

    // 5. 防止选择文本
    this.disableTextSelection()
  }

  /**
   * 禁用右键菜单
   */
  private disableContextMenu(): void {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      return false
    })
  }

  /**
   * 禁用常用快捷键
   */
  private disableShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // 禁用F12
      if (e.key === 'F12') {
        e.preventDefault()
        this.handleDevToolsDetected()
        return false
      }

      // 禁用Ctrl+Shift+I (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        this.handleDevToolsDetected()
        return false
      }

      // 禁用Ctrl+Shift+J (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault()
        this.handleDevToolsDetected()
        return false
      }

      // 禁用Ctrl+U (查看源代码)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault()
        return false
      }

      // 禁用Ctrl+S (保存页面)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        return false
      }

      // 禁用Ctrl+A (全选)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        return false
      }

      // 禁用Ctrl+P (打印)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault()
        return false
      }

      // Mac系统快捷键
      if (e.metaKey) {
        // 禁用Cmd+Option+I
        if (e.altKey && e.key === 'i') {
          e.preventDefault()
          this.handleDevToolsDetected()
          return false
        }

        // 禁用Cmd+Option+J
        if (e.altKey && e.key === 'j') {
          e.preventDefault()
          this.handleDevToolsDetected()
          return false
        }

        // 禁用Cmd+Option+C
        if (e.altKey && e.key === 'c') {
          e.preventDefault()
          this.handleDevToolsDetected()
          return false
        }
      }
    })
  }

  /**
   * 开始检测开发者工具
   */
  private startDevToolsDetection(): void {
    this.detectTimer = window.setInterval(() => {
      this.checkDevTools()
    }, this.config.detectInterval)
  }

  /**
   * 检测开发者工具是否打开
   */
  private checkDevTools(): void {
    const widthThreshold = window.outerWidth - window.innerWidth > 160
    const heightThreshold = window.outerHeight - window.innerHeight > 160

    // 方法1: 检测窗口尺寸变化
    if (widthThreshold || heightThreshold) {
      if (!this.isDevToolsOpen) {
        this.handleDevToolsDetected()
      }
      return
    }

    // 方法2: 使用console.log检测
    this.startTime = performance.now()
    console.log('%c', 'color: transparent')
    console.clear()

    const endTime = performance.now()
    if (endTime - this.startTime > 100) {
      if (!this.isDevToolsOpen) {
        this.handleDevToolsDetected()
      }
      return
    }

    // 方法3: 检测调试器
    try {
      const devtools = {
        open: false,
        orientation: null as string | null
      }

      setInterval(() => {
        if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
          if (!devtools.open) {
            devtools.open = true
            this.handleDevToolsDetected()
          }
        } else {
          devtools.open = false
          this.isDevToolsOpen = false
        }
      }, 500)
    } catch {
      // 忽略错误
    }
  }

  /**
   * 处理检测到开发者工具
   */
  private handleDevToolsDetected(): void {
    this.isDevToolsOpen = true

    if (this.config.showAlert) {
      alert(this.config.warningMessage)
    }

    // 清空控制台
    console.clear()

    // 输出警告信息
    console.log('%c' + this.config.warningMessage, 'color: red; font-size: 20px; font-weight: bold;')

    if (this.config.redirectOnDetect) {
      window.location.href = this.config.redirectUrl
    }
  }

  /**
   * 显示控制台警告信息
   */
  private showConsoleWarning(): void {
    const styles = [
      'color: red',
      'font-size: 20px',
      'font-weight: bold',
      'text-shadow: 2px 2px 4px rgba(0,0,0,0.5)'
    ].join(';')

    console.log('%c⚠️ 警告 ⚠️', styles)
    console.log('%c此系统受到保护，禁止使用开发者工具！', 'color: red; font-size: 16px;')
    console.log('%c如果您是开发人员，请联系系统管理员获取授权。', 'color: orange; font-size: 14px;')
    console.log('%c任何未经授权的调试行为都将被记录。', 'color: red; font-size: 14px;')
  }

  /**
   * 防止选择文本
   */
  private disableTextSelection(): void {
    document.addEventListener('selectstart', (e) => {
      e.preventDefault()
      return false
    })

    document.addEventListener('dragstart', (e) => {
      e.preventDefault()
      return false
    })

    // 添加CSS样式防止选择
    const style = document.createElement('style')
    style.textContent = `
      * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }

      input, textarea {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
    `
    document.head.appendChild(style)
  }
}

// 创建全局实例
const consoleProtection = new ConsoleProtection()

// 导出
export { ConsoleProtection, consoleProtection }
export default consoleProtection
