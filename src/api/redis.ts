import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import type { ApiResponse } from '@/types'
import { MockRedisService } from '@/mock/services/redis'

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

// 获取Redis键列表
export const getRedisKeys = async (params: RedisQueryParams): Promise<RedisResponse> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockRedisService.getRedisKeys(params)
  } else {
    // 调用真实API
    const response = await request.get<{result: RedisResponse}>('/api/v1/redis/keys',  params )
    const apiResponse = response as unknown as {code: number, message: string, result: RedisResponse, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取Redis键列表响应数据格式错误')
    }
    return apiResponse.result
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
