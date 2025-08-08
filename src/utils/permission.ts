import { useUserStore } from '@/stores/user'

/**
 * 检查用户是否有指定权限
 * @param permission 权限标识
 * @returns 是否有权限
 */
export function hasPermission(permission: string): boolean {
  const userStore = useUserStore()
  const userPermissions = userStore.permissions || []
  return userPermissions.includes(permission)
}

/**
 * 检查用户是否有任意一个权限
 * @param permissions 权限标识数组
 * @returns 是否有权限
 */
export function hasAnyPermission(permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(permission))
}

/**
 * 检查用户是否有所有权限
 * @param permissions 权限标识数组
 * @returns 是否有权限
 */
export function hasAllPermissions(permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(permission))
}

/**
 * 权限指令
 * 用于在模板中进行权限控制
 */
export const vPermission = {
  mounted(el: HTMLElement, binding: { value: string | string[] }) {
    const { value } = binding
    if (!value) return

    let hasAuth = false
    if (Array.isArray(value)) {
      hasAuth = hasAnyPermission(value)
    } else {
      hasAuth = hasPermission(value)
    }

    if (!hasAuth) {
      el.style.display = 'none'
    }
  },
  updated(el: HTMLElement, binding: { value: string | string[] }) {
    const { value } = binding
    if (!value) return

    let hasAuth = false
    if (Array.isArray(value)) {
      hasAuth = hasAnyPermission(value)
    } else {
      hasAuth = hasPermission(value)
    }

    if (!hasAuth) {
      el.style.display = 'none'
    } else {
      el.style.display = ''
    }
  }
}