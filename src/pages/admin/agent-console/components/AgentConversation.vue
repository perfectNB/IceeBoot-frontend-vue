<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatLineSquare, CircleCheck, Clock, Cpu, Plus, Promotion, Search, User, VideoPause, ArrowDown } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import { agentConsole, type AgentView, type AgentSession, type AgentMessage, type AgentProgress } from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'
const props = defineProps<{ agent: AgentView }>()
const sessions = ref<AgentSession[]>([])
const current = ref<AgentSession>()
const messages = ref<AgentMessage[]>([])
const input = ref('')
const traces = ref<Record<string, AgentProgress[]>>({})
const traceErrors = ref<Record<string, string>>({})
const traceLoading = ref<Record<string, boolean>>({})
const liveRunId = ref('')
const elapsed = ref(0)
const stopping = ref(false)
const streamError = ref('')
let streamController: AbortController | undefined
let elapsedTimer: ReturnType<typeof setInterval> | undefined
let flushTimer: ReturnType<typeof setTimeout> | undefined
let flushStreaming = () => {}
let optimisticId = -1
const phase = ref('正在建立连接')
function eventTime(timestamp: number) { return new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false }) }
function eventFailed(event: AgentProgress) { return ['FAILED', 'ERROR', 'DENIED', 'CANCELLED', 'TIMED_OUT'].includes(event.status) }
function showTrace(message: AgentMessage) {
  return Boolean(message.runId && (traces.value[message.runId]?.length || hasPermission('ai:session:events:api')))
}
async function loadTrace(message: AgentMessage, event?: Event, refresh = false) {
  if (event && !(event.target as HTMLDetailsElement).open) return
  if (!hasPermission('ai:session:events:api')) return
  if (!message.runId || traceLoading.value[message.runId] || (!refresh && traces.value[message.runId]?.length)) return
  const token = generation
  traceLoading.value[message.runId] = true
  traceErrors.value[message.runId] = ''
  try {
    const rows = await agentConsole.progress(agentId(), current.value!.sessionId, message.runId)
    if (alive && token === generation) traces.value[message.runId] = rows
  } catch { if (alive && token === generation) traceErrors.value[message.runId] = '过程加载失败，收起后展开可重试' }
  finally { if (alive) traceLoading.value[message.runId] = false }
}
async function stop() {
  if ((!sending.value && !pending.value) || stopping.value) return
  stopping.value = true
  try {
    const runId = sending.value ? liveRunId.value : messages.value.find(message => message.status === 'RUNNING')?.runId
    if (runId) await agentConsole.cancelRun(runId)
    else streamController?.abort()
    phase.value = '正在停止执行'
  } catch { ElMessage.error('停止失败，请重试') }
  finally { if (alive) stopping.value = false }
}
const sessionQuery = ref('')
const visibleSessions = computed(() => {
  const query = sessionQuery.value.trim().toLowerCase()
  return sessions.value.filter(session => session.title.toLowerCase().includes(query))
})
const markdown = new MarkdownIt({ html: false, breaks: true, linkify: true }).disable('image')
markdown.renderer.rules.link_open = (tokens, index, options, _env, self) => {
  tokens[index]!.attrSet('target', '_blank')
  tokens[index]!.attrSet('rel', 'noopener noreferrer')
  return self.renderToken(tokens, index, options)
}
function renderMarkdown(content: string) { return markdown.render(content) }
const displayMessages = computed(() => messages.value.map(message => ({
  ...message,
  html: message.role === 'assistant' && message.content ? renderMarkdown(message.content) : '',
})))
function messageTime(value: string) {
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function sessionDate(value: string) {
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  const today = new Date()
  const day = date.toDateString() === today.toDateString() ? '今天' : date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  return `${day} ${messageTime(value)}`
}
const loading = ref(false), sending = ref(false), failed = ref(false), creating = ref(false)
const moreSessions = ref(false), moreMessages = ref(false)
const thread = ref<HTMLElement>()
const statusLabels: Record<string, string> = { RUNNING: '处理中', FAILED: '执行失败', CANCELLED: '已取消', TIMED_OUT: '执行超时', INTERRUPTED: '执行已中断' }
const pending = computed(() => messages.value.some(message => message.status === 'RUNNING'))
let poll: ReturnType<typeof setTimeout> | undefined
let generation = 0, alive = true
function scheduleRefresh() {
  clearTimeout(poll)
  if (!alive || !pending.value || !current.value || sending.value) return
  const token = generation
  poll = setTimeout(async () => {
    try {
      const rows = await agentConsole.messages(agentId(), current.value!.sessionId)
      if (alive && token === generation) { messages.value = rows; await bottom() }
    } catch { if (alive && token === generation) failed.value = true }
    if (alive && token === generation) scheduleRefresh()
  }, 2000)
}
onBeforeUnmount(() => {
  alive = false; generation++; clearTimeout(poll); clearTimeout(flushTimer); clearInterval(elapsedTimer)
  streamController?.abort()
})
const agentId = () => props.agent.draft.id!
async function bottom(force = false) {
  const follow = force || !thread.value || thread.value.scrollHeight - thread.value.scrollTop - thread.value.clientHeight < 120
  await nextTick()
  if (follow) thread.value?.scrollTo({ top: thread.value.scrollHeight })
}
async function select(session: AgentSession) {
  if (sending.value) return
  const token = ++generation
  current.value = session
  messages.value = []
  traces.value = {}
  traceErrors.value = {}
  streamError.value = ''
  input.value = ''
  loading.value = true
  failed.value = false
  try {
    const rows = await agentConsole.messages(agentId(), session.sessionId)
    if (!alive || token !== generation) return
    messages.value = rows
    scheduleRefresh()
    moreMessages.value = rows.length === 100
    await bottom()
  } catch { if (alive && token === generation) failed.value = true }
  finally { if (alive && token === generation) loading.value = false }
}
async function loadSessions(append = false) {
  loading.value = true
  failed.value = false
  try {
    const rows = await agentConsole.sessions(agentId(), append ? sessions.value.length : 0)
    if (!alive) return
    sessions.value = append ? [...sessions.value, ...rows] : rows
    moreSessions.value = rows.length === 50
    current.value = rows.find(session => session.sessionId === current.value?.sessionId) || current.value
    if (!current.value && rows[0]) await select(rows[0])
  } catch { if (alive) failed.value = true }
  finally { if (alive) loading.value = false }
}
async function create() {
  if (sending.value || creating.value) return
  creating.value = true
  try {
    const session = await agentConsole.createSession(agentId())
    if (!alive) return
    sessions.value.unshift(session)
    sessionQuery.value = ''
    await select(session)
  } finally { if (alive) creating.value = false }
}
async function older() {
  if (!current.value || !messages.value[0]) return
  const token = generation
  loading.value = true
  try {
    const rows = await agentConsole.messages(agentId(), current.value.sessionId, messages.value[0].id)
    if (!alive || token !== generation) return
    messages.value = [...rows, ...messages.value]
    moreMessages.value = rows.length === 100
  } finally { if (alive && token === generation) loading.value = false }
}
async function send() {
  if (sending.value || loading.value || pending.value || failed.value || !input.value.trim()) return
  sending.value = true
  streamError.value = ''
  liveRunId.value = ''
  elapsed.value = 0
  phase.value = '正在建立连接'
  const token = generation
  const text = input.value
  const now = new Date().toISOString()
  const user: AgentMessage = { id: optimisticId--, runId: '', role: 'user', content: text, status: 'SUCCEEDED', createTime: now }
  const reply: AgentMessage = { id: optimisticId--, runId: '', role: 'assistant', content: '', status: 'RUNNING', createTime: now }
  messages.value.push(user, reply)
  await bottom(true)
  elapsedTimer = setInterval(() => { elapsed.value++ }, 1000)
  streamController = new AbortController()
  let buffer = ''
  const analysisBuffer = new Map<string, { event: AgentProgress; text: string }>()
  let terminal = false
  let streamedReply = ''
  const updateReply = (update: Partial<AgentMessage>) => {
    const row = messages.value.find(row => row.id === reply.id)
    if (row) Object.assign(row, update)
  }
  flushStreaming = () => {
    clearTimeout(flushTimer); flushTimer = undefined
    if (!alive || token !== generation) return
    const row = messages.value.find(row => row.id === reply.id)
    if (row && buffer) row.content += buffer
    buffer = ''
    for (const { event, text } of analysisBuffer.values()) {
      const rows = traces.value[event.rootRunId] ||= []
      let analysis = rows.find(row => row.type === 'REASONING_DELTA' && row.runId === event.runId && row.callId === event.callId)
      if (!analysis) { analysis = { ...event, text: '' }; rows.push(analysis) }
      analysis.text += text
    }
    analysisBuffer.clear()
    void bottom()
  }
  try {
    if (!current.value) {
      const session = await agentConsole.createSession(agentId(), text.slice(0, 120))
      if (!alive) return
      current.value = session
      sessions.value.unshift(session)
    }
    await agentConsole.invokeStream(props.agent.draft.code, text, current.value.sessionId, event => {
      if (!alive || token !== generation || event.type === 'HEARTBEAT') return
      if (event.rootRunId) {
        liveRunId.value = event.rootRunId
        updateReply({ runId: event.rootRunId })
        const userRow = messages.value.find(row => row.id === user.id)
        if (userRow) userRow.runId = event.rootRunId
      }
      if (event.type === 'RUN_STARTED' && !event.parentRunId) {
        input.value = ''
        if (current.value?.title === '新对话') current.value.title = text.slice(0, 120)
      }
      if (event.type === 'REASONING_DELTA') {
        const key = `${event.runId}:${event.callId}`
        const previous = analysisBuffer.get(key)
        analysisBuffer.set(key, { event: previous?.event || event, text: (previous?.text || '') + event.text })
        phase.value = event.title
        if (flushTimer === undefined) flushTimer = setTimeout(flushStreaming, 40)
        return
      }
      if (event.type === 'REASONING_FINISHED') {
        flushStreaming()
        const rows = traces.value[event.rootRunId] ||= []
        const index = rows.findIndex(row => row.type === 'REASONING_DELTA' && row.runId === event.runId && row.callId === event.callId)
        if (index >= 0) rows.splice(index, 1)
      }
      if (event.type === 'TEXT_DELTA') {
        phase.value = event.parentRunId ? `子智能体正在回复 · ${event.agentCode}` : '正在输出回复'
        if (!event.parentRunId) {
          if (streamedReply !== event.callId) { flushStreaming(); streamedReply = event.callId; updateReply({ content: '' }) }
          buffer += event.text
          if (flushTimer === undefined) flushTimer = setTimeout(flushStreaming, 40)
        } else {
          const rows = traces.value[event.rootRunId] ||= []
          let child = rows.find(row => row.type === 'TEXT_DELTA' && row.runId === event.runId)
          if (!child) { child = { ...event, title: `子智能体正在回复 · ${event.agentCode}`, text: '' }; rows.push(child) }
          child.text = (child.text + event.text).slice(0, 2000)
          phase.value = child.title
        }
        return
      }
      if (event.type === 'MODEL_STARTED' && !event.parentRunId) {
        flushStreaming(); streamedReply = event.callId; updateReply({ content: '' })
      }
      if (event.rootRunId) {
        const rows = traces.value[event.rootRunId] ||= []
        if (!rows.some(row => row.sequence === event.sequence)) rows.push(event)
      }
      phase.value = event.title
      if (event.type === 'RUN_FINISHED') {
        flushStreaming(); terminal = true
        updateReply({ content: event.text, status: 'SUCCEEDED' })
        input.value = ''
      } else if (event.type === 'ERROR') {
        flushStreaming(); terminal = true
        updateReply({ status: event.status || 'FAILED' })
        streamError.value = event.text
        input.value = text
      }
      void bottom()
    }, streamController.signal)
  } catch (error) {
    if (alive) {
      flushStreaming()
      input.value = text
      streamError.value = error instanceof Error ? error.message : '连接已中断，正在同步执行状态'
    }
  } finally {
    clearTimeout(flushTimer); clearInterval(elapsedTimer)
    if (alive && current.value) {
      try {
        const rows = await agentConsole.messages(agentId(), current.value.sessionId)
        if (alive) { messages.value = rows; moreMessages.value = rows.length === 100; await bottom() }
      } catch { if (alive) failed.value = true }
    }
    if (alive) {
      sending.value = false; stopping.value = false
      if (!terminal && !pending.value) updateReply({ status: 'INTERRUPTED' })
      scheduleRefresh()
      if (!failed.value) await loadSessions()
    }
  }
}
onMounted(() => loadSessions())
</script>
<template>
  <div class="conversation">
    <aside class="history-panel" aria-label="历史会话">
      <div class="history-top">
        <el-button v-if="hasPermission('ai:session:create:api')" class="new-conversation" type="primary" :icon="Plus"
          :disabled="sending || loading" :loading="creating" @click="create">新建对话</el-button>
        <div class="history-label"><span>历史对话</span><span>{{ sessions.length }}</span></div>
        <el-input v-model="sessionQuery" class="history-search" :prefix-icon="Search" clearable
          placeholder="搜索对话" aria-label="搜索历史对话" />
      </div>
      <nav class="session-list" aria-label="选择对话">
        <button v-for="session in visibleSessions" :key="session.sessionId" class="session"
          :class="{ active: current?.sessionId === session.sessionId }" :disabled="sending || creating || loading"
          :aria-current="current?.sessionId === session.sessionId ? 'true' : undefined" :title="session.title" @click="select(session)">
          <el-icon class="session-icon" aria-hidden="true"><ChatLineSquare /></el-icon>
          <span class="session-details"><strong>{{ session.title }}</strong><span class="session-meta">
            <time :datetime="session.updateTime" :title="session.updateTime">{{ sessionDate(session.updateTime) }}</time><span>v{{ session.version }}</span>
          </span></span>
        </button>
        <div v-if="!visibleSessions.length && !loading" class="history-empty">
          <el-icon aria-hidden="true"><ChatLineSquare /></el-icon>
          <p>{{ sessionQuery.trim() ? '没有匹配的对话' : '还没有历史对话' }}</p>
          <span>{{ sessionQuery.trim() ? '试试其他关键词' : '发送消息，开启第一段对话' }}</span>
        </div>
        <el-button v-if="moreSessions" class="more-sessions" :disabled="sending" :loading="loading" text @click="loadSessions(true)">加载更多对话</el-button>
      </nav>
      <div class="history-footer"><el-icon aria-hidden="true"><Clock /></el-icon><span>随时回来，继续上次的对话</span></div>
    </aside>
    <section class="chat" aria-label="对话内容">
      <header class="chat-heading">
        <div class="chat-heading-title"><span>当前会话</span><strong :title="current?.title">{{ current?.title || '新对话' }}</strong></div>
        <div class="chat-heading-meta"><span v-if="current" class="version-badge">v{{ current.version }}</span><span class="autosave-note"><el-icon aria-hidden="true"><CircleCheck /></el-icon>历史自动保存</span></div>
      </header>
      <div v-if="failed" role="alert" class="load-error"><span>对话记录暂时无法加载，请重试。</span><el-button text :disabled="sending" @click="current ? select(current) : loadSessions()">重新加载</el-button></div>
      <div ref="thread" v-loading="loading" class="thread" role="log" aria-label="消息历史" aria-live="polite" :aria-busy="loading">
        <div class="thread-content">
          <div v-if="moreMessages" class="older-messages"><el-button :icon="Clock" :disabled="sending" :loading="loading" text @click="older">加载更早的消息</el-button></div>
          <div v-if="!messages.length && !loading && !failed" class="chat-welcome">
            <span class="welcome-avatar"><el-icon aria-hidden="true"><Cpu /></el-icon></span>
            <span class="welcome-caption">与 {{ agent.draft.name }} 对话</span>
            <h3>有什么可以帮你？</h3>
            <p>分享一个问题或任务，从这里开始。<br />对话会自动保存，方便你随时继续。</p>
          </div>
          <article v-for="message in displayMessages" :key="message.id" class="message" :class="message.role">
            <span class="message-avatar" aria-hidden="true"><el-icon><User v-if="message.role === 'user'" /><Cpu v-else /></el-icon></span>
            <div class="message-body">
              <div class="message-label"><strong>{{ message.role === 'user' ? '你' : agent.draft.name }}</strong><time :datetime="message.createTime" :title="message.createTime">{{ messageTime(message.createTime) }}</time></div>
              <details v-if="message.role === 'assistant' && showTrace(message)" class="execution-trace" :open="sending && message.runId === liveRunId"
                @toggle="loadTrace(message, $event)">
                <summary><el-icon aria-hidden="true"><ArrowDown /></el-icon><strong>执行过程</strong><span>{{ traces[message.runId]?.length || '' }}</span><small v-if="sending && message.runId === liveRunId">{{ phase }}</small></summary>
                <p v-if="traceLoading[message.runId]" class="trace-hint">正在加载过程…</p>
                <p v-else-if="traceErrors[message.runId]" class="trace-hint trace-error">{{ traceErrors[message.runId] }}</p>
                <p v-else-if="!traces[message.runId]?.length" class="trace-hint">这轮对话暂无过程记录。</p>
                <ol v-else class="trace-list">
                  <li v-for="event in traces[message.runId]" :key="event.sequence" :class="{ 'trace-error': eventFailed(event) }">
                    <span class="trace-dot" aria-hidden="true" />
                    <div><header><strong>{{ event.title }}</strong><time>{{ eventTime(event.timestamp) }}</time></header>
                      <small v-if="event.parentRunId" class="trace-agent">子智能体 · {{ event.agentCode }}</small>
                      <details v-if="event.text && event.type !== 'RUN_FINISHED'" class="trace-result" :open="event.type === 'REASONING_DELTA'"><summary>{{ event.type.startsWith('REASONING_') ? '模型返回的分析内容' : event.type === 'TOOL_STARTED' ? '调用参数摘要' : '查看结果摘要' }}</summary><pre>{{ event.text }}</pre></details>
                    </div>
                  </li>
                </ol>
              </details>
              <div class="message-bubble">
                <div v-if="message.content && message.role === 'assistant'" class="markdown-content" v-html="message.html" />
                <p v-else class="message-text">{{ message.content || (message.status === 'RUNNING' ? '正在处理，执行进度会实时显示…' : '本轮未返回内容') }}</p>
              </div>
              <span v-if="message.status !== 'SUCCEEDED'" class="message-status" :class="{ processing: message.status === 'RUNNING' }">{{ statusLabels[message.status] || '未完成' }}</span>
            </div>
          </article>
          <div v-if="sending || pending" class="thinking-note" role="status"><span class="thinking-dots" aria-hidden="true"><i /><i /><i /></span><span>{{ sending ? phase : '正在执行，自动同步状态' }}<time v-if="sending" class="elapsed">{{ elapsed }}秒</time></span></div>
        </div>
      </div>
      <p v-if="streamError" class="stream-error" role="alert">{{ streamError }}</p>
      <div class="composer">
        <div class="composer-card" :class="{ 'is-disabled': sending || pending || loading || failed }">
          <label for="agent-chat-input">{{ current ? '继续对话' : '发送消息' }}</label>
          <el-input id="agent-chat-input" v-model="input" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }" :maxlength="100000"
            resize="none" :disabled="sending || pending || loading || failed" placeholder="输入你的问题，或描述需要完成的任务…" @keydown.ctrl.enter.prevent="send" @keydown.meta.enter.prevent="send" />
          <div class="composer-actions"><small><kbd>Ctrl / ⌘</kbd> + <kbd>Enter</kbd> 发送</small><el-button v-if="(sending || pending) && hasPermission('ai:run:cancel')" class="send-button" :icon="VideoPause" :loading="stopping" @click="stop">停止</el-button><el-button v-else-if="hasPermission('ai:agent:stream:api')" class="send-button" type="primary"
            :loading="sending" :disabled="sending || !input.trim() || pending || loading || failed" @click="send"><span>{{ sending || pending ? '处理中' : '发送' }}</span><el-icon v-if="!sending" aria-hidden="true"><Promotion /></el-icon></el-button></div>
        </div>
      </div>
    </section>
  </div>
</template>
<style scoped>
.execution-trace { margin-bottom: 12px; padding: 11px 14px; border: 1px solid var(--el-border-color-lighter); border-radius: 9px; background: var(--el-bg-color); }
.execution-trace > summary { display: flex; align-items: center; gap: 8px; min-height: 24px; cursor: pointer; list-style: none; font-size: 12px; color: var(--el-text-color-regular); }
.execution-trace > summary::-webkit-details-marker { display: none; }
.execution-trace > summary > .el-icon { transition: transform .15s; transform: rotate(-90deg); }
.execution-trace[open] > summary > .el-icon { transform: rotate(0); }
.execution-trace > summary strong { white-space: nowrap; font-weight: 500; }
.execution-trace > summary > span { color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
.execution-trace > summary small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: auto; color: var(--el-color-primary); }
.trace-list { display: flex; flex-direction: column; gap: 15px; max-height: 220px; overflow-y: auto; list-style: none; padding: 16px 0 2px; margin: 0; }
.trace-list > li { display: flex; gap: 11px; font-size: 12px; color: var(--el-text-color-regular); }
.trace-dot { flex-shrink: 0; width: 6px; height: 6px; margin: 6px 1px 0; border-radius: 50%; background: var(--el-color-primary); }
.trace-list > li > div { flex: 1; min-width: 0; }
.trace-list header { display: flex; align-items: baseline; gap: 12px; justify-content: space-between; }
.trace-list header strong { font-weight: 500; overflow-wrap: anywhere; }
.trace-list time { flex-shrink: 0; color: var(--el-text-color-regular); font-size: 11px; font-variant-numeric: tabular-nums; }
.trace-agent { display: block; margin: 4px 0; color: var(--el-text-color-secondary); }
.trace-result { margin-top: 5px; }
.trace-result summary { cursor: pointer; color: var(--el-text-color-regular); padding: 3px 0; }
.trace-result pre { max-height: 220px; overflow: auto; margin: 7px 0 0; padding: 10px; background: var(--el-fill-color-lighter); border-radius: 6px; white-space: pre-wrap; overflow-wrap: anywhere; font: 11px/1.7 'SFMono-Regular', Consolas, monospace; }
.trace-hint { margin: 14px 0 3px; color: var(--el-text-color-regular); font-size: 12px; }
.trace-error, .stream-error { color: var(--el-color-danger); }
.trace-error .trace-dot { background: var(--el-color-danger); }
.stream-error { margin: 0; padding: 8px 28px; font-size: 12px; }
.elapsed { padding-left: 8px; color: var(--el-text-color-regular); font-size: 11px; font-variant-numeric: tabular-nums; }
.message.assistant .message-body { width: 100%; }

.conversation { display: grid; grid-template-columns: 240px minmax(0, 1fr); height: min(690px, calc(90dvh - 90px)); min-height: 0; overflow: hidden; color: var(--el-text-color-primary); background: var(--el-bg-color); font-family: var(--el-font-family); }
.history-panel { display: flex; flex-direction: column; min-height: 0; min-width: 0; border-right: 1px solid var(--el-border-color-lighter); background: var(--el-fill-color-lighter); }
.history-top { padding: 22px 16px 12px; }
.new-conversation { width: 100%; height: 40px; border-radius: 9px; font-weight: 500; }
.history-label { display: flex; align-items: center; justify-content: space-between; margin: 27px 4px 12px; font-size: 12px; font-weight: 600; color: var(--el-text-color-regular); }
.history-label > span:last-child { display: grid; place-items: center; min-width: 20px; height: 20px; padding: 0 5px; box-sizing: border-box; border-radius: 6px; background: var(--el-fill-color); font-size: 11px; font-variant-numeric: tabular-nums; }
.history-search :deep(.el-input__wrapper) { min-height: 32px; border-radius: 7px; box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset; }
.history-search :deep(.el-input__inner) { font-size: 12px; }
.session-list { flex: 1; min-height: 0; overflow-y: auto; padding: 0 12px 16px; scrollbar-width: thin; }
.session { position: relative; display: flex; align-items: flex-start; gap: 10px; width: 100%; margin: 4px 0; padding: 13px 12px; border: 1px solid transparent; border-radius: 9px; background: transparent; color: var(--el-text-color-regular); text-align: left; cursor: pointer; font: inherit; transition: background-color .15s, border-color .15s; }
.session:hover:not(:disabled) { background: var(--el-fill-color); }
.session.active { border-color: var(--el-border-color-light); background: var(--el-bg-color); box-shadow: 0 2px 5px rgb(0 0 0 / 3%); color: var(--el-text-color-primary); }
.session.active::before { position: absolute; top: 16px; bottom: 16px; left: -1px; width: 3px; border-radius: 0 3px 3px 0; background: var(--el-color-primary); content: ''; }
.session-icon { margin-top: 2px; font-size: 16px; color: var(--el-text-color-secondary); }
.session.active .session-icon { color: var(--el-color-primary); }
.session-details { flex: 1; min-width: 0; }
.session strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 500; line-height: 1.6; }
.session-meta { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 7px; color: var(--el-text-color-regular); font-size: 11px; line-height: 1.4; font-variant-numeric: tabular-nums; }
.session-meta > span { color: var(--el-text-color-secondary); }
.session:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
.session:disabled { cursor: not-allowed; }
.history-empty { padding: 34px 4px; color: var(--el-text-color-regular); text-align: center; }
.history-empty .el-icon { font-size: 24px; color: var(--el-text-color-secondary); }
.history-empty p { margin: 12px 0 6px; font-size: 13px; }
.history-empty > span { font-size: 12px; }
.more-sessions { width: 100%; margin-top: 8px; font-size: 12px; }
.history-footer { display: flex; align-items: center; gap: 7px; padding: 16px; border-top: 1px solid var(--el-border-color-lighter); color: var(--el-text-color-regular); font-size: 11px; }
.chat { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.chat-heading { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; gap: 16px; min-height: 72px; padding: 14px 28px; box-sizing: border-box; border-bottom: 1px solid var(--el-border-color-lighter); }
.chat-heading-title { display: flex; flex-direction: column; min-width: 0; gap: 5px; }
.chat-heading-title > span { color: var(--el-text-color-regular); font-size: 11px; }
.chat-heading-title strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 600; }
.chat-heading-meta { display: flex; align-items: center; flex-shrink: 0; gap: 12px; }
.version-badge { padding: 3px 7px; border: 1px solid var(--el-border-color-light); border-radius: 5px; color: var(--el-text-color-regular); font-size: 11px; line-height: 1.4; }
.autosave-note { display: flex; align-items: center; gap: 5px; color: var(--el-text-color-regular); font-size: 11px; white-space: nowrap; }
.autosave-note .el-icon { color: var(--el-color-success-dark-2); font-size: 14px; }
.thread { flex: 1; min-height: 80px; overflow-y: auto; overscroll-behavior: contain; padding: 28px 30px; scrollbar-width: thin; }
.thread-content { display: flex; flex-direction: column; min-height: 100%; max-width: 760px; margin: 0 auto; }
.older-messages { text-align: center; margin: -10px 0 18px; }
.older-messages .el-button { font-size: 12px; }
.chat-welcome { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px 56px; text-align: center; }
.welcome-avatar { display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 20px; border: 1px solid var(--el-color-primary-light-8); border-radius: 17px; background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-size: 27px; }
.welcome-caption { color: var(--el-text-color-regular); font-size: 12px; }
.chat-welcome h3 { margin: 10px 0 12px; color: var(--el-text-color-primary); font-size: 24px; font-weight: 600; letter-spacing: -.5px; }
.chat-welcome p { max-width: 100%; margin: 0; color: var(--el-text-color-regular); font-size: 13px; line-height: 1.9; overflow-wrap: anywhere; }
.message { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 25px; }
.message-avatar { display: grid; flex-shrink: 0; place-items: center; width: 32px; height: 32px; margin-top: 23px; border: 1px solid var(--el-border-color-light); border-radius: 10px; background: var(--el-bg-color); color: var(--el-color-primary); font-size: 17px; }
.message-body { min-width: 0; max-width: calc(100% - 43px); }
.message-label { display: flex; align-items: center; gap: 9px; margin: 0 2px 8px; line-height: 1.3; }
.message-label strong { font-size: 12px; font-weight: 500; color: var(--el-text-color-regular); overflow-wrap: anywhere; }
.message-label time { flex-shrink: 0; color: var(--el-text-color-regular); font-size: 11px; font-variant-numeric: tabular-nums; }
.message-bubble { padding: 14px 18px; border: 1px solid var(--el-border-color-lighter); border-radius: 3px 14px 14px; background: var(--el-fill-color-lighter); font-size: 14px; line-height: 1.8; overflow-wrap: anywhere; }
.message-text { white-space: pre-wrap; margin: 0; }
.message.user { flex-direction: row-reverse; margin-left: 15%; }
.message.user .message-body { max-width: calc(100% - 43px); }
.message.user .message-label { justify-content: flex-end; }
.message.user .message-avatar { background: var(--el-fill-color); color: var(--el-text-color-regular); border-color: transparent; }
.message.user .message-bubble { border-color: var(--el-color-primary-light-8); background: var(--el-color-primary-light-9); border-radius: 14px 3px 14px 14px; }
.message-status { display: inline-block; margin: 7px 2px 0; font-size: 12px; color: var(--el-color-danger); }
.message-status.processing { color: var(--el-text-color-regular); }
.markdown-content { min-width: 0; }
.markdown-content :deep(> :first-child) { margin-top: 0; }
.markdown-content :deep(> :last-child) { margin-bottom: 0; }
.markdown-content :deep(p) { margin: 0 0 12px; }
.markdown-content :deep(h1), .markdown-content :deep(h2), .markdown-content :deep(h3), .markdown-content :deep(h4) { margin: 18px 0 9px; font-size: 16px; line-height: 1.6; font-weight: 600; }
.markdown-content :deep(ul), .markdown-content :deep(ol) { padding-left: 22px; margin: 10px 0; }
.markdown-content :deep(li + li) { margin-top: 5px; }
.markdown-content :deep(pre) { max-width: 100%; padding: 14px 16px; overflow-x: auto; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-bg-color); white-space: pre; line-height: 1.6; }
.markdown-content :deep(code) { padding: 2px 5px; border-radius: 4px; background: var(--el-fill-color); font-family: 'SFMono-Regular', Consolas, monospace; font-size: .9em; }
.markdown-content :deep(pre code) { padding: 0; background: transparent; }
.markdown-content :deep(blockquote) { margin: 12px 0; padding-left: 12px; border-left: 3px solid var(--el-border-color); color: var(--el-text-color-regular); }
.markdown-content :deep(a) { color: var(--el-color-primary-dark-2); text-decoration: underline; text-underline-offset: 3px; }
.markdown-content :deep(table) { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
.markdown-content :deep(th), .markdown-content :deep(td) { padding: 7px 10px; border: 1px solid var(--el-border-color); text-align: left; }
.markdown-content :deep(img) { max-width: 100%; height: auto; }
.thinking-note { display: flex; align-items: center; gap: 10px; margin: 0 0 16px 43px; color: var(--el-text-color-regular); font-size: 12px; }
.thinking-dots { display: inline-flex; align-items: center; gap: 4px; height: 16px; }
.thinking-dots i { width: 4px; height: 4px; border-radius: 50%; background: var(--el-color-primary); animation: thinking 1.2s ease-in-out infinite; }
.thinking-dots i:nth-child(2) { animation-delay: .15s; }
.thinking-dots i:nth-child(3) { animation-delay: .3s; }
@keyframes thinking { 0%, 70%, 100% { opacity: .35; transform: translateY(0); } 35% { opacity: 1; transform: translateY(-3px); } }
.load-error { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 24px; background: var(--el-color-danger-light-9); color: var(--el-color-danger); font-size: 12px; }
.composer { flex-shrink: 0; padding: 6px 28px 22px; }
.composer-card { max-width: 760px; margin: 0 auto; padding: 13px 16px 12px; border: 1px solid var(--el-border-color); border-radius: 13px; background: var(--el-bg-color); box-shadow: 0 3px 12px rgb(0 0 0 / 3%); transition: border-color .15s, box-shadow .15s; }
.composer-card:focus-within { border-color: var(--el-color-primary); box-shadow: 0 0 0 3px var(--el-color-primary-light-9); }
.composer-card.is-disabled { background: var(--el-fill-color-lighter); }
.composer label { display: block; margin: 0 0 8px; color: var(--el-text-color-regular); font-size: 12px; font-weight: 500; }
.composer :deep(.el-textarea__inner) { padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; color: var(--el-text-color-primary); font-family: inherit; font-size: 14px; line-height: 1.7; }
.composer :deep(.el-textarea__inner:focus), .composer :deep(.el-textarea__inner:hover) { box-shadow: none; }
.composer :deep(.el-textarea.is-disabled .el-textarea__inner) { background: transparent; }
.composer-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; }
.composer-actions > small { color: var(--el-text-color-regular); font-size: 11px; }
.composer-actions kbd { padding: 2px 4px; border: 1px solid var(--el-border-color-light); border-radius: 4px; font: inherit; }
.send-button { height: 34px; min-width: 78px; padding: 0 12px; border-radius: 7px; }
.send-button .el-icon { margin-left: 6px; font-size: 15px; }
@media (max-width: 900px) { .conversation { grid-template-columns: 210px minmax(0, 1fr); } .thread { padding: 24px 20px; } .chat-heading { padding: 14px 20px; } .composer { padding: 6px 20px 18px; } .autosave-note { display: none; } }
@media (max-width: 640px) {
  .conversation { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); height: calc(94dvh - 78px); }
  .history-panel { border-right: 0; border-bottom: 1px solid var(--el-border-color-lighter); }
  .history-top { display: flex; align-items: center; gap: 10px; padding: 12px 14px 8px; }
  .new-conversation { flex-shrink: 0; width: auto; height: 36px; }
  .history-label, .history-footer { display: none; }
  .history-search { min-width: 0; }
  .session-list { display: flex; gap: 6px; padding: 0 14px 9px; overflow-x: auto; }
  .session { width: 156px; min-width: 156px; margin: 0; padding: 9px 10px; }
  .session-icon { display: none; }
  .session-meta { margin-top: 4px; font-size: 10px; }
  .history-empty { padding: 6px 0; font-size: 12px; text-align: left; }
  .history-empty .el-icon, .history-empty > span { display: none; }
  .history-empty p { margin: 0; font-size: 12px; }
  .more-sessions { width: auto; flex-shrink: 0; align-self: center; margin: 0; }
  .chat-heading { min-height: 58px; padding: 10px 16px; }
  .chat-heading-title { gap: 4px; }
  .thread { padding: 20px 14px; }
  .message { gap: 8px; margin-bottom: 22px; }
  .message-avatar { width: 28px; height: 28px; border-radius: 9px; font-size: 15px; }
  .message-body, .message.user .message-body { max-width: calc(100% - 36px); }
  .message.user { margin-left: 5%; }
  .message-bubble { padding: 11px 13px; font-size: 15px; }
  .message-label { gap: 6px; }
  .message-label strong, .message-label time { font-size: 11px; }
  .composer { padding: 4px 12px 12px; }
  .composer-card { padding: 11px 12px; border-radius: 11px; }
  .composer :deep(.el-textarea__inner) { font-size: 16px; }
  .composer-actions > small { font-size: 10px; }
  .send-button { height: 38px; }
  .chat-welcome { padding: 28px 8px; }
  .chat-welcome h3 { font-size: 21px; }
  .load-error { padding: 6px 14px; }
}
@media (prefers-reduced-motion: reduce) { .session, .composer-card { transition: none; } .thinking-dots i { animation: none; } }
</style>
