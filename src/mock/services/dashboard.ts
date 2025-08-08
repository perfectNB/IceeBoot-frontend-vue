// 工作台统计数据Mock服务

import { mockDashboardStats, mockVisitTrend, mockUserDistribution } from '../data'
import type { DashboardStats, VisitTrend, UserDistribution } from '@/types'

export class MockDashboardService {
  // 获取工作台统计数据
  static getDashboardStats(): DashboardStats {
    return mockDashboardStats
  }

  // 获取访问趋势数据
  static getVisitTrend(): VisitTrend[] {
    return mockVisitTrend
  }

  // 获取用户分布数据
  static getUserDistribution(): UserDistribution[] {
    return mockUserDistribution
  }
}