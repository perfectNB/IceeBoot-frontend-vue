import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockRedisService } from '@/mock/services/redis'
import type { ApiResponse } from '@/types'

export interface RedisKey {
  key: string
  type: string
  value: string | number | object | boolean
  ttl: number
  size: string
}

export interface RedisQueryParams {
  page: number
  size: number
  key?: string
  type?: string
}

export interface RedisResponse {
  list: RedisKey[]
  total: number
}

// 获取Redis键列表
export const getRedisKeys = async (params: RedisQueryParams): Promise<RedisResponse> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockRedisService.getRedisKeys(params)
  } else {
    // 调用真实API
    const response = await request.get<ApiResponse<RedisResponse>>('/api/v1/redis/keys', { params })
    return response.data.data
  }
}

// 删除Redis键
export const deleteRedisKey = async (key: string): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockRedisService.deleteRedisKey(key)
  } else {
    // 调用真实API
    await request.delete(`/api/v1/redis/keys/${encodeURIComponent(key)}`)
  }
}

// 获取Redis键详情
export const getRedisKeyDetail = async (key: string): Promise<RedisKey> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockRedisService.getRedisKeyDetail(key)
  } else {
    // 调用真实API
    const response = await request.get<ApiResponse<RedisKey>>(`/api/v1/redis/keys/${encodeURIComponent(key)}`)
    return response.data.data
  }
}