import type { DashboardPeriod, DashboardStats, UserDistribution, VisitTrend } from '@/types'
import { mockUsers } from '../data/user'
import { logData } from '../data/log'

function dateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export const MockDashboardService = {
  getDashboardStats(): DashboardStats {
    const today = dateKey(new Date())
    const logs = logData.filter(row => row.timestamp.startsWith(today))
    return {
      totalUsers: mockUsers.length,
      newUsers: mockUsers.filter(user => user.createTime && dateKey(new Date(user.createTime.replace(' ', 'T'))) === today).length,
      logCount: logs.length,
      errorCount: logs.filter(row => row.level === 'ERROR').length,
    }
  },
  getVisitTrend(period: DashboardPeriod): VisitTrend[] {
    const days = period === 'month' ? 30 : 7
    const today = new Date()
    return Array.from({ length: days }, (_, index) => {
      const day = new Date(today)
      day.setDate(today.getDate() - days + 1 + index)
      const date = dateKey(day)
      const logs = logData.filter(row => row.timestamp.startsWith(date))
      return { date, logCount: logs.length, errorCount: logs.filter(row => row.level === 'ERROR').length }
    })
  },
  getUserDistribution(): UserDistribution[] {
    const counts = { active: 0, inactive: 0, other: 0 }
    for (const { status } of mockUsers) counts[status === 'active' || status === 'inactive' ? status : 'other']++
    return (Object.keys(counts) as UserDistribution['name'][]).filter(name => counts[name]).map(name => ({ name, value: counts[name] }))
  },
}
