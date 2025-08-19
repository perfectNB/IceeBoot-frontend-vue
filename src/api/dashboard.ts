// 工作台统计数据API

import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockDashboardService } from '@/mock/services/dashboard'
import type { DashboardStats, VisitTrend, UserDistribution, ApiResponse } from '@/types'

// 获取工作台统计数据
export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const data = MockDashboardService.getDashboardStats()
    return {
      code: 200,
      message: '获取成功',
      data,
      success: true,
      timestamp: Date.now()
    }
  } else {
    // 调用真实API
    const response = await request.get<{result: DashboardStats}>('/api/v1/dashboard/stats')
    const apiResponse = response as unknown as {code: number, message: string, result: DashboardStats, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取工作台统计数据响应格式错误')
    }
    return {
      code: apiResponse.code,
      message: apiResponse.message,
      data: apiResponse.result,
      success: apiResponse.success,
      timestamp: Date.now()
    }
  }
}

// 获取访问趋势数据
export const getVisitTrend = async (period: string): Promise<ApiResponse<VisitTrend[]>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const data = MockDashboardService.getVisitTrend()
    return {
      code: 200,
      message: '获取成功',
      data,
      success: true,
      timestamp: Date.now()
    }
  } else {
    // 调用真实API
    const response = await request.get<{result: VisitTrend[]}>('/api/v1/dashboard/visit-trend', { period })
    const apiResponse = response as unknown as {code: number, message: string, result: VisitTrend[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取访问趋势数据响应格式错误')
    }
    return {
      code: apiResponse.code,
      message: apiResponse.message,
      data: apiResponse.result,
      success: apiResponse.success,
      timestamp: Date.now()
    }
  }
}

// 获取用户分布数据
export const getUserDistribution = async (): Promise<ApiResponse<UserDistribution[]>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const data = MockDashboardService.getUserDistribution()
    return {
      code: 200,
      message: '获取成功',
      data,
      success: true,
      timestamp: Date.now()
    }
  } else {
    // 调用真实API
    const response = await request.get<{result: UserDistribution[]}>('/api/v1/dashboard/user-distribution')
    const apiResponse = response as unknown as {code: number, message: string, result: UserDistribution[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取用户分布数据响应格式错误')
    }
    return {
      code: apiResponse.code,
      message: apiResponse.message,
      data: apiResponse.result,
      success: apiResponse.success,
      timestamp: Date.now()
    }
  }
}
