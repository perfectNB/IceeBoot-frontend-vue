/**
 * API接口统一管理
 * 所有接口都通过此文件导出，便于统一管理和维护
 */

// 认证相关接口
export {
  login,
  logout,
  getUserInfo,
  refreshToken,
  getWechatQrCode,
  checkWechatLogin
} from './auth'

// 菜单相关接口
export {
  getUserMenus,
  getAllMenus,
  createMenu,
  updateMenu,
  deleteMenu
} from './menu'

// 权限相关接口
export {
  getPermissions,
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionById
} from './permission'

// 角色相关接口
export {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleById
} from './role'

// 用户管理相关接口
export {
  // 用户管理相关
  getUserList,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deleteUsers,
  resetUserPassword,
  updateUserStatus,
  type CreateUserData
} from './user'

// AI管理相关接口
export {
  getLLMModels,
  getLLMModel,
  createLLMModel,
  updateLLMModel,
  deleteLLMModel,
  addLLMModelKey,
  deleteLLMModelKey,
  updateLLMModelKeyStatus
} from './llm'

export {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  updateAgentStatus
} from './agent'
// 聊天相关接口
export {
  getChatSessions,
  getChatSession,
  createChatSession,
  deleteChatSession,
  sendMessage,
  getAvailableModels,
  getModelApiConfig,
  streamChat
} from './chat'

// 工作台相关接口
export {
  getDashboardStats,
  getVisitTrend,
  getUserDistribution
} from './dashboard'

// 其他业务接口
// export * from './business'

// OSS相关接口
export {
  getOSSProviders,
  addOSSKey,
  updateOSSKey,
  deleteOSSKey,
  updateOSSKeyStatus
} from './oss'

// SMS相关接口
export {
  getSMSProviders,
  addSMSKey,
  updateSMSKey,
  deleteSMSKey,
  updateSMSKeyStatus
} from './sms'

// Email相关接口
export {
  getEmailProviders,
  addEmailKey,
  updateEmailKey,
  deleteEmailKey,
  updateEmailKeyStatus
} from './email'

/**
 * API接口类型定义
 */
export type {
  LoginForm,
  LoginResponse,
  User,
  MenuItem,
  Permission,
  Role,
  ApiResponse,
  PageParams,
  PageResult
} from '@/types'

// 第三方服务类型定义
export type {
  OSSKey,
  OSSProvider
} from './oss'

export type {
  SMSKey,
  SMSProvider
} from './sms'

export type {
  EmailKey,
  EmailProvider
} from './email'


