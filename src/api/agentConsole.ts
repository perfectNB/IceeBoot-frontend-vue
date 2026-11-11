import { request } from '@/utils/request'

export type Provider =
  | 'GPT'
  | 'CLAUDE'
  | 'GEMINI'
  | 'QWEN'
  | 'DEEPSEEK'
  | 'GLM'
  | 'KIMI'
  | 'MINIMAX'
export type CapabilityKind = 'SKILL' | 'TOOL' | 'MCP' | 'SANDBOX' | 'KNOWLEDGE'
export interface Generation {
  temperature?: number
  maxTokens?: number
  thinking?: boolean
  reasoningEffort?: string
  thinkingBudget?: number
  extra?: Record<string, unknown>
}
export interface ModelConfig {
  id?: number
  name: string
  provider: Provider
  protocol: string
  baseUrl: string
  apiKey: string
  model: string
  contextWindow?: number
  enabled: boolean
  generation: Generation
}
export interface ToolConfig {
  kind: 'HTTP' | 'SCRIPT'
  url: string
  method: string
  headers: Record<string, string>
  inputSchema: Record<string, unknown>
  script: string
  projectApi: boolean
  permissionCode: string
}
export interface Capability {
  id?: number
  kind: CapabilityKind
  code: string
  name: string
  description: string
  enabled: boolean
  skill?: { content: string; resources: Record<string, string>; toolIds: number[] }
  tool?: ToolConfig
  mcp?: { url: string; headers: Record<string, string>; allowedTools: string[] }
  sandbox?: { templateId: string; timeoutSeconds: number }
}
export interface SkillImportDraft {
  code: string
  name: string
  description: string
  enabled: boolean
  content: string
  resources: Record<string, string>
  toolIds: number[]
}
export interface SkillImportItem extends SkillImportDraft { sourcePath: string }
export interface SkillImportPreview { skills: SkillImportItem[]; warnings: string[] }
export interface SkillGithubRequest { url: string; ref?: string; path?: string }
export interface AgentSpec {
  id?: number
  code: string
  name: string
  description: string
  avatar: string
  prompt: string
  modelConfigId?: number
  maxRounds: number
  enabled: boolean
  sandboxEnabled: boolean
  sandboxTemplateId?: number
  planMode: boolean
  outputFormat: 'TEXT' | 'JSON_SCHEMA'
  outputSchema: Record<string, unknown>
  generation: Generation
  skillIds: number[]
  toolIds: number[]
  mcpIds: number[]
  knowledgeIds: number[]
  childAgentIds: number[]
  environment: Record<string, string>
}
export interface AgentView {
  draft: AgentSpec
  activeReleaseId: string
  activeVersion: number
  callCount: number
}
export interface ReleaseView {
  id: string
  version: number
  createdAt: string
  createdBy: string
}
export interface AgentSession {
  agentId: number
  sessionId: string
  releaseId: string
  version: number
  title: string
  updateTime: string
}
export interface AgentMessage {
  id: number
  runId: string
  role: 'user' | 'assistant'
  content: string
  status: string
  createTime: string
}
export interface AgentProgress {
  sequence: number
  type: 'RUN_STARTED' | 'PHASE' | 'MODEL_STARTED' | 'REASONING_DELTA' | 'REASONING_FINISHED' | 'TEXT_DELTA' | 'TOOL_STARTED' | 'TOOL_FINISHED' | 'AGENT_FINISHED' | 'RUN_FINISHED' | 'ERROR' | 'HEARTBEAT'
  rootRunId: string
  runId: string
  parentRunId: string
  agentCode: string
  title: string
  text: string
  callId: string
  toolName: string
  status: string
  timestamp: number
}
export interface InvokeResult {
  sessionId: string
  runId: string
  output: string
  inputTokens: number
  outputTokens: number
  usageKnown: boolean
}
export interface RunView {
  id: string
  rootRunId: string
  parentRunId: string
  agentId: number
  agentCode: string
  version: number
  userId: string
  status: string
  input: string
  output: string
  error: string
  inputTokens: number
  outputTokens: number
  usageKnown: boolean
  startedAt: string
  finishedAt: string
  errorCode?: string
  traceId?: string
  cancelRequested?: boolean
}
export interface ModelCall {
  id: string
  runId: string
  rootRunId: string
  agentCode: string
  model: string
  input: string
  output: string
  inputTokens: number
  outputTokens: number
  usageKnown: boolean
  createdAt: string
}
export interface RunDetail {
  agents: RunView[]
  modelCalls: ModelCall[]
  totalInputTokens: number
  totalOutputTokens: number
  usageKnown: boolean
}
export interface AgentQuota {
  usageDay: string
  usedRequests: number
  dailyLimit: number
  remainingRequests: number | null
}
export interface SecretRotation {
  activeKeyId: string
  updatedRows: number
}
const root = '/api/v1/agent-console'
const capabilityRoutes: Record<CapabilityKind, string> = {
  SKILL: 'skills',
  TOOL: 'tools',
  MCP: 'mcps',
  SANDBOX: 'sandbox-templates',
  KNOWLEDGE: 'knowledge',
}

interface CapabilityResource {
  id?: number
  code: string
  name: string
  description?: string
  enabled: boolean
  content?: string
  resources?: Record<string, string>
  toolIds?: number[]
  kind?: ToolConfig['kind']
  url?: string
  method?: string
  headers?: Record<string, string>
  inputSchema?: Record<string, unknown>
  script?: string
  projectApi?: boolean
  permissionCode?: string
  allowedTools?: string[]
  templateId?: string
  timeoutSeconds?: number
}

function capabilityFromResource(kind: CapabilityKind, value: CapabilityResource): Capability {
  const capability: Capability = {
    id: value.id,
    kind,
    code: value.code,
    name: value.name,
    description: value.description ?? '',
    enabled: value.enabled,
  }
  switch (kind) {
    case 'SKILL':
      capability.skill = {
        content: value.content ?? '',
        resources: value.resources ?? {},
        toolIds: value.toolIds ?? [],
      }
      break
    case 'TOOL':
    case 'KNOWLEDGE':
      capability.tool = {
        kind: value.kind ?? 'HTTP',
        url: value.url ?? '',
        method: value.method ?? 'POST',
        headers: value.headers ?? {},
        inputSchema: value.inputSchema ?? { type: 'object', properties: {} },
        script: value.script ?? '',
        projectApi: value.projectApi ?? false,
        permissionCode: value.permissionCode ?? '',
      }
      break
    case 'MCP':
      capability.mcp = {
        url: value.url ?? '',
        headers: value.headers ?? {},
        allowedTools: value.allowedTools ?? [],
      }
      break
    case 'SANDBOX':
      capability.sandbox = {
        templateId: value.templateId ?? '',
        timeoutSeconds: value.timeoutSeconds ?? 600,
      }
  }
  return capability
}

async function listCapabilities(kind: CapabilityKind): Promise<Capability[]> {
  const values = await request.get<CapabilityResource[]>(`${root}/${capabilityRoutes[kind]}`)
  return values.map((value) => capabilityFromResource(kind, value))
}

function capabilityPayload(value: Capability) {
  const details =
    value.kind === 'SKILL' ? value.skill
      : value.kind === 'MCP' ? value.mcp
        : value.kind === 'SANDBOX' ? value.sandbox
          : value.tool
  return {
    ...details,
    id: value.id,
    code: value.code,
    name: value.name,
    description: value.description,
    enabled: value.enabled,
  }
}

export const agentConsole = {
  models: async () => {
    const values = await request.get<ModelConfig[]>(`${root}/models`)
    return values.map((value) => ({ ...value, generation: value.generation ?? { extra: {} } }))
  },
  saveModel: (value: ModelConfig) => value.id != null
    ? request.put<ModelConfig>(`${root}/models`, { ...value })
    : request.post<ModelConfig>(`${root}/models`, { ...value }),
  deleteModel: (id: number) => request.delete(`${root}/models/${id}`),
  invokeModel: (id: number, input: string) =>
    request.post<string>(
      `${root}/models/invoke`,
      { modelConfigId: id, input },
      { timeout: 150000, _skipAuthRefresh: true },
    ),
  capabilities: async (kind?: CapabilityKind): Promise<Capability[]> => {
    if (kind) return listCapabilities(kind)
    const groups = await Promise.all(
      (Object.keys(capabilityRoutes) as CapabilityKind[]).map(listCapabilities),
    )
    return groups.flat()
  },
  saveCapability: async (value: Capability): Promise<Capability> => {
    const url = `${root}/${capabilityRoutes[value.kind]}`
    const payload = capabilityPayload(value)
    const saved = value.id != null
      ? await request.put<CapabilityResource>(url, payload)
      : await request.post<CapabilityResource>(url, payload)
    return capabilityFromResource(value.kind, saved)
  },
  deleteCapability: (id: number, kind: CapabilityKind) =>
    request.delete(`${root}/${capabilityRoutes[kind]}/${id}`),
  agents: () => request.get<AgentView[]>(`${root}/agents`),
  saveAgent: (value: AgentSpec) => value.id != null
    ? request.put<AgentView>(`${root}/agents`, { ...value })
    : request.post<AgentView>(`${root}/agents`, { ...value }),
  deleteAgent: (id: number) => request.delete(`${root}/agents/${id}`),
  releases: (id: number) => request.get<ReleaseView[]>(`${root}/agents/${id}/releases`),
  publish: (id: number) => request.post<ReleaseView>(`${root}/agents/${id}/publish`),
  invoke: (code: string, input: string, sessionId?: string) =>
    request.post<InvokeResult>(
      `${root}/agents/by-code/${encodeURIComponent(code)}/invoke`,
      { input, sessionId },
      { timeout: 330000, _skipAuthRefresh: true },
    ),
  invokeStream: async (code: string, input: string, sessionId: string, onEvent: (event: AgentProgress) => void, signal?: AbortSignal) => {
    let terminal = false
    await request.stream<AgentProgress>(`${root}/agents/by-code/${encodeURIComponent(code)}/stream`, { input, sessionId }, event => {
      if (event.type === 'RUN_FINISHED' || event.type === 'ERROR') terminal = true
      onEvent(event)
    }, signal)
    if (!terminal) throw new Error('连接已中断，请查看本轮执行状态后重试')
  },
  progress: (agentId: number, sessionId: string, runId: string) =>
    request.get<AgentProgress[]>(`${root}/agents/${agentId}/sessions/${encodeURIComponent(sessionId)}/events`, { runId }),
  sessions: (agentId: number, offset = 0) =>
    request.get<AgentSession[]>(`${root}/agents/${agentId}/sessions`, { offset }),
  createSession: (agentId: number, title = '新对话') =>
    request.post<AgentSession>(`${root}/agents/${agentId}/sessions`, { title }),
  messages: (agentId: number, sessionId: string, beforeId?: number) =>
    request.get<AgentMessage[]>(`${root}/agents/${agentId}/sessions/${encodeURIComponent(sessionId)}/messages`,
      beforeId === undefined ? {} : { beforeId }),
  previewSkillArchive: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request.post<SkillImportPreview>(`${root}/skills/import/archive`, form,
      { headers: { 'Content-Type': undefined }, timeout: 120000, skipErrorMessage: true })
  },
  previewGithubSkills: (value: SkillGithubRequest) =>
    request.post<SkillImportPreview>(`${root}/skills/import/github`, { ...value }, { timeout: 270000, skipErrorMessage: true }),
  importSkills: (skills: SkillImportDraft[]) =>
    request.post<{ id: number; code: string; name: string }[]>(`${root}/skills/import`, { skills }, { timeout: 120000, skipErrorMessage: true }),
  quota: () => request.get<AgentQuota>(`${root}/quota`),
  cancelRun: (id: string) => request.post<void>(`${root}/runs/${encodeURIComponent(id)}/cancel`),
  rotateSecrets: () => request.post<SecretRotation>(`${root}/secrets/rotate`, undefined, { timeout: 300000, _skipAuthRefresh: true }),
  runs: () => request.get<RunView[]>(`${root}/runs`),
  run: (id: string) => request.get<RunDetail>(`${root}/runs/${id}`),
}
export const providers: Provider[] = [
  'GPT',
  'CLAUDE',
  'GEMINI',
  'QWEN',
  'DEEPSEEK',
  'GLM',
  'KIMI',
  'MINIMAX',
]
