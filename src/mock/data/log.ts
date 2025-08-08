export interface LogItem {
  id: string
  level: string
  timestamp: string
  module: string
  message: string
  thread: string
  className: string
  stackTrace?: string
}

export const logData: LogItem[] = [
  {
    id: '1',
    level: 'INFO',
    timestamp: '2024-01-15 14:30:15',
    module: 'UserService',
    message: '用户登录成功: admin',
    thread: 'http-nio-8080-exec-1',
    className: 'com.example.service.UserService'
  },
  {
    id: '2',
    level: 'ERROR',
    timestamp: '2024-01-15 14:28:32',
    module: 'DatabaseService',
    message: '数据库连接失败',
    thread: 'http-nio-8080-exec-2',
    className: 'com.example.service.DatabaseService',
    stackTrace: 'java.sql.SQLException: Connection refused\n\tat com.mysql.cj.jdbc.ConnectionImpl.connectOneTryOnly(ConnectionImpl.java:956)\n\tat com.mysql.cj.jdbc.ConnectionImpl.createNewIO(ConnectionImpl.java:826)\n\tat com.mysql.cj.jdbc.ConnectionImpl.<init>(ConnectionImpl.java:456)\n\tat com.mysql.cj.jdbc.ConnectionImpl.getInstance(ConnectionImpl.java:246)'
  },
  {
    id: '3',
    level: 'WARN',
    timestamp: '2024-01-15 14:25:18',
    module: 'CacheService',
    message: 'Redis连接池使用率过高: 85%',
    thread: 'scheduler-1',
    className: 'com.example.service.CacheService'
  },
  {
    id: '4',
    level: 'DEBUG',
    timestamp: '2024-01-15 14:22:45',
    module: 'ApiController',
    message: 'API请求: GET /api/v1/users?page=1&size=20',
    thread: 'http-nio-8080-exec-3',
    className: 'com.example.controller.ApiController'
  },
  {
    id: '5',
    level: 'INFO',
    timestamp: '2024-01-15 14:20:12',
    module: 'TaskScheduler',
    message: '定时任务执行完成: 用户数据同步任务',
    thread: 'task-scheduler-1',
    className: 'com.example.scheduler.TaskScheduler'
  },
  {
    id: '6',
    level: 'ERROR',
    timestamp: '2024-01-15 14:18:55',
    module: 'EmailService',
    message: '邮件发送失败: SMTP服务器无响应',
    thread: 'email-sender-1',
    className: 'com.example.service.EmailService',
    stackTrace: 'javax.mail.MessagingException: Could not connect to SMTP host: smtp.example.com, port: 587\n\tat com.sun.mail.smtp.SMTPTransport.openServer(SMTPTransport.java:2118)\n\tat com.sun.mail.smtp.SMTPTransport.protocolConnect(SMTPTransport.java:740)\n\tat javax.mail.Service.connect(Service.java:366)'
  },
  {
    id: '7',
    level: 'INFO',
    timestamp: '2024-01-15 14:15:33',
    module: 'SecurityService',
    message: '用户权限验证通过: admin -> system:user:view',
    thread: 'http-nio-8080-exec-4',
    className: 'com.example.security.SecurityService'
  },
  {
    id: '8',
    level: 'WARN',
    timestamp: '2024-01-15 14:12:28',
    module: 'FileService',
    message: '磁盘空间不足警告: 剩余空间 < 10%',
    thread: 'monitor-thread-1',
    className: 'com.example.service.FileService'
  },
  {
    id: '9',
    level: 'DEBUG',
    timestamp: '2024-01-15 14:10:15',
    module: 'CacheService',
    message: '缓存命中: user:profile:admin',
    thread: 'http-nio-8080-exec-5',
    className: 'com.example.service.CacheService'
  },
  {
    id: '10',
    level: 'INFO',
    timestamp: '2024-01-15 14:08:42',
    module: 'SystemService',
    message: '系统启动完成，耗时: 15.2秒',
    thread: 'main',
    className: 'com.example.SystemApplication'
  },
  {
    id: '11',
    level: 'ERROR',
    timestamp: '2024-01-15 14:05:18',
    module: 'PaymentService',
    message: '支付接口调用失败: 网络超时',
    thread: 'payment-processor-1',
    className: 'com.example.service.PaymentService',
    stackTrace: 'java.net.SocketTimeoutException: Read timed out\n\tat java.net.SocketInputStream.socketRead0(Native Method)\n\tat java.net.SocketInputStream.socketRead(SocketInputStream.java:116)\n\tat java.net.SocketInputStream.read(SocketInputStream.java:171)'
  },
  {
    id: '12',
    level: 'WARN',
    timestamp: '2024-01-15 14:02:55',
    module: 'AuthService',
    message: '登录尝试失败: 用户名或密码错误 (IP: 192.168.1.100)',
    thread: 'http-nio-8080-exec-6',
    className: 'com.example.service.AuthService'
  },
  {
    id: '13',
    level: 'INFO',
    timestamp: '2024-01-15 14:00:00',
    module: 'BackupService',
    message: '数据备份任务开始执行',
    thread: 'backup-scheduler-1',
    className: 'com.example.service.BackupService'
  },
  {
    id: '14',
    level: 'DEBUG',
    timestamp: '2024-01-15 13:58:22',
    module: 'ValidationService',
    message: '参数验证通过: CreateUserRequest',
    thread: 'http-nio-8080-exec-7',
    className: 'com.example.service.ValidationService'
  },
  {
    id: '15',
    level: 'ERROR',
    timestamp: '2024-01-15 13:55:44',
    module: 'ConfigService',
    message: '配置文件加载失败: application-prod.yml',
    thread: 'config-loader-1',
    className: 'com.example.config.ConfigService',
    stackTrace: 'java.io.FileNotFoundException: application-prod.yml (No such file or directory)\n\tat java.io.FileInputStream.open0(Native Method)\n\tat java.io.FileInputStream.open(FileInputStream.java:195)\n\tat java.io.FileInputStream.<init>(FileInputStream.java:138)'
  }
]