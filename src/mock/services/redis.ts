import { redisData } from '../data/redis'
import type { RedisKey, RedisQueryParams, RedisResponse, CreateRedisKeyParams } from '@/api/redis'
import { mockDelay, mockLog } from '@/config/mock'

export class MockRedisService {
  // 获取Redis键列表
  static async getRedisKeys(params: RedisQueryParams): Promise<RedisResponse> {
    await mockDelay()
    mockLog('获取Redis键列表', params)
    
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
    await mockDelay()
    mockLog('删除Redis键', { key })
    
    const index = redisData.findIndex(item => item.key === key)
    if (index > -1) {
      redisData.splice(index, 1)
    }
  }
  
  // 创建Redis键
  static async createRedisKey(params: CreateRedisKeyParams): Promise<void> {
    await mockDelay()
    mockLog('创建Redis键', params)
    
    // 检查键是否已存在
    const existingItem = redisData.find(item => item.key === params.key)
    if (existingItem) {
      throw new Error(`Redis键 "${params.key}" 已存在`)
    }
    
    // 计算数据大小（简单估算）
    let size = '0B'
    if (typeof params.value === 'string') {
      size = `${params.value.length}B`
    } else if (Array.isArray(params.value)) {
      size = `${JSON.stringify(params.value).length}B`
    } else if (typeof params.value === 'object') {
      size = `${JSON.stringify(params.value).length}B`
    }
    
    // 创建新的Redis项
    const newRedisItem: RedisKey = {
      key: params.key,
      type: params.type,
      value: params.value,
      ttl: params.ttl,
      size
    }
    
    // 添加到数据数组开头
    redisData.unshift(newRedisItem)
  }
  
  // 获取Redis键详情
  static async getRedisKeyDetail(key: string): Promise<RedisKey> {
    await mockDelay()
    mockLog('获取Redis键详情', { key })
    
    const item = redisData.find(item => item.key === key)
    if (!item) {
      throw new Error(`Redis键 "${key}" 不存在`)
    }
    return { ...item }
  }
}