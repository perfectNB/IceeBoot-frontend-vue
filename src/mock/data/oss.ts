import type { OSSProvider, OSSKey } from '@/api/oss'

// OSS密钥mock数据
export const ossKeys: OSSKey[] = [
  {
    id: 1,
    ossProvider: 'aliyun',
    accessKeyId: 'example-aliyun-access-key-id',
    accessKeySecret: 'YourAccessKeySecretExample123456',
    endpoint: 'oss-cn-hangzhou.aliyuncs.com',
    defaultBucket: 'my-bucket',
    region: 'cn-hangzhou',
    customDomain: '',
    remark: '阿里云OSS主账号',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    ossProvider: 'tencent',
    accessKeyId: 'AKIDQjz3ltompVjBExample',
    accessKeySecret: 'BQYIM75p4FsExample123456',
    endpoint: 'cos.ap-beijing.myqcloud.com',
    defaultBucket: 'test-bucket-1234567890',
    region: 'ap-beijing',
    customDomain: '',
    remark: '腾讯云COS测试账号',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    ossProvider: 'huawei',
    accessKeyId: 'UDSIAMSTUBTEST000Example',
    accessKeySecret: 'example-aliyun-access-key-secret',
    endpoint: 'obs.cn-north-4.myhuaweicloud.com',
    defaultBucket: 'huawei-bucket',
    region: 'cn-north-4',
    customDomain: '',
    remark: '华为云OBS开发环境',
    status: 'inactive',
    extraConfig: '{}',
    createTime: '2024-01-17 09:15:00'
  },
  {
    id: 4,
    ossProvider: 'minio',
    accessKeyId: 'minioadmin',
    accessKeySecret: 'minioadmin123',
    endpoint: 'localhost:9000',
    defaultBucket: 'uploads',
    region: 'us-east-1',
    customDomain: '',
    remark: '本地MinIO服务',
    status: 'active',
    extraConfig: '{"useSSL": false}',
    createTime: '2024-01-18 16:45:00'
  },
  {
    id: 5,
    ossProvider: 'qiniu',
    accessKeyId: 'QiNiuAccessKeyExample',
    accessKeySecret: 'QiNiuSecretKeyExample123',
    endpoint: 'up-z2.qiniup.com',
    defaultBucket: 'qiniu-storage',
    region: 'z2',
    customDomain: 'cdn.example.com',
    remark: '七牛云存储CDN',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-19 11:30:00'
  }
]

// OSS服务商mock数据
export const ossProviders: OSSProvider[] = [
  {
    providerName: 'aliyun',
    displayName: '阿里云OSS',
    description: '阿里云对象存储服务，提供海量、安全、低成本、高可靠的云存储服务',
    status: 'active',
    keys: ossKeys.filter(key => key.ossProvider === 'aliyun')
  },
  {
    providerName: 'huawei',
    displayName: '华为云OBS',
    description: '华为云对象存储服务，提供稳定、安全、高效、易用的云存储服务',
    status: 'active',
    keys: ossKeys.filter(key => key.ossProvider === 'huawei')
  },
  {
    providerName: 'tencent',
    displayName: '腾讯云COS',
    description: '腾讯云对象存储，提供安全稳定、海量、便捷、低延迟、低成本的云端存储服务',
    status: 'active',
    keys: ossKeys.filter(key => key.ossProvider === 'tencent')
  },
  {
    providerName: 'minio',
    displayName: 'MinIO',
    description: '高性能的分布式对象存储服务，兼容Amazon S3 API',
    status: 'active',
    keys: ossKeys.filter(key => key.ossProvider === 'minio')
  },
  {
    providerName: 'qiniu',
    displayName: '七牛云',
    description: '七牛云存储服务，为开发者提供可靠、安全、快速的云存储服务',
    status: 'active',
    keys: ossKeys.filter(key => key.ossProvider === 'qiniu')
  }
]
