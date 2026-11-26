import { isMockEnabled } from '@/config/mock'
import { request } from '@/utils/request'
import { MockDashboardService } from '@/mock/services/dashboard'
import type { DashboardPeriod, DashboardStats, UserDistribution, VisitTrend } from '@/types'

const root = '/api/v1/dashboard'

export async function getDashboardStats(): Promise<DashboardStats> {
  if (isMockEnabled()) return MockDashboardService.getDashboardStats()
  return request.get<DashboardStats>(`${root}/stats`)
}

export async function getVisitTrend(period: DashboardPeriod): Promise<VisitTrend[]> {
  if (isMockEnabled()) return MockDashboardService.getVisitTrend(period)
  return request.get<VisitTrend[]>(`${root}/visit-trend`, { period })
}

export async function getUserDistribution(): Promise<UserDistribution[]> {
  if (isMockEnabled()) return MockDashboardService.getUserDistribution()
  return request.get<UserDistribution[]>(`${root}/user-distribution`)
}
