/**
 * 大模型管理API
 */

import { request } from '@/utils/request'
import type { LLMModel, LLMKey, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockLLMService } from '@/mock/services/llm'

/**
 * 获取大模型列表
 */
export const getLLMModels = async (params: PageParams): Promise<PageResult<LLMModel>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockLLMService.getModels(params)
    return response.data
  } else {
    // 调用真实API
    const response = await request.get<PageResult<LLMModel>>('/api/v1/ai/llm', params)
    return response.data
  }
}

/**
 * 获取大模型详情
 */
export const getLLMModel = async (id: string | number): Promise<LLMModel> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockLLMService.getModel(id)
    return response.data
  } else {
    // 调用真实API
    const response = await request.get<LLMModel>(`/api/v1/ai/llm/${id}`)
    return response.data
  }
}

/**
 * 创建大模型
 */
export const createLLMModel = async (data: Partial<LLMModel>): Promise<LLMModel> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockLLMService.createModel(data)
    return response.data
  } else {
    // 调用真实API
    const response = await request.post<LLMModel>('/api/v1/ai/llm', data)
    return response.data
  }
}

/**
 * 更新大模型
 */
export const updateLLMModel = async (id: string | number, data: Partial<LLMModel>): Promise<LLMModel> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockLLMService.updateModel(id, data)
    return response.data
  } else {
    // 调用真实API
    const response = await request.put<LLMModel>(`/api/v1/ai/llm/${id}`, data)
    return response.data
  }
}

/**
 * 删除大模型
 */
export const deleteLLMModel = async (id: string | number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockLLMService.deleteModel(id)
  } else {
    // 调用真实API
    await request.delete(`/api/v1/ai/llm/${id}`)
  }
}

/**
 * 添加模型Key
 */
export const addLLMModelKey = async (modelId: string | number, data: Partial<LLMKey>): Promise<LLMKey> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockLLMService.addModelKey(modelId, data)
    return response.data
  } else {
    // 调用真实API
    const response = await request.post<LLMKey>(`/api/v1/ai/llm/${modelId}/keys`, data)
    return response.data
  }
}

/**
 * 删除模型Key
 */
export const deleteLLMModelKey = async (modelId: string | number, keyId: string | number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockLLMService.deleteModelKey(modelId, keyId)
  } else {
    // 调用真实API
    await request.delete(`/api/v1/ai/llm/${modelId}/keys/${keyId}`)
  }
}

/**
 * 更新模型Key状态
 */
export const updateLLMModelKeyStatus = async (
  modelId: string | number, 
  keyId: string | number, 
  status: 'active' | 'inactive'
): Promise<LLMKey> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockLLMService.updateModelKeyStatus(modelId, keyId, status)
    return response.data
  } else {
    // 调用真实API
    const response = await request.put<LLMKey>(`/api/v1/ai/llm/${modelId}/keys/${keyId}/status`, { status })
    return response.data
  }
}