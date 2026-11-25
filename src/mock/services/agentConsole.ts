import type { AgentConsoleApi, AgentSchedule, AgentScheduleRequest, AgentSpec, SkillImportDraft } from '@/api/agentConsole'
import { agents, agentById, capabilities, copy, models, nextId, publish, release, releases, removeRow, saveRow } from './agentCatalog'
import { chat } from './agentConversation'
import { demoUserId } from './auth'

const schedules = new Map<number, AgentSchedule[]>()
function tasks() {
  const user = demoUserId()
  if (!schedules.has(user)) schedules.set(user, [{ id: nextId(), name: '每日日志摘要', agentCode: 'ops-demo', input: '整理今天的日志',
    scheduleType: 'CRON', cronExpression: '0 0 9 ? * *', zoneId: 'Asia/Shanghai', enabled: false, nextFireAt: null, running: false }])
  return schedules.get(user)!
}
function updateTask(id: number, body: AgentScheduleRequest) {
  return saveRow(tasks(), { ...body, id, running: false, nextFireAt: body.enabled ? body.executeAt ?? null : null })
}
function preview(source: string) {
  const skill = { sourcePath: 'example/SKILL.md', code: 'example-skill', name: '示例技能', enabled: true, description: source,
    content: '# 示例技能\n汇总输入内容。', resources: {}, toolIds: [] }
  return { skills: [skill], warnings: ['此预览使用本地演示文件。'] }
}
function importSkill(skill: SkillImportDraft) {
  const saved = saveRow(capabilities, { ...skill, kind: 'SKILL', skill: { content: skill.content, resources: skill.resources, toolIds: skill.toolIds } })
  return { id: saved.id!, code: saved.code, name: saved.name }
}

export const mockAgentConsole: AgentConsoleApi = {
  ...chat,
  models: async () => copy(models),
  saveModel: async body => saveRow(models, { ...body, apiKey: body.apiKey ? '********' : '' }),
  deleteModel: async id => removeRow(models, row => row.id === id),
  invokeModel: async (_id, input) => '演示回复：' + input,
  capabilities: async kind => copy(capabilities.filter(row => !kind || row.kind === kind)),
  saveCapability: async body => saveRow(capabilities, body),
  deleteCapability: async (id, kind) => removeRow(capabilities, row => row.id === id && row.kind === kind),
  previewSkillArchive: async file => preview(file.name),
  previewGithubSkills: async body => preview(body.url),
  importSkills: async skills => {
    const codes = new Set(capabilities.filter(row => row.kind === 'SKILL').map(row => row.code))
    for (const row of skills) {
      if (codes.has(row.code)) throw new Error('技能编码重复')
      codes.add(row.code)
    }
    return skills.map(importSkill)
  },
  agents: async () => copy(agents),
  saveAgent: async body => {
    if (agents.some(row => row.draft.code === body.code && row.draft.id !== body.id)) throw new Error('智能体编码重复')
    if (body.id != null) {
      const agent = agentById(body.id)
      agent.draft = copy(body)
      return copy(agent)
    }
    const agent = { draft: copy({ ...body, id: nextId() }), activeVersion: 0, activeReleaseId: '', callCount: 0 }
    agents.push(agent)
    return copy(agent)
  },
  deleteAgent: async id => removeRow(agents, row => row.draft.id === id),
  preflight: async id => {
    const passed = models.some(model => model.id === agentById(id).draft.modelConfigId && model.enabled)
    return { passed, durationMs: 0, checks: [{ name: '演示模型连接', status: passed ? 'PASS' : 'ERROR', detail: passed ? '已配置可用的演示模型' : '请选择已启用的模型', durationMs: 0 }] }
  },
  publish: async id => publish(id),
  releases: async id => releases(id).map(({ id, version, createdAt, createdBy }) => ({ id, version, createdAt, createdBy })),
  releaseDiff: async (id, from, to) => {
    const a = release(id, from), b = release(id, to)
    const changes = (Object.keys(b.spec) as (keyof AgentSpec)[]).filter(key => JSON.stringify(a.spec[key]) !== JSON.stringify(b.spec[key]))
      .map(path => ({ path, sensitive: path === 'environment', before: path === 'environment' ? '********' : JSON.stringify(a.spec[path]), after: path === 'environment' ? '********' : JSON.stringify(b.spec[path]) }))
    return { fromVersion: a.version, toVersion: b.version, changes }
  },
  rollback: async (id, target) => publish(id, release(id, target).spec),
  schedules: async () => copy(tasks()),
  createSchedule: async body => {
    const row = { ...body, id: nextId(), running: false, nextFireAt: body.enabled ? body.executeAt ?? null : null }
    tasks().push(copy(row))
    return copy(row)
  },
  updateSchedule: async (id, body) => updateTask(id, body),
  setScheduleEnabled: async (id, enabled) => {
    const row = tasks().find(row => row.id === id)
    if (!row) throw new Error('任务不存在')
    return updateTask(id, { ...row, enabled })
  },
  deleteSchedule: async id => { removeRow(tasks(), row => row.id === id) },
  scheduleExecutions: async () => [],
  rotateSecrets: async () => ({ activeKeyId: 'demo', updatedRows: 0 }),
}
