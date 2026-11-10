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
export interface InvokeResult {
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
const root = '/api/v1/agent-console'
export const agentConsole = {
  models: () => request.get<ModelConfig[]>(`${root}/models`),
  saveModel: (value: ModelConfig) => request.post<ModelConfig>(`${root}/models`, { ...value }),
  deleteModel: (id: number) => request.delete(`${root}/models/${id}`),
  invokeModel: (id: number, input: string) =>
    request.post<string>(
      `${root}/models/invoke`,
      { modelConfigId: id, input },
      { timeout: 150000, _skipAuthRefresh: true },
    ),
  capabilities: () => request.get<Capability[]>(`${root}/capabilities`),
  saveCapability: (value: Capability) =>
    request.post<Capability>(`${root}/capabilities`, { ...value }),
  deleteCapability: (id: number) => request.delete(`${root}/capabilities/${id}`),
  agents: () => request.get<AgentView[]>(`${root}/agents`),
  saveAgent: (value: AgentSpec) => request.post<AgentView>(`${root}/agents`, { ...value }),
  deleteAgent: (id: number) => request.delete(`${root}/agents/${id}`),
  releases: (id: number) => request.get<ReleaseView[]>(`${root}/agents/${id}/releases`),
  publish: (id: number) => request.post<ReleaseView>(`${root}/agents/${id}/publish`),
  invoke: (code: string, input: string, sessionId?: string) =>
    request.post<InvokeResult>(
      `${root}/agents/by-code/${encodeURIComponent(code)}/invoke`,
      { input, sessionId },
      { timeout: 330000, _skipAuthRefresh: true },
    ),
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
