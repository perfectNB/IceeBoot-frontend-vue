<template>
  <div class="chat-interface">
    <div class="page-header">
      <h1 class="page-title">AI对话</h1>
      <p class="page-description">与AI模型进行智能对话交流</p>
    </div>
    
    <div class="chat-container">
      <!-- 左侧会话列表 -->
      <div class="session-sidebar">
        <div class="sidebar-header">
          <h3>对话会话</h3>
          <el-button type="primary" size="small" @click="handleCreateSession">
            <el-icon><Plus /></el-icon>
            新建对话
          </el-button>
        </div>
        
        <div class="session-list">
          <div
            v-for="session in sessions"
            :key="session.id"
            :class="['session-item', { active: currentSessionId === session.id }]"
            @click="handleSelectSession(session)"
          >
            <div class="session-info">
              <div class="session-title">{{ session.title }}</div>
              <div class="session-model">{{ session.modelName }}</div>
              <div class="session-time">{{ formatTime(session.updateTime) }}</div>
            </div>
            <el-button
              type="danger"
              size="small"
              text
              @click.stop="handleDeleteSession(session)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 右侧对话区域 -->
      <div class="chat-main">
        <div v-if="!currentSession" class="empty-state">
          <el-empty description="请选择或创建一个对话会话" />
        </div>
        
        <template v-else>
          <!-- 对话头部 -->
          <div class="chat-header">
            <div class="session-info">
              <h3>{{ currentSession.title }}</h3>
              <el-tag size="small">{{ currentSession.modelName }}</el-tag>
            </div>
            <div class="header-actions">
              <el-button size="small" @click="handleClearMessages">
                <el-icon><Delete /></el-icon>
                清空对话
              </el-button>
            </div>
          </div>
          
          <!-- 消息列表 -->
          <div class="message-list" ref="messageListRef">
            <div
              v-for="message in currentSession.messages"
              :key="message.id"
              :class="['message-item', message.role]"
            >
              <div class="message-avatar">
                <el-avatar v-if="message.role === 'user'" :size="32">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <el-avatar v-else :size="32" style="background-color: #409eff">
                  AI
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-text">{{ message.content }}</div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
            
            <!-- 加载中消息 -->
            <div v-if="isLoading" class="message-item assistant">
              <div class="message-avatar">
                <el-avatar :size="32" style="background-color: #409eff">
                  AI
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-text">
                  <el-icon class="loading-icon"><Loading /></el-icon>
                  AI正在思考中...
                </div>
              </div>
            </div>
          </div>
          
          <!-- 输入区域 -->
          <div class="input-area">
            <div class="input-container">
              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="3"
                placeholder="输入您的问题..."
                :disabled="isLoading"
                @keydown.ctrl.enter="handleSendMessage"
              />
              <div class="input-actions">
                <span class="input-tip">Ctrl + Enter 发送</span>
                <el-button
                  type="primary"
                  :disabled="!inputMessage.trim() || isLoading"
                  @click="handleSendMessage"
                >
                  <el-icon><Promotion /></el-icon>
                  发送
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    
    <!-- 新建会话对话框 -->
    <el-dialog
      v-model="sessionDialogVisible"
      title="新建对话会话"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="sessionFormRef"
        :model="sessionForm"
        :rules="sessionFormRules"
        label-width="100px"
      >
        <el-form-item label="会话标题" prop="title">
          <el-input v-model="sessionForm.title" placeholder="请输入会话标题" />
        </el-form-item>
        <el-form-item label="选择模型" prop="modelId">
          <el-select v-model="sessionForm.modelId" placeholder="请选择AI模型" style="width: 100%">
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            >
              <div class="model-option">
                <span>{{ model.name }}</span>
                <el-tag size="small" style="margin-left: 8px">{{ model.remark }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="对话模式">
          <el-radio-group v-model="sessionForm.mode">
            <el-radio value="backend">后端模式</el-radio>
            <el-radio value="frontend">前端模式</el-radio>
          </el-radio-group>
          <div class="mode-description">
            <p v-if="sessionForm.mode === 'backend'">
              后端模式：通过后端服务调用AI模型，更安全稳定
            </p>
            <p v-else>
              前端模式：直接在浏览器中调用AI模型API，响应更快
            </p>
          </div>
        </el-form-item>
        <el-form-item v-if="sessionForm.mode === 'frontend'" label="API密钥" prop="apiKey">
          <el-input
            v-model="sessionForm.apiKey"
            type="textarea"
            :rows="2"
            placeholder="请输入模型的API密钥"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="sessionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateSessionSubmit" :loading="submitting">
            创建
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Plus,
  Delete,
  User,
  Loading,
  Promotion
} from '@element-plus/icons-vue'
import {
  getChatSessions,
  createChatSession,
  deleteChatSession,
  sendMessage,
  getLLMModels
} from '@/api'
import type { ChatSession, ChatMessage, LLMModel } from '@/types'

// 响应式数据
const isLoading = ref(false)
const submitting = ref(false)
const sessionDialogVisible = ref(false)
const sessionFormRef = ref<FormInstance>()
const messageListRef = ref<HTMLElement>()

const sessions = ref<ChatSession[]>([])
const currentSessionId = ref<string | number | null>(null)
const availableModels = ref<LLMModel[]>([])
const inputMessage = ref('')

// 会话表单
const sessionForm = reactive({
  title: '',
  modelId: '',
  mode: 'backend' as 'backend' | 'frontend',
  apiKey: ''
})

// 表单验证规则
const sessionFormRules = {
  title: [{ required: true, message: '请输入会话标题', trigger: 'blur' }],
  modelId: [{ required: true, message: '请选择AI模型', trigger: 'change' }],
  apiKey: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (sessionForm.mode === 'frontend' && !value.trim()) {
          callback(new Error('前端模式下请输入API密钥'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算属性
const currentSession = computed(() => {
  return sessions.value.find(s => s.id === currentSessionId.value) || null
})

// 模型API配置
const modelApiConfigs: Record<string, { baseUrl: string; model: string }> = {
  'chatgpt': {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo'
  },
  '文心一言': {
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
    model: 'ernie-bot'
  },
  '通义千问': {
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    model: 'qwen-turbo'
  },
  'deepseek': {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat'
  },
  'kimi': {
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k'
  },
  'claude': {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-sonnet-20240229'
  },
  'grok': {
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-beta'
  },
  'gemini': {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-pro'
  }
}

// 格式化时间
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

// 加载会话列表
const loadSessions = async () => {
  try {
    const result = await getChatSessions({ pageNum: 1, pageSize: 100 })
    sessions.value = result.records
  } catch (error) {
    console.error('加载会话列表失败:', error)
    ElMessage.error('加载会话列表失败')
  }
}

// 加载可用模型
const loadAvailableModels = async () => {
  try {
    const result = await getLLMModels({ pageNum: 1, pageSize: 100 })
    availableModels.value = result.records
  } catch (error) {
    console.error('加载模型列表失败:', error)
    ElMessage.error('加载模型列表失败')
  }
}

// 选择会话
const handleSelectSession = (session: ChatSession) => {
  currentSessionId.value = session.id
  scrollToBottom()
}

// 新建会话
const handleCreateSession = () => {
  resetSessionForm()
  sessionDialogVisible.value = true
}

// 创建会话提交
const handleCreateSessionSubmit = async () => {
  if (!sessionFormRef.value) return
  
  try {
    await sessionFormRef.value.validate()
    submitting.value = true
    
    const selectedModel = availableModels.value.find(m => m.id === sessionForm.modelId)
    if (!selectedModel) {
      ElMessage.error('请选择有效的模型')
      return
    }
    
    const newSession = await createChatSession({
      title: sessionForm.title,
      modelId: sessionForm.modelId,
      modelName: selectedModel.name
    })
    
    ElMessage.success('会话创建成功')
    sessionDialogVisible.value = false
    await loadSessions()
    
    // 自动选择新创建的会话
    currentSessionId.value = newSession.id
  } catch (error) {
    console.error('创建会话失败:', error)
    ElMessage.error('创建会话失败')
  } finally {
    submitting.value = false
  }
}

// 删除会话
const handleDeleteSession = async (session: ChatSession) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除会话 "${session.title}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteChatSession(session.id)
    ElMessage.success('会话删除成功')
    
    // 如果删除的是当前会话，清空选择
    if (currentSessionId.value === session.id) {
      currentSessionId.value = null
    }
    
    await loadSessions()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会话失败:', error)
      ElMessage.error('删除会话失败')
    }
  }
}

// 清空对话
const handleClearMessages = async () => {
  if (!currentSession.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要清空当前对话的所有消息吗？',
      '清空确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 清空消息（这里应该调用API）
    currentSession.value.messages = []
    ElMessage.success('对话已清空')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空对话失败:', error)
      ElMessage.error('清空对话失败')
    }
  }
}

// 发送消息
const handleSendMessage = async () => {
  if (!inputMessage.value.trim() || !currentSession.value || isLoading.value) {
    return
  }
  
  const message = inputMessage.value.trim()
  inputMessage.value = ''
  
  // 添加用户消息
  const userMessage: ChatMessage = {
    id: Date.now(),
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  }
  
  currentSession.value.messages.push(userMessage)
  scrollToBottom()
  
  isLoading.value = true
  
  try {
    // 获取当前会话的模型信息
    const selectedModel = availableModels.value.find(m => m.id === currentSession.value!.modelId)
    if (!selectedModel) {
      throw new Error('模型信息不存在')
    }
    
    // 判断是前端模式还是后端模式
    const sessionData = sessions.value.find(s => s.id === currentSession.value!.id) as ChatSession & { mode?: string; apiKey?: string }
    const mode = sessionData?.mode || 'backend'
    
    let response: string
    
    if (mode === 'frontend') {
      // 前端模式：直接调用模型API
      response = await callModelDirectly(selectedModel, message, sessionData?.apiKey || '')
    } else {
      // 后端模式：通过后端服务
      const result = await sendMessage(currentSession.value.id, message)
      response = result.content
    }
    
    // 添加AI回复
    const assistantMessage: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    }
    
    currentSession.value.messages.push(assistantMessage)
    scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  } finally {
    isLoading.value = false
  }
}

// 直接调用模型API（前端模式）
const callModelDirectly = async (model: LLMModel, message: string, apiKey: string): Promise<string> => {
  // 这里实现各个模型的直接调用
  // 由于跨域和安全性问题，实际项目中可能需要通过代理服务器
  
  // 获取模型配置
  const config = modelApiConfigs[model.name]
  if (!config) {
    throw new Error(`不支持的模型: ${model.name}`)
  }
  
  // 验证API密钥
  if (!apiKey) {
    throw new Error('API密钥不能为空')
  }
  
  // 模拟API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`这是来自 ${model.name} 的模拟回复：${message}`)
    }, 1000 + Math.random() * 2000)
  })
}

// 重置会话表单
const resetSessionForm = () => {
  Object.assign(sessionForm, {
    title: '',
    modelId: '',
    mode: 'backend',
    apiKey: ''
  })
  sessionFormRef.value?.clearValidate()
}

// 初始化
onMounted(async () => {
  await Promise.all([
    loadSessions(),
    loadAvailableModels()
  ])
})
</script>

<style scoped lang="scss">
.chat-interface {
  padding: 20px;
  height: calc(100vh - 120px);
  
  .page-header {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
    }
    
    .page-description {
      color: #606266;
      margin: 0;
    }
  }
  
  .chat-container {
    display: flex;
    height: calc(100% - 80px);
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .session-sidebar {
    width: 300px;
    border-right: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    
    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid #e4e7ed;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        margin: 0;
        color: #303133;
      }
    }
    
    .session-list {
      flex: 1;
      overflow-y: auto;
      
      .session-item {
        padding: 12px 16px;
        border-bottom: 1px solid #f5f7fa;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: #f5f7fa;
        }
        
        &.active {
          background-color: #ecf5ff;
          border-left: 3px solid #409eff;
        }
        
        .session-info {
          flex: 1;
          min-width: 0;
          
          .session-title {
            font-weight: 500;
            color: #303133;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .session-model {
            font-size: 12px;
            color: #909399;
            margin-bottom: 2px;
          }
          
          .session-time {
            font-size: 11px;
            color: #c0c4cc;
          }
        }
      }
    }
  }
  
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .empty-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chat-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e4e7ed;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .session-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        h3 {
          margin: 0;
          color: #303133;
        }
      }
    }
    
    .message-list {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      
      .message-item {
        display: flex;
        margin-bottom: 20px;
        
        &.user {
          flex-direction: row-reverse;
          
          .message-content {
            background-color: #409eff;
            color: white;
            margin-right: 12px;
            
            .message-time {
              color: rgba(255, 255, 255, 0.8);
            }
          }
        }
        
        &.assistant {
          .message-content {
            background-color: #f5f7fa;
            color: #303133;
            margin-left: 12px;
          }
        }
        
        .message-avatar {
          flex-shrink: 0;
        }
        
        .message-content {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 12px;
          
          .message-text {
            line-height: 1.5;
            word-wrap: break-word;
            
            .loading-icon {
              animation: spin 1s linear infinite;
            }
          }
          
          .message-time {
            font-size: 11px;
            margin-top: 4px;
            opacity: 0.7;
          }
        }
      }
    }
    
    .input-area {
      padding: 20px;
      border-top: 1px solid #e4e7ed;
      
      .input-container {
        .input-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          
          .input-tip {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
  
  .model-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
  
  .mode-description {
    margin-top: 8px;
    
    p {
      margin: 0;
      font-size: 12px;
      color: #909399;
      line-height: 1.4;
    }
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>