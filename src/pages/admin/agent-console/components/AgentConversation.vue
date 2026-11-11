<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { agentConsole, type AgentView, type AgentSession, type AgentMessage } from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'
const props = defineProps<{ agent: AgentView }>()
const sessions = ref<AgentSession[]>([])
const current = ref<AgentSession>()
const messages = ref<AgentMessage[]>([])
const input = ref('')
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
onBeforeUnmount(() => { alive = false; generation++; clearTimeout(poll) })
const agentId = () => props.agent.draft.id!
async function bottom() { await nextTick(); thread.value?.scrollTo({ top: thread.value.scrollHeight }) }
async function select(session: AgentSession) {
  if (sending.value) return
  const token = ++generation
  current.value = session
  messages.value = []
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
  const text = input.value
  try {
    if (!current.value) {
      const session = await agentConsole.createSession(agentId(), text.slice(0, 120))
      if (!alive) return
      current.value = session
      sessions.value.unshift(session)
    }
    await agentConsole.invoke(props.agent.draft.code, text, current.value.sessionId)
    if (alive) input.value = ''
  } catch { if (alive) ElMessage.error('本轮未完成，请查看记录后重试') }
  finally {
    if (alive && current.value) {
      try {
        const rows = await agentConsole.messages(agentId(), current.value.sessionId)
        if (alive) { messages.value = rows; moreMessages.value = rows.length === 100; await bottom() }
      } catch { if (alive) failed.value = true }
    }
    if (alive) { sending.value = false; scheduleRefresh(); if (!failed.value) await loadSessions() }
  }
}
onMounted(() => loadSessions())
</script>
<template>
  <div class="conversation">
    <aside aria-label="历史会话">
      <el-button v-if="hasPermission('ai:session:create:api')" type="primary" plain :disabled="sending || loading" :loading="creating" @click="create">新建对话</el-button>
      <nav aria-label="选择对话">
        <button v-for="session in sessions" :key="session.sessionId" class="session"
          :class="{ active: current?.sessionId === session.sessionId }" :disabled="sending || creating || loading"
          :aria-current="current?.sessionId === session.sessionId ? 'true' : undefined" @click="select(session)">
          <strong>{{ session.title }}</strong><small>v{{ session.version }} · {{ session.updateTime }}</small>
        </button>
      </nav>
      <el-button v-if="moreSessions" :disabled="sending" :loading="loading" text @click="loadSessions(true)">更多会话</el-button>
    </aside>
    <section class="chat" aria-label="对话内容">
      <div class="chat-heading"><strong>{{ current?.title || '开始一段新对话' }}</strong><span v-if="current">发布版本 v{{ current.version }}</span></div>
      <div v-if="failed" role="alert" class="load-error">记录加载失败。<el-button text :disabled="sending" @click="current ? select(current) : loadSessions()">重新加载</el-button></div>
      <div ref="thread" v-loading="loading" class="thread" role="log" aria-label="消息历史" aria-live="polite">
        <el-button v-if="moreMessages" :disabled="sending" :loading="loading" text @click="older">加载更早消息</el-button>
        <el-empty v-if="!messages.length && !loading" description="发送消息开始对话，历史记录会自动保存" :image-size="64" />
        <article v-for="message in messages" :key="message.id" class="message" :class="message.role">
          <div class="message-label">{{ message.role === 'user' ? '你' : agent.draft.name }}<small>{{ message.createTime }}</small></div>
          <pre>{{ message.content || (message.status === 'RUNNING' ? '正在处理…' : '本轮未返回内容') }}</pre>
          <small v-if="message.status !== 'SUCCEEDED'" class="message-status">{{ statusLabels[message.status] || '未完成' }}</small>
        </article>
        <p v-if="sending || pending" role="status">正在处理，完成后将保存本轮记录…</p>
      </div>
      <div class="composer">
        <label for="agent-chat-input">消息</label>
        <el-input id="agent-chat-input" v-model="input" type="textarea" :rows="3" :maxlength="100000"
          :disabled="sending || pending || loading || failed" placeholder="继续提问…" @keydown.ctrl.enter.prevent="send" @keydown.meta.enter.prevent="send" />
        <div class="composer-actions"><small>Ctrl / ⌘ + Enter 发送</small><el-button v-if="hasPermission('ai:agent:invoke')" type="primary"
          :loading="sending" :disabled="!input.trim() || pending || loading || failed" @click="send">发送</el-button></div>
      </div>
    </section>
  </div>
</template>
<style scoped>
.conversation { display: grid; grid-template-columns: 230px minmax(0,1fr); height: min(680px,76vh); border: 1px solid var(--el-border-color-light); border-radius: 12px; overflow: hidden; }
aside { padding: 16px; overflow-y: auto; background: var(--el-fill-color-light); border-right: 1px solid var(--el-border-color-light); }
nav { display: grid; gap: 8px; margin-top: 16px; }
.session { text-align: left; padding: 12px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--el-text-color-primary); cursor: pointer; min-height: 54px; }
.session strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.session small { display: block; margin-top: 6px; color: var(--el-text-color-secondary); font-size: 11px; }
.session.active { background: var(--el-bg-color); border-color: var(--el-color-primary-light-5); }
.session:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
.chat { min-width: 0; display: flex; flex-direction: column; }
.chat-heading { padding: 16px 20px; border-bottom: 1px solid var(--el-border-color-lighter); display: flex; justify-content: space-between; gap: 12px; }
.chat-heading span, .composer-actions small { color: var(--el-text-color-secondary); font-size: 12px; }
.thread { overflow-y: auto; flex: 1; padding: 20px; min-height: 80px; }
.message { padding: 14px 16px; border-radius: 10px; background: var(--el-fill-color-light); margin-bottom: 16px; }
.message.user { margin-left: 24px; background: var(--el-color-primary-light-9); }
.message-label { font-weight: 600; display: flex; justify-content: space-between; gap: 12px; }
.message-label small { font-weight: 400; color: var(--el-text-color-secondary); }
.message pre { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; line-height: 1.7; margin-bottom: 0; }
.message-status, .load-error { color: var(--el-color-danger); }
.composer { border-top: 1px solid var(--el-border-color-lighter); padding: 12px 20px; }
.composer label { display: block; margin-bottom: 8px; }
.composer-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
@media(max-width: 640px) { .conversation { grid-template-columns: 1fr; height: 78vh; } aside { max-height: 130px; border-right: 0; } nav { display: flex; overflow-x: auto; } .session { min-width: 150px; } .chat { min-height: 0; } .message-label { flex-direction: column; gap: 4px; } }
</style>
