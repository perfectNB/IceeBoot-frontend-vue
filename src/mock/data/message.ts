import type { MessageItem, MessageType } from '@/api/message'

// 生成随机消息数据
const generateMessages = (): MessageItem[] => {
  const messages: MessageItem[] = []
  const types: MessageType[] = ['system', 'notice', 'warning']
  const titles = {
    system: [
      '系统维护通知',
      '系统升级完成',
      '新功能上线通知',
      '系统性能优化完成',
      '数据库备份完成'
    ],
    notice: [
      '重要公告发布',
      '节假日安排通知',
      '政策更新通知',
      '服务条款更新',
      '用户协议变更'
    ],
    warning: [
      '登录异常提醒',
      '密码即将过期',
      '账户安全检查',
      '异地登录提醒',
      '权限变更通知'
    ]
  }

  const contents = {
    system: [
      '系统将于今晚22:00-24:00进行维护升级，期间可能影响正常使用，请提前做好相关准备。',
      '系统升级已完成，新增了多项功能优化，提升了系统性能和用户体验。',
      '新功能模块已上线，包括消息中心、个人中心等，欢迎体验使用。',
      '系统性能优化已完成，响应速度提升30%，用户体验得到显著改善。',
      '数据库定期备份已完成，数据安全得到有效保障。'
    ],
    notice: [
      '重要公告：系统将于下周进行重大版本升级，请关注相关通知。',
      '节假日安排：根据国家法定节假日安排，系统服务时间将有所调整。',
      '隐私政策更新：我们更新了隐私政策条款，请仔细阅读相关内容。',
      '服务条款更新：为了更好地为您提供服务，我们更新了服务条款。',
      '用户协议变更：用户协议部分条款已更新，请及时查看最新版本。'
    ],
    warning: [
      '检测到您的账户在异常时间段有登录行为，如非本人操作请及时修改密码。',
      '您的登录密码已使用90天，为保障账户安全，建议及时更换密码。',
      '系统安全检查发现您的账户存在潜在风险，建议启用双因子认证。',
      '检测到您的账户在北京以外地区登录，如非本人操作请立即联系管理员。',
      '您的账户权限已发生变更，新增了部分模块的访问权限。'
    ]
  }

  // 生成100条消息
  for (let i = 1; i <= 100; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const titleList = titles[type]
    const contentList = contents[type]
    
    const title = titleList[Math.floor(Math.random() * titleList.length)]
    const content = contentList[Math.floor(Math.random() * contentList.length)]
    
    // 随机生成时间（最近30天内）
    const now = new Date()
    const randomDays = Math.floor(Math.random() * 30)
    const randomHours = Math.floor(Math.random() * 24)
    const randomMinutes = Math.floor(Math.random() * 60)
    
    const createTime = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000 - randomHours * 60 * 60 * 1000 - randomMinutes * 60 * 1000)
    
    // 70%的消息是已读的
    const isRead = Math.random() < 0.7
    const status = isRead ? 'read' : 'unread'
    const readTime = isRead ? new Date(createTime.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined
    
    messages.push({
      id: i,
      title,
      content,
      type,
      status,
      userId: 1, // 假设当前用户ID为1
      createTime: createTime.toISOString(),
      readTime
    })
  }

  // 按创建时间倒序排列
  return messages.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
}

// 导出mock消息数据
export const mockMessages = generateMessages()