import type { AgentSpec, AgentView, Capability, ModelConfig, ReleaseView } from '@/api/agentConsole'

export function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

let sequence = 100
export function nextId() { return ++sequence }

export function saveRow<T extends { id?: number }>(rows: T[], value: T): T {
  const saved = copy({ ...value, id: value.id ?? nextId() })
  if (value.id == null) rows.push(saved)
  else {
    const index = rows.findIndex(row => row.id === value.id)
    if (index < 0) throw new Error('记录不存在')
    rows[index] = saved
  }
  return copy(saved)
}
export function removeRow<T>(rows: T[], predicate: (row: T) => boolean) {
  const index = rows.findIndex(predicate)
  if (index < 0) throw new Error('记录不存在')
  rows.splice(index, 1)
  return {}
}

export const models: ModelConfig[] = [{ id: 1, name: '演示模型', model: 'demo', provider: 'GPT', protocol: 'OPENAI_CHAT', baseUrl: 'https://example.invalid', apiKey: '', generation: {}, enabled: true }]
export const capabilities: Capability[] = [{
  id: 1, kind: 'SKILL', code: 'daily-report', name: '日志摘要', description: '整理运行日志', enabled: true,
  skill: { content: '整理日志中的重要变化。', resources: {}, toolIds: [] },
}, {
  id: 2, kind: 'TOOL', code: 'metrics', name: '运行指标', description: '演示工具配置', enabled: true,
  tool: { kind: 'HTTP', url: 'https://example.invalid/metrics', method: 'GET', headers: {}, inputSchema: {}, script: '', projectApi: false, permissionCode: '' },
}, {
  id: 3, kind: 'MCP', code: 'ops-mcp', name: '运维服务', description: '演示 MCP 连接', enabled: true,
  mcp: { url: 'https://example.invalid/mcp', headers: {}, allowedTools: [] },
}, {
  id: 4, kind: 'KNOWLEDGE', code: 'handbook', name: '操作手册', description: '演示知识库连接', enabled: true,
  tool: { kind: 'HTTP', url: 'https://example.invalid/search', method: 'POST', headers: {}, inputSchema: {}, script: '', projectApi: false, permissionCode: '' },
}, {
  id: 5, kind: 'SANDBOX', code: 'demo-workspace', name: '演示工作区', description: '本地预览模板', enabled: true,
  sandbox: { templateId: 'demo-template', timeoutSeconds: 60 },
}]
const draft: AgentSpec = {
  id: 1, name: '运行助手', code: 'ops-demo', description: '用于体验对话、版本与运行记录。', avatar: '', prompt: '帮助阅读运行日志。',
  modelConfigId: 1, maxRounds: 4, enabled: true, sandboxEnabled: false, planMode: false, outputFormat: 'TEXT', outputSchema: {},
  generation: {}, skillIds: [1], toolIds: [], mcpIds: [], knowledgeIds: [], childAgentIds: [], environment: {},
}
export const agents: AgentView[] = [{ draft, activeReleaseId: '', activeVersion: 0, callCount: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCachedTokens: null }]
interface Snapshot extends ReleaseView { spec: AgentSpec }
const history = new Map<number, Snapshot[]>()

export function agentById(id: number) {
  const agent = agents.find(row => row.draft.id === id)
  if (!agent) throw new Error('智能体不存在')
  return agent
}
export function releases(id: number) { return history.get(id) ?? [] }
export function release(id: number, releaseId: string) {
  const row = releases(id).find(row => row.id === releaseId)
  if (!row) throw new Error('发布版本不存在')
  return row
}
export function publish(id: number, spec = agentById(id).draft): ReleaseView {
  const agent = agentById(id)
  const row = { id: String(nextId()), version: agent.activeVersion + 1, createdAt: new Date().toISOString(), createdBy: 'Demo', spec: copy(spec) }
  history.set(id, [row, ...releases(id)])
  agent.activeReleaseId = row.id
  agent.activeVersion = row.version
  return copy(row)
}
publish(1)
