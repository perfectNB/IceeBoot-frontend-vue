// 工作台统计数据API

import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockDashboardService } from '@/mock/services/dashboard'
import type { DashboardStats, VisitTrend, UserDistribution } from '@/types'

// 获取工作台统计数据
export const getDashboardStats = async (): Promise<DashboardStats> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return MockDashboardService.getDashboardStats()
  } else {
    // 调用真实API
    return await request.get<DashboardStats>('/api/v1/dashboard/stats')
  }
}

// 获取访问趋势数据
export const getVisitTrend = async (period: string): Promise<VisitTrend[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return MockDashboardService.getVisitTrend()
  } else {
    // 调用真实API
    return await request.get<VisitTrend[]>('/api/v1/dashboard/visit-trend', { period })
  }
}

// 获取用户分布数据
export const getUserDistribution = async (): Promise<UserDistribution[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return MockDashboardService.getUserDistribution()
  } else {
    // 调用真实API
    return await request.get<UserDistribution[]>('/api/v1/dashboard/user-distribution')
  }
}
