import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockLogService } from '@/mock/services/log'

export interface LogItem {
  id: string
  level: string
  timestamp: string
  module: string
  message: string
  thread: string
  className: string
  stackTrace?: string
}

export interface LogQueryParams {
  pageNum: number
  pageSize: number
  level?: string
  module?: string
  keyword?: string
  startTime?: string
  endTime?: string
  [key: string]: unknown
}

export interface LogResponse {
  records: LogItem[]
  total: number
  current: number
  size: number
  pages: number
  hasPrevious: boolean
  hasNext: boolean
}

// 获取日志列表
export const getLogs = async (params: LogQueryParams): Promise<LogResponse> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockLogService.getLogs(params)
  } else {
    // 调用真实API
    const response = await request.get<{result: LogResponse}>('/api/v1/logs',  params )
    const apiResponse = response as unknown as {code: number, message: string, result: LogResponse, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取日志列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 删除日志（批量删除）
export const deleteLogs = async (ids: string[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockLogService.batchDeleteLogs(ids)
    return true
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/logs', {}, {
      data: ids
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除日志失败')
    }
    return true
  }
}

// 删除单个日志（兼容性保留）
export const deleteLog = async (id: string): Promise<boolean> => {
  return await deleteLogs([id])
}

// 批量删除日志（兼容性保留）
export const batchDeleteLogs = async (ids: string[]): Promise<void> => {
  await deleteLogs(ids)
}

// 清空日志
export const clearLogs = async (params?: { level?: string; beforeDate?: string }): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockLogService.clearLogs(params)
  } else {
    // 调用真实API
    await request.delete('/api/v1/logs/clear', params)
  }
}
