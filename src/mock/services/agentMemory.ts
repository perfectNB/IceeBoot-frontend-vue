import type { Candidate, GrantRequest, MemoryApi, MemoryPolicyRequest, MemoryScope, Profile } from '@/api/agentMemory'
import { agents, copy } from './agentCatalog'
import { demoUserId } from './auth'

const policies = new Map<string, MemoryPolicyRequest>()
const profiles = new Map<string, Profile>()
const grants = new Map<string, GrantRequest>()
const queue = new Map<string, Candidate[]>()

function scopeKey(scope: MemoryScope, agent: number) {
  return scope === 'USER' ? 'USER' : scope + '/' + agent
}
function ownerKey(scope: MemoryScope, agent: number) {
  return scopeKey(scope, agent) + '/' + (scope === 'AGENT' ? 'shared' : demoUserId())
}
function policy(scope: MemoryScope, agent: number): MemoryPolicyRequest {
  return policies.get(scopeKey(scope, agent)) ?? { enabled: true, revision: 0, reviewRequired: true,
    prompt: '记录用户明确表达的回复格式偏好。', fields: { reply_style: 'TEXT' } }
}
function profile(scope: MemoryScope, agent: number) {
  const key = ownerKey(scope, agent)
  let row = profiles.get(key)
  if (!row) {
    row = { revision: 0, forgottenFields: [], values: {}, fields: {} }
    profiles.set(key, row)
  }
  row.fields = { ...policy(scope, agent).fields }
  return row
}
function check(actual: number, expected: number) {
  if (actual !== expected) throw new Error('记录已更新，请刷新后再操作')
}
function pending(scope: MemoryScope, agent: number) {
  const key = ownerKey(scope, agent)
  if (!queue.has(key)) queue.set(key, [{ id: 1, values: { reply_style: '简洁' }, evidence: { reply_style: '演示：请简短回答。' } }])
  return queue.get(key)!
}
function grant(agent: number) {
  const availableFields = Object.keys(policy('USER', 0).fields)
  const row = grants.get(demoUserId() + '/' + agent) ?? { revision: 0, readFields: [], writeFields: [] }
  return { ...row, availableFields }
}

export const mockMemoryApi: MemoryApi = {
  agents: async () => agents.map(({ draft }) => ({ id: draft.id!, name: draft.name })),
  policy: async (scope, agent) => copy(policy(scope, agent)),
  savePolicy: async (scope, agent, body) => {
    check(policy(scope, agent).revision, body.revision)
    policies.set(scopeKey(scope, agent), copy({ ...body, revision: body.revision + 1 }))
  },
  profile: async (scope, agent) => copy(profile(scope, agent)),
  edit: async (scope, agent, key, value, revision) => {
    const row = profile(scope, agent)
    check(row.revision, revision)
    if (!Object.prototype.hasOwnProperty.call(row.fields, key)) throw new Error('未知字段')
    row.values[key] = value
    row.forgottenFields = row.forgottenFields.filter(name => name !== key)
    row.revision++
  },
  forget: async (scope, agent, key, revision) => {
    const row = profile(scope, agent)
    check(row.revision, revision)
    delete row.values[key]
    if (!row.forgottenFields.includes(key)) row.forgottenFields.push(key)
    row.revision++
  },
  grant: async agent => copy(grant(agent)),
  share: async (agent, body) => {
    check(grant(agent).revision, body.revision)
    grants.set(demoUserId() + '/' + agent, copy({ ...body, revision: body.revision + 1 }))
  },
  pending: async (scope, agent) => copy(pending(scope, agent)),
  review: async (scope, agent, id, approve) => {
    const rows = pending(scope, agent)
    const index = rows.findIndex(row => row.id === id)
    if (index < 0) return false
    const [candidate] = rows.splice(index, 1)
    if (approve) {
      const row = profile(scope, agent)
      for (const [key, value] of Object.entries(candidate.values)) {
        if (Object.prototype.hasOwnProperty.call(row.fields, key) && !row.forgottenFields.includes(key)) row.values[key] = value
      }
      row.revision++
    }
    return true
  },
}
