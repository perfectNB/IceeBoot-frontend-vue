import type { SMSProvider, SMSKey } from '@/api/sms'

// SMS密钥mock数据
export const smsKeys: SMSKey[] = [
  {
    id: 1,
    smsProvider: 'aliyun',
    accessKeyId: 'example-aliyun-access-key-id',
    accessKeySecret: 'YourAccessKeySecretExample123456',
    endpoint: 'dysmsapi.aliyuncs.com',
    defaultSignName: '阿里云短信测试',
    defaultTemplateId: 'SMS_154950909',
    region: 'cn-hangzhou',
    sender: '',
    remark: '阿里云短信服务主账号',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    smsProvider: 'tencent',
    accessKeyId: 'AKIDQjz3ltompVjBExample',
    accessKeySecret: 'BQYIM75p4FsExample123456',
    endpoint: 'sms.tencentcloudapi.com',
    defaultSignName: '腾讯云',
    defaultTemplateId: '449739',
    region: 'ap-beijing',
    sender: '1400187558',
    remark: '腾讯云短信测试账号',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    smsProvider: 'huawei',
    accessKeyId: 'UDSIAMSTUBTEST000Example',
    accessKeySecret: 'example-aliyun-access-key-secret',
    endpoint: 'smsapi.cn-north-4.myhuaweicloud.com',
    defaultSignName: '华为云SMS',
    defaultTemplateId: '8ff55eac1d0b478ab3c06c3c6a492300',
    region: 'cn-north-4',
    sender: '10690000',
    remark: '华为云短信开发环境',
    status: 'inactive',
    extraConfig: '{}',
    createTime: '2024-01-17 09:15:00'
  },
  {
    id: 4,
    smsProvider: 'qiniu',
    accessKeyId: 'QiNiuAccessKeyExample',
    accessKeySecret: 'QiNiuSecretKeyExample123',
    endpoint: 'sms.qiniuapi.com',
    defaultSignName: '七牛云',
    defaultTemplateId: '1234567890123456',
    region: '',
    sender: '',
    remark: '七牛云短信服务',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-18 16:45:00'
  },
  {
    id: 5,
    smsProvider: 'netease',
    accessKeyId: 'NetEaseAppKeyExample',
    accessKeySecret: 'NetEaseAppSecretExample123',
    endpoint: 'api.netease.im',
    defaultSignName: '网易云信',
    defaultTemplateId: '3058726',
    region: '',
    sender: '',
    remark: '网易云信短信服务',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-19 11:30:00'
  },
  {
    id: 6,
    smsProvider: 'rongcloud',
    accessKeyId: 'RongCloudAppKeyExample',
    accessKeySecret: 'RongCloudAppSecretExample123',
    endpoint: 'api.cn.ronghub.com',
    defaultSignName: '容联云通讯',
    defaultTemplateId: '1',
    region: '',
    sender: '',
    remark: '容联云通讯短信服务',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-20 08:20:00'
  }
]

// SMS服务商mock数据
export const smsProviders: SMSProvider[] = [
  {
    providerName: 'aliyun',
    displayName: '阿里云短信',
    description: '阿里云短信服务，提供验证码、通知类短信发送服务',
    status: 'active',
    keys: smsKeys.filter(key => key.smsProvider === 'aliyun')
  },
  {
    providerName: 'huawei',
    displayName: '华为云短信',
    description: '华为云短信服务，提供高到达率、低延迟的短信发送服务',
    status: 'active',
    keys: smsKeys.filter(key => key.smsProvider === 'huawei')
  },
  {
    providerName: 'tencent',
    displayName: '腾讯云短信',
    description: '腾讯云短信服务，提供验证码、营销、通知类短信服务',
    status: 'active',
    keys: smsKeys.filter(key => key.smsProvider === 'tencent')
  },
  {
    providerName: 'qiniu',
    displayName: '七牛云短信',
    description: '七牛云短信服务，提供稳定可靠的短信发送能力',
    status: 'active',
    keys: smsKeys.filter(key => key.smsProvider === 'qiniu')
  },
  {
    providerName: 'netease',
    displayName: '网易云信',
    description: '网易云信短信服务，提供全球短信发送服务',
    status: 'active',
    keys: smsKeys.filter(key => key.smsProvider === 'netease')
  },
  {
    providerName: 'rongcloud',
    displayName: '容联云通讯',
    description: '容联云通讯短信服务，提供企业级通信解决方案',
    status: 'active',
    keys: smsKeys.filter(key => key.smsProvider === 'rongcloud')
  }
]