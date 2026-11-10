declare const __APP_VERSION__: string

export const setupVersionGuard = () => {
  if (!import.meta.env.PROD) return
  if (typeof window === 'undefined') return

  const currentVersion = __APP_VERSION__
  let checking = false

  const check = async () => {
    if (checking) return
    checking = true
    try {
      const res = await fetch('/version.json', { cache: 'no-store' })
      if (!res.ok) return
      const payload = (await res.json()) as { version?: string }
      const remoteVersion = payload?.version
      if (!remoteVersion || remoteVersion === currentVersion) return

      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }

      const url = new URL(window.location.href)
      url.searchParams.set('v', remoteVersion)
      window.location.replace(url.toString())
    } finally {
      checking = false
    }
  }

  void check()
  window.setInterval(() => void check(), 5 * 60 * 1000)
}

