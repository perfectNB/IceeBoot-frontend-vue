/**
 * 支付管理 Mock 服务
 */
import type { PaymentConfigVO, PayRecordQueryParams, PaymentConfigQueryParams } from '@/api/pay'
import { mockPaymentConfigs, mockPayRecords, generateQrCodeUrl } from '../data/pay'

// 复制数据避免污染原始数据
let paymentConfigs = [...mockPaymentConfigs]
let payRecords = [...mockPayRecords]

/**
 * 分页查询支付配置列表
 */
export const getPaymentConfigsService = (params: PaymentConfigQueryParams) => {
  const {
    pageNum = 1,
    pageSize = 20,
    configName,
    minAmount,
    maxAmount,
    keyword
  } = params

  // 筛选数据
  let filteredConfigs = [...paymentConfigs]

  if (configName) {
    filteredConfigs = filteredConfigs.filter(c => c.configName.includes(configName))
  }

  if (minAmount !== undefined) {
    filteredConfigs = filteredConfigs.filter(c => c.amount >= minAmount)
  }

  if (maxAmount !== undefined) {
    filteredConfigs = filteredConfigs.filter(c => c.amount <= maxAmount)
  }

  if (keyword) {
    filteredConfigs = filteredConfigs.filter(c =>
      c.configName.includes(keyword) ||
      c.description.includes(keyword)
    )
  }

  // 排序（按排序字段排序）
  filteredConfigs.sort((a, b) => a.sort - b.sort)

  // 分页
  const total = filteredConfigs.length
  const pages = Math.ceil(total / pageSize)
  const start = (pageNum - 1) * pageSize
  const end = start + pageSize
  const records = filteredConfigs.slice(start, end)

  return {
    code: 200,
    message: '获取成功',
    result: {
      records,
      total,
      current: pageNum,
      size: pageSize,
      pages,
      hasPrevious: pageNum > 1,
      hasNext: pageNum < pages
    },
    success: true,
    timestamp: Date.now()
  }
}

/**
 * 创建支付配置
 */
export const createPaymentConfigService = (data: Partial<PaymentConfigVO>) => {
  const newConfig: PaymentConfigVO = {
    id: Math.max(...paymentConfigs.map(c => c.id), 0) + 1,
    configName: data.configName || '',
    payCode: data.payCode || `PAY_${Date.now()}`,
    amount: data.amount || 0,
    amountYuan: data.amountYuan || '0.00',
    description: data.description || '',
    status: data.status || 'active',
    sort: data.sort || paymentConfigs.length + 1,
    createBy: 'admin',
    createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    updateTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  }
  paymentConfigs.push(newConfig)
  return {
    code: 200,
    message: '创建成功',
    result: newConfig,
    success: true,
    timestamp: Date.now()
  }
}

/**
 * 更新支付配置
 */
export const updatePaymentConfigService = (id: number | string, data: Partial<PaymentConfigVO>) => {
  const index = paymentConfigs.findIndex(c => c.id === Number(id))
  if (index === -1) {
    return {
      code: 404,
      message: '配置不存在',
      result: null,
      success: false,
      timestamp: Date.now()
    }
  }

  paymentConfigs[index] = {
    ...paymentConfigs[index],
    ...data,
    updateTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  }

  return {
    code: 200,
    message: '更新成功',
    result: paymentConfigs[index],
    success: true,
    timestamp: Date.now()
  }
}

/**
 * 删除支付配置
 */
export const deletePaymentConfigService = (id: number | string) => {
  const index = paymentConfigs.findIndex(c => c.id === Number(id))
  if (index === -1) {
    return {
      code: 404,
      message: '配置不存在',
      result: null,
      success: false,
      timestamp: Date.now()
    }
  }

  paymentConfigs.splice(index, 1)

  return {
    code: 200,
    message: '删除成功',
    result: null,
    success: true,
    timestamp: Date.now()
  }
}

/**
 * 批量删除支付配置
 */
export const deletePaymentConfigsService = (ids: (number | string)[]) => {
  const numIds = ids.map(id => Number(id))
  paymentConfigs = paymentConfigs.filter(c => !numIds.includes(c.id))

  return {
    code: 200,
    message: `成功删除 ${ids.length} 个配置`,
    result: null,
    success: true,
    timestamp: Date.now()
  }
}

/**
 * 更新支付配置状态
 */
export const updatePaymentConfigStatusService = (id: number | string, status: 'active' | 'inactive') => {
  const index = paymentConfigs.findIndex(c => c.id === Number(id))
  if (index === -1) {
    return {
      code: 404,
      message: '配置不存在',
      result: null,
      success: false,
      timestamp: Date.now()
    }
  }

  paymentConfigs[index].status = status
  paymentConfigs[index].updateTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')

  return {
    code: 200,
    message: '状态更新成功',
    result: paymentConfigs[index],
    success: true,
    timestamp: Date.now()
  }
}

/**
 * 获取支付记录列表（分页）
 */
export const getPayRecordsService = (params: PayRecordQueryParams) => {
  const {
    pageNum = 1,
    pageSize = 20,
    outTradeNo,
    payType,
    payStatus,
    configId,
    startTime,
    endTime,
    keyword
  } = params

  // 筛选数据
  let filteredRecords = [...payRecords]

  if (outTradeNo) {
    filteredRecords = filteredRecords.filter(r => r.outTradeNo.includes(outTradeNo))
  }

  if (payType) {
    filteredRecords = filteredRecords.filter(r => r.payType === payType)
  }

  if (payStatus) {
    filteredRecords = filteredRecords.filter(r => r.payStatus === payStatus)
  }

  if (configId) {
    filteredRecords = filteredRecords.filter(r => r.configId === configId)
  }

  if (startTime) {
    filteredRecords = filteredRecords.filter(r => r.createTime >= startTime)
  }

  if (endTime) {
    filteredRecords = filteredRecords.filter(r => r.createTime <= endTime)
  }

  if (keyword) {
    filteredRecords = filteredRecords.filter(r =>
      r.orderName.includes(keyword) ||
      r.username.includes(keyword) ||
      r.outTradeNo.includes(keyword)
    )
  }

  // 排序（默认按创建时间倒序）
  filteredRecords.sort((a, b) => {
    return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
  })

  // 分页
  const total = filteredRecords.length
  const pages = Math.ceil(total / pageSize)
  const start = (pageNum - 1) * pageSize
  const end = start + pageSize
  const records = filteredRecords.slice(start, end)

  return {
    code: 200,
    message: '获取成功',
    result: {
      records,
      total,
      current: pageNum,
      size: pageSize,
      pages,
      hasPrevious: pageNum > 1,
      hasNext: pageNum < pages
    },
    success: true,
    timestamp: Date.now()
  }
}

/**
 * 获取支付记录详情
 */
export const getPayRecordDetailService = (id: number | string) => {
  const record = payRecords.find(r => r.id === Number(id))
  if (!record) {
    return {
      code: 404,
      message: '记录不存在',
      result: null,
      success: false,
      timestamp: Date.now()
    }
  }

  return {
    code: 200,
    message: '获取成功',
    result: record,
    success: true,
    timestamp: Date.now()
  }
}

/**
 * 创建支付二维码
 */
export const createPayQrCodeService = (configId: number | string) => {
  const config = paymentConfigs.find(c => c.id === Number(configId))
  if (!config) {
    return {
      code: 404,
      message: '配置不存在',
      result: null,
      success: false,
      timestamp: Date.now()
    }
  }

  if (config.status !== 'active') {
    return {
      code: 400,
      message: '该配置已禁用',
      result: null,
      success: false,
      timestamp: Date.now()
    }
  }

  const qrCodeUrl = generateQrCodeUrl(Number(configId))

  return {
    code: 200,
    message: '二维码生成成功',
    result: qrCodeUrl,
    success: true,
    timestamp: Date.now()
  }
}

/**
 * 删除支付记录
 */
export const deletePayRecordService = (id: number | string) => {
  const index = payRecords.findIndex(r => r.id === Number(id))
  if (index === -1) {
    return {
      code: 404,
      message: '记录不存在',
      result: null,
      success: false,
      timestamp: Date.now()
    }
  }

  payRecords.splice(index, 1)

  return {
    code: 200,
    message: '删除成功',
    result: null,
    success: true,
    timestamp: Date.now()
  }
}

/**
 * 批量删除支付记录
 */
export const deletePayRecordsService = (ids: (number | string)[]) => {
  const numIds = ids.map(id => Number(id))
  payRecords = payRecords.filter(r => !numIds.includes(r.id))

  return {
    code: 200,
    message: `成功删除 ${ids.length} 条记录`,
    result: null,
    success: true,
    timestamp: Date.now()
  }
}
