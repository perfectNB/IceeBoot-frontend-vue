import type { Router } from 'vue-router'
import { hasPermission } from '@/utils/permission'

export function canOpenWorkflowPage(router: Router, name: string) {
  if (!router.hasRoute(name)) return false
  const permissions = router.resolve({ name }).meta.permissions
  return !Array.isArray(permissions) || !permissions.length || permissions.some(hasPermission)
}
