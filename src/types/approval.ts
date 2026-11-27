export interface ApprovalField {
  key: string
  label: string
  kind: 'routing' | 'business'
  type: 'text' | 'number'
  required: boolean
}
export type Comparison = 'eq' | 'gt' | 'ge' | 'lt' | 'le'
export interface Exit {
  branches: { conditions: { field: string; value: string; operator?: Comparison }[]; target: string }[]
  fallback: string
}
export interface ApprovalNode {
  id: string
  name: string
  role: string
  coRoles?: string[]
  exit: Exit
}
export interface ApprovalDesign {
  launchRole?: string
  additionalLaunchRoles?: string[]
  code: string
  name: string
  fields: ApprovalField[]
  start: Exit
  nodes: ApprovalNode[]
}
export interface Blueprint {
  stopped?: boolean
  design: ApprovalDesign
  revision: number
  version: number
}
export interface TemplateRow {
  code: string
  name: string
  revision: number
  version: number
  stopped: boolean
  changed: boolean
}
export interface ApprovalRole {
  code: string
  name: string
}
export type Scope = 'inbox' | 'handled' | 'mine' | 'rejected'
export type Decision = 'approve' | 'reject'
export type OwnerAction = 'resubmit' | 'void'
export type Values = Record<string, string>
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOID'
export interface ApprovalItem {
  id: string
  title: string
  status: ApprovalStatus
  round: number
  revision: number
  node: string
  updatedAt: string
}
export interface ApprovalEvent {
  nodeId?: string
  role?: string
  round: number
  action: 'SUBMIT' | 'RESUBMIT' | 'APPROVE' | 'REJECT' | 'VOID'
  node: string
  actorId: number
  actor: string
  reason: string
  time: string
  values: Values | null
}
export interface ApprovalDetail {
  item: ApprovalItem
  version: number
  design: ApprovalDesign
  values: Values
  history: ApprovalEvent[]
  route: string[]
  mine: boolean
  candidates?: Record<string, string[]>
  roleNames?: Record<string, string>
  tasks?: { id: string; node: string; role: string; actionable: boolean }[]
  canReview: boolean
}
export interface Change {
  taskId?: string
  revision: number
  reason?: string
  values?: Values
}
