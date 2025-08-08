// 工作台统计数据Mock

import type { DashboardStats, VisitTrend, UserDistribution } from '@/types'

// 工作台统计数据
export const mockDashboardStats: DashboardStats = {
  totalUsers: 1248,
  todayVisits: 3567,
  totalArticles: 892,
  systemStatus: 'normal',
  userGrowth: 12.5,
  visitGrowth: 8.3,
  articleGrowth: 15.2
}

// 访问趋势数据（最近7天）
export const mockVisitTrend: VisitTrend[] = [
  { date: '2024-01-15', visits: 2340, users: 1120 },
  { date: '2024-01-16', visits: 2890, users: 1350 },
  { date: '2024-01-17', visits: 3120, users: 1480 },
  { date: '2024-01-18', visits: 2750, users: 1290 },
  { date: '2024-01-19', visits: 3450, users: 1620 },
  { date: '2024-01-20', visits: 3890, users: 1850 },
  { date: '2024-01-21', visits: 3567, users: 1680 }
]

// 用户分布数据
export const mockUserDistribution: UserDistribution[] = [
  { name: '北京', value: 312, percentage: 25.0 },
  { name: '上海', value: 249, percentage: 20.0 },
  { name: '广州', value: 187, percentage: 15.0 },
  { name: '深圳', value: 149, percentage: 12.0 },
  { name: '杭州', value: 125, percentage: 10.0 },
  { name: '成都', value: 100, percentage: 8.0 },
  { name: '其他', value: 126, percentage: 10.0 }
]