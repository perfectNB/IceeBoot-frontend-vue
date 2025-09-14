import type { EmailProvider, EmailKey } from '@/api/email'

// Email密钥mock数据
export const emailKeys: EmailKey[] = [
  {
    id: 1,
    emailProvider: 'aliyun',
    emailAddress: 'noreply@example.com',
    emailPassword: 'AliyunEmailPassword123',
    smtpHost: 'smtpdm.aliyun.com',
    smtpPort: 465,
    enableSsl: true,
    enableTls: false,
    enableAuth: true,
    senderName: '系统通知',
    connectionTimeout: 30000,
    readTimeout: 30000,
    remark: '阿里云邮件推送服务',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    emailProvider: 'gmail',
    emailAddress: 'test@gmail.com',
    emailPassword: 'GmailAppPassword123',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    enableSsl: true,
    enableTls: true,
    enableAuth: true,
    senderName: 'Test Sender',
    connectionTimeout: 30000,
    readTimeout: 30000,
    remark: 'Gmail测试账号',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    emailProvider: 'netease',
    emailAddress: 'test@163.com',
    emailPassword: 'NetEasePassword123',
    smtpHost: 'smtp.163.com',
    smtpPort: 465,
    enableSsl: true,
    enableTls: false,
    enableAuth: true,
    senderName: '网易邮箱',
    connectionTimeout: 30000,
    readTimeout: 30000,
    remark: '网易邮箱测试账号',
    status: 'inactive',
    extraConfig: '{}',
    createTime: '2024-01-17 09:15:00'
  },
  {
    id: 4,
    emailProvider: 'qq',
    emailAddress: 'test@qq.com',
    emailPassword: 'QQEmailPassword123',
    smtpHost: 'smtp.qq.com',
    smtpPort: 587,
    enableSsl: true,
    enableTls: true,
    enableAuth: true,
    senderName: 'QQ邮箱',
    connectionTimeout: 30000,
    readTimeout: 30000,
    remark: 'QQ邮箱个人账号',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-18 16:45:00'
  },
  {
    id: 5,
    emailProvider: 'tencent',
    emailAddress: 'admin@company.com',
    emailPassword: 'TencentEnterprisePassword123',
    smtpHost: 'smtp.exmail.qq.com',
    smtpPort: 465,
    enableSsl: true,
    enableTls: false,
    enableAuth: true,
    senderName: '企业邮箱',
    connectionTimeout: 30000,
    readTimeout: 30000,
    remark: '腾讯企业邮箱',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-19 11:30:00'
  },
  {
    id: 6,
    emailProvider: 'outlook',
    emailAddress: 'test@outlook.com',
    emailPassword: 'OutlookPassword123',
    smtpHost: 'smtp-mail.outlook.com',
    smtpPort: 587,
    enableSsl: true,
    enableTls: true,
    enableAuth: true,
    senderName: 'Outlook邮箱',
    connectionTimeout: 30000,
    readTimeout: 30000,
    remark: 'Outlook个人邮箱',
    status: 'active',
    extraConfig: '{}',
    createTime: '2024-01-20 08:20:00'
  }
]

// Email服务商mock数据
export const emailProviders: EmailProvider[] = [
  {
    providerName: 'aliyun',
    displayName: '阿里云邮件',
    description: '阿里云邮件推送服务，提供高到达率的邮件发送服务',
    status: 'active',
    keys: emailKeys.filter(key => key.emailProvider === 'aliyun')
  },
  {
    providerName: 'gmail',
    displayName: 'Gmail邮箱',
    description: 'Google Gmail邮箱服务，全球领先的邮件服务提供商',
    status: 'active',
    keys: emailKeys.filter(key => key.emailProvider === 'gmail')
  },
  {
    providerName: 'netease',
    displayName: '网易邮箱',
    description: '网易邮箱服务，提供稳定可靠的邮件发送能力',
    status: 'active',
    keys: emailKeys.filter(key => key.emailProvider === 'netease')
  },
  {
    providerName: 'qq',
    displayName: 'QQ邮箱',
    description: '腾讯QQ邮箱服务，国内主流邮件服务提供商',
    status: 'active',
    keys: emailKeys.filter(key => key.emailProvider === 'qq')
  },
  {
    providerName: 'tencent',
    displayName: '腾讯企业邮箱',
    description: '腾讯企业邮箱服务，为企业提供专业的邮件解决方案',
    status: 'active',
    keys: emailKeys.filter(key => key.emailProvider === 'tencent')
  },
  {
    providerName: 'outlook',
    displayName: 'Outlook邮箱',
    description: 'Microsoft Outlook邮箱服务，微软提供的企业级邮件服务',
    status: 'active',
    keys: emailKeys.filter(key => key.emailProvider === 'outlook')
  }
]