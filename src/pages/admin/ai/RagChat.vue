<template>
  <div class="rag-chat-interface" style="height: calc(100vh - 90px);">
    <div class="chat-container">
      <!-- 左侧会话列表 -->
      <div class="session-sidebar">
        <div class="sidebar-header">
          <h3>RAG对话</h3>
          <el-button
            type="primary"
            size="small"
            @click="handleCreateSession"
            :loading="sessionLoading"
          >
            新建对话
          </el-button>
        </div>

        <div class="session-list" ref="sessionListRef" @scroll="handleSessionScroll">
          <template v-for="session in sessions" :key="session?.id || Math.random()">
            <div
              v-if="session"
              :class="['session-item', { active: currentSessionId === session.id }]"
              @click="handleSelectSession(session)"
            >
              <div class="session-info">
                <div class="session-title">{{ session.title || '未命名对话' }}</div>
                <div class="session-model">{{ session.modelName || '未知模型' }}</div>
                <div class="session-time">{{ session.createTime ? formatTime(session.createTime) : '未知时间' }}</div>
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
          </template>

          <!-- 会话加载提示 -->
          <div v-if="sessionLoading" class="session-loading">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>加载更多会话...</span>
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
          <div class="message-list" ref="messageListRef" @scroll="handleMessageScroll">
            <!-- 历史消息加载提示 -->
            <div v-if="messageLoading && messagePage > 1" class="loading-more">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>加载更多消息...</span>
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
                  <span class="thinking-text">AI正在思考中...</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import {
  Delete,
  User,
  Loading,
  Promotion
} from '@element-plus/icons-vue'
import {
  getLLMModels
} from '@/api'
import { getAiChatSessions, getAiChatMessages, deleteAiChatSession, createAiChatSession, clearAiChatSession } from '@/api/aiChat'
import type { AiChatSession, AiChatMessage, StreamChatRequest } from '@/api/aiChat'
import { getBaseURL } from '@/utils/env'
import { useUserStore } from '@/stores/user'

// 响应式数据
const isLoading = ref(false)
const messageListRef = ref<HTMLElement>()
const sessionListRef = ref<HTMLElement>()

const sessions = ref<AiChatSession[]>([])
const currentSessionId = ref<string | number | null>(null)
const inputMessage = ref('')
const sessionLoading = ref(false)
const sessionPage = ref(1)
const sessionHasMore = ref(true)
const messageLoading = ref(false)
const messagePage = ref(1)
const messageHasMore = ref(true)
const currentMessages = ref<AiChatMessage[]>([])

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

// 计算属性
const currentSession = computed(() => {
  return sessions.value.find(s => s && s.id === currentSessionId.value) || null
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
    ElMessage.error('加载消息列表失败')
  } finally {
    messageLoading.value = false
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
      pageSize: 10,
      type: 2  // RAG对话类型
    })

    if (reset) {
      sessions.value = result.records || []
    } else {
      sessions.value.push(...(result.records || []))
    }

    sessionHasMore.value = (result.records || []).length === 10
    if (sessionHasMore.value) {
      sessionPage.value++
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
    ElMessage.error('加载会话列表失败')
  } finally {
    sessionLoading.value = false
  }
}

// 选择会话
const handleSelectSession = async (session: AiChatSession) => {
  try {
    currentSessionId.value = session.id
    // 重置消息状态并加载消息
    currentMessages.value = []
    messagePage.value = 1
    messageHasMore.value = true
    await loadMessages(session.id, true)
    scrollToBottom()
  } catch (error) {
    console.error('选择会话失败:', error)
    ElMessage.error('选择会话失败')
  }
}

// 新建会话 - 直接调用接口，传递type=2参数
const handleCreateSession = async () => {
  try {
    // 获取第一个可用的厂商和模型
    const providers = await getLLMModels()
    if (!providers || providers.length === 0) {
      ElMessage.error('没有可用的AI模型厂商')
      return
    }

    // 找到第一个有可用密钥的厂商
    const availableProvider = providers.find(p => p.keys && p.keys.length > 0 && p.keys.some(k => k.status === 'active'))
    if (!availableProvider) {
      ElMessage.error('没有可用的AI模型密钥')
      return
    }

    // 获取第一个可用的密钥
    const availableKey = availableProvider.keys.find(k => k.status === 'active')
    if (!availableKey) {
      ElMessage.error('没有可用的AI模型密钥')
      return
    }

    // 根据厂商获取默认模型
    const getDefaultModel = (providerName: string) => {
      const modelMap: Record<string, string> = {
        'moonshot': 'moonshot-v1-8k',
        'chatgpt': 'qwen-max',
        'claude': 'claude-3-sonnet',
        'gemini': 'gemini-pro',
        'wenxin': 'ernie-bot',
        'qwen': 'qwen-turbo',
        'deepseek': 'deepseek-chat',
        'grok': 'grok-beta'
      }
      return modelMap[providerName] || 'default-model'
    }

    const defaultModel = getDefaultModel(availableProvider.providerName)

    // 创建会话，传递type=2参数
    const sessionData = {
      title: `RAG对话 ${new Date().toLocaleString()}`,
      keyId: availableKey.id,
      modelName: defaultModel,
      type: 2  // RAG对话类型
    }

    await createAiChatSession(sessionData)

    // 重新查询会话列表以获取最新数据
    await loadSessions(true)

    // 选择第一个会话（最新创建的会话）
    if (sessions.value.length > 0) {
      await handleSelectSession(sessions.value[0])
    }

    ElMessage.success('创建RAG对话会话成功')
  } catch (error) {
    console.error('创建会话失败:', error)
    ElMessage.error('创建会话失败')
  }
}

// 删除会话
const handleDeleteSession = async (session: AiChatSession) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除会话"${session.title}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteAiChatSession([session.id])

    // 从列表中移除
    const index = sessions.value.findIndex(s => s.id === session.id)
    if (index >= 0) {
      sessions.value.splice(index, 1)
    }

    // 如果删除的是当前会话，清空当前会话
    if (currentSessionId.value === session.id) {
      currentSessionId.value = null
      currentMessages.value = []
    }

    ElMessage.success('删除会话成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会话失败:', error)
      ElMessage.error('删除会话失败')
    }
  }
}

// 清空对话
const handleClearMessages = async () => {
  if (!currentSession.value) {
    ElMessage.error('请先选择一个对话会话')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要清空当前对话的所有消息吗？',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 调用清空对话接口
    await clearAiChatSession(currentSession.value.id)

    // 清空本地消息列表
    currentMessages.value = []
    ElMessage.success('清空对话成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空对话失败:', error)
      ElMessage.error('清空对话失败')
    }
  }
}

// RAG流式对话
const streamRagChat = async (
  data: StreamChatRequest,
  onMessage: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    // 调用RAG流式对话API
    const userStore = useUserStore()
    const token = userStore.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    const response = await fetch(`${getBaseURL()}/api/v1/chat/rag/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('Stream not supported')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed === '') continue
          if (!trimmed.startsWith('data:')) continue

          // 取出 data: 之后的内容，并兼容同一行包含多个 data:
          const combined = trimmed.slice(5).trimStart()
          const segments = combined
            .split(/\s*data:\s*/)
            .map(s => s.trim())
            .filter(s => s.length > 0)

          for (const seg of segments) {
            if (seg === '[DONE]') {
              onComplete?.()
              return
            }

            const normalized = seg.replace(/[""]/g, '"')
            try {
              const parsed = JSON.parse(normalized)
              // 兼容三种返回格式：
              // 1) { content: string, finished?: boolean }
              // 2) OpenAI风格 { choices: [{ delta: { content: string } }] }
              // 3) { type: 'message', data: string }
              if (typeof parsed.content === 'string' && parsed.content.length > 0) {
                onMessage(parsed.content)
              } else if (parsed.choices && parsed.choices[0]?.delta?.content) {
                onMessage(parsed.choices[0].delta.content)
              } else if (typeof parsed.data === 'string' && parsed.data.length > 0) {
                onMessage(parsed.data)
              }

              if (parsed.finished === true) {
                onComplete?.()
                return
              }
            } catch {
              // 兜底：从非标准JSON中提取content或data字段，或直接输出纯文本
              const matchContent = normalized.match(/\"content\"\s*:\s*\"([\s\S]*?)\"/)
              if (matchContent && matchContent[1] && matchContent[1].length > 0) {
                onMessage(matchContent[1])
              } else {
                const matchData = normalized.match(/\"data\"\s*:\s*\"([\s\S]*?)\"/)
                if (matchData && matchData[1] && matchData[1].length > 0) {
                  onMessage(matchData[1])
                } else if (normalized && normalized !== '[DONE]') {
                  // 纯文本数据（如：你好啊）
                  onMessage(normalized)
                }
              }
            }
          }
        }
      }
      onComplete?.()
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    console.error('RAG流式对话失败:', error)
    onError?.(error as Error)
    throw error
  }
}

// 发送消息
const handleSendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value || !currentSession.value) {
    return
  }

  const message = inputMessage.value.trim()
  inputMessage.value = ''
  isLoading.value = true

  try {
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

    // 添加AI消息占位符
    const aiMessage: AiChatMessage = {
      id: Date.now() + 1,
      sessionId: currentSession.value.id,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      userId: 1,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    currentMessages.value.push(aiMessage)

    scrollToBottom()

    // 调用RAG流式对话
    await streamRagChat(
      {
        sessionId: currentSession.value.id,
        content: message
      },
      (chunk: string) => {
        // 更新AI消息内容
        const lastMessage = currentMessages.value[currentMessages.value.length - 1]
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content += chunk
        }
        scrollToBottom()
      },
      () => {
        // 对话完成
        isLoading.value = false
        scrollToBottom()
      },
      (error: Error) => {
        // 对话出错
        console.error('RAG对话失败:', error)
        ElMessage.error('RAG对话失败')
        isLoading.value = false

        // 移除失败的AI消息
        if (currentMessages.value.length > 0 && currentMessages.value[currentMessages.value.length - 1].role === 'assistant') {
          currentMessages.value.pop()
        }
      }
    )
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
    isLoading.value = false

    // 移除失败的消息
    if (currentMessages.value.length > 0 && currentMessages.value[currentMessages.value.length - 1].role === 'assistant') {
      currentMessages.value.pop()
    }
  }
}

// 会话列表滚动处理
const handleSessionScroll = () => {
  if (!sessionListRef.value) return

  const { scrollTop, scrollHeight, clientHeight } = sessionListRef.value
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    loadSessions()
  }
}

// 消息列表滚动处理
const handleMessageScroll = () => {
  if (!messageListRef.value || !currentSession.value) return

  const { scrollTop } = messageListRef.value
  if (scrollTop <= 10) {
    loadMessages(currentSession.value.id)
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadSessions(true)
})
</script>

<style scoped>
.rag-chat-interface {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-page);
}

.chat-container {
  flex: 1;
  display: flex;
  height: 100%;
  overflow: hidden;
}

.session-sidebar {
  width: 300px;
  background: var(--bg-color);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.session-item:hover {
  background-color: var(--bg-color-overlay);
}

.session-item.active {
  background-color: rgba(64, 158, 255, 0.12);
  border-color: #409eff;
}

.session-info {
  flex: 1;
  min-width: 0;
}

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
  font-size: 12px;
  color: var(--text-placeholder);
}

.session-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: var(--text-secondary);
}

.loading-icon {
  margin-right: 8px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-color);
}

.chat-header .session-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: var(--bg-color-page);
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: var(--text-secondary);
}

.message-item {
  display: flex;
  margin-bottom: 24px;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 12px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  min-width: 0;
}

.message-item.user .message-content {
  text-align: right;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
  line-height: 1.6;
}

.message-item.user .message-text {
  background: #409eff;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-item.assistant .message-text {
  background: var(--bg-color);
  border: 1px solid var(--border-light);
  border-bottom-left-radius: 4px;
  color: var(--text-primary);
}

.message-time {
  font-size: 12px;
  color: var(--text-placeholder);
  margin-top: 8px;
}

.message-item.user .message-time {
  text-align: right;
}

.thinking-animation {
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #409eff;
  margin: 0 2px;
  animation: thinking 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes thinking {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.thinking-text {
  color: var(--text-secondary);
  font-style: italic;
}

.input-area {
  padding: 16px 24px;
  background: var(--bg-color);
  border-top: 1px solid var(--border-light);
}

.input-container {
  max-width: 100%;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.input-tip {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Markdown样式 */
.markdown-content {
  line-height: 1.6;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin: 16px 0 8px 0;
  font-weight: 600;
}

.markdown-content p {
  margin: 8px 0;
}

.markdown-content ul,
.markdown-content ol {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-content li {
  margin: 4px 0;
}

.markdown-content blockquote {
  margin: 16px 0;
  padding: 8px 16px;
  background: var(--bg-color-overlay);
  border-left: 4px solid #409eff;
  color: var(--text-regular);
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid var(--border-light);
  padding: 8px 12px;
  text-align: left;
}

.markdown-content th {
  background: var(--bg-color-overlay);
  font-weight: 600;
}

/* 代码块样式 */
.hljs-code-block {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-color-overlay);
  border: 1px solid var(--border-light);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-color-overlay);
  border-bottom: 1px solid var(--border-light);
  font-size: 12px;
}

.code-lang {
  color: var(--text-regular);
  font-weight: 500;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-regular);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: var(--bg-color-overlay);
  border-color: var(--border-base);
}

.copy-btn.copied {
  color: #1a7f37;
  border-color: #1a7f37;
}

.copy-btn svg {
  width: 14px;
  height: 14px;
}

.hljs-code-block code {
  display: block;
  padding: 16px;
  background: transparent;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
  line-height: 1.45;
  overflow-x: auto;
}

/* 行内代码样式 */
.markdown-content code:not(.hljs) {
  background: var(--bg-color-overlay);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  color: #d73a49;
}

/* 打字机效果 */
.typing-effect {
  position: relative;
}

.typing-effect::after {
  content: '|';
  animation: blink 1s infinite;
  color: #409eff;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
