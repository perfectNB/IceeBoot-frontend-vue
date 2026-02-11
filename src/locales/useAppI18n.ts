import i18n from './index'

/**
 * Non-component context t() function.
 * Use this in request.ts, router guards, and other non-setup contexts.
 */
export function t(key: string, named?: Record<string, unknown>): string {
  return (i18n.global.t as (key: string, named?: Record<string, unknown>) => string)(key, named ?? {})
}
