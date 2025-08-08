import { redisData } from '../data/redis'
import type { RedisKey, RedisQueryParams, RedisResponse } from '@/api/redis'

export class MockRedisService {
  // 获取Redis键列表
  static async getRedisKeys(params: RedisQueryParams): Promise<RedisResponse> {
    const { page = 1, size = 20, key, type } = params
    
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
    const start = (page - 1) * size
    const end = start + size
    const list = filteredData.slice(start, end)
    
    return {
      list,
      total
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