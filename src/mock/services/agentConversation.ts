import type { AgentConsoleApi, AgentFile, AgentMessage, AgentProgress, AgentSession, RunView } from '@/api/agentConsole'
import { agents, agentById, copy, nextId } from './agentCatalog'
import { demoUserId } from './auth'

interface Conversation {
  user: number
  session: AgentSession
  messages: AgentMessage[]
  files: Map<string, { info: AgentFile; blob: Blob; runId: string }>
  runs: Map<string, { run: RunView; events: AgentProgress[] }>
}
const history: Conversation[] = []
const now = () => new Date().toISOString()
function own() { return history.filter(row => row.user === demoUserId()) }
function conversation(id: number, sessionId: string) {
  const row = own().find(row => row.session.agentId === id && row.session.sessionId === sessionId)
  if (!row) throw new Error('会话不存在')
  return row
}
function create(agentId: number, title = '新对话') {
  const agent = agentById(agentId)
  const session = { agentId, sessionId: String(nextId()), releaseId: agent.activeReleaseId, version: agent.activeVersion, title, updateTime: now() }
  history.push({ user: demoUserId(), session, messages: [], files: new Map(), runs: new Map() })
  return copy(session)
}
function locate(runId: string) {
  for (const row of own()) {
    const entry = row.runs.get(runId)
    if (entry) return entry
  }
  throw new Error('运行记录不存在')
}

async function execute(code: string, input: string, sessionId?: string, emit?: (event: AgentProgress) => void, signal?: AbortSignal, attachments: string[] = []) {
  const agent = agents.find(row => row.draft.code === code)
  if (!agent?.draft.id || !agent.activeVersion) throw new Error('请先发布智能体')
  const id = agent.draft.id
  const chat = conversation(id, sessionId || create(id, input.slice(0, 80)).sessionId)
  const runId = String(nextId())
  const run: RunView = { id: runId, rootRunId: runId, parentRunId: '', agentId: id, agentCode: code, version: chat.session.version,
    userId: String(chat.user), status: 'RUNNING', input, output: '', error: '', inputTokens: 0, outputTokens: 0, usageKnown: false, startedAt: now(), finishedAt: '' }
  const events: AgentProgress[] = []
  function event(type: AgentProgress['type'], title: string, text = '') {
    const row = { sequence: events.length + 1, type, rootRunId: runId, runId, parentRunId: '', agentCode: code,
      title, text, callId: runId, toolName: '', status: run.status, timestamp: Date.now() }
    events.push(row)
    emit?.(copy(row))
  }
  chat.runs.set(runId, { run, events })
  for (const key of attachments) {
    const file = chat.files.get(key)
    if (file) file.runId = runId
  }
  if (chat.session.title === '新对话') chat.session.title = input.slice(0, 80)
  chat.messages.push({ id: nextId(), runId, role: 'user', content: input, status: 'SUCCEEDED', createTime: now() })
  agent.callCount++
  event('RUN_STARTED', '开始演示')
  event('MODEL_STARTED', '生成演示回复')
  for (const part of ['这是本地演示回复。', '收到你的消息：', input]) {
    await new Promise(resolve => setTimeout(resolve, 100))
    if (signal?.aborted || run.cancelRequested) { run.status = 'CANCELLED'; break }
    run.output += part
    event('TEXT_DELTA', '输出回复', part)
  }
  if (run.status === 'RUNNING') {
    run.status = 'SUCCEEDED'
    const blob = new Blob([run.output], { type: 'text/plain;charset=utf-8' })
    const info: AgentFile = { id: String(nextId()), kind: 'ARTIFACT', name: '演示回复.txt', sizeBytes: blob.size, sha256: '', createTime: now() }
    chat.files.set(info.id, { info, blob, runId })
    event('ARTIFACT', '已生成回复文件', info.name)
  }
  run.finishedAt = now()
  chat.session.updateTime = run.finishedAt
  chat.messages.push({ id: nextId(), runId, role: 'assistant', content: run.output, status: run.status, createTime: now() })
  event(run.status === 'SUCCEEDED' ? 'RUN_FINISHED' : 'ERROR', '结束演示', run.status === 'SUCCEEDED' ? run.output : '已停止')
  return { sessionId: chat.session.sessionId, runId, output: run.output, inputTokens: 0, outputTokens: 0, usageKnown: false }
}

type ChatMethods = 'sessions' | 'createSession' | 'messages' | 'invoke' | 'invokeStream' | 'progress' | 'runs' | 'run' | 'cancelRun' | 'uploadFile' | 'downloadFile' | 'deleteFile' | 'files' | 'recover' | 'quota'
export const chat: Pick<AgentConsoleApi, ChatMethods> = {
  sessions: async (id, offset = 0) => copy(own().filter(row => row.session.agentId === id).map(row => row.session)
    .sort((a, b) => b.updateTime.localeCompare(a.updateTime)).slice(offset, offset + 50)),
  createSession: async (id, title) => create(id, title),
  messages: async (id, session, before) => copy(conversation(id, session).messages.filter(row => before == null || row.id < before).slice(-100)),
  invoke: execute,
  invokeStream: async (...args) => { await execute(...args) },
  progress: async (id, session, run) => copy(conversation(id, session).runs.get(run)?.events ?? []),
  runs: async () => copy(own().flatMap(row => [...row.runs.values()].map(entry => entry.run)).reverse()),
  run: async id => ({ agents: [copy(locate(id).run)], modelCalls: [], totalInputTokens: 0, totalOutputTokens: 0, usageKnown: false }),
  cancelRun: async id => { locate(id).run.cancelRequested = true },
  quota: async () => ({ usageDay: now().slice(0, 10), usedRequests: own().flatMap(row => [...row.runs.values()]).filter(row => row.run.startedAt.slice(0, 10) === now().slice(0, 10)).length, dailyLimit: 0, remainingRequests: null }),
  uploadFile: async (id, session, file, progress) => {
    const info: AgentFile = { id: String(nextId()), kind: 'ATTACHMENT', name: file.name, sizeBytes: file.size, sha256: '', createTime: now() }
    conversation(id, session).files.set(info.id, { info, blob: file, runId: '' })
    progress?.(100)
    return copy(info)
  },
  files: async (id, session, runId) => copy([...conversation(id, session).files.values()].filter(row => row.runId === runId).map(row => row.info)),
  downloadFile: async (id, session, fileId) => {
    const row = conversation(id, session).files.get(fileId)
    if (!row) throw new Error('文件不存在')
    return row.blob
  },
  deleteFile: async (id, session, fileId) => { conversation(id, session).files.delete(fileId) },
  recover: async (id, session, runId) => {
    const source = conversation(id, session)
    const entry = source.runs.get(runId)
    if (!entry) throw new Error('运行记录不存在')
    const next = conversation(id, create(id, source.session.title).sessionId)
    next.session.version = source.session.version
    next.session.releaseId = source.session.releaseId
    const index = source.messages.findIndex(row => row.runId === runId)
    next.messages = copy(source.messages.slice(0, index))
    const attachments: AgentFile[] = []
    for (const row of source.files.values()) {
      if (row.runId !== runId || row.info.kind !== 'ATTACHMENT') continue
      const info = { ...row.info, id: String(nextId()) }
      next.files.set(info.id, { ...row, info, runId: '' })
      attachments.push(info)
    }
    return { session: copy(next.session), input: entry.run.input, attachments, sourceRunId: runId }
  },
}
