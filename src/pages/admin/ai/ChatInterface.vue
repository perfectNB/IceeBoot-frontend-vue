<template>
  <div class="chat-interface">
    <div class="page-header">
      <h1 class="page-title">{{ t('chatInterface.pageTitle') }}</h1>
      <p class="page-description">{{ t('chatInterface.pageDescription') }}</p>
    </div>

    <div class="chat-container">
      <!-- 左侧会话列表 -->
      <div class="session-sidebar">
        <div class="sidebar-header">
          <h3>{{ t('chatInterface.sessionHistory') }}</h3>
          <el-button type="primary" size="small" @click="handleCreateSession">
            <el-icon><Plus /></el-icon>
            {{ t('chatInterface.newChat') }}
          </el-button>
        </div>

        <div class="session-list" ref="sessionListRef" @scroll="handleSessionScroll">
          <div
            v-for="session in sessions"
            :key="session.id"
            :class="['session-item', { active: currentSessionId === session.id }]"
            @click="handleSelectSession(session)"
          >
            <div class="session-info">
              <div class="session-title">{{ session.title }}</div>
              <div class="session-model">{{ session.modelName }}</div>
              <div class="session-time">{{ formatTime(session.createTime) }}</div>
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

            <!-- 会话加载提示 -->
            <div v-if="sessionLoading" class="session-loading">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>{{ t('chatInterface.loadMoreSessions') }}</span>
            </div>
          </div>
        </div>

      <!-- 右侧对话区域 -->
      <div class="chat-main">
        <div v-if="!currentSession" class="empty-state">
          <el-empty :description="t('chatInterface.selectOrCreateSession')" />
        </div>

        <template v-else>
          <!-- 对话头部 -->
          <div class="chat-header">
            <div class="session-info">
              <h3>{{ currentSession.title }}</h3>
              <el-tag size="small">{{ currentSession.modelName }}</el-tag>
            </div>
            <div class="header-actions">
              <div class="mcp-switch">
                <span class="switch-label">{{ t('chatInterface.enableMcp') }}</span>
                <el-switch
                  v-model="mcpEnabled"
                  size="small"
                  style="margin-left: 8px; margin-right: 16px;"
                />
              </div>
              <el-button size="small" @click="handleClearMessages">
                <el-icon><Delete /></el-icon>
                {{ t('chatInterface.clearChat') }}
              </el-button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div class="message-list" ref="messageListRef" @scroll="handleMessageScroll">
            <!-- 历史消息加载提示 -->
            <div v-if="messageLoading && messagePage > 1" class="loading-more">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>{{ t('chatInterface.loadMoreMessages') }}</span>
            </div>

            <div
              v-for="message in currentMessages"
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
                <div
                  class="message-text"
                  :class="{ 'typing-effect': message.role === 'assistant' && isLoading && currentMessages[currentMessages.length - 1]?.id === message.id }"
                >
                  <div
                    v-if="message.role === 'assistant'"
                    v-html="renderMarkdown(message.content)"
                    class="markdown-content"
                  ></div>
                  <div v-else>{{ message.content }}</div>
                </div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>

            <!-- 发送消息时的加载状态 -->
            <div v-if="isLoading && currentMessages.length > 0 && currentMessages[currentMessages.length - 1].content === ''" class="message-item assistant">
              <div class="message-avatar">
                <el-avatar :size="32" style="background-color: #409eff">
                  AI
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-text">
                  <div class="thinking-animation">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                  <span class="thinking-text">{{ t('chatInterface.aiThinking') }}</span>
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
                :placeholder="t('chatInterface.enterYourQuestion')"
                :disabled="isLoading"
                @keydown.ctrl.enter="handleSendMessage"
              />
              <div class="input-actions">
                <span class="input-tip">{{ t('chatInterface.ctrlEnterToSend') }}</span>
                <el-button
                  type="primary"
                  :disabled="!inputMessage.trim() || isLoading"
                  @click="handleSendMessage"
                >
                  <el-icon><Promotion /></el-icon>
                  {{ t('chatInterface.send') }}
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
      :title="t('chatInterface.newChatDialog')"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="sessionFormRef"
        :model="sessionForm"
        :rules="sessionFormRules"
        label-width="100px"
      >
        <el-form-item :label="t('chatInterface.chatTitle')" prop="title">
          <el-input v-model="sessionForm.title" :placeholder="t('chatInterface.pleaseEnterChatTitle')" />
        </el-form-item>
        <el-form-item :label="t('chatInterface.selectProvider')" prop="provider">
          <el-select
            v-model="sessionForm.provider"
            :placeholder="t('chatInterface.pleaseSelectProvider')"
            @change="handleProviderChange"
            style="width: 100%"
          >
            <el-option
              v-for="provider in availableProviders"
              :key="provider.providerName"
              :label="provider.displayName"
              :value="provider.providerName"
              :disabled="!provider.keys || provider.keys.length === 0"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('chatInterface.selectModel')" prop="modelName">
          <el-select
            v-model="sessionForm.modelName"
            :placeholder="t('chatInterface.pleaseSelectModel')"
            style="width: 100%"
            :disabled="!sessionForm.provider"
          >
            <el-option
              v-for="model in availableModels"
              :key="model.name"
              :label="model.name"
              :value="model.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('chatInterface.selectKey')" prop="keyId">
          <el-select
            v-model="sessionForm.keyId"
            :placeholder="t('chatInterface.pleaseSelectKey')"
            style="width: 100%"
            :disabled="!sessionForm.provider"
          >
            <el-option
              v-for="key in availableKeys"
              :key="key.id"
              :label="key.remark || key.id"
              :value="key.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="sessionDialogVisible = false">{{ t('chatInterface.cancel') }}</el-button>
          <el-button type="primary" @click="handleCreateSessionSubmit" :loading="submitting">
            {{ t('chatInterface.create') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import {
  Plus,
  Delete,
  User,
  Loading,
  Promotion
} from '@element-plus/icons-vue'
import {
  getLLMModels
} from '@/api'
import { getAiChatSessions, getAiChatMessages, streamAiChat, streamIntelligentAiChat, deleteAiChatSession,createAiChatSession, clearAiChatSession } from '@/api/aiChat'
import type { LLMModel } from '@/types'
import type { AiChatSession, AiChatMessage, StreamChatRequest } from '@/api/aiChat'

const { t } = useI18n()

// 响应式数据
const isLoading = ref(false)
const submitting = ref(false)
const sessionDialogVisible = ref(false)
const sessionFormRef = ref<FormInstance>()
const messageListRef = ref<HTMLElement>()
const sessionListRef = ref<HTMLElement>()

const sessions = ref<AiChatSession[]>([])
const currentSessionId = ref<string | number | null>(null)
const availableProviders = ref<LLMModel[]>([])
const inputMessage = ref('')
const sessionLoading = ref(false)
const sessionPage = ref(1)
const sessionHasMore = ref(true)
const messageLoading = ref(false)
const messagePage = ref(1)
const messageHasMore = ref(true)
const currentMessages = ref<AiChatMessage[]>([])
const mcpEnabled = ref(false)

// Markdown渲染器
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, { language: lang }).value
        return `<pre class="hljs-code-block"><div class="code-header"><span class="code-lang">${lang}</span><button class="copy-btn" onclick="copyCode(this)" title="Copy code"><span class="btn-label">Copy code</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button></div><code class="hljs language-${lang}">${highlighted}</code></pre>`
      } catch {
        // 忽略高亮错误，使用普通文本
      }
    }
    return `<pre class="hljs-code-block"><div class="code-header"><span class="code-lang">text</span><button class="copy-btn" onclick="copyCode(this)" title="Copy code"><span class="btn-label">Copy code</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button></div><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`
  }
})

// 自定义表格渲染，添加滚动容器
md.renderer.rules.table_open = () => '<div class="table-container"><table>'
md.renderer.rules.table_close = () => '</table></div>'

// 渲染Markdown内容
const renderMarkdown = (content: string) => {
  const rendered = md.render(content)
  // 在客户端添加复制功能
  nextTick(() => {
    // 确保全局复制函数存在
    const globalWindow = window as Window & { copyCode?: (button: HTMLElement) => void }
    if (typeof globalWindow.copyCode === 'undefined') {
      globalWindow.copyCode = (button: HTMLElement) => {
        const codeBlock = button.closest('.hljs-code-block') as HTMLElement | null
        const code = codeBlock?.querySelector('code')?.textContent || ''
        const label = button.querySelector('.btn-label') as HTMLElement | null
        if (!code) return
        navigator.clipboard.writeText(code).then(() => {
          if (label) {
            button.classList.add('copied')
            label.textContent = 'Copied!'
            ;(button as HTMLButtonElement).disabled = true
            setTimeout(() => {
              button.classList.remove('copied')
              label.textContent = 'Copy code'
              ;(button as HTMLButtonElement).disabled = false
            }, 1500)
          }
        }).catch(() => {
          // 忽略失败，不弹出全局提示，保持 ChatGPT 行为
        })
      }
    }
  })
  return rendered
}

// 默认厂商列表
const defaultProviders: LLMModel[] = [
  { providerName: 'chatgpt', displayName: 'ChatGPT', keys: [], keyCount: 0, activeKeyCount: 0 },
  { providerName: 'grok', displayName: 'Grok', keys: [], keyCount: 0, activeKeyCount: 0 },
  { providerName: 'claude', displayName: 'Claude', keys: [], keyCount: 0, activeKeyCount: 0 },
  { providerName: 'gemini', displayName: 'Gemini', keys: [], keyCount: 0, activeKeyCount: 0 },
  { providerName: 'wenxin', displayName: '文心一言', keys: [], keyCount: 0, activeKeyCount: 0 },
  { providerName: 'moonshot', displayName: '月之暗面', keys: [], keyCount: 0, activeKeyCount: 0 },
  { providerName: 'qwen', displayName: '通义千问', keys: [], keyCount: 0, activeKeyCount: 0 },
  { providerName: 'deepseek', displayName: 'DeepSeek', keys: [], keyCount: 0, activeKeyCount: 0 }
]

// 会话表单
const sessionForm = reactive({
  title: '',
  provider: '',
  modelName: '',
  keyId: null as number | null
})

// 表单验证规则
const sessionFormRules = {
  title: [{ required: true, message: t('chatInterface.pleaseEnterChatTitle'), trigger: 'blur' }],
  provider: [{ required: true, message: t('chatInterface.pleaseSelectProvider'), trigger: 'change' }],
  modelName: [{ required: true, message: t('chatInterface.pleaseSelectModel'), trigger: 'change' }],
  keyId: [{ required: true, message: t('chatInterface.pleaseSelectKey'), trigger: 'change' }]
}

// 计算属性
const currentSession = computed(() => {
  return sessions.value.find(s => s.id === currentSessionId.value) || null
})

// 加载消息列表
const loadMessages = async (sessionId: number, reset = false) => {
  if (messageLoading.value || (!messageHasMore.value && !reset)) return

  try {
    messageLoading.value = true
    if (reset) {
      messagePage.value = 1
      messageHasMore.value = true
    }

    const result = await getAiChatMessages(sessionId, {
      pageNum: messagePage.value,
      pageSize: 20
    })

    if (reset) {
      // 按createTime从小到大排序，然后确保每对对话中assistant在前，user在后
      const sortedRecords = result.records.sort((a, b) => {
        // 首先按createTime从小到大排序
        const timeA = new Date(a.createTime).getTime()
        const timeB = new Date(b.createTime).getTime()
        if (timeA !== timeB) {
          return timeA - timeB // 从小到大
        }

        // 如果createTime相同，assistant排在前面
        if (a.role === 'assistant' && b.role === 'user') return -1
        if (a.role === 'user' && b.role === 'assistant') return 1
        return 0
      })
      currentMessages.value = sortedRecords
    } else {
      // 新消息插入到开头（因为是上滑加载历史消息）
      // 按createTime从小到大排序，同样确保assistant在user前面
      const sortedRecords = result.records.sort((a, b) => {
        const timeA = new Date(a.createTime).getTime()
        const timeB = new Date(b.createTime).getTime()
        if (timeA !== timeB) {
          return timeA - timeB // 从小到大
        }

        if (a.role === 'assistant' && b.role === 'user') return -1
        if (a.role === 'user' && b.role === 'assistant') return 1
        return 0
      })
      currentMessages.value.unshift(...sortedRecords)
    }

    messageHasMore.value = result.records.length === 20
    if (messageHasMore.value) {
      messagePage.value++
    }
  } catch (error) {
    console.error('加载消息列表失败:', error)
    ElMessage.error(t('chatInterface.loadMessagesFailed'))
  } finally {
    messageLoading.value = false
  }
}

// 可用模型列表
const availableModels = computed(() => {
  const provider = availableProviders.value.find(p => p.providerName === sessionForm.provider)
  if (!provider) return []

  // 根据厂商返回对应的模型列表
  const modelMap: Record<string, Array<{name: string, description: string}>> = {
    'moonshot': [
      { name: 'moonshot-v1-8k', description: '8K上下文' },
      { name: 'moonshot-v1-32k', description: '32K上下文' },
      { name: 'moonshot-v1-128k', description: '128K上下文' }
    ],
    'chatgpt': [
      { name: 'gpt-3.5-turbo', description: 'GPT-3.5 Turbo' },
      { name: 'gpt-4', description: 'GPT-4' },
      { name: 'gpt-4-turbo', description: 'GPT-4 Turbo' }
    ],
    'claude': [
      { name: 'claude-3-sonnet', description: 'Claude 3 Sonnet' },
      { name: 'claude-3-opus', description: 'Claude 3 Opus' },
      { name: 'claude-3-haiku', description: 'Claude 3 Haiku' }
    ],
    'gemini': [
      { name: 'gemini-pro', description: 'Gemini Pro' },
      { name: 'gemini-pro-vision', description: 'Gemini Pro Vision' }
    ],
    'wenxin': [
      { name: 'ernie-bot', description: '文心一言' },
      { name: 'ernie-bot-turbo', description: '文心一言 Turbo' }
    ],
    'qwen': [
      { name: 'qwen-turbo', description: '通义千问 Turbo' },
      { name: 'qwen-plus', description: '通义千问 Plus' },
      { name: 'qwen-max', description: '通义千问 Max' }
    ],
    'deepseek': [
      { name: 'deepseek-chat', description: 'DeepSeek Chat' },
      { name: 'deepseek-coder', description: 'DeepSeek Coder' }
    ],
    'grok': [
      { name: 'grok-beta', description: 'Grok Beta' }
    ]
  }

  return modelMap[provider.providerName] || []
})

// 可用密钥列表
const availableKeys = computed(() => {
  const provider = availableProviders.value.find(p => p.providerName === sessionForm.provider)
  return provider?.keys?.filter(k => k.status === 'active') || []
})



// 格式化时间
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) { // 1分钟内
    return t('chatInterface.justNow')
  } else if (diff < 3600000) { // 1小时内
    return t('chatInterface.minutesAgo', { minutes: Math.floor(diff / 60000) })
  } else if (diff < 86400000) { // 1天内
    return t('chatInterface.hoursAgo', { hours: Math.floor(diff / 3600000) })
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
const loadSessions = async (reset = false) => {
  if (sessionLoading.value || (!sessionHasMore.value && !reset)) return

  try {
    sessionLoading.value = true
    if (reset) {
      sessionPage.value = 1
      sessionHasMore.value = true
    }

    const result = await getAiChatSessions({
      pageNum: sessionPage.value,
      pageSize: 10
    })

    if (reset) {
      sessions.value = result.records
    } else {
      sessions.value.push(...result.records)
    }

    sessionHasMore.value = result.records.length === 10
    if (sessionHasMore.value) {
      sessionPage.value++
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
    ElMessage.error(t('chatInterface.loadSessionsFailed'))
  } finally {
    sessionLoading.value = false
  }
}

// 加载可用厂商
const loadAvailableProviders = async () => {
  try {
    const result = await getLLMModels()
    // 合并API返回的数据和默认厂商列表
    const mergedProviders = [...defaultProviders]
    result.forEach(apiProvider => {
      const index = mergedProviders.findIndex(p => p.providerName === apiProvider.providerName)
      if (index >= 0) {
        mergedProviders[index] = apiProvider
      } else {
        mergedProviders.push(apiProvider)
      }
    })
    availableProviders.value = mergedProviders
  } catch (error) {
    console.error('加载厂商列表失败:', error)
    // 即使接口失败，也使用默认厂商列表
    availableProviders.value = [...defaultProviders]
  }
}

// 选择会话
const handleSelectSession = async (session: AiChatSession) => {
  currentSessionId.value = session.id
  // 重置消息状态并加载消息
  currentMessages.value = []
  await loadMessages(session.id, true)
  scrollToBottom()
}

// 新建会话
const handleCreateSession = async () => {
  // 加载厂商列表
  await loadAvailableProviders()
  resetSessionForm()
  sessionDialogVisible.value = true
}

// 处理厂商变更
const handleProviderChange = () => {
  sessionForm.modelName = ''
  sessionForm.keyId = null
}

// 创建会话提交
const handleCreateSessionSubmit = async () => {
  if (!sessionFormRef.value) return

  try {
    await sessionFormRef.value.validate()
    submitting.value = true

    if (!sessionForm.keyId) {
      ElMessage.error(t('chatInterface.pleaseSelectKeyValidation'))
      return
    }

    // 调用创建对话接口
    await createAiChatSession({
      title: sessionForm.title,
      keyId: sessionForm.keyId,
      modelName: sessionForm.modelName
    })

    ElMessage.success(t('chatInterface.chatCreateSuccess'))
    sessionDialogVisible.value = false
    await loadSessions(true)

    // 自动选择第一个会话
    if (sessions.value.length > 0) {
      currentSessionId.value = sessions.value[0].id
      await loadMessages(sessions.value[0].id, true)
      scrollToBottom()
    }
  } catch (error) {
    console.error('创建对话失败:', error)
    ElMessage.error(t('chatInterface.chatCreateFailed'))
  } finally {
    submitting.value = false
  }
}

// 删除会话
const handleDeleteSession = async (session: AiChatSession) => {
  try {
    await ElMessageBox.confirm(
      t('chatInterface.confirmDeleteSession', { title: session.title }),
      t('chatInterface.deleteConfirm'),
      {
        confirmButtonText: t('chatInterface.confirm'),
        cancelButtonText: t('chatInterface.cancel'),
        type: 'warning'
      }
    )

    await deleteAiChatSession([session.id])
    ElMessage.success(t('chatInterface.sessionDeleteSuccess'))

    // 如果删除的是当前会话，清空选择
    if (currentSessionId.value === session.id) {
      currentSessionId.value = null
      currentMessages.value = []
    }

    // 重新加载会话列表，确保左侧会话记录及时更新
    await loadSessions(true)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会话失败:', error)
      ElMessage.error(t('chatInterface.sessionDeleteFailed'))
    }
  }
}

// 清空对话
const handleClearMessages = async () => {
  if (!currentSession.value) {
    ElMessage.error(t('chatInterface.pleaseSelectSession'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('chatInterface.confirmClearMessages'),
      t('chatInterface.clearConfirm'),
      {
        confirmButtonText: t('chatInterface.confirm'),
        cancelButtonText: t('chatInterface.cancel'),
        type: 'warning'
      }
    )

    // 调用清空对话接口
    await clearAiChatSession(currentSession.value.id)

    // 清空本地消息列表
    currentMessages.value = []
    ElMessage.success(t('chatInterface.chatCleared'))
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空对话失败:', error)
      ElMessage.error(t('chatInterface.clearChatFailed'))
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
  const userMessage: AiChatMessage = {
    id: Date.now(),
    sessionId: currentSession.value.id,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
    userId: 1,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  }

  currentMessages.value.push(userMessage)
  scrollToBottom()

  // 创建AI回复消息占位符
  const assistantMessage: AiChatMessage = {
    id: Date.now() + 1,
    sessionId: currentSession.value.id,
    role: 'assistant',
    content: '',
    timestamp: new Date().toISOString(),
    userId: 1,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  }

  currentMessages.value.push(assistantMessage)
  const messageIndex = currentMessages.value.length - 1
  isLoading.value = true

  try {
    // 使用流式对话接口
    const streamRequest: StreamChatRequest = {
      sessionId: currentSession.value.id,
      content: message
    }

    // 根据MCP开关选择不同的流接口
    const streamFunction = mcpEnabled.value ? streamIntelligentAiChat : streamAiChat

    await streamFunction(
      streamRequest,
      // onMessage: 接收流式数据
      (chunk: string) => {
        if (messageIndex < currentMessages.value.length) {
          currentMessages.value[messageIndex].content += chunk
          scrollToBottom()
        }
      },
      // onComplete: 流式传输完成
      () => {
        isLoading.value = false
        scrollToBottom()
      },
      // onError: 错误处理
      (error: Error) => {
        console.error(mcpEnabled.value ? '智能流式对话失败:' : '流式对话失败:', error)
        ElMessage.error(t('chatInterface.sendMessageFailed'))
        isLoading.value = false
        // 移除失败的消息
        if (messageIndex < currentMessages.value.length) {
          currentMessages.value.splice(messageIndex, 1)
        }
      }
    )
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error(t('chatInterface.sendMessageFailed'))
    isLoading.value = false
    // 移除失败的消息
    if (messageIndex < currentMessages.value.length) {
      currentMessages.value.splice(messageIndex, 1)
    }
  }
}



// 重置会话表单
const resetSessionForm = () => {
  Object.assign(sessionForm, {
    title: '',
    provider: '',
    modelName: '',
    keyId: null
  })
  sessionFormRef.value?.clearValidate()
}

// 会话列表滚动事件
const handleSessionScroll = () => {
  if (!sessionListRef.value) return

  const { scrollTop, scrollHeight, clientHeight } = sessionListRef.value
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    loadSessions()
  }
}

// 消息列表滚动事件
const handleMessageScroll = () => {
  if (!messageListRef.value) return

  const { scrollTop } = messageListRef.value
  if (scrollTop <= 10 && currentSession.value) {
    loadMessages(currentSession.value.id)
  }
}

// 初始化
onMounted(async () => {
  await loadSessions(true)
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
      color: var(--text-primary);
      margin: 0 0 8px 0;
    }

    .page-description {
      color: var(--text-regular);
      margin: 0;
    }
  }

  .chat-container {
    display: flex;
    height: calc(100% - 80px);
    background: var(--bg-color);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .session-sidebar {
    width: 300px;
    border-right: 1px solid var(--border-light);
    display: flex;
    flex-direction: column;

    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        color: var(--text-primary);
      }
    }

    .session-list {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */

    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }

    .session-item {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-extra-light);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s;

        &:hover {
          background-color: var(--bg-color-overlay);
        }

        &.active {
          background-color: rgba(64, 158, 255, 0.12);
          border-left: 3px solid #409eff;
        }

        .session-info {
          flex: 1;
          min-width: 0;

          .session-title {
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .session-model {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 2px;
          }

          .session-time {
            font-size: 11px;
            color: var(--text-placeholder);
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
      border-bottom: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: center;

      .session-info {
        display: flex;
        align-items: center;
        gap: 12px;

        h3 {
          margin: 0;
          color: var(--text-primary);
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;

        .mcp-switch {
          display: flex;
          align-items: center;

          .switch-label {
            font-size: 14px;
            color: var(--text-regular);
            white-space: nowrap;
          }
        }
      }
    }

    .message-list {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */

      &::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }

      .loading-more {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        color: var(--text-secondary);
        font-size: 12px;

        .loading-icon {
          margin-right: 8px;
          animation: spin 1s linear infinite;
        }
      }

      .message-item {
        display: flex;
        margin-bottom: 20px;
        align-items: flex-start;
        gap: 12px;

        &.user {
          flex-direction: row-reverse;

          .message-content {
            background-color: var(--el-color-primary-light-9);
            color: var(--text-primary);
            margin-right: 0;
            border-radius: 20px 20px 4px 20px;
            border: 1px solid var(--el-color-primary-light-8);

            .dark & {
               background-color: #2c2c2c;
               border-color: #3c3c3c;
               color: #e0e0e0;
            }

            .message-time {
              color: var(--text-secondary);
              text-align: right;
            }
          }
        }

        &.assistant {
          width: 100%;

          .message-content {
            background-color: transparent !important;
            box-shadow: none !important;
            padding: 0 16px;
            max-width: 100%;
            width: 100%;
            margin-left: 0;

            .message-text {
                font-size: 16px;
                line-height: 1.7;
            }
          }
        }

        .message-avatar {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .message-content {
          max-width: calc(100% - 80px);
          width: fit-content;
          padding: 12px 16px;
          border-radius: 12px;
          box-sizing: border-box;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          position: relative;

          .message-text {
            line-height: 1.6;
            word-wrap: break-word;
            word-break: break-word;
            overflow-wrap: break-word;
            white-space: pre-wrap;

            .loading-icon {
              animation: spin 1s linear infinite;
            }

            .thinking-animation {
              display: inline-flex;
              align-items: center;
              margin-right: 8px;

              .dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background-color: #409eff;
                margin: 0 2px;
                animation: thinking 1.4s infinite ease-in-out;

                &:nth-child(1) {
                  animation-delay: -0.32s;
                }

                &:nth-child(2) {
                  animation-delay: -0.16s;
                }

                &:nth-child(3) {
                  animation-delay: 0s;
                }
              }
            }

            .thinking-text {
              color: var(--text-secondary);
              font-size: 14px;
            }

            &.typing-effect::after {
              content: '|';
              animation: blink 1s infinite;
              color: #409eff;
              font-weight: bold;
            }
          }

          .markdown-content {
            line-height: 1.7;
            font-size: 16px;
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;

            // 重置所有元素的默认边距
            * {
              margin: 0;
              padding: 0;
            }

            // 标题样式
            h1, h2, h3, h4, h5, h6 {
              margin: 24px 0 16px 0;
              font-weight: 600;
              line-height: 1.3;
              color: var(--text-primary);

              &:first-child {
                margin-top: 0;
              }
            }
            h1 { font-size: 1.75em; padding-bottom: 0.3em; border-bottom: 1px solid var(--border-light); }
            h2 { font-size: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid var(--border-light); }
            h3 { font-size: 1.25em; }
            h4 { font-size: 1.1em; }
            h5 { font-size: 1em; }
            h6 { font-size: 0.9em; color: var(--text-secondary); }

            // 段落
            p {
              margin: 16px 0;
              white-space: pre-wrap;

              &:first-child {
                margin-top: 0;
              }

              &:last-child {
                margin-bottom: 0;
              }
            }

            // 列表样式优化
            ul, ol {
              margin: 16px 0;
              padding-left: 24px;
              list-style-position: outside;

              &:first-child {
                margin-top: 0;
              }

              &:last-child {
                margin-bottom: 0;
              }
            }

            ul {
              list-style-type: disc;
            }

            ol {
              list-style-type: decimal;
            }

            li {
              margin: 8px 0;
              line-height: 1.7;

              // 嵌套列表
              ul, ol {
                margin: 8px 0 8px 24px;
              }
            }

            // 引用块
            blockquote {
              margin: 16px 0;
              padding: 8px 16px;
              border-left: 4px solid var(--border-light);
              color: var(--text-secondary);
              background: transparent;

              p {
                margin: 0;
              }
            }

            // 行内代码
            code:not(.hljs) {
              background-color: rgba(175, 184, 193, 0.2);
              color: var(--text-primary);
              padding: 0.2em 0.4em;
              border-radius: 6px;
              font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
              font-size: 0.85em;
            }

            // 代码块
            .hljs-code-block {
              margin: 16px 0;
              border-radius: 8px;
              overflow: hidden;
              background-color: #0d1117; // Dark background for code blocks standard
              color: #c9d1d9;
              position: relative;
              font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;

              .dark & {
                 border: 1px solid var(--border-light);
              }

              .code-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background-color: #161b22;
                color: #8b949e;
                font-size: 12px;
                user-select: none;
                border-bottom: 1px solid #30363d;
              }

              .code-lang {
                font-weight: 600;
                text-transform: uppercase;
              }

              .copy-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: transparent;
                border: none;
                color: #8b949e;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: all 0.2s ease;
                font-size: 12px;

                &:hover {
                  background-color: rgba(177, 186, 196, 0.12);
                  color: #c9d1d9;
                }

                &.copied {
                  color: #3fb950;

                  svg {
                    stroke: #3fb950;
                  }
                }

                svg {
                  width: 14px;
                  height: 14px;
                }
              }

              pre {
                margin: 0;
                padding: 16px;
                overflow-x: auto;
                background: transparent;

                code {
                  background: none;
                  padding: 0;
                  border-radius: 0;
                  color: inherit;
                  font-family: inherit;
                  font-size: 14px;
                  line-height: 1.5;
                  white-space: pre;
                }
              }
            }

            // 表格容器（关键修复：支持横向滚动）
            .table-container {
              width: 100%;
              overflow-x: auto;
              margin: 20px 0;
              border-radius: 8px;
              border: 1px solid var(--border-light);
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);

              table {
                margin: 0;
                border: none;
                border-radius: 0;
                box-shadow: none;
                width: 100%;
                min-width: max-content; // 确保内容不换行，触发滚动
              }
            }

            // 表格样式
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
              line-height: 1.5;

              thead {
                background-color: var(--bg-color-overlay);
                border-bottom: 2px solid var(--border-light);
              }

              th, td {
                padding: 12px 16px;
                text-align: left;
                border-bottom: 1px solid var(--border-light);
                border-right: 1px solid var(--border-light);

                &:last-child {
                  border-right: none;
                }
              }

              th {
                font-weight: 600;
                color: var(--text-primary);
              }

              td {
                color: var(--text-regular);
              }

              tr:last-child td {
                border-bottom: none;
              }

              // 隔行变色
              tbody tr:nth-child(even) {
                 background-color: var(--bg-color-page);
              }
            }

            // 链接
            a {
              color: #0969da;
              text-decoration: none;

              &:hover {
                text-decoration: underline;
              }
            }

            // 图片
            img {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              margin: 16px 0;
            }

            // 分割线
            hr {
              height: 1px;
              background-color: var(--border-light);
              border: none;
              margin: 24px 0;
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
      border-top: 1px solid var(--border-light);

      .input-container {
        .input-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;

          .input-tip {
            font-size: 12px;
            color: var(--text-secondary);
          }
        }
      }
    }
  }

  .session-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    color: var(--text-secondary);
    font-size: 12px;

    .loading-icon {
      margin-right: 8px;
      animation: spin 1s linear infinite;
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
      color: var(--text-secondary);
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

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

@keyframes thinking {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
