import type { Candidate, GrantRequest, MemoryApi, MemoryPolicyRequest, MemoryScope, Profile } from '@/api/agentMemory'
import { agents, copy } from './agentCatalog'
import { demoUserId } from './auth'
import { mockUsers } from '../data/user'

const policies = new Map<string, MemoryPolicyRequest>()
const profiles = new Map<string, Profile>()
const grants = new Map<string, GrantRequest>()
const queue = new Map<string, Candidate[]>()

function scopeKey(scope: MemoryScope, agent: number) {
  return scope === 'USER' ? 'USER' : scope + '/' + agent
}
function ownerKey(scope: MemoryScope, agent: number, user = String(demoUserId())) {
  return scopeKey(scope, agent) + '/' + (scope === 'AGENT' ? 'shared' : user)
}
function policy(scope: MemoryScope, agent: number): MemoryPolicyRequest {
  return policies.get(scopeKey(scope, agent)) ?? { enabled: true, revision: 0, reviewRequired: true,
    prompt: '记录用户明确表达的回复格式偏好。', fields: { reply_style: 'TEXT' } }
}
function profile(scope: MemoryScope, agent: number, user?: string) {
  const key = ownerKey(scope, agent, user)
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
function pending(scope: MemoryScope, agent: number, user?: string) {
  const key = ownerKey(scope, agent, user)
  if (!queue.has(key)) queue.set(key, [{ id: 1, values: { reply_style: '简洁' }, evidence: { reply_style: '演示：请简短回答。' } }])
  return queue.get(key)!
}
function grant(agent: number) {
  const availableFields = Object.keys(policy('USER', 0).fields)
  const row = grants.get(demoUserId() + '/' + agent) ?? { revision: 0, readFields: [], writeFields: [] }
  return { ...row, availableFields }
}

function authorizeUser(action: string, user?: string) {
  const actor = mockUsers.find(row => String(row.id) === String(demoUserId()))
  if (!actor?.permissions?.includes(`ai:memory:user-${action}:api`)) throw new Error('没有用户画像管理权限')
  if (user !== undefined && !mockUsers.some(row => String(row.id) === user)) throw new Error('用户不存在')
}
function editProfile(row: Profile, key: string, value: string, revision: number) {
  check(row.revision, revision)
  if (!Object.prototype.hasOwnProperty.call(row.fields, key)) throw new Error('未知字段')
  row.values[key] = value
  row.forgottenFields = row.forgottenFields.filter(name => name !== key)
  row.revision++
}
function forgetProfile(row: Profile, key: string, revision: number) {
  check(row.revision, revision)
  delete row.values[key]
  if (!row.forgottenFields.includes(key)) row.forgottenFields.push(key)
  row.revision++
}
function reviewProfile(scope: MemoryScope, agent: number, id: number, approve: boolean, user?: string) {
  const rows = pending(scope, agent, user)
  const index = rows.findIndex(row => row.id === id)
  if (index < 0) return false
  const [candidate] = rows.splice(index, 1)
  if (approve) {
    const row = profile(scope, agent, user)
    for (const [key, value] of Object.entries(candidate.values)) {
      if (Object.prototype.hasOwnProperty.call(row.fields, key) && !row.forgottenFields.includes(key)) row.values[key] = value
    }
    row.revision++
  }
  return true
}

export const mockMemoryApi: MemoryApi = {
  users: async ({ pageNum, pageSize, keyword = '' }) => {
    authorizeUser('list')
    const query = keyword.trim().toLowerCase()
    const rows = mockUsers.filter(row => [row.username, row.nickname].join(' ').toLowerCase().includes(query))
    const pages = Math.ceil(rows.length / pageSize)
    return { records: rows.slice((pageNum - 1) * pageSize, pageNum * pageSize).map(row => ({
      userId: String(row.id), username: row.username, nickname: row.nickname || '', status: row.status || 'active',
    })), total: rows.length, current: pageNum, size: pageSize, pages, hasPrevious: pageNum > 1, hasNext: pageNum < pages }
  },
  userProfile: async user => { authorizeUser('read', user); return copy(profile('USER', 0, user)) },
  editUserProfile: async (user, key, value, revision) => {
    authorizeUser('edit', user)
    editProfile(profile('USER', 0, user), key, value, revision)
  },
  forgetUserProfile: async (user, key, revision) => {
    authorizeUser('forget', user)
    forgetProfile(profile('USER', 0, user), key, revision)
  },
  userPending: async user => { authorizeUser('review-read', user); return copy(pending('USER', 0, user)) },
  reviewUserProfile: async (user, id, approve) => {
    authorizeUser('review', user)
    return reviewProfile('USER', 0, id, approve, user)
  },
  agents: async () => agents.map(({ draft }) => ({ id: draft.id!, name: draft.name })),
  policy: async (scope, agent) => copy(policy(scope, agent)),
  savePolicy: async (scope, agent, body) => {
    check(policy(scope, agent).revision, body.revision)
    policies.set(scopeKey(scope, agent), copy({ ...body, revision: body.revision + 1 }))
  },
  profile: async (scope, agent) => copy(profile(scope, agent)),
  edit: async (scope, agent, key, value, revision) => {
    editProfile(profile(scope, agent), key, value, revision)
  },
  forget: async (scope, agent, key, revision) => {
    forgetProfile(profile(scope, agent), key, revision)
  },
  grant: async agent => copy(grant(agent)),
  share: async (agent, body) => {
    check(grant(agent).revision, body.revision)
    grants.set(demoUserId() + '/' + agent, copy({ ...body, revision: body.revision + 1 }))
  },
  pending: async (scope, agent) => copy(pending(scope, agent)),
  review: async (scope, agent, id, approve) => reviewProfile(scope, agent, id, approve),
}
