import { ossProviders, ossKeys } from '../data/oss'
import type { OSSKey, OSSProvider, OssFile, OssBucket, CreateBucketData, UpdateBucketData, FileQueryParams, BucketQueryParams, UploadFileParams } from '@/api/oss'
import type { PageResult } from '@/types'

const mockOSSKeys = [...ossKeys]
let nextId = Math.max(...mockOSSKeys.map(k => k.id)) + 1

export class MockOSSService {
  // 获取OSS服务商列表
  static async getOSSProviders(): Promise<OSSProvider[]> {
    const providersWithKeys = ossProviders.map(provider => ({
      ...provider,
      keys: mockOSSKeys.filter(key => key.ossProvider === provider.providerName)
    }))
    return providersWithKeys
  }

  // 获取OSS服务商详情
  static async getOSSProvider(providerName: string): Promise<OSSProvider> {
    const provider = ossProviders.find(p => p.providerName === providerName)

    if (!provider) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }

    return {
      ...provider,
      keys: mockOSSKeys.filter(key => key.ossProvider === providerName)
    }
  }

  // 创建OSS服务商
  static async createOSSProvider(providerData: Partial<OSSProvider>): Promise<OSSProvider> {
    const newProvider: OSSProvider = {
      providerName: providerData.providerName || '',
      displayName: providerData.displayName || '',
      description: providerData.description || '',
      status: providerData.status || 'active',
      keys: []
    }

    ossProviders.push(newProvider)
    return { ...newProvider }
  }

  // 更新OSS服务商
  static async updateOSSProvider(providerName: string, providerData: Partial<OSSProvider>): Promise<OSSProvider> {
    const index = ossProviders.findIndex(p => p.providerName === providerName)

    if (index === -1) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }

    const updatedProvider = {
      ...ossProviders[index],
      ...providerData
    }

    ossProviders[index] = updatedProvider
    return { ...updatedProvider }
  }

  // 删除OSS服务商
  static async deleteOSSProvider(providerName: string): Promise<void> {
    const index = ossProviders.findIndex(p => p.providerName === providerName)

    if (index === -1) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }

    ossProviders.splice(index, 1)
  }

  // 添加OSS密钥
  static async addOSSKey(providerName: string, keyData: Partial<OSSKey>): Promise<OSSKey> {
    const provider = ossProviders.find(p => p.providerName === providerName)

    if (!provider) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }

    const newKey: OSSKey = {
      id: nextId++,
      ossProvider: providerName,
      accessKeyId: keyData.accessKeyId || '',
      accessKeySecret: keyData.accessKeySecret || '',
      endpoint: keyData.endpoint || '',
      defaultBucket: keyData.defaultBucket || '',
      region: keyData.region || '',
      customDomain: keyData.customDomain || '',
      remark: keyData.remark || '',
      status: keyData.status || 'active',
      extraConfig: keyData.extraConfig || '{}',
      createTime: new Date().toISOString()
    }

    mockOSSKeys.push(newKey)
    return { ...newKey }
  }

  // 删除OSS密钥
  static async deleteOSSKey(providerName: string, keyId: number): Promise<void> {
    const keyIndex = mockOSSKeys.findIndex(k => k.id === keyId && k.ossProvider === providerName)

    if (keyIndex === -1) {
      throw new Error(`OSS密钥 "${keyId}" 不存在`)
    }

    mockOSSKeys.splice(keyIndex, 1)
  }

  // 更新OSS密钥
  static async updateOSSKey(providerName: string, keyId: number, data: Partial<OSSKey>): Promise<OSSKey> {
    const keyIndex = mockOSSKeys.findIndex(k => k.id === keyId && k.ossProvider === providerName)

    if (keyIndex === -1) {
      throw new Error(`OSS密钥 "${keyId}" 不存在`)
    }

    const updatedKey = {
      ...mockOSSKeys[keyIndex],
      ...data,
      id: keyId,
      ossProvider: providerName
    }
    mockOSSKeys[keyIndex] = updatedKey
    return { ...updatedKey }
  }

  // 更新OSS服务商状态
  static async updateOSSProviderStatus(providerName: string, status: 'active' | 'inactive'): Promise<OSSProvider> {
    const provider = ossProviders.find(p => p.providerName === providerName)

    if (!provider) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }

    provider.status = status

    return { ...provider }
  }

  // 更新OSS密钥状态
  static async updateOSSKeyStatus(providerName: string, keyId: number, status: string): Promise<void> {
    const keyIndex = mockOSSKeys.findIndex(k => k.id === keyId && k.ossProvider === providerName)
    
    if (keyIndex === -1) {
      throw new Error(`OSS密钥不存在`)
    }
    
    mockOSSKeys[keyIndex].status = status as 'active' | 'inactive'
  }

  // 获取存储桶列表
  static async getBucketList(params: BucketQueryParams): Promise<PageResult<OssBucket>> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 模拟存储桶数据
    const mockBuckets: OssBucket[] = [
      {
        id: 1,
        bucketName: 'my-bucket-1',
        provider: 'aliyun',
        keyId: 1,
        description: '阿里云存储桶1',
        status: 'active',
        fileCount: 25,
        createTime: '2024-01-15 10:30:00',
        updateTime: '2024-01-15 10:30:00'
      },
      {
        id: 2,
        bucketName: 'my-bucket-2',
        provider: 'tencent',
        keyId: 2,
        description: '腾讯云存储桶1',
        status: 'active',
        fileCount: 12,
        createTime: '2024-01-16 14:20:00',
        updateTime: '2024-01-16 14:20:00'
      },
      {
        id: 3,
        bucketName: 'test-bucket',
        provider: 'qiniu',
        keyId: 3,
        description: '七牛云测试桶',
        status: 'inactive',
        fileCount: 0,
        createTime: '2024-01-17 09:15:00',
        updateTime: '2024-01-17 09:15:00'
      }
    ]
    
    let filteredBuckets = [...mockBuckets]
    
    // 应用过滤条件
    if (params.bucketName) {
      filteredBuckets = filteredBuckets.filter(bucket => 
        bucket.bucketName.toLowerCase().includes(params.bucketName!.toLowerCase())
      )
    }
    if (params.provider) {
      filteredBuckets = filteredBuckets.filter(bucket => bucket.provider === params.provider)
    }
    if (params.status) {
      filteredBuckets = filteredBuckets.filter(bucket => bucket.status === params.status)
    }
    
    // 分页处理
    const pageSize = params.pageSize || 10
    const pageNum = params.pageNum || 1
    const startIndex = (pageNum - 1) * pageSize
    const endIndex = startIndex + pageSize
    const pagedBuckets = filteredBuckets.slice(startIndex, endIndex)
    
    return {
      records: pagedBuckets,
      total: filteredBuckets.length,
      size: pageSize,
      current: pageNum,
      pages: Math.ceil(filteredBuckets.length / pageSize),
      hasPrevious: pageNum > 1,
      hasNext: pageNum < Math.ceil(filteredBuckets.length / pageSize)
    }
  }

  // 创建存储桶
  static async createBucket(data: CreateBucketData): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    // 模拟创建成功
    console.log('Mock创建存储桶:', data)
  }

  // 更新存储桶
  static async updateBucket(data: UpdateBucketData): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    // 模拟更新成功
    console.log('Mock更新存储桶:', data)
  }

  // 删除存储桶
  static async deleteBuckets(ids: number[]): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('Mock删除存储桶:', ids)
    return true
  }

  // 获取文件列表
  static async getFileList(params: FileQueryParams): Promise<PageResult<OssFile>> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 模拟文件数据
    const mockFiles: OssFile[] = [
      {
        id: 1,
        fileName: 'avatar_20240115_001.jpg',
        originalName: '头像.jpg',
        fileSize: 1024000,
        fileUrl: 'https://example.com/files/avatar_20240115_001.jpg',
        fileType: 'image/jpeg',
        provider: 'aliyun',
        bucketName: 'my-bucket-1',
        fileMd5: 'abc123def456',
        status: 'active',
        fileSizeFormatted: '1.0 MB',
        createTime: '2024-01-15 10:30:00',
        updateTime: '2024-01-15 10:30:00'
      },
      {
        id: 2,
        fileName: 'document_20240116_001.pdf',
        originalName: '重要文档.pdf',
        fileSize: 2048000,
        fileUrl: 'https://example.com/files/document_20240116_001.pdf',
        fileType: 'application/pdf',
        provider: 'tencent',
        bucketName: 'my-bucket-2',
        fileMd5: 'def456ghi789',
        status: 'active',
        fileSizeFormatted: '2.0 MB',
        createTime: '2024-01-16 14:20:00',
        updateTime: '2024-01-16 14:20:00'
      },
      {
        id: 3,
        fileName: 'video_20240117_001.mp4',
        originalName: '演示视频.mp4',
        fileSize: 10240000,
        fileUrl: 'https://example.com/files/video_20240117_001.mp4',
        fileType: 'video/mp4',
        provider: 'qiniu',
        bucketName: 'test-bucket',
        fileMd5: 'ghi789jkl012',
        status: 'active',
        fileSizeFormatted: '10.0 MB',
        createTime: '2024-01-17 09:15:00',
        updateTime: '2024-01-17 09:15:00'
      }
    ]
    
    let filteredFiles = [...mockFiles]
    
    // 应用过滤条件
    if (params.fileName) {
      filteredFiles = filteredFiles.filter(file => 
        file.fileName.toLowerCase().includes(params.fileName!.toLowerCase())
      )
    }
    if (params.originalName) {
      filteredFiles = filteredFiles.filter(file => 
        file.originalName.toLowerCase().includes(params.originalName!.toLowerCase())
      )
    }
    if (params.fileType) {
      filteredFiles = filteredFiles.filter(file => file.fileType === params.fileType)
    }
    if (params.provider) {
      filteredFiles = filteredFiles.filter(file => file.provider === params.provider)
    }
    if (params.bucketName) {
      filteredFiles = filteredFiles.filter(file => file.bucketName === params.bucketName)
    }
    if (params.status) {
      filteredFiles = filteredFiles.filter(file => file.status === params.status)
    }
    
    // 分页处理
    const pageSize = params.pageSize || 10
    const pageNum = params.pageNum || 1
    const startIndex = (pageNum - 1) * pageSize
    const endIndex = startIndex + pageSize
    const pagedFiles = filteredFiles.slice(startIndex, endIndex)
    
    return {
      records: pagedFiles,
      total: filteredFiles.length,
      size: pageSize,
      current: pageNum,
      pages: Math.ceil(filteredFiles.length / pageSize),
      hasPrevious: pageNum > 1,
      hasNext: pageNum < Math.ceil(filteredFiles.length / pageSize)
    }
  }

  // 上传文件
  static async uploadFile(params: UploadFileParams): Promise<OssFile> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟上传成功返回的文件信息
    const mockFile: OssFile = {
      id: Date.now(),
      fileName: `upload_${Date.now()}_${params.file.name}`,
      originalName: params.file.name,
      fileSize: params.file.size,
      fileUrl: `https://example.com/files/upload_${Date.now()}_${params.file.name}`,
      fileType: params.file.type,
      provider: params.provider,
      bucketName: params.bucketName,
      fileMd5: `md5_${Date.now()}`,
      status: 'active',
      fileSizeFormatted: `${(params.file.size / 1024 / 1024).toFixed(1)} MB`,
      createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
    }
    
    return mockFile
  }

  // 删除文件
  static async deleteFiles(ids: number[]): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('Mock删除文件:', ids)
    return true
  }

  // 下载文件
  static async downloadFile(id: number): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟文件内容
    const content = `Mock file content for file ID: ${id}`
    return new Blob([content], { type: 'text/plain' })
  }
}
