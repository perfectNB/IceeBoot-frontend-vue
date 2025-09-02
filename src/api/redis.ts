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
  if (!isMockEnabled()) {
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
  if (!isMockEnabled()) {
    // 使用Mock数据
    await MockRedisService.deleteRedisKey(key)
  } else {
    // 调用真实API - 统一使用批量删除接口
    await deleteRedisKeys([key])
  }
}

// 批量删除Redis键
export const deleteRedisKeys = async (keys: string[]): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据 - 逐个删除
    for (const key of keys) {
      await MockRedisService.deleteRedisKey(key)
    }
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/redis/keys', keys as unknown as Record<string, unknown>)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('批量删除Redis键失败')
    }
  }
}

// 创建Redis键
export const createRedisKey = async (params: CreateRedisKeyParams): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    await MockRedisService.createRedisKey(params)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/redis/keys', params as unknown as Record<string, unknown>)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建Redis键失败')
    }
  }
}

// 获取Redis键详情
export const getRedisKeyDetail = async (key: string): Promise<RedisKey> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    return await MockRedisService.getRedisKeyDetail(key)
  } else {
    // 调用真实API
    const response = await request.get<ApiResponse<RedisKey>>(`/api/v1/redis/keys/${encodeURIComponent(key)}`)
    return response.data.data
  }
}
