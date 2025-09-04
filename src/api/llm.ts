/**
 * 大模型管理API
 */

import { request } from '@/utils/request'
import type { LLMModel, LLMKey } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockLLMService } from '@/mock/services/llm'

// 获取大模型列表
export const getLLMModels = async (): Promise<LLMModel[]> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    const result = await MockLLMService.getLLMModels({})
    return result.records
  } else {
    // 调用真实API
    const response = await request.get<{result: LLMModel[]}>('/api/v1/llm-keys')
    const apiResponse = response as unknown as {code: number, message: string, result: LLMModel[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取LLM模型列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取大模型详情
export const getLLMModel = async (providerName: string): Promise<LLMModel> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockLLMService.getLLMModel(providerName)
  } else {
    // 调用真实API
    const response = await request.get<{result: LLMModel}>(`/api/v1/llm-keys/${providerName}`)
    const apiResponse = response as unknown as {code: number, message: string, result: LLMModel, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取LLM模型详情响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 创建大模型
export const createLLMModel = async (data: Partial<LLMModel>): Promise<LLMModel> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockLLMService.createLLMModel(data)
  } else {
    // 调用真实API
    const response = await request.post<{result: LLMModel}>('/api/v1/llm-keys', data)
    const apiResponse = response as unknown as {code: number, message: string, result: LLMModel, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('创建LLM模型响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 更新大模型
export const updateLLMModel = async (providerName: string, data: Partial<LLMModel>): Promise<LLMModel> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockLLMService.updateLLMModel(providerName, data)
  } else {
    // 调用真实API
    const response = await request.put<{result: LLMModel}>(`/api/v1/llm-keys/${providerName}`, data)
    const apiResponse = response as unknown as {code: number, message: string, result: LLMModel, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('更新LLM模型响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 删除大模型
export const deleteLLMModel = async (providerName: string): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockLLMService.deleteLLMModel(providerName)
  } else {
    // 调用真实API
    const response = await request.delete(`/api/v1/llm-keys/${providerName}`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除LLM模型失败')
    }
  }
}

// 获取模型密钥列表
export const getLLMModelKeys = async (providerName: string): Promise<LLMKey[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const models = await MockLLMService.getLLMModels({})
    const model = models.records.find(m => m.providerName === providerName)
    return model?.keys || []
  } else {
    // 调用真实API - 从完整列表中筛选
    const response = await request.get<{result: LLMModel[]}>('/api/v1/llm-keys')
    const apiResponse = response as unknown as {code: number, message: string, result: LLMModel[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取密钥列表响应数据格式错误')
    }
    const model = apiResponse.result.find(m => m.providerName === providerName)
    return model?.keys || []
  }
}

// 创建密钥
export const createLLMKey = async (data: Omit<LLMKey, 'id' | 'createTime' | 'updateTime'>): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    await MockLLMService.addLLMKey(data.llmProvider, data)
  } else {
    // 调用真实API
    console.log('data', data)
    const response = await request.post('/api/v1/llm-keys', data)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建密钥失败')
    }
  }
}

// 更新密钥
export const updateLLMKey = async (keyId: number, data: Partial<LLMKey>): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    const models = await MockLLMService.getLLMModels({})
    const model = models.records.find(m => m.keys.some(k => k.id === keyId))
    if (model) {
      const keyIndex = model.keys.findIndex(k => k.id === keyId)
      if (keyIndex === -1) {
        throw new Error(`密钥 "${keyId}" 不存在`)
      }
      model.keys[keyIndex] = { ...model.keys[keyIndex], ...data, updateTime: new Date().toISOString() }
    } else {
      throw new Error(`密钥 "${keyId}" 不存在`)
    }
  } else {
    // 调用真实API - 后端接口是PUT /api/v1/llm-keys，ID包含在请求体中
    const requestData = { ...data, id: keyId }
    const response = await request.put('/api/v1/llm-keys', requestData)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新密钥失败')
    }
  }
}

// 删除密钥（批量删除）
export const deleteLLMKeys = async (ids: number[]): Promise<boolean> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    for (const keyId of ids) {
      const models = await MockLLMService.getLLMModels({})
      const model = models.records.find(m => m.keys.some(k => k.id === keyId))
      if (model) {
        await MockLLMService.deleteLLMKey(model.providerName, keyId)
      } else {
        throw new Error(`密钥 "${keyId}" 不存在`)
      }
    }
    return true
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/llm-keys', {}, {
      data: ids
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除密钥失败')
    }
    return true
  }
}

// 删除单个密钥（兼容性保留）
export const deleteLLMKey = async (keyId: number): Promise<void> => {
  await deleteLLMKeys([keyId])
}

// 启用密钥
export const enableLLMKey = async (keyId: number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await updateLLMKey(keyId, { status: 'active' })
  } else {
    // 调用真实API
    const response = await request.put(`/api/v1/llm-keys/${keyId}/enable`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('启用密钥失败')
    }
  }
}

// 禁用密钥
export const disableLLMKey = async (keyId: number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await updateLLMKey(keyId, { status: 'inactive' })
  } else {
    // 调用真实API
    const response = await request.put(`/api/v1/llm-keys/${keyId}/disable`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('禁用密钥失败')
    }
  }
}

// 兼容性函数 - 保持向后兼容
export const addLLMModelKey = createLLMKey
export const updateLLMModelKey = async (providerName: string, keyId: number, data: Partial<LLMKey>): Promise<void> => {
  // 在更新数据中包含llmProvider字段
  const updateData = { ...data, llmProvider: providerName }
  await updateLLMKey(keyId, updateData)
}
export const deleteLLMModelKey = async (providerName: string, keyId: number): Promise<void> => {
  await deleteLLMKey(keyId)
}
export const updateLLMModelKeyStatus = async (providerName: string, keyId: number, status: 'active' | 'inactive'): Promise<void> => {
  if (status === 'active') {
    await enableLLMKey(keyId)
  } else {
    await disableLLMKey(keyId)
  }
}
