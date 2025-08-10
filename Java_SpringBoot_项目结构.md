# Java Spring Boot 项目包结构设计

基于前端Vue项目分析，设计对应的Java Spring Boot后端项目包结构，用于快速搭建企业级应用脚手架。参考若依框架设计理念，构建完整的后台管理系统脚手架。

## 项目概述

- **项目名称**: zboot-backend-java
- **技术栈**: Spring Boot 3.x + Sa-Token + MyBatis Plus + Redis + MySQL + Elasticsearch + RabbitMQ + Activity + EasyExcel
- **架构模式**: 分层架构 (Controller -> Service -> Repository)
- **包管理**: Maven
- **设计模式**: 策略模式(文件存储/短信服务)、工厂模式、建造者模式等

## 目录结构

```
zboot-backend-java/
├── pom.xml                                 # Maven配置文件
├── README.md                               # 项目说明文档
├── docker-compose.yml                     # Docker容器编排
├── Dockerfile                              # Docker镜像构建
├── .gitignore                             # Git忽略文件
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/
    │   │       └── zboot/
    │   │           ├── ZbootApplication.java           # 启动类
    │   │           ├── common/                         # 公共模块
    │   │           │   ├── annotation/                # 自定义注解
    │   │           │   │   ├── RequirePermission.java # 权限注解
    │   │           │   │   ├── Log.java               # 日志注解
    │   │           │   │   ├── RateLimit.java         # 限流注解
    │   │           │   │   ├── Excel.java             # Excel注解
    │   │           │   │   └── DataSource.java        # 数据源注解
    │   │           │   ├── aspect/                    # 切面
    │   │           │   │   ├── LogAspect.java         # 日志切面
    │   │           │   │   ├── PermissionAspect.java  # 权限切面
    │   │           │   │   ├── RateLimitAspect.java   # 限流切面
    │   │           │   │   └── DataSourceAspect.java  # 数据源切面
    │   │           │   ├── constant/                  # 常量类
    │   │           │   │   ├── CommonConstant.java    # 通用常量
    │   │           │   │   ├── RedisConstant.java     # Redis常量
    │   │           │   │   ├── SecurityConstant.java  # 安全常量
    │   │           │   │   ├── FileConstant.java      # 文件常量
    │   │           │   │   ├── SmsConstant.java       # 短信常量
    │   │           │   │   └── WorkflowConstant.java  # 工作流常量
    │   │           │   ├── core/                      # 核心基础类
    │   │           │   │   ├── domain/                # 公共实体
    │   │           │   │   │   ├── BaseEntity.java    # 基础实体
    │   │           │   │   │   ├── TreeEntity.java    # 树形实体
    │   │           │   │   │   └── AuditEntity.java   # 审计实体
    │   │           │   │   ├── page/                  # 分页相关
    │   │           │   │   │   ├── PageDomain.java    # 分页参数
    │   │           │   │   │   ├── TableSupport.java  # 分页支持
    │   │           │   │   │   └── TableDataInfo.java # 分页数据
    │   │           │   │   └── text/                  # 文本处理
    │   │           │   │       ├── Convert.java       # 类型转换
    │   │           │   │       └── StrFormatter.java  # 字符串格式化
    │   │           │   ├── enums/                     # 枚举类
    │   │           │   │   ├── BusinessStatus.java    # 业务状态
    │   │           │   │   ├── DataSourceType.java    # 数据源类型
    │   │           │   │   ├── OperatorType.java      # 操作人类别
    │   │           │   │   ├── BusinessType.java      # 业务操作类型
    │   │           │   │   ├── FileType.java          # 文件类型
    │   │           │   │   └── CloudProvider.java     # 云服务提供商
    │   │           │   ├── exception/                 # 异常处理
    │   │           │   │   ├── GlobalExceptionHandler.java # 全局异常处理
    │   │           │   │   ├── ServiceException.java       # 业务异常
    │   │           │   │   ├── DemoModeException.java      # 演示模式异常
    │   │           │   │   └── UtilException.java          # 工具异常
    │   │           │   ├── filter/                    # 过滤器
    │   │           │   │   ├── RepeatableFilter.java  # 可重复读取过滤器
    │   │           │   │   ├── XssFilter.java         # XSS过滤器
    │   │           │   │   └── PropertyPreExcludeFilter.java # 属性预排除过滤器
    │   │           │   └── utils/                     # 工具类
    │   │           │       ├── StringUtils.java       # 字符串工具
    │   │           │       ├── DateUtils.java         # 日期工具
    │   │           │       ├── SecurityUtils.java     # 安全工具
    │   │           │       ├── ServletUtils.java      # Servlet工具
    │   │           │       ├── IpUtils.java           # IP工具
    │   │           │       ├── MessageUtils.java      # 消息工具
    │   │           │       ├── SqlUtil.java           # SQL工具
    │   │           │       ├── PageUtils.java         # 分页工具
    │   │           │       ├── BeanUtils.java         # Bean工具
    │   │           │       ├── FileUtils.java         # 文件工具
    │   │           │       ├── ExcelUtil.java         # Excel工具
    │   │           │       ├── JsonUtils.java         # JSON工具
    │   │           │       ├── RedisUtils.java        # Redis工具
    │   │           │       ├── ThreadUtils.java       # 线程工具
    │   │           │       └── uuid/                  # UUID工具
    │   │           │           ├── IdUtils.java       # ID工具
    │   │           │           ├── Seq.java           # 序列号
    │   │           │           └── UUID.java          # UUID生成
    │   │           ├── config/                         # 配置类
    │   │           │   ├── SaTokenConfig.java         # Sa-Token配置
    │   │           │   ├── RedisConfig.java           # Redis配置
    │   │           │   ├── MyBatisPlusConfig.java     # MyBatis Plus配置
    │   │           │   ├── WebConfig.java             # Web配置
    │   │           │   ├── SwaggerConfig.java         # API文档配置
    │   │           │   ├── ScheduleConfig.java        # 定时任务配置
    │   │           │   ├── ElasticsearchConfig.java   # Elasticsearch配置
    │   │           │   ├── RabbitMQConfig.java        # RabbitMQ配置
    │   │           │   ├── ActivityConfig.java        # 工作流配置
    │   │           │   ├── ThreadPoolConfig.java      # 线程池配置
    │   │           │   └── ResourcesConfig.java       # 资源配置
    │   │           ├── web/                            # 控制器层
    │   │           │   ├── controller/                # 控制器
    │   │           │   │   ├── common/                # 通用控制器
    │   │           │   │   │   ├── CaptchaController.java     # 验证码
    │   │           │   │   │   ├── CommonController.java      # 通用数据
    │   │           │   │   │   └── ProfileController.java     # 个人信息
    │   │           │   │   ├── system/                # 系统管理
    │   │           │   │   │   ├── SysLoginController.java    # 登录验证
    │   │           │   │   │   ├── SysIndexController.java    # 首页
    │   │           │   │   │   ├── SysUserController.java     # 用户信息
    │   │           │   │   │   ├── SysRoleController.java     # 角色信息
    │   │           │   │   │   ├── SysMenuController.java     # 菜单信息
    │   │           │   │   │   ├── SysDeptController.java     # 部门信息
    │   │           │   │   │   ├── SysPostController.java     # 岗位信息
    │   │           │   │   │   ├── SysDictTypeController.java # 字典类型
    │   │           │   │   │   ├── SysDictDataController.java # 字典数据
    │   │           │   │   │   ├── SysConfigController.java   # 参数配置
    │   │           │   │   │   └── SysNoticeController.java   # 通知公告
    │   │           │   │   ├── monitor/               # 系统监控
    │   │           │   │   │   ├── SysOperlogController.java  # 操作日志
    │   │           │   │   │   ├── SysLogininforController.java # 登录日志
    │   │           │   │   │   ├── SysUserOnlineController.java # 在线用户
    │   │           │   │   │   ├── SysJobController.java      # 定时任务
    │   │           │   │   │   ├── DruidController.java       # 数据监控
    │   │           │   │   │   ├── ServerController.java      # 服务监控
    │   │           │   │   │   ├── CacheController.java       # 缓存监控
    │   │           │   │   │   └── SysRedisController.java    # Redis监控
    │   │           │   │   ├── tool/                  # 系统工具
    │   │           │   │   │   ├── TestController.java        # 测试
    │   │           │   │   │   ├── SwaggerController.java     # 系统接口
    │   │           │   │   │   └── GenController.java         # 代码生成
    │   │           │   │   ├── ai/                    # AI管理
    │   │           │   │   │   ├── AiAgentController.java     # AI代理管理
    │   │           │   │   │   ├── AiLLMController.java       # 大模型管理
    │   │           │   │   │   ├── AiChatController.java      # AI对话
    │   │           │   │   │   └── AiModelController.java     # 模型配置
    │   │           │   │   ├── workflow/              # 工作流管理
    │   │           │   │   │   ├── ProcessController.java     # 流程管理
    │   │           │   │   │   ├── TaskController.java        # 任务管理
    │   │           │   │   │   ├── ModelController.java       # 模型管理
    │   │           │   │   │   └── HistoryController.java     # 历史记录
    │   │           │   │   └── file/                  # 文件管理
    │   │           │   │       ├── FileController.java        # 文件上传
    │   │           │   │       └── FileInfoController.java    # 文件信息
    │   │           ├── framework/                      # 框架核心
    │   │           │   ├── aspectj/                   # 注解实现
    │   │           │   │   ├── lang/                  # 语言切面
    │   │           │   │   │   └── annotation/        # 注解包
    │   │           │   │   │       ├── Anonymous.java # 匿名访问
    │   │           │   │   │       ├── InnerAuth.java # 内部认证
    │   │           │   │   │       └── Sensitive.java # 敏感字段
    │   │           │   │   ├── DataScopeAspect.java   # 数据权限
    │   │           │   │   ├── DataSourceAspect.java  # 多数据源
    │   │           │   │   ├── LogAspect.java         # 操作日志
    │   │           │   │   ├── PreAuthorizeAspect.java # 权限认证
    │   │           │   │   ├── RateLimiterAspect.java # 限流处理
    │   │           │   │   └── RepeatSubmitAspect.java # 防重复提交
    │   │           │   ├── datasource/               # 多数据源
    │   │           │   │   ├── DynamicDataSource.java # 动态数据源
    │   │           │   │   └── DynamicDataSourceContextHolder.java # 数据源切换
    │   │           │   ├── interceptor/               # 拦截器
    │   │           │   │   ├── RepeatSubmitInterceptor.java # 防重复提交
    │   │           │   │   └── SameUrlDataInterceptor.java  # 相同参数拦截
    │   │           │   ├── manager/                   # 异步处理
    │   │           │   │   ├── AsyncManager.java      # 异步任务管理器
    │   │           │   │   └── factory/               # 工厂模式
    │   │           │   │       └── AsyncFactory.java # 异步工厂
    │   │           │   ├── security/                  # 权限安全
    │   │           │   │   ├── context/               # 权限上下文
    │   │           │   │   │   ├── AuthContextHolder.java # 认证上下文
    │   │           │   │   │   └── PermissionContextHolder.java # 权限上下文
    │   │           │   │   ├── handle/                # 处理器
    │   │           │   │   │   ├── AuthenticationEntryPointImpl.java # 认证失败
    │   │           │   │   │   └── LogoutSuccessHandlerImpl.java     # 退出处理
    │   │           │   │   └── service/               # 权限业务
    │   │           │   │       ├── TokenService.java # token验证
    │   │           │   │       └── PermissionService.java # 权限验证
    │   │           │   └── web/                       # web服务
    │   │           │       ├── domain/                # 通用领域
    │   │           │       │   ├── AjaxResult.java    # 响应信息主体
    │   │           │       │   ├── R.java             # 响应信息主体
    │   │           │       │   └── server/            # 服务器相关
    │   │           │       │       └── Sys.java       # 系统相关信息
    │   │           │       ├── exception/             # 异常处理
    │   │           │       │   └── GlobalExceptionHandler.java # 全局异常处理器
    │   │           │       └── service/               # 系统服务
    │   │           │           ├── ConfigService.java # 参数配置
    │   │           │           ├── DictService.java   # 字典服务
    │   │           │           ├── PermissionService.java # 权限信息
    │   │           │           ├── TokenService.java  # Token服务
    │   │           │           └── UserDetailsServiceImpl.java # 用户信息
    │   │           ├── service/                        # 业务服务层
    │   │           │   ├── system/                    # 系统模块
    │   │           │   │   ├── ISysConfigService.java # 参数配置服务
    │   │           │   │   ├── ISysDeptService.java   # 部门管理服务
    │   │           │   │   ├── ISysDictDataService.java # 字典数据服务
    │   │           │   │   ├── ISysDictTypeService.java # 字典类型服务
    │   │           │   │   ├── ISysLogininforService.java # 系统访问日志服务
    │   │           │   │   ├── ISysMenuService.java   # 菜单权限服务
    │   │           │   │   ├── ISysNoticeService.java # 公告服务
    │   │           │   │   ├── ISysOperLogService.java # 操作日志服务
    │   │           │   │   ├── ISysPostService.java   # 岗位信息服务
    │   │           │   │   ├── ISysRoleService.java   # 角色业务服务
    │   │           │   │   ├── ISysUserOnlineService.java # 在线用户服务
    │   │           │   │   ├── ISysUserService.java   # 用户业务服务
    │   │           │   │   └── impl/                  # 服务实现
    │   │           │   │       ├── SysConfigServiceImpl.java
    │   │           │   │       ├── SysDeptServiceImpl.java
    │   │           │   │       ├── SysDictDataServiceImpl.java
    │   │           │   │       ├── SysDictTypeServiceImpl.java
    │   │           │   │       ├── SysLogininforServiceImpl.java
    │   │           │   │       ├── SysMenuServiceImpl.java
    │   │           │   │       ├── SysNoticeServiceImpl.java
    │   │           │   │       ├── SysOperLogServiceImpl.java
    │   │           │   │       ├── SysPostServiceImpl.java
    │   │           │   │       ├── SysRoleServiceImpl.java
    │   │           │   │       ├── SysUserOnlineServiceImpl.java
    │   │           │   │       └── SysUserServiceImpl.java
    │   │           │   ├── ai/                        # AI模块服务
    │   │           │   │   ├── IAiAgentService.java   # AI代理服务
    │   │           │   │   ├── IAiLLMService.java     # 大模型服务
    │   │           │   │   ├── IAiChatService.java    # AI对话服务
    │   │           │   │   └── impl/                  # 服务实现
    │   │           │   │       ├── AiAgentServiceImpl.java
    │   │           │   │       ├── AiLLMServiceImpl.java
    │   │           │   │       └── AiChatServiceImpl.java
    │   │           │   ├── workflow/                  # 工作流服务
    │   │           │   │   ├── IProcessService.java   # 流程服务
    │   │           │   │   ├── ITaskService.java      # 任务服务
    │   │           │   │   └── impl/                  # 服务实现
    │   │           │   │       ├── ProcessServiceImpl.java
    │   │           │   │       └── TaskServiceImpl.java
    │   │           │   ├── file/                      # 文件服务
    │   │           │   │   ├── IFileService.java      # 文件服务
    │   │           │   │   ├── strategy/              # 策略模式
    │   │           │   │   │   ├── FileStorageStrategy.java # 文件存储策略接口
    │   │           │   │   │   ├── AliyunOssStrategy.java   # 阿里云OSS策略
    │   │           │   │   │   ├── TencentCosStrategy.java  # 腾讯云COS策略
    │   │           │   │   │   ├── HuaweiObsStrategy.java   # 华为云OBS策略
    │   │           │   │   │   ├── QiniuKodoStrategy.java   # 七牛云策略
    │   │           │   │   │   └── LocalFileStrategy.java   # 本地文件策略
    │   │           │   │   └── impl/                  # 服务实现
    │   │           │   │       └── FileServiceImpl.java
    │   │           │   ├── sms/                       # 短信服务
    │   │           │   │   ├── ISmsService.java       # 短信服务接口
    │   │           │   │   ├── strategy/              # 策略模式
    │   │           │   │   │   ├── SmsStrategy.java   # 短信策略接口
    │   │           │   │   │   ├── AliyunSmsStrategy.java   # 阿里云短信策略
    │   │           │   │   │   ├── TencentSmsStrategy.java  # 腾讯云短信策略
    │   │           │   │   │   └── HuaweiSmsStrategy.java   # 华为云短信策略
    │   │           │   │   └── impl/                  # 服务实现
    │   │           │   │       └── SmsServiceImpl.java
    │   │           │   └── gen/                       # 代码生成
    │   │           │       ├── IGenTableService.java # 业务表服务
    │   │           │       ├── IGenTableColumnService.java # 业务字段服务
    │   │           │       └── impl/                  # 服务实现
    │   │           │           ├── GenTableServiceImpl.java
    │   │           │           └── GenTableColumnServiceImpl.java
    │   │           ├── mapper/                         # 数据访问层
    │   │           │   ├── system/                    # 系统模块
    │   │           │   │   ├── SysConfigMapper.java   # 参数配置
    │   │           │   │   ├── SysDeptMapper.java     # 部门管理
    │   │           │   │   ├── SysDictDataMapper.java # 字典数据
    │   │           │   │   ├── SysDictTypeMapper.java # 字典类型
    │   │           │   │   ├── SysLogininforMapper.java # 系统访问日志
    │   │           │   │   ├── SysMenuMapper.java     # 菜单权限
    │   │           │   │   ├── SysNoticeMapper.java   # 通知公告
    │   │           │   │   ├── SysOperLogMapper.java  # 操作日志
    │   │           │   │   ├── SysPostMapper.java     # 岗位信息
    │   │           │   │   ├── SysRoleMapper.java     # 角色表
    │   │           │   │   ├── SysRoleDeptMapper.java # 角色与部门关联
    │   │           │   │   ├── SysRoleMenuMapper.java # 角色和菜单关联
    │   │           │   │   ├── SysUserMapper.java     # 用户表
    │   │           │   │   ├── SysUserPostMapper.java # 用户与岗位关联
    │   │           │   │   └── SysUserRoleMapper.java # 用户和角色关联
    │   │           │   ├── ai/                        # AI模块
    │   │           │   │   ├── AiAgentMapper.java     # AI代理
    │   │           │   │   ├── AiLLMMapper.java       # 大模型
    │   │           │   │   ├── AiChatMapper.java      # AI对话
    │   │           │   │   └── AiModelMapper.java     # 模型配置
    │   │           │   ├── workflow/                  # 工作流模块
    │   │           │   │   ├── ProcessMapper.java     # 流程
    │   │           │   │   └── TaskMapper.java        # 任务
    │   │           │   ├── file/                      # 文件模块
    │   │           │   │   └── FileInfoMapper.java    # 文件信息
    │   │           │   └── gen/                       # 代码生成
    │   │           │       ├── GenTableMapper.java    # 业务表
    │   │           │       └── GenTableColumnMapper.java # 业务字段
    │   │           ├── domain/                         # 实体类(DO)
    │   │           │   ├── system/                    # 系统模块
    │   │           │   │   ├── SysConfigDO.java       # 参数配置实体
    │   │           │   │   ├── SysDeptDO.java         # 部门实体
    │   │           │   │   ├── SysDictDataDO.java     # 字典数据实体
    │   │           │   │   ├── SysDictTypeDO.java     # 字典类型实体
    │   │           │   │   ├── SysLogininforDO.java   # 系统访问记录实体
    │   │           │   │   ├── SysMenuDO.java         # 菜单权限实体
    │   │           │   │   ├── SysNoticeDO.java       # 通知公告实体
    │   │           │   │   ├── SysOperLogDO.java      # 操作日志实体
    │   │           │   │   ├── SysPostDO.java         # 岗位实体
    │   │           │   │   ├── SysRoleDO.java         # 角色实体
    │   │           │   │   ├── SysRoleDeptDO.java     # 角色和部门关联实体
    │   │           │   │   ├── SysRoleMenuDO.java     # 角色和菜单关联实体
    │   │           │   │   ├── SysUserDO.java         # 用户实体
    │   │           │   │   ├── SysUserPostDO.java     # 用户和岗位关联实体
    │   │           │   │   └── SysUserRoleDO.java     # 用户和角色关联实体
    │   │           │   ├── ai/                        # AI模块
    │   │           │   │   ├── AiAgentDO.java         # AI代理实体
    │   │           │   │   ├── AiLLMDO.java           # 大模型实体
    │   │           │   │   ├── AiChatDO.java          # AI对话实体
    │   │           │   │   └── AiModelDO.java         # 模型配置实体
    │   │           │   ├── workflow/                  # 工作流模块
    │   │           │   │   ├── ProcessDO.java         # 流程实体
    │   │           │   │   └── TaskDO.java            # 任务实体
    │   │           │   ├── file/                      # 文件模块
    │   │           │   │   └── FileInfoDO.java        # 文件信息实体
    │   │           │   └── gen/                       # 代码生成
    │   │           │       ├── GenTableDO.java        # 代码生成业务表实体
    │   │           │       └── GenTableColumnDO.java  # 代码生成业务表字段实体
    │   │           ├── dto/                            # 数据传输对象(DTO)
    │   │           │   ├── system/                    # 系统模块DTO
    │   │           │   │   ├── SysUserDTO.java        # 用户传输对象
    │   │           │   │   ├── SysRoleDTO.java        # 角色传输对象
    │   │           │   │   ├── SysMenuDTO.java        # 菜单传输对象
    │   │           │   │   ├── SysDeptDTO.java        # 部门传输对象
    │   │           │   │   ├── SysPostDTO.java        # 岗位传输对象
    │   │           │   │   ├── SysConfigDTO.java      # 参数配置传输对象
    │   │           │   │   ├── SysDictDataDTO.java    # 字典数据传输对象
    │   │           │   │   ├── SysDictTypeDTO.java    # 字典类型传输对象
    │   │           │   │   ├── SysNoticeDTO.java      # 通知公告传输对象
    │   │           │   │   └── LoginDTO.java          # 登录传输对象
    │   │           │   ├── ai/                        # AI模块DTO
    │   │           │   │   ├── AiAgentDTO.java        # AI代理传输对象
    │   │           │   │   ├── AiLLMDTO.java          # 大模型传输对象
    │   │           │   │   ├── AiChatDTO.java         # AI对话传输对象
    │   │           │   │   └── AiModelDTO.java        # 模型配置传输对象
    │   │           │   ├── workflow/                  # 工作流DTO
    │   │           │   │   ├── ProcessDTO.java        # 流程传输对象
    │   │           │   │   └── TaskDTO.java           # 任务传输对象
    │   │           │   ├── file/                      # 文件DTO
    │   │           │   │   └── FileInfoDTO.java       # 文件信息传输对象
    │   │           │   ├── sms/                       # 短信DTO
    │   │           │   │   └── SmsDTO.java            # 短信传输对象
    │   │           │   └── gen/                       # 代码生成DTO
    │   │           │       ├── GenTableDTO.java       # 代码生成业务表传输对象
    │   │           │       └── GenTableColumnDTO.java # 代码生成业务表字段传输对象
    │   │           ├── vo/                             # 视图对象(VO)
    │   │           │   ├── system/                    # 系统模块VO
    │   │           │   │   ├── SysUserVO.java         # 用户视图对象
    │   │           │   │   ├── SysRoleVO.java         # 角色视图对象
    │   │           │   │   ├── SysMenuVO.java         # 菜单视图对象
    │   │           │   │   ├── SysDeptVO.java         # 部门视图对象
    │   │           │   │   ├── SysPostVO.java         # 岗位视图对象
    │   │           │   │   ├── SysConfigVO.java       # 参数配置视图对象
    │   │           │   │   ├── SysDictDataVO.java     # 字典数据视图对象
    │   │           │   │   ├── SysDictTypeVO.java     # 字典类型视图对象
    │   │           │   │   ├── SysNoticeVO.java       # 通知公告视图对象
    │   │           │   │   ├── SysOperLogVO.java      # 操作日志视图对象
    │   │           │   │   ├── SysLogininforVO.java   # 系统访问记录视图对象
    │   │           │   │   ├── LoginVO.java           # 登录视图对象
    │   │           │   │   ├── RouterVO.java          # 路由配置视图对象
    │   │           │   │   └── MetaVO.java            # 路由显示信息视图对象
    │   │           │   ├── ai/                        # AI模块VO
    │   │           │   │   ├── AiAgentVO.java         # AI代理视图对象
    │   │           │   │   ├── AiLLMVO.java           # 大模型视图对象
    │   │           │   │   ├── AiChatVO.java          # AI对话视图对象
    │   │           │   │   └── AiModelVO.java         # 模型配置视图对象
    │   │           │   ├── workflow/                  # 工作流VO
    │   │           │   │   ├── ProcessVO.java         # 流程视图对象
    │   │           │   │   └── TaskVO.java            # 任务视图对象
    │   │           │   ├── file/                      # 文件VO
    │   │           │   │   └── FileInfoVO.java        # 文件信息视图对象
    │   │           │   ├── monitor/                   # 监控VO
    │   │           │   │   ├── ServerVO.java          # 服务器信息视图对象
    │   │           │   │   ├── CacheVO.java           # 缓存信息视图对象
    │   │           │   │   └── OnlineVO.java          # 在线用户视图对象
    │   │           │   └── gen/                       # 代码生成VO
    │   │           │       ├── GenTableVO.java        # 代码生成业务表视图对象
    │   │           │       └── GenTableColumnVO.java  # 代码生成业务表字段视图对象
    │   │           └── query/                          # 查询对象(Query)
    │   │               ├── system/                    # 系统模块查询对象
    │   │               │   ├── SysUserQuery.java      # 用户查询对象
    │   │               │   ├── SysRoleQuery.java      # 角色查询对象
    │   │               │   ├── SysMenuQuery.java      # 菜单查询对象
    │   │               │   ├── SysDeptQuery.java      # 部门查询对象
    │   │               │   ├── SysPostQuery.java      # 岗位查询对象
    │   │               │   ├── SysConfigQuery.java    # 参数配置查询对象
    │   │               │   ├── SysDictDataQuery.java  # 字典数据查询对象
    │   │               │   ├── SysDictTypeQuery.java  # 字典类型查询对象
    │   │               │   ├── SysNoticeQuery.java    # 通知公告查询对象
    │   │               │   ├── SysOperLogQuery.java   # 操作日志查询对象
    │   │               │   └── SysLogininforQuery.java # 系统访问记录查询对象
    │   │               ├── ai/                        # AI模块查询对象
    │   │               │   ├── AiAgentQuery.java      # AI代理查询对象
    │   │               │   ├── AiLLMQuery.java        # 大模型查询对象
    │   │               │   ├── AiChatQuery.java       # AI对话查询对象
    │   │               │   └── AiModelQuery.java      # 模型配置查询对象
    │   │               ├── workflow/                  # 工作流查询对象
    │   │               │   ├── ProcessQuery.java      # 流程查询对象
    │   │               │   └── TaskQuery.java         # 任务查询对象
    │   │               ├── file/                      # 文件查询对象
    │   │               │   └── FileInfoQuery.java     # 文件信息查询对象
    │   │               └── gen/                       # 代码生成查询对象
    │   │                   ├── GenTableQuery.java     # 代码生成业务表查询对象
    │   │                   └── GenTableColumnQuery.java # 代码生成业务表字段查询对象
    │   └── resources/
    │       ├── application.yml                        # 主配置文件
    │       ├── application-dev.yml                    # 开发环境配置
    │       ├── application-test.yml                   # 测试环境配置
    │       ├── application-prod.yml                   # 生产环境配置
    │       ├── mapper/                                # MyBatis映射文件
    │       │   ├── UserMapper.xml
    │       │   ├── RoleMapper.xml
    │       │   ├── PermissionMapper.xml
    │       │   ├── MenuMapper.xml
    │       │   ├── AgentMapper.xml
    │       │   ├── LLMMapper.xml
    │       │   ├── ChatMapper.xml
    │       │   ├── TaskMapper.xml
    │       │   └── LogMapper.xml
    │       ├── static/                                # 静态资源
    │       └── templates/                             # 模板文件
    └── test/
        └── java/
            └── com/
                └── zboot/
                    ├── ZbootApplicationTests.java     # 启动测试
                    ├── controller/                    # 控制器测试
                    ├── service/                       # 服务测试
                    └── repository/                    # 数据访问测试
```

## 核心依赖配置 (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>com.zboot</groupId>
    <artifactId>zboot-backend-spring</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <name>zboot-backend-spring</name>
    <description>ZBoot后端脚手架项目</description>
    
    <properties>
        <java.version>17</java.version>
        <mybatis-plus.version>3.5.4</mybatis-plus.version>
        <sa-token.version>1.37.0</sa-token.version>
        <swagger.version>2.2.0</swagger.version>
        <activiti.version>7.1.0.M6</activiti.version>
        <easyexcel.version>3.3.2</easyexcel.version>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-amqp</artifactId>
        </dependency>
        
        <!-- 数据库相关 -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
            <version>${mybatis-plus.version}</version>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- Sa-Token 权限认证 -->
        <dependency>
            <groupId>cn.dev33</groupId>
            <artifactId>sa-token-spring-boot3-starter</artifactId>
            <version>1.37.0</version>
        </dependency>
        <dependency>
            <groupId>cn.dev33</groupId>
            <artifactId>sa-token-redis-jackson</artifactId>
            <version>1.37.0</version>
        </dependency>
        
        <!-- Activity 工作流 -->
        <dependency>
            <groupId>org.activiti</groupId>
            <artifactId>activiti-spring-boot-starter</artifactId>
            <version>7.1.0.M6</version>
        </dependency>
        
        <!-- EasyExcel -->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>easyexcel</artifactId>
            <version>3.3.2</version>
        </dependency>
        
        <!-- 阿里云OSS -->
        <dependency>
            <groupId>com.aliyun.oss</groupId>
            <artifactId>aliyun-sdk-oss</artifactId>
            <version>3.17.1</version>
        </dependency>
        
        <!-- 腾讯云COS -->
        <dependency>
            <groupId>com.qcloud</groupId>
            <artifactId>cos_api</artifactId>
            <version>5.6.155</version>
        </dependency>
        
        <!-- 华为云OBS -->
        <dependency>
            <groupId>com.huaweicloud</groupId>
            <artifactId>esdk-obs-java</artifactId>
            <version>3.23.5</version>
        </dependency>
        
        <!-- 七牛云 -->
        <dependency>
            <groupId>com.qiniu</groupId>
            <artifactId>qiniu-java-sdk</artifactId>
            <version>7.13.1</version>
        </dependency>
        
        <!-- 阿里云短信 -->
        <dependency>
            <groupId>com.aliyun</groupId>
            <artifactId>dysmsapi20170525</artifactId>
            <version>2.0.24</version>
        </dependency>
        
        <!-- 腾讯云短信 -->
        <dependency>
            <groupId>com.tencentcloudapi</groupId>
            <artifactId>tencentcloud-sdk-java-sms</artifactId>
            <version>3.1.880</version>
        </dependency>
        
        <!-- API文档 -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>${swagger.version}</version>
        </dependency>
        
        <!-- 工具类 -->
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>5.8.22</version>
        </dependency>
        
        <!-- 测试 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

## 主要配置文件

### application.yml
```yaml
spring:
  profiles:
    active: dev
  application:
    name: zboot-backend-spring
  
  # 数据库配置
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/zboot?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
  
  # Redis配置
  data:
    redis:
      host: localhost
      port: 6379
      password:
      database: 0
      timeout: 3000ms
      lettuce:
        pool:
          max-active: 8
          max-idle: 8
          min-idle: 0
  
  # Jackson配置
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: GMT+8

# MyBatis Plus配置
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
  mapper-locations: classpath*:/mapper/**/*.xml

# Sa-Token配置
sa-token:
  token-name: Authorization
  timeout: 86400  # token有效期，单位s 默认30天
  activity-timeout: 1800  # token临时有效期 (指定时间内无操作就视为token过期) 单位: 秒
  is-concurrent: true  # 是否允许同一账号并发登录 (为true时允许一起登录, 为false时新登录挤掉旧登录)
  is-share: false  # 在多人登录同一账号时，是否共用一个token (为true时所有登录共用一个token, 为false时每次登录新建一个token)
  token-style: uuid  # token风格
  is-log: false  # 是否输出操作日志
  
# Elasticsearch配置
spring:
  elasticsearch:
    uris: http://localhost:9200
    username: 
    password: 
    connection-timeout: 5s
    socket-timeout: 60s
    
# RabbitMQ配置
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
    virtual-host: /
    
# Activity工作流配置
spring:
  activiti:
    database-schema-update: true
    db-identity-used: true
    history-level: full
    check-process-definitions: false

# API文档配置
springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
    tags-sorter: alpha
    operations-sorter: alpha

# 日志配置
logging:
  level:
    com.zboot: debug
    org.springframework.security: debug
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

## 核心功能模块

### 1. 认证授权模块
- 基于Sa-Token的权限认证
- 用户登录/登出
- Token管理和刷新
- 权限验证和角色管理
- 数据权限控制

### 2. 系统管理模块
- 用户管理: 用户CRUD、角色分配、状态管理
- 角色管理: 角色权限分配、数据权限
- 菜单管理: 动态菜单、权限控制
- 部门管理: 组织架构管理
- 岗位管理: 岗位信息维护
- 字典管理: 数据字典维护
- 参数配置: 系统参数管理
- 通知公告: 系统消息管理

### 3. AI管理模块
- AI代理管理: 智能助手配置
- 大模型管理: LLM模型配置
- AI对话管理: 对话历史和会话
- 模型配置: API密钥和参数

### 4. 工作流模块
- 流程设计: 基于Activity的流程设计
- 流程部署: 流程定义部署
- 任务管理: 待办任务处理
- 流程监控: 流程实例监控

### 5. 文件管理模块
- 多云存储: 支持阿里云、腾讯云、华为云、七牛云
- 文件上传: 支持多种文件格式
- 文件下载: 安全的文件下载
- Excel处理: 基于EasyExcel的导入导出

### 6. 短信服务模块
- 多厂商支持: 阿里云、腾讯云、华为云
- 短信模板: 模板管理和配置
- 发送记录: 短信发送历史
- 策略模式: 动态切换短信服务商

### 7. 代码生成模块
- 数据库表管理
- 代码模板配置
- 一键生成CRUD代码
- 支持自定义模板

### 8. 监控模块
- 系统监控: 服务器性能监控
- 在线用户: 实时在线用户管理
- 操作日志: 用户操作记录
- 登录日志: 用户登录记录
- 缓存监控: Redis缓存监控

### 9. 搜索模块
- Elasticsearch集成
- 全文检索
- 高级搜索
- 搜索结果高亮

## 开发规范

### 1. 命名规范
- 类名：大驼峰命名法 (PascalCase)
- 方法名：小驼峰命名法 (camelCase)
- 常量：全大写下划线分隔 (UPPER_SNAKE_CASE)
- 包名：全小写点分隔
- 数据库表名：小写下划线分隔 (snake_case)
- 字段名：小写下划线分隔 (snake_case)

### 2. 代码结构
- Controller层：负责接收请求，参数校验，调用Service
- Service层：业务逻辑处理，事务控制
- Mapper层：数据访问，SQL操作
- Domain层：数据库实体映射(DO)
- DTO层：数据传输对象
- VO层：视图对象
- Query层：查询对象

### 3. 异常处理
- 统一异常处理机制
- 自定义业务异常
- 标准错误码定义
- 友好错误信息返回
- 异常日志记录

### 4. 接口设计
- RESTful API设计
- 统一响应格式 (AjaxResult/R)
- 分页查询标准 (PageDomain)
- API版本控制
- 接口文档规范 (Swagger)

### 5. 数据库规范
- 表名前缀统一 (sys_, ai_, wf_等)
- 主键统一使用id
- 创建时间、更新时间字段统一
- 逻辑删除字段统一
- 索引命名规范

### 6. 日志规范
- 统一日志格式
- 日志级别规范
- 敏感信息脱敏
- 操作日志记录
- 错误日志追踪

### 7. 安全规范
- 参数校验
- SQL注入防护
- XSS攻击防护
- CSRF防护
- 接口限流
- 数据权限控制

### 8. 性能规范
- 数据库查询优化
- 缓存使用规范
- 分页查询限制
- 异步处理机制
- 连接池配置

## 部署说明

### 1. 开发环境
```bash
# 启动MySQL和Redis
docker-compose up -d mysql redis

# 运行应用
mvn spring-boot:run
```

### 2. 生产环境
```bash
# 构建镜像
docker build -t zboot-backend:latest .

# 部署应用
docker-compose up -d
```

### 3. 数据库初始化
- 执行SQL脚本创建表结构
- 初始化基础数据(管理员账号、角色权限等)
- 配置定时任务

## 扩展指南

### 1. 添加新模块
1. 创建包结构: domain、dto、vo、query、mapper、service、controller
2. 定义实体类: 继承BaseEntity，添加表注解
3. 创建Mapper接口: 继承BaseMapper
4. 编写Service接口和实现类
5. 创建Controller: 添加权限注解
6. 配置权限菜单
7. 编写单元测试
8. 更新API文档

### 2. 集成第三方服务
1. 添加Maven依赖
2. 创建配置类和属性类
3. 封装服务接口
4. 实现策略模式(如有多个服务商)
5. 添加异常处理
6. 编写配置文档
7. 添加健康检查

### 3. 自定义注解开发
1. 定义注解接口
2. 创建切面处理类
3. 注册切面Bean
4. 编写使用示例
5. 添加单元测试

### 4. 数据库扩展
1. 多数据源配置
2. 读写分离配置
3. 分库分表策略
4. 数据库连接池优化
5. SQL监控配置

### 5. 缓存策略扩展
1. 多级缓存配置
2. 缓存预热策略
3. 缓存更新策略
4. 缓存穿透防护
5. 缓存雪崩防护

### 6. 消息队列集成
1. RabbitMQ配置
2. 消息生产者封装
3. 消息消费者实现
4. 死信队列处理
5. 消息重试机制

### 7. 定时任务扩展
1. Quartz集成
2. 分布式任务调度
3. 任务监控管理
4. 任务失败处理
5. 动态任务配置

### 8. 性能优化
1. 数据库索引优化
2. SQL查询优化
3. Redis缓存策略
4. 接口响应优化
5. 异步处理机制
6. 连接池调优
7. JVM参数调优

### 9. 监控告警
1. 应用性能监控
2. 业务指标监控
3. 错误日志告警
4. 系统资源监控
5. 接口调用监控

这个Java Spring Boot项目结构设计基于前端Vue项目的功能模块，提供了完整的企业级应用脚手架，支持快速开发和二次定制。