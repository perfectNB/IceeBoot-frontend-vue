import request from '@/utils/request'

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
export const getRedisKeys = (params: RedisQueryParams) => {
  return request<RedisResponse>({
    url: '/api/v1/redis/keys',
    method: 'GET',
    params
  })
}

// 删除Redis键
export const deleteRedisKey = (key: string) => {
  return request({
    url: `/api/v1/redis/keys/${encodeURIComponent(key)}`,
    method: 'DELETE'
  })
}

// 获取Redis键详情
export const getRedisKeyDetail = (key: string) => {
  return request<RedisKey>({
    url: `/api/v1/redis/keys/${encodeURIComponent(key)}`,
    method: 'GET'
  })
}