<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatLineSquare, CircleCheck, Clock, Cpu, Plus, Promotion, Search, User, VideoPause, Close, Document, Operation, Refresh, Paperclip } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import { agentConsole, type AgentView, type AgentSession, type AgentMessage, type AgentProgress, type AgentFile } from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'
import AgentRunSummary from './AgentRunSummary.vue'
import { formatDuration } from './runMetrics'
const props = defineProps<{ agent: AgentView }>()
const sessions = ref<AgentSession[]>([])
const current = ref<AgentSession>()
const messages = ref<AgentMessage[]>([])
const input = ref('')
const pendingAttachments = ref<(AgentFile & { reused?: boolean })[]>([])
const runFiles = ref<Record<string, AgentFile[]>>({})
const fileLoading = ref<Record<string, boolean>>({})
const fileErrors = ref<Record<string, string>>({})
const uploading = ref(false), uploadPercent = ref(0), recovering = ref(false)
const filePicker = ref<HTMLInputElement>()
function fileSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KiB` : `${(bytes / 1024 / 1024).toFixed(1)} MiB` }
async function loadFiles(runId: string, event?: Event, refresh = false) {
  if (event && !(event.target as HTMLDetailsElement).open) return
  if (!current.value || !hasPermission('ai:file:list:api') || fileLoading.value[runId] || (!refresh && runFiles.value[runId])) return
  const token = generation, session = current.value.sessionId
  fileLoading.value[runId] = true; fileErrors.value[runId] = ''
  try { const rows = await agentConsole.files(agentId(), session, runId); if (alive && token === generation) runFiles.value[runId] = rows }
  catch { if (alive && token === generation) fileErrors.value[runId] = '文件加载失败，请重试。' }
  finally { if (alive && token === generation) fileLoading.value[runId] = false }
}
async function download(file: AgentFile) {
  if (!current.value) return
  const bytes = await agentConsole.downloadFile(agentId(), current.value.sessionId, file.id)
  if (!alive) return
  const url = URL.createObjectURL(bytes)
  const link = document.createElement('a'); link.href = url; link.download = file.name
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function reuseFile(file: AgentFile) {
  if (pendingAttachments.value.some(row => row.id === file.id)) return
  if (pendingAttachments.value.length >= 5 || pendingAttachments.value.reduce((sum, row) => sum + row.sizeBytes, file.sizeBytes) > 20 * 1024 * 1024) { ElMessage.warning('本轮最多 5 个附件，总量不超过 20MiB'); return }
  pendingAttachments.value.push({ ...file, reused: true })
}
async function removeAttachment(file: AgentFile & { reused?: boolean }) {
  if (uploading.value || sending.value || !current.value) return
  if (!file.reused) await agentConsole.deleteFile(agentId(), current.value.sessionId, file.id)
  pendingAttachments.value = pendingAttachments.value.filter(row => row.id !== file.id)
}
async function upload(event: Event) {
  const picker = event.target as HTMLInputElement
  const files = [...(picker.files || [])]
  if (!files.length || uploading.value || sending.value || loading.value || pending.value) return
  const total = files.reduce((sum, file) => sum + file.size, 0) + pendingAttachments.value.reduce((sum, file) => sum + file.sizeBytes, 0)
  if (files.some(file => !file.size || file.size > 20 * 1024 * 1024) || total > 20 * 1024 * 1024 || files.length + pendingAttachments.value.length > 5) { ElMessage.warning('本轮最多 5 个附件，总量不超过 20MiB'); picker.value = ''; return }
  uploading.value = true
  try {
    if (!current.value) {
      const session = await agentConsole.createSession(agentId())
      if (!alive) return
      current.value = session; sessions.value.unshift(session)
    }
    const session = current.value.sessionId
    for (const file of files) {
      uploadPercent.value = 0
      const saved = await agentConsole.uploadFile(agentId(), session, file, percent => { if (alive) uploadPercent.value = percent })
      if (!alive) return
      pendingAttachments.value.push(saved)
    }
  } finally { if (alive) uploading.value = false; picker.value = '' }
}
async function recover(message: AgentMessage) {
  if (!current.value || sending.value || pending.value || uploading.value || recovering.value) return
  try { await ElMessageBox.confirm('创建独立的重试会话，沿用原发布版本，带入可见的历史上下文和本轮附件。确认内容后再发送，可能重新执行工具操作。', '准备重新执行', { confirmButtonText: '创建重试会话', type: 'warning' }) }
  catch { return }
  recovering.value = true
  try {
    const recovery = await agentConsole.recover(agentId(), current.value.sessionId, message.runId)
    if (!alive) return
    sessions.value.unshift(recovery.session)
    await select(recovery.session)
    if (!alive) return
    input.value = recovery.input; pendingAttachments.value = recovery.attachments
  } finally { if (alive) recovering.value = false }
}
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
  } catch { if (alive && token === generation) traceErrors.value[message.runId] = '过程加载失败，请重试' }
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
const historyVisible = ref(false)
const historyLoading = ref(false), historyError = ref('')
const inspectorOpen = ref(false)
const inspectorTab = ref<'activity' | 'files'>('activity')
const focusedRunId = ref('')
const activityTabButton = ref<HTMLButtonElement>(), filesTabButton = ref<HTMLButtonElement>()
function focusInspectorTab(tab: 'activity' | 'files') {
  if (tab === 'activity' && !canViewActivity.value || tab === 'files' && !hasPermission('ai:file:list:api')) return
  void openInspector(tab)
  void nextTick(() => (tab === 'activity' ? activityTabButton.value : filesTabButton.value)?.focus())
}
const assistantMessages = computed(() => messages.value.filter(message => message.role === 'assistant' && message.runId))
const inspectedRun = computed(() => assistantMessages.value.find(message => message.runId === focusedRunId.value)
  || assistantMessages.value.find(message => message.runId === liveRunId.value)
  || assistantMessages.value[assistantMessages.value.length - 1])
const inspectedEvents = computed(() => (traces.value[inspectedRun.value?.runId || ''] || []).filter(event => event.type !== 'HEARTBEAT'))
const inspectedFiles = computed(() => runFiles.value[inspectedRun.value?.runId || ''] || [])
const canViewActivity = computed(() => hasPermission('ai:session:events:api') || Object.values(traces.value).some(events => events.length > 0))
const canInspect = computed(() => canViewActivity.value || hasPermission('ai:file:list:api'))
function runLabel(message: AgentMessage) {
  return `第 ${assistantMessages.value.findIndex(row => row.runId === message.runId) + 1} 轮 · ${messageTime(message.createTime)}`
}
async function openInspector(tab: 'activity' | 'files', message?: AgentMessage, refresh = false) {
  if (tab === 'files' && !hasPermission('ai:file:list:api')) return
  if (tab === 'activity' && !canViewActivity.value) return
  inspectorTab.value = tab
  inspectorOpen.value = true
  const target = message || inspectedRun.value
  if (!target || !current.value) return
  focusedRunId.value = target.runId
  if (tab === 'files') await loadFiles(target.runId, undefined, refresh)
  else await loadTrace(target, undefined, refresh)
}
function toggleInspector() {
  if (inspectorOpen.value) inspectorOpen.value = false
  else void openInspector(canViewActivity.value ? inspectorTab.value : 'files')
}
async function chooseSession(session: AgentSession) {
  if (sending.value || uploading.value || creating.value || recovering.value) return
  if (current.value?.sessionId !== session.sessionId) await select(session)
  if (alive) historyVisible.value = false
}
function historyRowClass({ row }: { row: AgentSession }) {
  return current.value?.sessionId === row.sessionId ? 'is-current-session' : ''
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
      if (alive && token === generation) {
        messages.value = rows
        if (inspectorOpen.value && inspectedRun.value) await openInspector(inspectorTab.value, inspectedRun.value, true)
        await bottom()
      }
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
  if (sending.value || uploading.value) return
  const token = ++generation
  current.value = session
  messages.value = []
  traces.value = {}
  focusedRunId.value = ''
  liveRunId.value = ''
  runFiles.value = {}; fileErrors.value = {}; fileLoading.value = {}
  pendingAttachments.value = []
  traceErrors.value = {}
  streamError.value = ''
  input.value = ''
  loading.value = true
  failed.value = false
  try {
    const rows = await agentConsole.messages(agentId(), session.sessionId)
    if (!alive || token !== generation) return
    messages.value = rows
    const lastReply = [...rows].reverse().find(row => row.role === 'assistant')
    if (lastReply) {
      void loadTrace(lastReply)
      if (inspectorOpen.value && inspectorTab.value === 'files') void loadFiles(lastReply.runId)
    }
    if (hasPermission('ai:file:list:api') && agentConsole.files) {
      try { const files = await agentConsole.files(agentId(), session.sessionId, ''); if (alive && token === generation) pendingAttachments.value = files }
      catch { /* 附件列表失败不覆盖对话状态，上传时仍会校验归属。 */ }
    }
    scheduleRefresh()
    moreMessages.value = rows.length === 100
    await bottom()
  } catch { if (alive && token === generation) failed.value = true }
  finally { if (alive && token === generation) loading.value = false }
}
async function loadSessions(append = false) {
  const initial = !current.value
  historyLoading.value = true
  historyError.value = ''
  if (initial) { loading.value = true; failed.value = false }
  try {
    const rows = await agentConsole.sessions(agentId(), append ? sessions.value.length : 0)
    if (!alive) return
    sessions.value = append ? [...sessions.value, ...rows] : rows
    moreSessions.value = rows.length === 50
    current.value = rows.find(session => session.sessionId === current.value?.sessionId) || current.value
    if (!current.value && rows[0]) await select(rows[0])
  } catch {
    if (alive) {
      historyError.value = '会话历史暂时无法加载，请刷新重试。'
      if (initial) failed.value = true
    }
  } finally {
    if (alive) { historyLoading.value = false; if (initial) loading.value = false }
  }
}
async function create() {
  if (sending.value || creating.value || uploading.value || recovering.value) return
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
  if (sending.value || loading.value || uploading.value || recovering.value || pending.value || failed.value || !input.value.trim()) return
  sending.value = true
  streamError.value = ''
  liveRunId.value = ''
  focusedRunId.value = ''
  elapsed.value = 0
  phase.value = '正在建立连接'
  const token = generation
  const text = input.value
  const attached = [...pendingAttachments.value]
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
        pendingAttachments.value = []
        if (attached.length) runFiles.value[event.rootRunId] = attached
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
      if (event.type === 'ARTIFACT') void loadFiles(event.rootRunId, undefined, true)
      if (!['PHASE_FINISHED', 'MODEL_FIRST_TOKEN', 'MODEL_FINISHED', 'ARTIFACT'].includes(event.type)) phase.value = event.title
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
    }, streamController.signal, attached.map(file => file.id))
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
        if (alive) { messages.value = rows; moreMessages.value = rows.length === 100; if (liveRunId.value && hasPermission('ai:file:list:api')) void loadFiles(liveRunId.value, undefined, true); await bottom() }
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
  <div class="conversation" :class="{ 'inspector-open': inspectorOpen }">
    <section class="chat" aria-label="对话内容">
      <header class="chat-heading">
        <div class="chat-heading-title"><strong :title="current?.title">{{ current?.title || '新对话' }}</strong><span v-if="current" class="version-badge">v{{ current.version }}</span><span class="autosave-note"><el-icon aria-hidden="true"><CircleCheck /></el-icon>自动保存</span></div>
        <div class="workspace-actions">
          <el-button text :icon="Clock" @click="historyVisible = true">会话历史</el-button>
          <el-button v-if="hasPermission('ai:session:create:api')" :icon="Plus" class="new-session-button" :disabled="sending || loading || uploading || recovering" :loading="creating" @click="create">新会话</el-button>
          <el-button v-if="canInspect" text :icon="Operation" :class="{ 'is-selected': inspectorOpen }" :aria-expanded="inspectorOpen" @click="toggleInspector">过程与文件</el-button>
        </div>
      </header>
      <div class="workspace-main">
        <section class="chat-main" aria-label="聊天记录与输入">
          <div v-if="failed" role="alert" class="load-error"><span>对话记录暂时无法加载。</span><el-button text :disabled="sending" @click="current ? select(current) : loadSessions()">重新加载</el-button></div>
          <div ref="thread" v-loading="loading" class="thread" role="log" aria-label="消息历史" aria-live="polite" :aria-busy="loading">
            <div class="thread-content">
              <div v-if="moreMessages" class="older-messages"><el-button :icon="Clock" :disabled="sending" :loading="loading" text @click="older">加载更早的消息</el-button></div>
              <div v-if="!messages.length && !loading && !failed" class="chat-welcome"><span class="welcome-symbol"><el-icon aria-hidden="true"><ChatLineSquare /></el-icon></span><h3>与 {{ agent.draft.name }} 开始对话</h3><p>发送一个问题或任务，从这里开始。</p><small>会话自动保存，可随时从历史中继续。</small></div>
              <article v-for="message in displayMessages" :key="message.id" class="message" :class="message.role">
                <span class="message-avatar" aria-hidden="true"><el-icon><User v-if="message.role === 'user'" /><Cpu v-else /></el-icon></span>
                <div class="message-body">
                  <div class="message-label"><strong>{{ message.role === 'user' ? '你' : agent.draft.name }}</strong><time :datetime="message.createTime" :title="message.createTime">{{ messageTime(message.createTime) }}</time></div>
                  <div class="message-bubble">
                    <div v-if="message.content && message.role === 'assistant'" class="markdown-content" v-html="message.html" />
                    <p v-else class="message-text">{{ message.content || (message.status === 'RUNNING' ? '正在处理，执行进展可在右侧查看…' : '本轮未返回内容') }}</p>
                  </div>
                  <div v-if="message.role === 'assistant' && message.runId" class="message-links">
                    <button v-if="showTrace(message)" type="button" :class="{ active: inspectorOpen && inspectorTab === 'activity' && inspectedRun?.runId === message.runId }" @click="openInspector('activity', message)"><el-icon aria-hidden="true"><Operation /></el-icon>执行过程<span v-if="traces[message.runId]?.length">{{ traces[message.runId]?.length }}</span></button>
                    <button v-if="hasPermission('ai:file:list:api')" type="button" :class="{ active: inspectorOpen && inspectorTab === 'files' && inspectedRun?.runId === message.runId }" @click="openInspector('files', message)"><el-icon aria-hidden="true"><Document /></el-icon>文件<span v-if="runFiles[message.runId]?.length">{{ runFiles[message.runId]?.length }}</span></button>
                  </div>
                  <div v-if="message.role === 'assistant' && ['FAILED','TIMED_OUT','CANCELLED','INTERRUPTED'].includes(message.status)" class="recovery-actions"><span>保留本轮记录，可带入上下文重新开始。</span><el-button v-if="hasPermission('ai:run:recovery:api')" text type="primary" :disabled="sending || pending || uploading" :loading="recovering" @click="recover(message)">准备重试</el-button></div>
                  <span v-if="message.status !== 'SUCCEEDED'" class="message-status" :class="{ processing: message.status === 'RUNNING' }">{{ statusLabels[message.status] || '未完成' }}</span>
                  <AgentRunSummary v-if="message.role === 'assistant'" :events="traces[message.runId] || []" />
                </div>
              </article>
              <div v-if="sending || pending" class="thinking-note" role="status"><span class="thinking-dots" aria-hidden="true"><i /><i /><i /></span><span>{{ sending ? phase : '正在执行，自动同步状态' }}<time v-if="sending" class="elapsed">{{ elapsed }}秒</time></span></div>
            </div>
          </div>
          <p v-if="streamError" class="stream-error" role="alert">{{ streamError }}</p>
          <div class="composer">
            <div class="composer-card" :class="{ 'is-disabled': sending || pending || loading || failed }">
              <label for="agent-chat-input">{{ current ? '继续对话' : '发送消息' }}</label>
              <el-input id="agent-chat-input" v-model="input" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }" :maxlength="100000" resize="none" :disabled="sending || pending || loading || failed" placeholder="输入消息，描述你想完成的任务…" @keydown.ctrl.enter.prevent="send" @keydown.meta.enter.prevent="send" />
              <div v-if="pendingAttachments.length" class="pending-attachments"><span v-for="file in pendingAttachments" :key="file.id"><el-icon aria-hidden="true"><Document /></el-icon><strong :title="file.name">{{ file.name }}</strong><small>{{ fileSize(file.sizeBytes) }}</small><button type="button" :disabled="sending || uploading || !hasPermission('ai:file:delete:api') && !file.reused" :aria-label="`移除 ${file.name}`" @click="removeAttachment(file)">×</button></span></div>
              <div class="composer-actions"><small><kbd>Ctrl / ⌘</kbd> + <kbd>Enter</kbd> 发送</small><div class="composer-tools"><input ref="filePicker" type="file" multiple hidden aria-label="选择附件" :disabled="sending || pending || loading || uploading" @change="upload" /><el-button v-if="hasPermission('ai:file:upload:api')" text circle :icon="Paperclip" :loading="uploading" :disabled="sending || pending || loading || failed || recovering" :aria-label="uploading ? `上传中 ${uploadPercent}%` : '添加附件'" title="最多 5 个附件，共 20MiB" @click="filePicker?.click()" /><el-button v-if="(sending || pending) && hasPermission('ai:run:cancel')" class="send-button" :icon="VideoPause" :loading="stopping" @click="stop">停止</el-button><el-button v-else-if="hasPermission('ai:agent:stream:api')" class="send-button" type="primary" circle :icon="Promotion" :disabled="sending || uploading || recovering || !input.trim() || pending || loading || failed" aria-label="发送消息" title="发送消息" @click="send" /></div></div>
            </div>
          </div>
        </section>
        <aside v-if="inspectorOpen" class="run-inspector" aria-label="执行过程与文件面板">
          <header class="inspector-heading"><div class="inspector-tabs" role="tablist" aria-label="查看执行信息"><button v-if="canViewActivity" id="activity-tab" ref="activityTabButton" type="button" role="tab" :tabindex="inspectorTab === 'activity' ? 0 : -1" @keydown.right.prevent="focusInspectorTab('files')" @keydown.left.prevent="focusInspectorTab('files')" :aria-selected="inspectorTab === 'activity'" aria-controls="inspector-content" @click="openInspector('activity')"><el-icon aria-hidden="true"><Operation /></el-icon>执行过程<span>{{ inspectedEvents.length }}</span></button><button v-if="hasPermission('ai:file:list:api')" id="files-tab" ref="filesTabButton" type="button" role="tab" :tabindex="inspectorTab === 'files' ? 0 : -1" @keydown.left.prevent="focusInspectorTab('activity')" @keydown.right.prevent="focusInspectorTab('activity')" :aria-selected="inspectorTab === 'files'" aria-controls="inspector-content" @click="openInspector('files')"><el-icon aria-hidden="true"><Document /></el-icon>文件<span>{{ inspectedFiles.length }}</span></button></div><el-button text circle :icon="Close" aria-label="关闭执行面板" @click="inspectorOpen = false" /></header>
          <div v-if="assistantMessages.length" class="inspector-run"><span>查看轮次</span><el-select :model-value="inspectedRun?.runId" size="small" aria-label="选择对话轮次" @change="(id: string) => openInspector(inspectorTab, assistantMessages.find(message => message.runId === id))"><el-option v-for="message in assistantMessages" :key="message.runId" :value="message.runId" :label="runLabel(message)" /></el-select></div>
          <div id="inspector-content" class="inspector-content" role="tabpanel" :aria-labelledby="inspectorTab === 'activity' ? 'activity-tab' : 'files-tab'">
            <div v-if="!inspectedRun" class="inspector-empty"><el-icon aria-hidden="true"><Document /></el-icon><strong>还没有执行记录</strong><p>开始一轮对话后，在这里查看过程和文件。</p></div>
            <template v-else-if="inspectorTab === 'activity'">
              <p v-if="traceLoading[inspectedRun.runId]" class="panel-hint" role="status">正在加载执行过程…</p>
              <div v-else-if="traceErrors[inspectedRun.runId]" class="panel-error" role="alert"><p>{{ traceErrors[inspectedRun.runId] }}</p><el-button text size="small" @click="openInspector('activity', inspectedRun, true)">重新加载</el-button></div>
              <div v-else-if="!inspectedEvents.length" class="inspector-empty"><el-icon aria-hidden="true"><Operation /></el-icon><strong>暂无过程记录</strong><p>执行进展会实时出现在这里。</p></div>
              <ol v-else class="trace-list"><li v-for="event in inspectedEvents" :key="event.sequence" :class="{ 'trace-error': eventFailed(event) }"><span class="trace-dot" aria-hidden="true" /><div><header><strong>{{ event.title }}</strong><time :title="eventTime(event.timestamp)">{{ event.durationMs == null ? eventTime(event.timestamp) : formatDuration(event.durationMs) }}</time></header><small v-if="event.parentRunId" class="trace-agent">子智能体 · {{ event.agentCode }}</small><details v-if="event.text && event.type !== 'RUN_FINISHED'" class="trace-result" :open="event.type === 'REASONING_DELTA'"><summary>{{ event.type.startsWith('REASONING_') ? '模型返回的分析内容' : event.type === 'TOOL_STARTED' ? '调用参数摘要' : '查看结果摘要' }}</summary><pre>{{ event.text }}</pre></details></div></li></ol>
            </template>
            <template v-else>
              <p v-if="fileLoading[inspectedRun.runId]" class="panel-hint" role="status">正在加载文件…</p>
              <div v-else-if="fileErrors[inspectedRun.runId]" class="panel-error" role="alert"><p>{{ fileErrors[inspectedRun.runId] }}</p><el-button text size="small" @click="openInspector('files', inspectedRun, true)">重新加载</el-button></div>
              <div v-else-if="!inspectedFiles.length" class="inspector-empty"><el-icon aria-hidden="true"><Document /></el-icon><strong>本轮暂无文件</strong><p>上传的附件和智能体交付的文件会显示在这里。</p></div>
              <ul v-else class="artifact-list"><li v-for="file in inspectedFiles" :key="file.id"><span class="artifact-icon"><el-icon aria-hidden="true"><Document /></el-icon></span><div class="artifact-details"><strong :title="file.name">{{ file.name }}</strong><small>{{ file.kind === 'ARTIFACT' ? '生成文件' : '用户附件' }} · {{ fileSize(file.sizeBytes) }}</small><div><el-button v-if="hasPermission('ai:file:download:api')" size="small" text type="primary" @click="download(file)">下载</el-button><el-button v-if="hasPermission('ai:file:upload:api')" size="small" text :disabled="sending || pending || uploading" @click="reuseFile(file)">加入本轮</el-button></div></div></li></ul>
            </template>
          </div>
        </aside>
      </div>
    </section>
    <el-dialog v-model="historyVisible" title="会话历史" width="min(960px,94vw)" class="conversation-history-dialog" append-to-body align-center :close-on-click-modal="false">
      <template #header="{ titleId, titleClass }"><div class="history-dialog-heading"><h2 :id="titleId" :class="titleClass">会话历史</h2><p>{{ agent.draft.name }}</p></div></template>
      <div class="history-toolbar"><el-input v-model="sessionQuery" :prefix-icon="Search" clearable placeholder="搜索已加载的会话标题" aria-label="搜索历史会话" /><el-button :icon="Refresh" :loading="historyLoading" aria-label="刷新会话历史" title="刷新会话历史" @click="loadSessions()" /></div>
      <p v-if="historyError" class="panel-error" role="alert">{{ historyError }}</p>
      <el-table v-loading="historyLoading" :data="visibleSessions" :row-class-name="historyRowClass" class="session-history-table" max-height="min(52dvh,520px)" empty-text="暂无匹配的会话" @row-click="chooseSession"><el-table-column label="会话" min-width="260"><template #default="{row}"><div class="history-title"><el-icon aria-hidden="true"><ChatLineSquare /></el-icon><strong :title="row.title">{{ row.title }}</strong><el-tag v-if="current?.sessionId === row.sessionId" size="small" effect="plain">当前</el-tag></div></template></el-table-column><el-table-column label="发布版本" width="100"><template #default="{row}"><span class="history-version">v{{ row.version }}</span></template></el-table-column><el-table-column label="最近活动" min-width="150"><template #default="{row}"><time :datetime="row.updateTime" :title="row.updateTime">{{ sessionDate(row.updateTime) }}</time></template></el-table-column><el-table-column label="" width="90"><template #default="{row}"><el-button text type="primary" :disabled="sending || uploading || creating || recovering" @click.stop="chooseSession(row)">继续对话</el-button></template></el-table-column></el-table>
      <template #footer><div class="history-dialog-footer"><span>已加载 {{ sessions.length }} 个会话</span><el-button v-if="moreSessions" :loading="historyLoading" @click="loadSessions(true)">加载更多</el-button><el-button @click="historyVisible = false">关闭</el-button></div></template>
    </el-dialog>
  </div>
</template>
<style scoped>
.conversation { height: calc(100dvh - 72px); min-height: 0; overflow: hidden; color: var(--el-text-color-primary); background: var(--el-bg-color-page); font-family: var(--el-font-family); }
.chat { display: flex; flex-direction: column; height: 100%; min-width: 0; min-height: 0; }
.chat-heading { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; gap: 20px; min-height: 54px; padding: 8px 26px; border-bottom: 1px solid var(--el-border-color-lighter); }
.chat-heading-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
.chat-heading-title > strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 500; }
.version-badge { flex-shrink: 0; padding: 2px 6px; border: 1px solid var(--el-border-color-lighter); border-radius: 5px; font-size: 10px; color: var(--el-text-color-regular); }
.autosave-note { display: inline-flex; align-items: center; flex-shrink: 0; gap: 4px; color: var(--el-text-color-secondary); font-size: 11px; }
.autosave-note .el-icon { color: var(--el-color-success); }
.workspace-actions { display: flex; align-items: center; flex-shrink: 0; gap: 8px; }
.workspace-actions .el-button { margin: 0; height: 30px; padding: 0 10px; font-size: 12px; border-radius: 7px; }
.workspace-actions .new-session-button, .workspace-actions .is-selected { color: var(--el-color-primary); border-color: transparent; background: var(--el-color-primary-light-9); }
.workspace-main { display: flex; flex: 1; min-height: 0; min-width: 0; position: relative; }
.chat-main { display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0; }
.thread { flex: 1; min-height: 80px; overflow-y: auto; overscroll-behavior: contain; padding: 26px 40px 12px; scrollbar-width: thin; }
.thread-content { display: flex; flex-direction: column; min-height: 100%; max-width: 1120px; margin: 0 auto; }
.older-messages { text-align: center; margin: 0 0 20px; }
.older-messages .el-button { font-size: 12px; }
.chat-welcome { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; min-height: 170px; padding: 24px 16px 64px; text-align: center; }
.welcome-symbol { color: var(--el-text-color-placeholder); font-size: 28px; opacity: .7; }
.chat-welcome h3 { margin: 18px 0 10px; color: var(--el-text-color-regular); font-size: 17px; font-weight: 500; }
.chat-welcome p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.8; }
.chat-welcome small { margin-top: 7px; color: var(--el-text-color-secondary); font-size: 11px; }
.message { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 28px; }
.message-avatar { display: grid; place-items: center; flex-shrink: 0; width: 30px; height: 30px; margin-top: 1px; border: 1px solid var(--el-border-color-lighter); border-radius: 9px; background: var(--el-bg-color); color: var(--el-color-primary); font-size: 16px; }
.message-body { flex: 1; min-width: 0; max-width: calc(100% - 42px); }
.message-label { display: flex; align-items: baseline; gap: 9px; margin: 3px 0 10px; line-height: 1.3; }
.message-label strong { font-size: 12px; font-weight: 500; color: var(--el-text-color-regular); overflow-wrap: anywhere; }
.message-label time { color: var(--el-text-color-secondary); font-size: 10px; font-variant-numeric: tabular-nums; }
.message-bubble { font-size: 14px; line-height: 1.85; overflow-wrap: anywhere; }
.message-text { white-space: pre-wrap; margin: 0; }
.message.user { flex-direction: row-reverse; margin-left: 20%; }
.message.user .message-body { flex: initial; }
.message.user .message-label { justify-content: flex-end; margin-bottom: 7px; }
.message.user .message-avatar { color: var(--el-text-color-regular); background: var(--el-bg-color); border-color: var(--el-border-color-light); }
.message.user .message-bubble { padding: 12px 17px; background: var(--el-color-primary-light-8); border: 1px solid var(--el-color-primary-light-5); border-radius: 16px 4px 16px 16px; box-shadow: 0 2px 6px rgb(0 0 0 / 4%); }
html.dark .message.user .message-bubble, html[data-theme='dark'] .message.user .message-bubble { background: #303030; border-color: #606060; box-shadow: 0 2px 8px rgb(0 0 0 / 12%); }
.message-links { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 9px; }
.message-links button { display: inline-flex; align-items: center; gap: 5px; padding: 1px 0; border: 0; background: transparent; font: inherit; color: var(--el-text-color-secondary); font-size: 11px; cursor: pointer; }
.message-links button:hover, .message-links button.active { color: var(--el-color-primary); }
.message-links button:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; border-radius: 3px; }
.message-links button > span { padding: 0 4px; border-radius: 3px; background: var(--el-fill-color); font-size: 10px; }
.message-status { display: inline-block; margin-top: 6px; color: var(--el-color-danger); font-size: 11px; }
.message-status.processing { color: var(--el-text-color-regular); }
.recovery-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 8px; color: var(--el-text-color-regular); font-size: 11px; }
.markdown-content { min-width: 0; }
.markdown-content :deep(> :first-child) { margin-top: 0; }
.markdown-content :deep(> :last-child) { margin-bottom: 0; }
.markdown-content :deep(p) { margin: 0 0 12px; }
.markdown-content :deep(h1), .markdown-content :deep(h2), .markdown-content :deep(h3), .markdown-content :deep(h4) { margin: 18px 0 9px; font-size: 16px; line-height: 1.6; font-weight: 600; }
.markdown-content :deep(ul), .markdown-content :deep(ol) { padding-left: 22px; margin: 10px 0; }
.markdown-content :deep(li + li) { margin-top: 4px; }
.markdown-content :deep(pre) { max-width: 100%; padding: 14px 16px; overflow-x: auto; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-bg-color); white-space: pre; line-height: 1.6; }
.markdown-content :deep(code) { padding: 2px 5px; border-radius: 4px; background: var(--el-fill-color); font-family: 'SFMono-Regular', Consolas, monospace; font-size: .9em; }
.markdown-content :deep(pre code) { padding: 0; background: transparent; }
.markdown-content :deep(blockquote) { margin: 12px 0; padding-left: 12px; border-left: 3px solid var(--el-border-color); color: var(--el-text-color-regular); }
.markdown-content :deep(a) { color: var(--el-color-primary); text-decoration: underline; text-underline-offset: 3px; }
.markdown-content :deep(table) { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
.markdown-content :deep(th), .markdown-content :deep(td) { padding: 7px 10px; border: 1px solid var(--el-border-color); text-align: left; }
.thinking-note { display: flex; align-items: center; gap: 9px; margin: 0 0 12px 42px; color: var(--el-text-color-regular); font-size: 11px; }
.thinking-dots { display: inline-flex; align-items: center; gap: 4px; height: 16px; }
.thinking-dots i { width: 4px; height: 4px; border-radius: 50%; background: var(--el-color-primary); animation: thinking 1.2s ease-in-out infinite; }
.thinking-dots i:nth-child(2) { animation-delay: .15s; }
.thinking-dots i:nth-child(3) { animation-delay: .3s; }
@keyframes thinking { 0%,70%,100% { opacity: .35; transform: translateY(0); } 35% { opacity: 1; transform: translateY(-3px); } }
.elapsed { margin-left: 8px; font-variant-numeric: tabular-nums; }
.load-error { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 24px; background: var(--el-color-danger-light-9); color: var(--el-color-danger); font-size: 12px; }
.stream-error { margin: 0; padding: 6px 28px; color: var(--el-color-danger); font-size: 12px; }
.composer { flex-shrink: 0; padding: 8px 28px 20px; }
.composer-card { max-width: 1120px; margin: 0 auto; padding: 14px 18px 10px; border: 1px solid var(--el-border-color-light); border-radius: 14px; background: var(--el-bg-color); box-shadow: 0 2px 8px rgb(0 0 0 / 3%); transition: border-color .15s, box-shadow .15s; }
.composer-card:focus-within { border-color: var(--el-color-primary); box-shadow: 0 0 0 2px var(--el-color-primary-light-9); }
.composer-card.is-disabled { background: var(--el-fill-color-lighter); }
.composer label { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.composer :deep(.el-textarea__inner) { padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; color: var(--el-text-color-primary); font-family: inherit; font-size: 14px; line-height: 1.7; }
.composer :deep(.el-textarea__inner:focus), .composer :deep(.el-textarea__inner:hover) { box-shadow: none; }
.composer :deep(.el-textarea.is-disabled .el-textarea__inner) { background: transparent; }
.composer-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; }
.composer-actions > small { color: var(--el-text-color-secondary); font-size: 10px; }
.composer-actions kbd { font: inherit; }
.composer-tools { display: flex; align-items: center; gap: 10px; }
.composer-tools .el-button { margin: 0; }
.send-button { min-width: 32px; height: 32px; }
.pending-attachments { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
.pending-attachments > span { display: inline-flex; align-items: center; gap: 7px; max-width: 100%; padding: 6px 9px; border: 1px solid var(--el-border-color-lighter); border-radius: 7px; background: var(--el-fill-color-light); font-size: 11px; }
.pending-attachments strong { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.pending-attachments small { color: var(--el-text-color-secondary); font-size: 10px; }
.pending-attachments button { border: 0; background: transparent; color: var(--el-text-color-regular); cursor: pointer; }
.run-inspector { display: flex; flex-direction: column; flex-shrink: 0; width: 360px; min-width: 0; margin: 14px 18px 20px 0; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-bg-color); overflow: hidden; }
.inspector-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 10px 10px 12px; border-bottom: 1px solid var(--el-border-color-lighter); }
.inspector-heading > .el-button { margin: 0; width: 26px; height: 26px; }
.inspector-tabs { display: flex; gap: 4px; }
.inspector-tabs > button { display: inline-flex; align-items: center; gap: 5px; padding: 7px 9px; border: 0; border-radius: 6px; background: transparent; color: var(--el-text-color-regular); font: inherit; font-size: 12px; cursor: pointer; }
.inspector-tabs > button[aria-selected='true'] { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.inspector-tabs > button:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 1px; }
.inspector-tabs > button > span { font-size: 10px; opacity: .8; }
.inspector-run { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--el-border-color-lighter); }
.inspector-run > span { flex-shrink: 0; font-size: 11px; color: var(--el-text-color-secondary); }
.inspector-run .el-select { flex: 1; min-width: 0; }
.inspector-content { flex: 1; min-height: 0; overflow-y: auto; padding: 18px 16px; scrollbar-width: thin; }
.inspector-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 11px; padding: 52px 10px; text-align: center; color: var(--el-text-color-secondary); }
.inspector-empty > .el-icon { color: var(--el-text-color-placeholder); font-size: 27px; }
.inspector-empty strong { font-size: 13px; font-weight: 500; color: var(--el-text-color-regular); }
.inspector-empty p { margin: 0; max-width: 230px; font-size: 12px; line-height: 1.8; }
.panel-hint { margin: 0; color: var(--el-text-color-regular); font-size: 12px; }
.panel-error { color: var(--el-color-danger); font-size: 12px; line-height: 1.7; }
.trace-list { display: flex; flex-direction: column; gap: 20px; list-style: none; padding: 0 0 6px; margin: 0; }
.trace-list > li { display: flex; gap: 10px; color: var(--el-text-color-regular); font-size: 12px; }
.trace-dot { flex-shrink: 0; width: 6px; height: 6px; margin-top: 5px; border-radius: 50%; background: var(--el-color-primary); }
.trace-list > li > div { flex: 1; min-width: 0; }
.trace-list header { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.trace-list header strong { font-weight: 500; overflow-wrap: anywhere; }
.trace-list time { flex-shrink: 0; color: var(--el-text-color-secondary); font-size: 10px; font-variant-numeric: tabular-nums; }
.trace-agent { display: block; margin-top: 5px; color: var(--el-text-color-secondary); font-size: 10px; }
.trace-result { margin-top: 6px; }
.trace-result summary { padding: 3px 0; cursor: pointer; color: var(--el-text-color-regular); font-size: 11px; }
.trace-result pre { max-height: 320px; overflow: auto; margin: 7px 0 0; padding: 10px; border-radius: 6px; background: var(--el-fill-color-lighter); white-space: pre-wrap; overflow-wrap: anywhere; font: 11px/1.7 'SFMono-Regular', Consolas, monospace; }
.trace-error { color: var(--el-color-danger) !important; }
.trace-error .trace-dot { background: var(--el-color-danger); }
.artifact-list { list-style: none; margin: 0; padding: 0; }
.artifact-list > li { display: flex; gap: 11px; padding: 14px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.artifact-list > li:first-child { padding-top: 0; }
.artifact-icon { display: grid; place-items: center; width: 34px; height: 38px; flex-shrink: 0; border-radius: 7px; background: var(--el-fill-color-light); color: var(--el-color-primary); font-size: 19px; }
.artifact-details { flex: 1; min-width: 0; }
.artifact-details > strong { display: block; overflow-wrap: anywhere; font-size: 12px; color: var(--el-text-color-primary); font-weight: 500; }
.artifact-details > small { display: block; margin-top: 6px; color: var(--el-text-color-secondary); font-size: 10px; }
.artifact-details > div { display: flex; gap: 8px; margin-top: 6px; }
.artifact-details .el-button { margin: 0; height: 22px; padding: 0 3px; font-size: 11px; }
.history-dialog-heading h2 { margin: 0; font-size: 17px; font-weight: 600; color: var(--el-text-color-primary); }
.history-dialog-heading p { margin: 6px 0 0; color: var(--el-text-color-secondary); font-size: 12px; }
.history-toolbar { display: flex; gap: 10px; margin-bottom: 18px; }
.history-toolbar .el-input { flex: 1; min-width: 0; }
.history-toolbar .el-button { margin: 0; }
.history-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
.history-title > .el-icon { color: var(--el-text-color-secondary); font-size: 16px; flex-shrink: 0; }
.history-title > strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 500; }
.history-title .el-tag { flex-shrink: 0; }
.history-version { color: var(--el-text-color-regular); font-size: 12px; }
.session-history-table { --el-table-header-bg-color: var(--el-fill-color-lighter); }
.session-history-table :deep(.el-table__row) { cursor: pointer; }
.session-history-table :deep(.is-current-session > td) { background: var(--el-color-primary-light-9); }
.session-history-table time { color: var(--el-text-color-regular); font-size: 12px; }
.history-dialog-footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.history-dialog-footer > span { margin-right: auto; color: var(--el-text-color-secondary); font-size: 12px; }
@media(min-width: 1800px) { .thread-content, .composer-card { max-width: 1360px; } }
@media(max-width: 1100px) { .autosave-note { display: none; } .run-inspector { width: 320px; margin-right: 12px; } .thread { padding: 22px 26px 12px; } .composer { padding: 8px 20px 16px; } }
@media(max-width: 820px) { .run-inspector { position: absolute; z-index: 2; inset: 8px 8px 12px auto; width: min(360px,calc(100% - 16px)); margin: 0; box-shadow: 0 8px 30px rgb(0 0 0 / 10%); } .chat-heading { gap: 10px; padding: 7px 14px; } .chat-heading-title { max-width: 35%; } .workspace-actions { gap: 4px; } .workspace-actions .el-button { padding: 0 7px; } }
@media(max-width: 640px) { .chat-heading { flex-wrap: wrap; gap: 9px; padding: 10px 12px; } .chat-heading-title { max-width: 100%; flex: 1 1 100%; } .workspace-actions { width: 100%; justify-content: flex-end; } .thread { padding: 20px 14px 10px; } .message { gap: 9px; margin-bottom: 24px; } .message-avatar { width: 26px; height: 26px; font-size: 14px; } .message-body { max-width: calc(100% - 35px); } .message.user { margin-left: 8%; } .message-bubble { font-size: 14px; } .composer { padding: 6px 12px 12px; } .composer-card { padding: 12px 14px 8px; border-radius: 12px; } .composer :deep(.el-textarea__inner) { font-size: 16px; } .chat-welcome { padding-bottom: 32px; } .chat-welcome h3 { font-size: 16px; } .history-title { gap: 6px; } }
@media(prefers-reduced-motion: reduce) { .composer-card { transition: none; } .thinking-dots i { animation: none; } }
</style>
