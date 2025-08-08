import request from '@/utils/request'

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
  page: number
  size: number
  level?: string
  module?: string
  keyword?: string
  startTime?: string
  endTime?: string
}

export interface LogResponse {
  list: LogItem[]
  total: number
}

// 获取日志列表
export const getLogs = (params: LogQueryParams) => {
  return request<LogResponse>({
    url: '/api/v1/logs',
    method: 'GET',
    params
  })
}

// 删除日志
export const deleteLog = (id: string) => {
  return request({
    url: `/api/v1/logs/${id}`,
    method: 'DELETE'
  })
}

// 批量删除日志
export const batchDeleteLogs = (ids: string[]) => {
  return request({
    url: '/api/v1/logs/batch',
    method: 'DELETE',
    data: { ids }
  })
}

// 清空日志
export const clearLogs = (params?: { level?: string; beforeDate?: string }) => {
  return request({
    url: '/api/v1/logs/clear',
    method: 'DELETE',
    params
  })
}