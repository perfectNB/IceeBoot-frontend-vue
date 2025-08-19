import { logData } from '../data/log'
import type { LogQueryParams, LogResponse } from '@/api/log'

export class MockLogService {
  // 获取日志列表
  static async getLogs(params: LogQueryParams): Promise<LogResponse> {
    const { page = 1, size = 20, level, module, keyword, startTime, endTime } = params
    
    // 过滤数据
    let filteredData = [...logData]
    
    if (level) {
      filteredData = filteredData.filter(item => item.level === level)
    }
    
    if (module) {
      filteredData = filteredData.filter(item => 
        item.module.toLowerCase().includes(module.toLowerCase())
      )
    }
    
    if (keyword) {
      filteredData = filteredData.filter(item => 
        item.message.toLowerCase().includes(keyword.toLowerCase()) ||
        item.className.toLowerCase().includes(keyword.toLowerCase())
      )
    }
    
    if (startTime) {
      filteredData = filteredData.filter(item => item.timestamp >= startTime)
    }
    
    if (endTime) {
      filteredData = filteredData.filter(item => item.timestamp <= endTime)
    }
    
    // 按时间倒序排列
    filteredData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    // 分页
    const total = filteredData.length
    const start = (page - 1) * size
    const end = start + size
    const records = filteredData.slice(start, end)
    const pages = Math.ceil(total / size)
    
    return {
      records,
      total,
      current: page,
      size,
      pages,
      hasPrevious: page > 1,
      hasNext: page < pages
    }
  }
  
  // 删除日志
  static async deleteLog(id: string): Promise<void> {
    const index = logData.findIndex(item => item.id === id)
    if (index > -1) {
      logData.splice(index, 1)
    }
  }
  
  // 批量删除日志
  static async batchDeleteLogs(ids: string[]): Promise<void> {
    ids.forEach(id => {
      const index = logData.findIndex(item => item.id === id)
      if (index > -1) {
        logData.splice(index, 1)
      }
    })
  }
  
  // 清空日志
  static async clearLogs(params?: { level?: string; beforeDate?: string }): Promise<void> {
    if (!params) {
      // 清空所有日志
      logData.length = 0
      return
    }
    
    const { level, beforeDate } = params
    
    // 根据条件删除日志
    for (let i = logData.length - 1; i >= 0; i--) {
      const item = logData[i]
      let shouldDelete = true
      
      if (level && item.level !== level) {
        shouldDelete = false
      }
      
      if (beforeDate && item.timestamp > beforeDate) {
        shouldDelete = false
      }
      
      if (shouldDelete) {
        logData.splice(i, 1)
      }
    }
  }
}