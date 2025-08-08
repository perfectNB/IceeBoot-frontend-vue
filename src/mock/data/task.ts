export interface Task {
  id: string
  name: string
  className: string
  cronExpression: string
  status: string
  description: string
  lastExecuteTime?: string
  nextExecuteTime?: string | null
  createTime: string
  updateTime: string
}

export const taskData: Task[] = [
  {
    id: '1',
    name: '用户数据同步任务',
    className: 'com.example.job.UserSyncJob',
    cronExpression: '0 0 2 * * ?',
    status: 'running',
    description: '每天凌晨2点同步用户数据到数据仓库',
    lastExecuteTime: '2024-01-15 02:00:00',
    nextExecuteTime: '2024-01-16 02:00:00',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-15 02:00:00'
  },
  {
    id: '2',
    name: '日志清理任务',
    className: 'com.example.job.LogCleanupJob',
    cronExpression: '0 0 1 * * ?',
    status: 'running',
    description: '每天凌晨1点清理30天前的系统日志',
    lastExecuteTime: '2024-01-15 01:00:00',
    nextExecuteTime: '2024-01-16 01:00:00',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-15 01:00:00'
  },
  {
    id: '3',
    name: '邮件发送任务',
    className: 'com.example.job.EmailSendJob',
    cronExpression: '0 */5 * * * ?',
    status: 'running',
    description: '每5分钟检查并发送待发邮件',
    lastExecuteTime: '2024-01-15 14:25:00',
    nextExecuteTime: '2024-01-15 14:30:00',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-15 14:25:00'
  },
  {
    id: '4',
    name: '缓存预热任务',
    className: 'com.example.job.CacheWarmupJob',
    cronExpression: '0 30 8 * * ?',
    status: 'stopped',
    description: '每天早上8:30预热系统缓存',
    lastExecuteTime: '2024-01-14 08:30:00',
    nextExecuteTime: undefined,
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-14 08:30:00'
  },
  {
    id: '5',
    name: '数据备份任务',
    className: 'com.example.job.DataBackupJob',
    cronExpression: '0 0 3 * * ?',
    status: 'running',
    description: '每天凌晨3点备份重要业务数据',
    lastExecuteTime: '2024-01-15 03:00:00',
    nextExecuteTime: '2024-01-16 03:00:00',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-15 03:00:00'
  },
  {
    id: '6',
    name: '统计报表生成',
    className: 'com.example.job.ReportGenerateJob',
    cronExpression: '0 0 6 * * MON',
    status: 'paused',
    description: '每周一早上6点生成周统计报表',
    lastExecuteTime: '2024-01-08 06:00:00',
    nextExecuteTime: undefined,
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-08 06:00:00'
  },
  {
    id: '7',
    name: '系统健康检查',
    className: 'com.example.job.HealthCheckJob',
    cronExpression: '0 */10 * * * ?',
    status: 'running',
    description: '每10分钟检查系统各组件健康状态',
    lastExecuteTime: '2024-01-15 14:20:00',
    nextExecuteTime: '2024-01-15 14:30:00',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-15 14:20:00'
  },
  {
    id: '8',
    name: '临时文件清理',
    className: 'com.example.job.TempFileCleanJob',
    cronExpression: '0 0 4 * * ?',
    status: 'stopped',
    description: '每天凌晨4点清理系统临时文件',
    lastExecuteTime: '2024-01-13 04:00:00',
    nextExecuteTime: undefined,
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-13 04:00:00'
  }
]