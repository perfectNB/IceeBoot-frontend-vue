import { redisData } from '../data/redis'
import type { RedisKey, RedisQueryParams, RedisResponse } from '@/api/redis'

export class MockRedisService {
  // 获取Redis键列表
  static async getRedisKeys(params: RedisQueryParams): Promise<RedisResponse> {
    const { pageNum = 1, pageSize = 20, key, type } = params
    
    // 过滤数据
    let filteredData = [...redisData]
    
    if (key) {
      filteredData = filteredData.filter(item => 
        item.key.toLowerCase().includes(key.toLowerCase())
      )
    }
    
    if (type) {
      filteredData = filteredData.filter(item => item.type === type)
    }
    
    // 分页
    const total = filteredData.length
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    const records = filteredData.slice(start, end)
    const pages = Math.ceil(total / pageSize)
    
    return {
      records,
      total,
      current: pageNum,
      size: pageSize,
      pages,
      hasPrevious: pageNum > 1,
      hasNext: pageNum < pages
    }
  }
  
  // 删除Redis键
  static async deleteRedisKey(key: string): Promise<void> {
    const index = redisData.findIndex(item => item.key === key)
    if (index > -1) {
      redisData.splice(index, 1)
    }
  }
  
  // 获取Redis键详情
  static async getRedisKeyDetail(key: string): Promise<RedisKey> {
    const item = redisData.find(item => item.key === key)
    if (!item) {
      throw new Error(`Redis键 "${key}" 不存在`)
    }
    return { ...item }
  }
}