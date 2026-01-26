/**
 * 支付管理相关 API
 */
import { normalizeApiResponse, request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import * as MockPayService from '@/mock/services/pay'

// ============ 类型定义 ============

/**
 * 支付配置 VO
 */
export interface PaymentConfigVO {
  id: number
  configName: string
  payCode: string
  amount: number
  amountYuan: string
  description: string
  status: 'active' | 'inactive'
  sort: number
  createBy: string
  createTime: string
  updateTime: string
}

/**
 * 支付记录 VO
 */
export interface PayRecordVO {
  id: number
  outTradeNo: string
  tradeNo: string
  orderName: string
  payType: number
  payTypeName: string
  configId: number
  configName: string
  payAmount: number
  payAmountYuan: string
  payStatus: number
  payStatusName: string
  userId: number
  username: string
  remark: string
  createBy: string
  createTime: string
  updateTime: string
}

/**
 * 支付记录查询参数
 */
export interface PayRecordQueryParams {
  pageNum?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: string
  keyword?: string
  delFlag?: number
  outTradeNo?: string
  payType?: number
  payStatus?: number
  configId?: number
  startTime?: string
  endTime?: string
  [key: string]: unknown
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
  hasPrevious: boolean
  hasNext: boolean
}

/**
 * 支付配置查询参数
 */
export interface PaymentConfigQueryParams {
  pageNum?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: string
  keyword?: string
  delFlag?: number
  configName?: string
  minAmount?: number
  maxAmount?: number
  [key: string]: unknown
}

// ============ 支付配置相关 API ============

/**
 * 分页查询支付配置列表
 */
export const getPaymentConfigs = async (params?: PaymentConfigQueryParams): Promise<PageResult<PaymentConfigVO>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockPayService.getPaymentConfigsService(params || {})
    const apiResponse = normalizeApiResponse<PageResult<PaymentConfigVO>>(response)
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取支付配置列表响应数据格式错误')
    }
    return apiResponse.data
  } else {
    // 调用真实API
    const response = await request.get<PageResult<PaymentConfigVO>>('/api/v1/pay/configs', params || {})
    const apiResponse = response as unknown as { code: number; message: string; data: PageResult<PaymentConfigVO>; success: boolean }
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取支付配置列表响应数据格式错误')
    }
    return apiResponse.data
  }
}

/**
 * 创建支付配置
 */
export const createPaymentConfig = async (data: Partial<PaymentConfigVO>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockPayService.createPaymentConfigService(data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/pay/configs', data)
    const apiResponse = response as unknown as { code: number; message: string; success: boolean }
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建支付配置失败')
    }
  }
}

/**
 * 更新支付配置
 */
export const updatePaymentConfig = async (id: number | string, data: Partial<PaymentConfigVO>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockPayService.updatePaymentConfigService(id, data)
  } else {
    // 调用真实API - ID包含在请求体中
    const requestData = { ...data, id }
    const response = await request.put('/api/v1/pay/configs', requestData)
    const apiResponse = response as unknown as { code: number; message: string; success: boolean }
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新支付配置失败')
    }
  }
}

/**
 * 删除支付配置（支持单个和批量）
 */
export const deletePaymentConfigs = async (ids: (number | string)[]): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockPayService.deletePaymentConfigsService(ids)
  } else {
    // 调用真实API - ID数组在请求体中
    const response = await request.delete('/api/v1/pay/configs', {}, {
      data: ids.map(Number)
    })
    const apiResponse = response as unknown as { code: number; message: string; success: boolean }
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除支付配置失败')
    }
  }
}

/**
 * 删除单个支付配置（兼容性保留）
 */
export const deletePaymentConfig = async (id: number | string): Promise<void> => {
  return await deletePaymentConfigs([id])
}

/**
 * 更新支付配置状态
 */
export const updatePaymentConfigStatus = async (id: number | string, status: 'active' | 'inactive'): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockPayService.updatePaymentConfigStatusService(id, status)
  } else {
    // 调用真实API - 专门的状态更新接口
    const response = await request.put(`/api/v1/pay/configs/${id}/status?status=${status}`)
    const apiResponse = response as unknown as { code: number; message: string; success: boolean }
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新支付配置状态失败')
    }
  }
}

// ============ 支付记录相关 API ============

/**
 * 获取支付记录列表（分页）
 */
export const getPayRecords = async (params: PayRecordQueryParams): Promise<PageResult<PayRecordVO>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockPayService.getPayRecordsService(params)
    const apiResponse = normalizeApiResponse<PageResult<PayRecordVO>>(response)
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取支付记录列表响应数据格式错误')
    }
    return apiResponse.data
  } else {
    // 调用真实API
    const response = await request.get<PageResult<PayRecordVO>>('/api/v1/pay/records', params)
    const apiResponse = response as unknown as { code: number; message: string; data: PageResult<PayRecordVO>; success: boolean }
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取支付记录列表响应数据格式错误')
    }
    return apiResponse.data
  }
}

/**
 * 获取支付记录详情
 */
export const getPayRecordDetail = async (id: number | string): Promise<PayRecordVO> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockPayService.getPayRecordDetailService(id)
    const apiResponse = normalizeApiResponse<PayRecordVO | null>(response)
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取支付记录详情失败')
    }
    return apiResponse.data
  } else {
    // 调用真实API
    const response = await request.get<PayRecordVO>(`/api/v1/pay/records/${id}`)
    const apiResponse = response as unknown as { code: number; message: string; data: PayRecordVO; success: boolean }
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取支付记录详情响应数据格式错误')
    }
    return apiResponse.data
  }
}

/**
 * 获取支付链接
 */
export const createPayQrCode = async (configId: number | string): Promise<string> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockPayService.createPayQrCodeService(configId)
    const apiResponse = normalizeApiResponse<string | null>(response)
    if (!apiResponse || !apiResponse.data) {
      throw new Error('生成支付链接失败')
    }
    return apiResponse.data
  } else {
    // 调用真实API
    const response = await request.get<string>(`/api/v1/pay/create-qr/${configId}`)
    const apiResponse = response as unknown as { success: boolean; code: number; message?: string; data?: string }

    if (!apiResponse) {
      throw new Error('服务器无响应')
    }

    if (!apiResponse.success || apiResponse.code !== 200) {
      throw new Error('获取支付链接失败')
    }

    const payUrl = apiResponse.data

    if (!payUrl || typeof payUrl !== 'string') {
      console.error('支付链接无效:', payUrl)
      console.error('完整响应对象:', apiResponse)
      throw new Error('支付链接为空或格式错误')
    }

    return payUrl
  }
}

/**
 * 删除支付记录
 */
export const deletePayRecord = async (id: number | string): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockPayService.deletePayRecordService(id)
  } else {
    // 调用真实API
    const response = await request.delete(`/api/v1/pay/records/${id}`)
    const apiResponse = response as unknown as { code: number; message: string; success: boolean }
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除支付记录失败')
    }
  }
}

/**
 * 批量删除支付记录
 */
export const deletePayRecords = async (ids: (number | string)[]): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockPayService.deletePayRecordsService(ids)
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/pay/records/batch', {}, {
      data: ids
    })
    const apiResponse = response as unknown as { code: number; message: string; success: boolean }
    if (!apiResponse || !apiResponse.success) {
      throw new Error('批量删除支付记录失败')
    }
  }
}
