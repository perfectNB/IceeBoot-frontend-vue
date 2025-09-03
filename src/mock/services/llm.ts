import { mockLLMModels } from '../data/llm'
import type { LLMModel, LLMKey, PageParams, PageResult } from '@/types'

export class MockLLMService {
  // 获取大模型列表
  static async getLLMModels(params: PageParams): Promise<PageResult<LLMModel>> {
    const { pageNum = 1, pageSize = 20, keyword = '' } = params
    
    let filteredModels = [...mockLLMModels]
    
    // 关键词搜索
    if (keyword) {
      filteredModels = filteredModels.filter(model => 
        model.name.toLowerCase().includes(keyword.toLowerCase()) ||
        model.remark.toLowerCase().includes(keyword.toLowerCase())
      )
    }
    
    const total = filteredModels.length
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    const records = filteredModels.slice(start, end)
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

  // 获取大模型详情
  static async getLLMModel(id: string | number): Promise<LLMModel> {
    const model = mockLLMModels.find(m => m.id === id)
    
    if (!model) {
      throw new Error(`大模型 "${id}" 不存在`)
    }
    
    return { ...model }
  }

  // 创建大模型
  static async createLLMModel(modelData: Partial<LLMModel>): Promise<LLMModel> {
    const newModel: LLMModel = {
      id: Date.now().toString(),
      name: modelData.name || '',
      remark: modelData.remark || '',
      description: modelData.description || '',
      icon: modelData.icon || '',
      keys: [],
      status: modelData.status || 'active',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    mockLLMModels.push(newModel)
    return { ...newModel }
  }

  // 更新大模型
  static async updateLLMModel(id: string | number, modelData: Partial<LLMModel>): Promise<LLMModel> {
    const index = mockLLMModels.findIndex(m => m.id === id)
    
    if (index === -1) {
      throw new Error(`大模型 "${id}" 不存在`)
    }
    
    const updatedModel = {
      ...mockLLMModels[index],
      ...modelData,
      id,
      updateTime: new Date().toISOString()
    }
    
    mockLLMModels[index] = updatedModel
    return { ...updatedModel }
  }

  // 删除大模型
  static async deleteLLMModel(id: string | number): Promise<void> {
    const index = mockLLMModels.findIndex(m => m.id === id)
    
    if (index === -1) {
      throw new Error(`大模型 "${id}" 不存在`)
    }
    
    mockLLMModels.splice(index, 1)
  }

  // 添加模型密钥
  static async addLLMKey(modelId: string | number, keyData: Partial<LLMKey>): Promise<LLMKey> {
    const model = mockLLMModels.find(m => m.id === modelId)
    
    if (!model) {
      throw new Error(`大模型 "${modelId}" 不存在`)
    }
    
    const newKey: LLMKey = {
      id: Date.now().toString(),
      key: keyData.key || '',
      remark: keyData.remark || '',
      secretKey: keyData.secretKey || '',
      apiKey: keyData.apiKey || '',
      status: keyData.status || 'active',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    model.keys.push(newKey)
    model.updateTime = new Date().toISOString()
    
    return { ...newKey }
  }

  // 删除模型密钥
  static async deleteLLMKey(modelId: string | number, keyId: string | number): Promise<void> {
    const model = mockLLMModels.find(m => m.id === modelId)
    
    if (!model) {
      throw new Error(`大模型 "${modelId}" 不存在`)
    }
    
    const keyIndex = model.keys.findIndex(k => k.id === keyId)
    
    if (keyIndex === -1) {
      throw new Error(`密钥 "${keyId}" 不存在`)
    }
    
    model.keys.splice(keyIndex, 1)
    model.updateTime = new Date().toISOString()
  }

  // 更新模型状态
  static async updateLLMModelStatus(id: string | number, status: 'active' | 'inactive'): Promise<LLMModel> {
    const model = mockLLMModels.find(m => m.id === id)
    
    if (!model) {
      throw new Error(`大模型 "${id}" 不存在`)
    }
    
    model.status = status
    model.updateTime = new Date().toISOString()
    
    return { ...model }
  }
}