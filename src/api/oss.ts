/**
 * OSS存储管理API
 */

import { request } from '@/utils/request'
import service from '@/utils/request'
import type { PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockOSSService } from '@/mock/services/oss'

// OSS密钥相关接口
export interface OSSKey {
  id: number
  ossProvider: string
  accessKeyId: string
  accessKeySecret: string
  endpoint?: string
  defaultBucket?: string
  region?: string
  customDomain?: string
  remark?: string
  status: 'active' | 'inactive'
  extraConfig?: string
  createTime: string
}

export interface OSSProvider {
  providerName: string
  displayName: string
  description: string
  status: 'active' | 'inactive'
  keys?: OSSKey[]
}

// 获取OSS服务商列表
export const getOSSProviders = async (): Promise<OSSProvider[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockOSSService.getOSSProviders()
  } else {
    // 调用真实API
    const response = await request.get<{result: OSSProvider[]}>('/api/v1/oss-keys')
    const apiResponse = response as unknown as {code: number, message: string, result: OSSProvider[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取OSS服务商列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取OSS服务商详情
export const getOSSProvider = async (providerName: string): Promise<OSSProvider> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const providers = await MockOSSService.getOSSProviders()
    const provider = providers.find(p => p.providerName === providerName)
    if (!provider) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }
    return provider
  } else {
    // 调用真实API
    const response = await request.get<{result: OSSProvider}>(`/api/v1/oss-keys/providers/${providerName}`)
    const apiResponse = response as unknown as {code: number, message: string, result: OSSProvider, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取OSS服务商详情响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取OSS密钥列表
export const getOSSKeys = async (providerName: string): Promise<OSSKey[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const providers = await MockOSSService.getOSSProviders()
    const provider = providers.find(p => p.providerName === providerName)
    return provider?.keys || []
  } else {
    // 调用真实API - 从完整列表中筛选
    const response = await request.get<{result: OSSProvider[]}>('/api/v1/oss-keys/providers')
    const apiResponse = response as unknown as {code: number, message: string, result: OSSProvider[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取密钥列表响应数据格式错误')
    }
    const provider = apiResponse.result.find(p => p.providerName === providerName)
    return provider?.keys || []
  }
}

// 创建OSS密钥
export const createOSSKey = async (data: Omit<OSSKey, 'id' | 'createTime'>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockOSSService.addOSSKey(data.ossProvider || '', data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/oss-keys', data)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建OSS密钥失败')
    }
  }
}

// 更新OSS密钥
export const updateOSSKey = async (keyId: number, data: Partial<OSSKey>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    // 需要先找到对应的provider
    const providers = await MockOSSService.getOSSProviders()
    const provider = providers.find(p => p.keys?.some((k: OSSKey) => k.id === keyId))
    if (!provider) {
      throw new Error(`OSS密钥 "${keyId}" 不存在`)
    }
    await MockOSSService.updateOSSKey(provider.providerName, keyId, data)
  } else {
    // 调用真实API - 后端接口是PUT /api/v1/oss-keys，ID包含在请求体中
    const requestData = { ...data, id: keyId }
    const response = await request.put('/api/v1/oss-keys', requestData)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新OSS密钥失败')
    }
  }
}

// 删除OSS密钥（批量删除）
export const deleteOSSKeys = async (ids: number[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    for (const keyId of ids) {
      const providers = await MockOSSService.getOSSProviders()
      const provider = providers.find(p => p.keys?.some((k: OSSKey) => k.id === keyId))
      if (provider) {
        await MockOSSService.deleteOSSKey(provider.providerName, keyId)
      } else {
        throw new Error(`OSS密钥 "${keyId}" 不存在`)
      }
    }
    return true
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/oss-keys', {}, {
      data: ids
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除OSS密钥失败')
    }
    return true
  }
}

// 删除单个OSS密钥（兼容性保留）
export const deleteOSSKey = async (keyId: number): Promise<void> => {
  await deleteOSSKeys([keyId])
}

// 启用OSS密钥
export const enableOSSKey = async (keyId: number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    // 需要先找到对应的provider
    const providers = await MockOSSService.getOSSProviders()
    const provider = providers.find(p => p.keys?.some((k: OSSKey) => k.id === keyId))
    if (!provider) {
      throw new Error(`OSS密钥 "${keyId}" 不存在`)
    }
    await MockOSSService.updateOSSKey(provider.providerName, keyId, { status: 'active' })
  } else {
    // 调用真实API
    const response = await request.put(`/api/v1/oss-keys/${keyId}/enable`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('启用OSS密钥失败')
    }
  }
}

// 禁用OSS密钥
export const disableOSSKey = async (keyId: number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    // 需要先找到对应的provider
    const providers = await MockOSSService.getOSSProviders()
    const provider = providers.find(p => p.keys?.some((k: OSSKey) => k.id === keyId))
    if (!provider) {
      throw new Error(`OSS密钥 "${keyId}" 不存在`)
    }
    await MockOSSService.updateOSSKey(provider.providerName, keyId, { status: 'inactive' })
  } else {
    // 调用真实API
    const response = await request.put(`/api/v1/oss-keys/${keyId}/disable`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('禁用OSS密钥失败')
    }
  }
}

// 兼容性函数 - 保持向后兼容
export const addOSSKey = createOSSKey
export const updateOSSKeyStatus = async (providerName: string, keyId: number, status: 'active' | 'inactive'): Promise<void> => {
  if (status === 'active') {
    await enableOSSKey(keyId)
  } else {
    await disableOSSKey(keyId)
  }
}

// OSS文件接口
export interface OssFile {
  id: number
  fileName: string
  originalName: string
  fileSize: number
  fileUrl: string
  fileType: string
  provider: string
  bucketName: string
  fileMd5: string
  status: 'active' | 'deleted'
  fileSizeFormatted: string
  createTime: string
  updateTime: string
}

// OSS存储桶接口
export interface OssBucket {
  id: number
  bucketName: string
  provider: string
  keyId: number
  description: string
  status: 'active' | 'inactive'
  fileCount: number
  createTime: string
  updateTime: string
}

// 创建存储桶数据接口
export interface CreateBucketData {
  bucketName: string
  provider: string
  keyId: number | null
  description?: string
  status: 'active' | 'inactive'
}

// 更新存储桶数据接口
export interface UpdateBucketData extends CreateBucketData {
  id: number
}

// 文件查询参数接口
export interface FileQueryParams extends PageParams {
  fileName?: string
  originalName?: string
  fileType?: string
  provider?: string
  bucketName?: string
  status?: 'active' | 'deleted'
  startTime?: string
  endTime?: string
}

// 存储桶查询参数接口
export interface BucketQueryParams extends PageParams {
  bucketName?: string
  provider?: string
  status?: 'active' | 'inactive'
  startTime?: string
  endTime?: string
}

// 上传文件参数接口
export interface UploadFileParams {
  provider: string
  keyId: number
  bucketName: string
  file: File
  pathPrefix?: string
}

// 获取存储桶列表
export const getBucketList = async (params: BucketQueryParams): Promise<PageResult<OssBucket>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockOSSService.getBucketList(params)
  } else {
    // 调用真实API
    const response = await request.get<{result: PageResult<OssBucket>}>('/api/v1/oss-files/buckets', params)
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<OssBucket>, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取存储桶列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 创建存储桶
export const createBucket = async (data: CreateBucketData): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockOSSService.createBucket(data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/oss-files/buckets', data as unknown as Record<string, unknown>)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建存储桶失败')
    }
  }
}

// 更新存储桶
export const updateBucket = async (data: UpdateBucketData): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockOSSService.updateBucket(data)
  } else {
    try {
      // 调用真实API - 确保传递完整的数据
      const requestData = {
        id: data.id,
        bucketName: data.bucketName,
        provider: data.provider,
        keyId: data.keyId,
        description: data.description || '',
        status: data.status
      }

      const response = await request.put('/api/v1/oss-files/buckets', requestData)

      // 处理不同的响应格式
      type UpdateBucketResponse = {
        code?: number
        message?: string
        success?: boolean
        data?: unknown
      }

      if (response && typeof response === 'object') {
        const apiResponse = response as unknown as UpdateBucketResponse

        // 检查success状态
        if (apiResponse.success === false) {
          throw new Error(apiResponse.message || '更新存储桶失败')
        }

        // 检查code状态
        if (apiResponse.code && apiResponse.code !== 200 && apiResponse.code !== 0) {
          throw new Error(apiResponse.message || '更新存储桶失败')
        }
      }
    } catch (error: unknown) {
      const err = error as Error & { response?: { status?: number } }
      if (err.response && err.response.status) {
        throw new Error(`更新存储桶失败：HTTP ${err.response.status}`)
      }
      throw new Error('更新存储桶失败：' + (err.message || '未知错误'))
    }
  }
}

// 删除存储桶（批量删除）
export const deleteBuckets = async (ids: number[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockOSSService.deleteBuckets(ids)
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/oss-files/buckets', {}, {
      data: ids
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除存储桶失败')
    }
    return true
  }
}

// 获取文件列表
export const getFileList = async (params: FileQueryParams): Promise<PageResult<OssFile>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockOSSService.getFileList(params)
  } else {
    // 调用真实API
    const response = await request.get<{result: PageResult<OssFile>}>('/api/v1/oss-files', params)
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<OssFile>, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取文件列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 上传文件
export const uploadFile = async (params: UploadFileParams): Promise<OssFile> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockOSSService.uploadFile(params)
  } else {
    // 调用真实API
    const formData = new FormData()
    formData.append('provider', params.provider)
    formData.append('keyId', params.keyId.toString())
    formData.append('bucketName', params.bucketName)
    formData.append('file', params.file)
    if (params.pathPrefix) {
      formData.append('pathPrefix', params.pathPrefix)
    }

    try {
      const response = await service.post('/api/v1/oss-files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // 处理不同的响应格式
      type ApiResponse = {
        code?: number
        message?: string
        result?: OssFile
        success?: boolean
        data?: OssFile
      } & Partial<OssFile>

      if (response && typeof response === 'object') {
        const apiResponse = response as unknown as ApiResponse

        // 检查是否有result字段
        if (apiResponse.result) {
          return apiResponse.result
        }

        // 检查是否有data字段
        if (apiResponse.data) {
          return apiResponse.data
        }

        // 检查success状态
        if (apiResponse.success === false) {
          throw new Error(apiResponse.message || '上传文件失败')
        }

        // 如果响应本身就是文件对象
        if (apiResponse.id && apiResponse.fileName) {
          return apiResponse as OssFile
        }
      }

      throw new Error('上传文件响应数据格式错误')
    } catch (error: unknown) {
      const err = error as Error & { response?: { status?: number } }
      // 如果是网络错误或其他错误，重新抛出
      if (err.message && !err.message.includes('响应数据格式错误')) {
        throw err
      }
      throw new Error('上传文件失败：' + (err.message || '未知错误'))
    }
  }
}

// 删除文件（批量删除）
export const deleteFiles = async (ids: number[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockOSSService.deleteFiles(ids)
  } else {
    try {
      // 调用真实API
      const response = await request.delete('/api/v1/oss-files', {}, {
        data: ids
      })

      // 处理不同的响应格式
      type DeleteApiResponse = {
        code?: number
        message?: string
        success?: boolean
        data?: unknown
      }

      if (response && typeof response === 'object') {
        const apiResponse = response as unknown as DeleteApiResponse

        // 检查success状态
        if (apiResponse.success === false) {
          throw new Error(apiResponse.message || '删除文件失败')
        }

        // 检查code状态（有些API使用code字段）
        if (apiResponse.code && apiResponse.code !== 200 && apiResponse.code !== 0) {
          throw new Error(apiResponse.message || '删除文件失败')
        }

        return true
      }

      // 如果响应为空或者是其他格式，默认认为成功
      return true
    } catch (error: unknown) {
      const err = error as Error & { response?: { status?: number } }
      // 如果是网络错误或其他错误，重新抛出
      if (err.response && err.response.status) {
        // HTTP错误
        throw new Error(`删除文件失败：HTTP ${err.response.status}`)
      }
      throw new Error('删除文件失败：' + (err.message || '未知错误'))
    }
  }
}

// 下载文件接口响应格式
export interface DownloadFileResponse {
  code: number
  message: string
  success: boolean
  timestamp: number
  fail: boolean
}

// 下载文件 - 返回下载链接
export const getDownloadUrl = async (id: number): Promise<string> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const blob = await MockOSSService.downloadFile(id)
    // 为Mock数据创建临时URL
    return window.URL.createObjectURL(blob)
  } else {
    try {
      // 调用真实API - 获取下载链接
      const response = await request.get<DownloadFileResponse>(`/api/v1/oss-files/download/${id}`)
      const apiResponse = response as unknown as DownloadFileResponse

      if (!apiResponse || !apiResponse.success) {
        throw new Error(apiResponse?.message || '获取下载链接失败')
      }

      // 返回下载链接（在message字段中）
      return apiResponse.message
    } catch (error: unknown) {
      const err = error as Error & { response?: { status?: number, data?: unknown } }

      // 检查是否是HTTP错误
      if (err.response) {
        if (err.response.status === 404) {
          throw new Error('文件不存在或已被删除')
        } else if (err.response.status === 403) {
          throw new Error('没有权限下载该文件')
        } else {
          throw new Error(`获取下载链接失败：HTTP ${err.response.status}`)
        }
      }

      throw new Error('获取下载链接失败：' + (err.message || '未知错误'))
    }
  }
}

// 下载文件 - 通过链接下载为Blob（保持向后兼容）
export const downloadFile = async (id: number): Promise<Blob> => {
  if (isMockEnabled()) {
    // Mock模式下直接返回Blob
    return await MockOSSService.downloadFile(id)
  } else {
    // 真实API模式下，OSS链接存在CORS问题，无法直接fetch
    // 建议使用 downloadFileByUrl 或 downloadAndSaveFile 方法
    throw new Error('OSS链接存在CORS限制，请使用 downloadFileByUrl 或 downloadAndSaveFile 方法进行下载')
  }
}

// 直接通过链接下载文件（推荐使用）
export const downloadFileByUrl = async (id: number): Promise<void> => {
  try {
    const downloadUrl = await getDownloadUrl(id)

    // 直接打开下载链接
    window.open(downloadUrl, '_blank')
  } catch (error) {
    throw error
  }
}

// 下载文件并自动保存（处理中文文件名）
export const downloadAndSaveFile = async (id: number, fileName?: string): Promise<void> => {
  try {
    // 获取下载链接
    const downloadUrl = await getDownloadUrl(id)

    // 创建下载链接
    const link = document.createElement('a')
    link.href = downloadUrl

    // 设置文件名，如果没有提供则使用默认名称
    if (fileName) {
      // 确保文件名是安全的
      const safeFileName = fileName.replace(/[<>:"/\\|?*]/g, '_')
      link.download = safeFileName
    } else {
      link.download = `file_${id}_${Date.now()}`
    }

    // 设置target为_blank以确保在新窗口打开（某些浏览器需要）
    link.target = '_blank'

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)

    // 如果是Mock数据创建的临时URL，需要清理
    if (isMockEnabled() && downloadUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(downloadUrl)
    }
  } catch (error) {
    throw error
  }
}
