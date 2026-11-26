import { isMockEnabled } from '@/config/mock'
import { mockMemoryApi } from '@/mock/services/agentMemory'
import { request } from '@/utils/request'
import type { PageResult } from '@/types'

export type MemoryScope = 'AGENT_USER' | 'USER' | 'AGENT'
export type FieldType = 'TEXT' | 'NUMBER' | 'BOOLEAN'
export interface MemoryPolicyRequest {
  revision: number
  enabled: boolean
  reviewRequired: boolean
  prompt: string
  fields: Record<string, FieldType>
}
export type MemoryPolicy = Readonly<MemoryPolicyRequest>
export interface Profile {
  forgottenFields: string[]
  revision: number
  values: Record<string, string>
  fields: Record<string, FieldType>
}
export interface GrantRequest {
  revision: number
  readFields: string[]
  writeFields: string[]
}
export interface Grant extends GrantRequest { availableFields: string[] }
export interface MemoryUser { userId: string; username: string; nickname: string; status: string }
export interface MemoryUserQuery { pageNum: number; pageSize: number; keyword?: string }
export interface Candidate {
  id: number
  values: Record<string, string>
  evidence: Record<string, string>
}
const root = '/api/v1/agent-console/memory'
const policyPath = (scope: MemoryScope, agent: number) =>
  scope === 'USER' ? `${root}/platform-policy` : `${root}/policies/${scope}/${agent}`
const fieldPath = (scope: MemoryScope, agent: number, field: string) =>
  `${root}/${scope === 'AGENT' ? 'shared' : 'profiles/' + scope}/${agent}/fields/${encodeURIComponent(field)}`
const reviewPath = (scope: MemoryScope, agent: number) =>
  scope === 'AGENT' ? `${root}/shared/${agent}/reviews` : `${root}/reviews/${scope}/${agent}`

const liveMemoryApi = {
  users: (query: MemoryUserQuery) => request.get<PageResult<MemoryUser>>(`${root}/users`, { ...query }),
  userProfile: (user: string) => request.get<Profile>(`${root}/users/${encodeURIComponent(user)}/profile`),
  editUserProfile: (user: string, field: string, value: string, revision: number) =>
    request.put<void>(`${root}/users/${encodeURIComponent(user)}/fields/${encodeURIComponent(field)}`, { value, revision }),
  forgetUserProfile: (user: string, field: string, revision: number) =>
    request.delete<void>(`${root}/users/${encodeURIComponent(user)}/fields/${encodeURIComponent(field)}`, { revision }),
  userPending: (user: string) => request.get<Candidate[]>(`${root}/users/${encodeURIComponent(user)}/reviews`),
  reviewUserProfile: (user: string, id: number, approve: boolean) =>
    request.put<boolean>(`${root}/users/${encodeURIComponent(user)}/reviews/${id}`, { approve }),
  agents: () => request.get<{ id: number; name: string }[]>(`${root}/agents`),
  policy: (scope: MemoryScope, agent: number) => request.get<MemoryPolicy>(policyPath(scope, agent)),
  savePolicy: (scope: MemoryScope, agent: number, body: MemoryPolicyRequest) =>
    request.put<void>(policyPath(scope, agent), body),
  profile: (scope: MemoryScope, agent: number) => request.get<Profile>(`${root}/profiles/${scope}/${agent}`),
  edit: (scope: MemoryScope, agent: number, field: string, value: string, revision: number) =>
    request.put<void>(fieldPath(scope, agent, field), { value, revision }),
  forget: (scope: MemoryScope, agent: number, field: string, revision: number) =>
    request.delete<void>(fieldPath(scope, agent, field), { revision }),
  grant: (agent: number) => request.get<Grant>(`${root}/grants/${agent}`),
  share: (agent: number, body: GrantRequest) => request.put<void>(`${root}/grants/${agent}`, body),
  pending: (scope: MemoryScope, agent: number) => request.get<Candidate[]>(reviewPath(scope, agent)),
  review: (scope: MemoryScope, agent: number, id: number, approve: boolean) =>
    request.put<boolean>(`${reviewPath(scope, agent)}/${id}`, { approve }),
}

export type MemoryApi = typeof liveMemoryApi
export const memoryApi: typeof liveMemoryApi = isMockEnabled() ? mockMemoryApi : liveMemoryApi
