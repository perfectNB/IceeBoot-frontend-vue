import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockRedisService } from '@/mock/services/redis'

export interface RedisKey {
  key: string
  type: string
  value: string | number | object | boolean
  ttl: number
  size: string
}

export interface RedisQueryParams {
  pageNum: number
  pageSize: number
  key?: string
  type?: string
  [key: string]: unknown
}

export interface RedisResponse {
  records: RedisKey[]
  total: number
  current: number
  size: number
  pages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface CreateRedisKeyParams {
  key: string
  type: string
  value: string | Record<string, string> | string[] | Array<{score: number, member: string}>
  ttl: number
}

// 获取Redis键列表
export const getRedisKeys = async (params: RedisQueryParams): Promise<RedisResponse> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockRedisService.getRedisKeys(params)
  } else {
    // 调用真实API
    return await request.get<RedisResponse>('/api/v1/redis/keys', params)
  }
}



// 删除Redis键
export const deleteRedisKey = async (key: string): Promise<void> => {
  return await deleteRedisKeys([key])
}

// 批量删除Redis键
export const deleteRedisKeys = async (keys: string[]): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据 - 逐个删除
    for (const key of keys) {
      await MockRedisService.deleteRedisKey(key)
    }
  } else {
    // 调用真实API
    await request.delete('/api/v1/redis/keys', {},{
      data: keys.map(String)
    })
  }
}

// 创建Redis键
export const createRedisKey = async (params: CreateRedisKeyParams): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockRedisService.createRedisKey(params)
  } else {
    // 调用真实API
    await request.post('/api/v1/redis/keys', params as unknown as Record<string, unknown>)
  }
}

// 获取Redis键详情
export const getRedisKeyDetail = async (key: string): Promise<RedisKey> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockRedisService.getRedisKeyDetail(key)
  } else {
    // 调用真实API
    return await request.get<RedisKey>(`/api/v1/redis/keys/${encodeURIComponent(key)}`)
  }
}
